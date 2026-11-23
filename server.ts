import {GoogleGenAI} from '@google/genai';
import express, {type Request, type Response} from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import {fileURLToPath} from 'url';

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
