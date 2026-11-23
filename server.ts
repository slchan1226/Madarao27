import {GoogleGenAI} from '@google/genai';
import express, {type Request, type Response} from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';
import {
  fetchOfficialResortLifts,
  type LiveLiftPayload,
  type SkiResortId,
} from './server/liveLifts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Default center: Hotel Silk In Madarao (倉本温泉 ホテルシルクイン斑尾)
const DEFAULT_LAT = 36.8516;
const DEFAULT_LNG = 138.2932;

type SpotCategory =
  | 'all'
  | 'gear'
  | 'onsen'
  | 'restaurant'
  | 'store'
  | 'attraction';

const VALID_CATEGORIES = new Set<SpotCategory>([
  'all',
  'gear',
  'onsen',
  'restaurant',
  'store',
  'attraction',
]);

const CATEGORY_PROMPT_MAP: Record<SpotCategory, string> = {
  all: '雪具租借店、溫泉、餐廳、便利商店／超市及冬季景點',
  gear: '高階雪具租借店與滑雪裝備店（優先提供新款／粉雪板租借，如斑尾 Powder Station、Chill Madarao、野澤 Compass House、Salomon Station 等，並附大概日租價錢）',
  onsen: '日歸溫泉、外湯與露天雪見溫泉（如斑尾高原溫泉、野澤溫泉外湯、馬曲溫泉等）',
  restaurant: '人氣餐廳、拉麵、蕎麥麵、居酒屋與雪後美食（斑尾高原、JR 飯山站及野澤溫泉周邊）',
  store: '便利商店（7-Eleven、Lawson）、飯山站商店手信與大型超市（如 Tsuruya ツルヤ 飯山店）補給點',
  attraction: '冬季旅遊景點、雪屋村、溫泉街散步點及觀景地標（斑尾高原、飯山及野澤溫泉周邊）',
};

const PLACES_SEARCH_QUERY_MAP: Record<SpotCategory, string> = {
  all: '斑尾高原 飯山 野沢温泉 観光 スキー グルメ',
  gear: 'Madarao Nozawa Onsen snowboard ski rental powder shop',
  onsen: '斑尾高原 野沢温泉 馬曲温泉 日帰り温泉',
  restaurant: '飯山駅 斑尾高原 グルメ ラーメン 居酒屋 レストラン',
  store: '飯山駅 斑尾高原 スーパー ツルヤ コンビニ お土産',
  attraction: '斑尾高原 飯山 野沢温泉 観光スポット 冬',
};

interface GroundedReviewSnippet {
  text: string;
  uri?: string;
}

interface GroundedPlaceItem {
  title: string;
  uri: string;
  reviewSnippets: GroundedReviewSnippet[];
}

interface GroundedResponsePayload {
  category: SpotCategory;
  summary: string;
  places: GroundedPlaceItem[];
  fetchedAt: string;
  source: 'gemini-maps-grounding' | 'google-places-api';
}

const GROUNDING_CACHE_TTL_MS = 30 * 60 * 1000;
const groundingMemoryCache: Partial<
  Record<SpotCategory, {expiresAt: number; payload: GroundedResponsePayload}>
> = {};

function getMapsBrowserApiKey(): string {
  return (
    process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_PLATFORM_API_KEY?.trim() ||
    ''
  );
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function extractGroundedPlaces(response: unknown): GroundedPlaceItem[] {
  const candidates = (
    response as {
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{
            maps?: {
              uri?: string;
              title?: string;
              placeAnswerSources?: {
                reviewSnippets?: Array<{
                  content?: string;
                  text?: string;
                  reviewUri?: string;
                  uri?: string;
                }>;
              };
            };
          }>;
        };
      }>;
    }
  )?.candidates;

  const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seenUris = new Set<string>();
  const places: GroundedPlaceItem[] = [];

  for (const chunk of chunks) {
    const maps = chunk?.maps;
    if (!maps?.uri) continue;
    if (seenUris.has(maps.uri)) continue;
    seenUris.add(maps.uri);

    const rawSnippets = maps.placeAnswerSources?.reviewSnippets ?? [];
    const reviewSnippets: GroundedReviewSnippet[] = [];
    for (const snippet of rawSnippets) {
      const text = (snippet.content ?? snippet.text ?? '').trim();
      if (text) {
        reviewSnippets.push({
          text,
          uri: snippet.reviewUri ?? snippet.uri,
        });
      }
    }

    places.push({
      title: (maps.title ?? 'Google Maps 地點').trim(),
      uri: maps.uri,
      reviewSnippets,
    });
  }

  return places;
}

// Fallback using official Places API (New) Text Search (server-side) if Gemini Maps Grounding hits 429 quota
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search?utm_campaign=gmp_mcp_codeassist_v1_aistudio
async function fetchViaPlacesApiNew(
  category: SpotCategory,
  latitude: number,
  longitude: number,
): Promise<GroundedResponsePayload | null> {
  const mapsKey = getMapsBrowserApiKey();
  if (!mapsKey) return null;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': mapsKey,
      'X-Goog-FieldMask':
        'places.displayName,places.formattedAddress,places.googleMapsUri,places.rating,places.userRatingCount,places.editorialSummary,places.regularOpeningHours.openNow',
    },
    body: JSON.stringify({
      textQuery: PLACES_SEARCH_QUERY_MAP[category],
      languageCode: 'zh-TW',
      regionCode: 'JP',
      maxResultCount: 6,
      locationBias: {
        circle: {
          center: {latitude, longitude},
          radius: 25000.0,
        },
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`PLACES_API_HTTP_${res.status}:${errText.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      displayName?: {text?: string};
      formattedAddress?: string;
      googleMapsUri?: string;
      rating?: number;
      userRatingCount?: number;
      editorialSummary?: {text?: string};
      regularOpeningHours?: {openNow?: boolean};
    }>;
  };

  const rawPlaces = data.places ?? [];
  if (rawPlaces.length === 0) return null;

  const places: GroundedPlaceItem[] = rawPlaces
    .filter((p) => Boolean(p.googleMapsUri))
    .map((p) => {
      const snippets: GroundedReviewSnippet[] = [];
      if (p.editorialSummary?.text) {
        snippets.push({text: p.editorialSummary.text});
      }
      if (typeof p.rating === 'number') {
        const openNote =
          typeof p.regularOpeningHours?.openNow === 'boolean'
            ? p.regularOpeningHours.openNow
              ? ' · 目前營業中'
              : ' · 目前休息中'
            : '';
        snippets.push({
          text: `Google 評分 ${p.rating.toFixed(1)}（${p.userRatingCount ?? 0} 則評價）${openNote}`,
        });
      }
      return {
        title: p.displayName?.text ?? 'Google Maps 地點',
        uri: p.googleMapsUri as string,
        reviewSnippets: snippets,
      };
    });

  const summaryLines = rawPlaces.map((p) => {
    const name = p.displayName?.text ?? '未命名地點';
    const ratingStr =
      typeof p.rating === 'number'
        ? `（★ ${p.rating.toFixed(1)}／${p.userRatingCount ?? 0} 評價）`
        : '';
    const addr = p.formattedAddress ? ` — ${p.formattedAddress}` : '';
    return `- **${name}**${ratingStr}${addr}`;
  });

  return {
    category,
    summary: `### Google Maps 即時地點清單\n${summaryLines.join('\n')}`,
    places,
    fetchedAt: new Date().toISOString(),
    source: 'google-places-api',
  };
}

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  app.use(express.json({limit: '64kb'}));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({status: 'ok'});
  });

  // Exposes the configured Google Maps browser API key to the SPA without hardcoding it in source
  app.get('/api/config/maps', (_req: Request, res: Response) => {
    res.json({apiKey: getMapsBrowserApiKey()});
  });

  app.post('/api/places/ground', async (req: Request, res: Response) => {
    const body = req.body as {
      category?: string;
      latitude?: unknown;
      longitude?: unknown;
      forceRefresh?: boolean;
    };

    const rawCategory =
      typeof body?.category === 'string' ? body.category : 'all';
    if (!VALID_CATEGORIES.has(rawCategory as SpotCategory)) {
      res.status(400).json({error: '無效的分類篩選參數。'});
      return;
    }
    const category = rawCategory as SpotCategory;

    const cached = groundingMemoryCache[category];
    if (!body?.forceRefresh && cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    const parsedLat = Number(body?.latitude);
    const parsedLng = Number(body?.longitude);
    const latitude =
      Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90
        ? parsedLat
        : DEFAULT_LAT;
    const longitude =
      Number.isFinite(parsedLng) && parsedLng >= -180 && parsedLng <= 180
        ? parsedLng
        : DEFAULT_LNG;

    const ai = getGeminiClient();
    let geminiErrorMessage = '';

    if (ai) {
      const topic = CATEGORY_PROMPT_MAP[category];
      const prompt = [
        `請使用 Google Maps 最新地點資料，為前往日本長野縣「斑尾高原（倉本温泉 ホテルシルクイン斑尾）、飯山市及野澤溫泉」自駕滑雪的 14 人團隊，整理附近最值得去的「${topic}」最新實用資訊（精選 4 至 6 個真實地點）。`,
        '請以繁體中文（香港／台灣自駕旅客易讀風格）簡潔列點回覆，每個地點說明：',
        '1. 地點名稱（附日文名）與所在區域',
        '2. 特色亮點、參考價錢（如屬雪具租借店）、大約營業時間或冬季／停車注意事項',
        '請只列出 Google Maps 上真實存在的地點，不要編造地址或營業時間。',
      ].join('\n');

      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: prompt,
            config: {
              tools: [{googleMaps: {}}],
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude,
                    longitude,
                  },
                },
              },
            },
          });

          const summary = (response.text ?? '').trim();
          const places = extractGroundedPlaces(response);
          const payload: GroundedResponsePayload = {
            category,
            summary,
            places,
            fetchedAt: new Date().toISOString(),
            source: 'gemini-maps-grounding',
          };

          groundingMemoryCache[category] = {
            expiresAt: Date.now() + GROUNDING_CACHE_TTL_MS,
            payload,
          };
          res.json(payload);
          return;
        } catch (err: unknown) {
          geminiErrorMessage =
            err instanceof Error ? err.message : 'Google Maps 資料查詢失敗';
          const isRetryable =
            geminiErrorMessage.includes('503') ||
            geminiErrorMessage.includes('UNAVAILABLE');
          if (attempt === 0 && isRetryable) {
            await new Promise((r) => setTimeout(r, 900));
            continue;
          }
          console.error(
            '[places/ground] Gemini Maps Grounding error:',
            geminiErrorMessage,
          );
          break;
        }
      }
    }

    // Automatic fallback to Google Maps Platform Places API (New) when Gemini Grounding is rate-limited
    try {
      const placesPayload = await fetchViaPlacesApiNew(
        category,
        latitude,
        longitude,
      );
      if (placesPayload) {
        groundingMemoryCache[category] = {
          expiresAt: Date.now() + GROUNDING_CACHE_TTL_MS,
          payload: placesPayload,
        };
        res.json(placesPayload);
        return;
      }
    } catch (placesErr: unknown) {
      const placesMsg =
        placesErr instanceof Error ? placesErr.message : String(placesErr);
      console.error('[places/ground] Places API fallback error:', placesMsg);
      if (placesMsg.includes('429') || placesMsg.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error:
            'Google Maps 即時查詢配額已達上限，請稍後再試或直接使用下方完整離線地標清單。',
          quotaExceeded: true,
        });
        return;
      }
    }

    if (
      geminiErrorMessage.includes('429') ||
      geminiErrorMessage.includes('RESOURCE_EXHAUSTED')
    ) {
      res.status(429).json({
        error:
          'Google Maps 即時查詢次數已達上限，請稍後再試或先查閱下方完整離線清單。',
      });
      return;
    }

    if (
      geminiErrorMessage.includes('403') ||
      geminiErrorMessage.includes('PERMISSION_DENIED') ||
      geminiErrorMessage.includes('API_KEY_INVALID')
    ) {
      res.status(403).json({
        error:
          'API 金鑰權限不足或無效，請於 Settings > Secrets 檢查設定。',
      });
      return;
    }

    res.status(502).json({
      error: '暫時未能連線至 Google Maps 即時資料，已保留離線地標供查閱。',
    });
  });

  const VALID_RESORTS = new Set<SkiResortId>([
    'madarao',
    'tangram',
    'romance',
    'nozawa',
  ]);
  const RESORT_SEARCH_NAMES: Record<
    SkiResortId,
    {name: string; officialDomain: string}
  > = {
    madarao: {
      name: '斑尾高原スキー場（Madarao Mountain Resort）',
      officialDomain: 'madarao.jp',
    },
    tangram: {
      name: 'タングラムスキーサーカス（Tangram Ski Circus）',
      officialDomain: 'tangram.jp',
    },
    romance: {
      name: 'スノーリゾートロマンスの神様（旧木島平スキー場 Kijimadaira）',
      officialDomain: 'kijimadaira-ski.com',
    },
    nozawa: {
      name: '野沢温泉スキー場（Nozawa Onsen Snow Resort）',
      officialDomain: 'nozawaski.com',
    },
  };

  const LIFT_CACHE_TTL_MS = 20 * 60 * 1000;
  const liftMemoryCache: Partial<
    Record<SkiResortId, {expiresAt: number; payload: LiveLiftPayload}>
  > = {};

  app.post('/api/ski/lifts', async (req: Request, res: Response) => {
    const body = req.body as {
      resortId?: string;
      forceRefresh?: boolean;
    };

    const rawId = typeof body?.resortId === 'string' ? body.resortId : '';
    if (!VALID_RESORTS.has(rawId as SkiResortId)) {
      res.status(400).json({error: '無效的雪場代號。'});
      return;
    }
    const resortId = rawId as SkiResortId;

    const cached = liftMemoryCache[resortId];
    if (!body?.forceRefresh && cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    // 1. Primary: Fetch live status directly from official ski resort status pages (zero quota limit, real-time)
    try {
      const officialPayload = await fetchOfficialResortLifts(resortId);
      liftMemoryCache[resortId] = {
        expiresAt: Date.now() + LIFT_CACHE_TTL_MS,
        payload: officialPayload,
      };
      res.json(officialPayload);
      return;
    } catch (officialErr: unknown) {
      console.warn(
        `[ski/lifts] Official site fetch failed for ${resortId}, falling back to Gemini Search:`,
        officialErr instanceof Error ? officialErr.message : String(officialErr),
      );
    }

    // 2. Fallback: Gemini 4 Hydrogen with Google Search Grounding
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          '暫未能連線至雪場官網取得即時纜車資訊，請先查閱常規時間表或點擊官網。',
      });
      return;
    }

    const resortInfo = RESORT_SEARCH_NAMES[resortId];
    const nowJst = new Date(Date.now() + 9 * 3600_000);
    const todayJst = `${nowJst.getUTCFullYear()}-${String(
      nowJst.getUTCMonth() + 1,
    ).padStart(2, '0')}-${String(nowJst.getUTCDate()).padStart(2, '0')}`;

    const prompt = [
      `請使用 Google Search 查詢日本長野縣「${resortInfo.name}」（官網 ${resortInfo.officialDomain}）截至日本日期 ${todayJst} 的最新真實纜車開放狀況、營業時間、夜滑（ナイター）與官方積雪報告。`,
      '請嚴格只根據搜尋到的真實資料回覆，不可捏造；若目前非雪季、尚未開季或已結束雪季，請明確標示為 offseason 並說明官方預計開季／結束日期及常規雪季營業時間。',
      '請以繁體中文（香港／台灣滑雪旅客習慣用語）輸出單一 JSON 物件（不要多餘前言），欄位如下：',
      '{',
      '  "operationState": "open" | "partial" | "closed" | "offseason" | "unknown",',
      '  "statusBadgeText": "精簡狀態標籤，例如：正常營業中 / 部分吊椅運行 / 受強風影響暫停 / 非雪季（預計12月中開季）",',
      '  "openLiftsSummary": "例如：開放 8 / 11 條纜車 或 目前非雪季（共 15 條纜車）",',
      '  "operatingHours": "今日或本季官方營業時間，例如：08:30 – 16:00（尾班 15:45）",',
      '  "nightSkiStatus": "夜滑開放與否及時間說明",',
      '  "officialSnowDepth": "官方最新公布積雪深度或雪況，若非雪季寫「非雪季無實測」",',
      '  "advisory": "簡短 1-2 句營運備註（強風、新雪、開季日或雪道連通狀態）",',
      '  "lifts": [',
      '    { "name": "主要纜車或吊椅名", "status": "運行中 / 暫停 / 未開放 / 休止", "hours": "08:30–16:00", "note": "備註（選填）" }',
      '  ]',
      '}',
    ].join('\n');

    let lastErrMsg = '';
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            tools: [{googleSearch: {}}],
          },
        });

        const rawText = (response.text ?? '').trim();

        // Extract verified web grounding sources
        const candidates = (
          response as {
            candidates?: Array<{
              groundingMetadata?: {
                groundingChunks?: Array<{
                  web?: {uri?: string; title?: string};
                }>;
              };
            }>;
          }
        )?.candidates;

        const chunks =
          candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        const seenUrls = new Set<string>();
        const sources: Array<{title: string; uri: string}> = [];
        for (const chunk of chunks) {
          const uri = chunk?.web?.uri?.trim();
          if (!uri || seenUrls.has(uri)) continue;
          seenUrls.add(uri);
          sources.push({
            title: (chunk?.web?.title ?? uri).trim(),
            uri,
          });
        }

        // Safely parse JSON block if returned, otherwise preserve text as summaryMarkdown
        let parsed: Partial<LiveLiftPayload> | null = null;
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]) as Partial<LiveLiftPayload>;
          } catch {
            parsed = null;
          }
        }

        const validStates = new Set([
          'open',
          'partial',
          'closed',
          'offseason',
          'unknown',
        ]);
        const opState =
          parsed?.operationState && validStates.has(parsed.operationState)
            ? parsed.operationState
            : 'unknown';

        const lifts = Array.isArray(parsed?.lifts)
          ? parsed.lifts
              .filter(
                (item) =>
                  item &&
                  typeof item.name === 'string' &&
                  typeof item.status === 'string',
              )
              .slice(0, 8)
              .map((item) => ({
                name: item.name.trim(),
                status: item.status.trim(),
                hours:
                  typeof item.hours === 'string' && item.hours.trim()
                    ? item.hours.trim()
                    : undefined,
                note:
                  typeof item.note === 'string' && item.note.trim()
                    ? item.note.trim()
                    : undefined,
              }))
          : [];

        const payload: LiveLiftPayload = {
          resortId,
          operationState: opState,
          statusBadgeText:
            typeof parsed?.statusBadgeText === 'string' &&
            parsed.statusBadgeText.trim()
              ? parsed.statusBadgeText.trim()
              : '已取得最新營運情報',
          openLiftsSummary:
            typeof parsed?.openLiftsSummary === 'string' &&
            parsed.openLiftsSummary.trim()
              ? parsed.openLiftsSummary.trim()
              : '詳見下方摘要與官網',
          operatingHours:
            typeof parsed?.operatingHours === 'string' &&
            parsed.operatingHours.trim()
              ? parsed.operatingHours.trim()
              : '請以官網公告為準',
          nightSkiStatus:
            typeof parsed?.nightSkiStatus === 'string'
              ? parsed.nightSkiStatus.trim()
              : '',
          officialSnowDepth:
            typeof parsed?.officialSnowDepth === 'string' &&
            parsed.officialSnowDepth.trim()
              ? parsed.officialSnowDepth.trim()
              : '請參閱官網實測',
          advisory:
            typeof parsed?.advisory === 'string' ? parsed.advisory.trim() : '',
          lifts,
          summaryMarkdown: parsed ? undefined : rawText,
          sources,
          fetchedAt: new Date().toISOString(),
        };

        liftMemoryCache[resortId] = {
          expiresAt: Date.now() + LIFT_CACHE_TTL_MS,
          payload,
        };
        res.json(payload);
        return;
      } catch (err: unknown) {
        lastErrMsg =
          err instanceof Error ? err.message : '即時纜車情報查詢失敗';
        const isRetryable =
          lastErrMsg.includes('503') || lastErrMsg.includes('UNAVAILABLE');
        if (attempt === 0 && isRetryable) {
          await new Promise((r) => setTimeout(r, 900));
          continue;
        }
        console.error('[ski/lifts] Gemini Search Grounding error:', lastErrMsg);
        break;
      }
    }

    if (
      lastErrMsg.includes('429') ||
      lastErrMsg.includes('RESOURCE_EXHAUSTED')
    ) {
      res.status(429).json({
        error:
          '即時檢索配額暫時已達上限，請稍後再試，或直接點擊下方官網連結查閱最新纜車表。',
      });
      return;
    }

    if (
      lastErrMsg.includes('403') ||
      lastErrMsg.includes('PERMISSION_DENIED') ||
      lastErrMsg.includes('API_KEY_INVALID')
    ) {
      res.status(403).json({
        error: 'Gemini API 金鑰權限不足或無效，請於 Settings > Secrets 檢查。',
      });
      return;
    }

    res.status(502).json({
      error:
        '暫時未能取得即時纜車狀況，下方已完整保留常規營業時間表及官網直達連結。',
    });
  });

  // Google Places API (New) server-side photo proxy for the 6 highway drive stops
  // Docs: https://developers.google.com/maps/documentation/places/web-service/place-photos?utm_campaign=gmp_mcp_codeassist_v1_aistudio
  interface StopPhotoResult {
    photoUri: string | null;
    attributionName?: string;
    attributionUri?: string;
  }

  const STOP_PHOTO_TARGETS: Array<{
    stopId: string;
    placeId?: string;
    textQuery?: string;
  }> = [
    {stopId: 'narita-t3', placeId: 'ChIJYd_6WXnzImAR89wPaFU25-8'},
    {stopId: 'miyoshi-pa', placeId: 'ChIJPZZcG-TcGGAReH_JmzI5t5A'},
    {stopId: 'aeon-takasaki', placeId: 'ChIJ9RKkNYSMHmARnWhbGboVq_Q'},
    {stopId: 'matsushiro-pa', placeId: 'ChIJlXPx48WEHWARtfIzJcirHHA'},
    {
      stopId: 'maple-house',
      textQuery: 'Maple House Backpackers Madarao Iiyama Nagano',
    },
    {stopId: 'silk-in-madarao', placeId: 'ChIJ6-PetV0j9l8RvC39yyIm7lw'},
  ];

  // Short-lived in-memory dedupe cache (5 min) to prevent burst traffic against Demo Key quota without permanent caching
  const STOP_PHOTO_DEDUPE_TTL_MS = 5 * 60 * 1000;
  let stopPhotosCache: {
    expiresAt: number;
    photos: Record<string, StopPhotoResult>;
    quotaExceeded: boolean;
  } | null = null;

  interface PlacesPhotoEntry {
    name?: string;
    authorAttributions?: Array<{
      displayName?: string;
      uri?: string;
    }>;
  }

  async function resolveStopPhoto(
    target: {stopId: string; placeId?: string; textQuery?: string},
    mapsKey: string,
  ): Promise<{result: StopPhotoResult; quotaExceeded: boolean}> {
    let firstPhoto: PlacesPhotoEntry | undefined;

    if (target.placeId) {
      const detailRes = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(target.placeId)}?languageCode=ja`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': mapsKey,
            'X-Goog-FieldMask': 'photos',
          },
        },
      );
      if (detailRes.status === 429) {
        return {result: {photoUri: null}, quotaExceeded: true};
      }
      if (!detailRes.ok) {
        const bodyText = await detailRes.text().catch(() => '');
        if (bodyText.includes('RESOURCE_EXHAUSTED')) {
          return {result: {photoUri: null}, quotaExceeded: true};
        }
        return {result: {photoUri: null}, quotaExceeded: false};
      }
      const detailJson = (await detailRes.json()) as {
        photos?: PlacesPhotoEntry[];
      };
      firstPhoto = detailJson.photos?.[0];
    } else if (target.textQuery) {
      const searchRes = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsKey,
            'X-Goog-FieldMask': 'places.photos',
          },
          body: JSON.stringify({
            textQuery: target.textQuery,
            languageCode: 'ja',
            regionCode: 'JP',
            maxResultCount: 1,
          }),
        },
      );
      if (searchRes.status === 429) {
        return {result: {photoUri: null}, quotaExceeded: true};
      }
      if (!searchRes.ok) {
        const bodyText = await searchRes.text().catch(() => '');
        if (bodyText.includes('RESOURCE_EXHAUSTED')) {
          return {result: {photoUri: null}, quotaExceeded: true};
        }
        return {result: {photoUri: null}, quotaExceeded: false};
      }
      const searchJson = (await searchRes.json()) as {
        places?: Array<{photos?: PlacesPhotoEntry[]}>;
      };
      firstPhoto = searchJson.places?.[0]?.photos?.[0];
    }

    if (!firstPhoto?.name) {
      return {result: {photoUri: null}, quotaExceeded: false};
    }

    const mediaRes = await fetch(
      `https://places.googleapis.com/v1/${firstPhoto.name}/media?maxWidthPx=900&skipHttpRedirect=true`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': mapsKey,
        },
      },
    );
    if (mediaRes.status === 429) {
      return {result: {photoUri: null}, quotaExceeded: true};
    }
    if (!mediaRes.ok) {
      return {result: {photoUri: null}, quotaExceeded: false};
    }
    const mediaJson = (await mediaRes.json()) as {photoUri?: string};
    const attribution = firstPhoto.authorAttributions?.[0];

    return {
      result: {
        photoUri:
          typeof mediaJson.photoUri === 'string' && mediaJson.photoUri.trim()
            ? mediaJson.photoUri.trim()
            : null,
        attributionName: attribution?.displayName?.trim() || undefined,
        attributionUri: attribution?.uri?.trim() || undefined,
      },
      quotaExceeded: false,
    };
  }

  app.get('/api/places/stop-photos', async (_req: Request, res: Response) => {
    const mapsKey = getMapsBrowserApiKey();
    if (!mapsKey) {
      res.json({photos: {}, quotaExceeded: false});
      return;
    }

    if (stopPhotosCache && stopPhotosCache.expiresAt > Date.now()) {
      res.json({
        photos: stopPhotosCache.photos,
        quotaExceeded: stopPhotosCache.quotaExceeded,
      });
      return;
    }

    let quotaExceeded = false;
    const photos: Record<string, StopPhotoResult> = {};

    await Promise.all(
      STOP_PHOTO_TARGETS.map(async (target) => {
        try {
          const outcome = await resolveStopPhoto(target, mapsKey);
          if (outcome.quotaExceeded) {
            quotaExceeded = true;
          }
          if (outcome.result.photoUri) {
            photos[target.stopId] = outcome.result;
          }
        } catch (err: unknown) {
          console.warn(
            `[places/stop-photos] Failed for ${target.stopId}:`,
            err instanceof Error ? err.message : String(err),
          );
        }
      }),
    );

    stopPhotosCache = {
      expiresAt: Date.now() + STOP_PHOTO_DEDUPE_TTL_MS,
      photos,
      quotaExceeded,
    };

    res.json({photos, quotaExceeded});
  });

  if (!IS_PROD) {
    const {createServer: createViteServer} = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      plugins: disableHmr
        ? [
            {
              name: 'disable-vite-client-ws-when-hmr-off',
              enforce: 'post',
              transform(code: string, id: string) {
                if (
                  id.includes('vite/dist/client/client.mjs') ||
                  id.endsWith('/@vite/client')
                ) {
                  return {
                    code: code
                      .replace(
                        'transport.connect(createHMRHandler(handleMessage));',
                        '/* WebSocket HMR disabled via DISABLE_HMR=true */',
                      )
                      .replace(
                        'setupForwardConsoleHandler(transport, forwardConsole);',
                        '/* Console WS forwarding disabled via DISABLE_HMR=true */',
                      ),
                    map: null,
                  };
                }
                return null;
              },
            },
          ]
        : [],
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : {server: httpServer},
        ws: disableHmr ? false : {server: httpServer},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.use((req: Request, res: Response, next) => {
      if (req.path.startsWith('/api/')) {
        next();
        return;
      }
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
