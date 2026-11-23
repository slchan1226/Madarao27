import React, {useMemo, useRef, useState} from 'react';
import {
  AlertCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CornerUpRight,
  ExternalLink,
  LayoutGrid,
  Map as MapIcon,
  MapPin,
  ParkingCircle,
  Phone,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Store,
  Tag,
  Utensils,
  Waves,
  WifiOff,
} from 'lucide-react';
import {
  OFFLINE_LOCAL_SPOTS,
  SPOT_CATEGORY_META,
  type SpotCategory,
  type SpotFilterCategory,
} from '../data/localSpots';
import {formatUpdatedTime} from '../lib/weather';
import {LocalSpotsMap} from './LocalSpotsMap';

interface GroundedReviewSnippet {
  text: string;
  uri?: string;
}

interface GroundedPlaceItem {
  title: string;
  uri: string;
  reviewSnippets: GroundedReviewSnippet[];
}

interface GroundedCategoryResult {
  category: SpotFilterCategory;
  summary: string;
  places: GroundedPlaceItem[];
  fetchedAt: string;
}

type GroundedCacheMap = Partial<
  Record<SpotFilterCategory, GroundedCategoryResult>
>;

interface LocalSpotsExplorerProps {
  isOnline: boolean;
  onCopyText: (text: string) => void;
}

const FILTER_STORAGE_KEY = 'madarao_2027_local_spot_filter';
const GROUNDING_CACHE_KEY = 'madarao_2027_maps_grounding_v1';

const FILTER_ORDER: SpotFilterCategory[] = [
  'all',
  'gear',
  'onsen',
  'restaurant',
  'store',
  'attraction',
];

function readInitialFilter(): SpotFilterCategory {
  try {
    const saved = localStorage.getItem(FILTER_STORAGE_KEY);
    if (saved && FILTER_ORDER.includes(saved as SpotFilterCategory)) {
      return saved as SpotFilterCategory;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'all';
}

function readGroundedCache(): GroundedCacheMap {
  try {
    const raw = localStorage.getItem(GROUNDING_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GroundedCacheMap;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Ignore storage read errors
  }
  return {};
}

function saveGroundedCache(map: GroundedCacheMap): void {
  try {
    localStorage.setItem(GROUNDING_CACHE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function getCategoryIcon(
  category: SpotFilterCategory,
  className = 'w-3.5 h-3.5 shrink-0',
) {
  switch (category) {
    case 'gear':
      return <Snowflake className={className} aria-hidden="true" />;
    case 'onsen':
      return <Waves className={className} aria-hidden="true" />;
    case 'restaurant':
      return <Utensils className={className} aria-hidden="true" />;
    case 'store':
      return <Store className={className} aria-hidden="true" />;
    case 'attraction':
      return <Camera className={className} aria-hidden="true" />;
    default:
      return <LayoutGrid className={className} aria-hidden="true" />;
  }
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const SafeMarkdownSummary: React.FC<{text: string}> = ({text}) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (/^#{1,4}\s+/.test(line)) {
          const heading = line.replace(/^#{1,4}\s+/, '');
          return (
            <h5
              key={idx}
              className="text-xs font-bold text-snow-900 pt-1.5 first:pt-0"
            >
              {renderInlineBold(heading)}
            </h5>
          );
        }
        if (/^[-*•]\s+/.test(line)) {
          const item = line.replace(/^[-*•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-sky-600 shrink-0 mt-1.5"
                aria-hidden="true"
              />
              <span>{renderInlineBold(item)}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInlineBold(line)}</p>;
      })}
    </div>
  );
};

async function tryGetBrowserCoords(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      () => resolve(null),
      {enableHighAccuracy: false, timeout: 3000, maximumAge: 300_000},
    );
  });
}

export const LocalSpotsExplorer: React.FC<LocalSpotsExplorerProps> = ({
  isOnline,
  onCopyText,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<SpotFilterCategory>(readInitialFilter);
  const [groundedCache, setGroundedCache] =
    useState<GroundedCacheMap>(readGroundedCache);
  const [isGroundingLoading, setIsGroundingLoading] = useState<boolean>(false);
  const [groundingError, setGroundingError] = useState<string | null>(null);
  const [showMapView, setShowMapView] = useState<boolean>(true);
  const [selectedMapSpotId, setSelectedMapSpotId] = useState<string | null>(
    null,
  );
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const categoryCounts = useMemo(() => {
    const counts: Record<SpotFilterCategory, number> = {
      all: OFFLINE_LOCAL_SPOTS.length,
      gear: 0,
      onsen: 0,
      restaurant: 0,
      store: 0,
      attraction: 0,
    };
    for (const spot of OFFLINE_LOCAL_SPOTS) {
      counts[spot.category] += 1;
    }
    return counts;
  }, []);

  const filteredSpots = useMemo(() => {
    if (selectedCategory === 'all') return OFFLINE_LOCAL_SPOTS;
    return OFFLINE_LOCAL_SPOTS.filter(
      (spot) => spot.category === selectedCategory,
    );
  }, [selectedCategory]);

  const handleSelectCategory = (cat: SpotFilterCategory) => {
    setSelectedCategory(cat);
    setSelectedMapSpotId(null);
    setGroundingError(null);
    try {
      localStorage.setItem(FILTER_STORAGE_KEY, cat);
    } catch {
      // Ignore storage write errors
    }
  };

  const handleFocusSpotOnMap = (spotId: string) => {
    setShowMapView(true);
    setSelectedMapSpotId(spotId);
    window.setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 60);
  };

  const handleFetchGoogleMapsData = async () => {
    if (!isOnline) {
      setGroundingError(
        '目前處於離線狀態，下方已完整載入內置離線地標與先前快取資料。',
      );
      return;
    }

    setIsGroundingLoading(true);
    setGroundingError(null);

    try {
      const coords = await tryGetBrowserCoords();
      const response = await fetch('/api/places/ground', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          category: selectedCategory,
          ...(coords ?? {}),
        }),
      });

      const payload = (await response.json()) as Partial<GroundedCategoryResult> & {
        error?: string;
        quotaExceeded?: boolean;
      };

      if (response.status === 429 && payload.quotaExceeded) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }

      if (!response.ok) {
        throw new Error(
          payload.error || `查詢失敗（HTTP ${response.status}）`,
        );
      }

      const result: GroundedCategoryResult = {
        category: selectedCategory,
        summary: payload.summary ?? '',
        places: Array.isArray(payload.places) ? payload.places : [],
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      };

      setGroundedCache((prev) => {
        const next = {...prev, [selectedCategory]: result};
        saveGroundedCache(next);
        return next;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : '未能連線至 Google Maps 即時資料，請先查閱下方離線地標清單。';
      setGroundingError(message);
    } finally {
      setIsGroundingLoading(false);
    }
  };

  const activeGrounded = groundedCache[selectedCategory] ?? null;
  const activeMeta = SPOT_CATEGORY_META[selectedCategory];

  return (
    <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-4">
      {/* 標題與離線保障標籤 */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>LOCAL SPOTS &amp; GEAR DIRECTORY</span>
          </span>
          <h3 className="font-serif text-lg font-bold text-snow-900 mt-0.5">
            周邊地標＆雪具店（高階粉雪板／溫泉／餐廳／超商／景點）
          </h3>
        </div>
        <span className="ui-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
          <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span>離線精確載入</span>
        </span>
      </div>

      {/* 分類篩選器 */}
      <div
        role="tablist"
        aria-label="周邊地標分類篩選"
        className="flex flex-wrap gap-1.5"
      >
        {FILTER_ORDER.map((cat) => {
          const meta = SPOT_CATEGORY_META[cat];
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleSelectCategory(cat)}
              className={`ui-pill border transition cursor-pointer ${
                isSelected
                  ? 'bg-snow-900 text-white border-snow-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
              }`}
            >
              {getCategoryIcon(cat, 'w-3.5 h-3.5 shrink-0')}
              <span>{meta.shortLabel}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {categoryCounts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* 互動式 Google Maps 縮放總覽地圖 */}
      <div
        ref={mapSectionRef}
        className="bg-white/95 border border-sky-200/80 rounded-2xl p-3 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-snow-900 inline-flex items-center gap-1.5">
              <MapIcon className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>互動 Google 地圖總覽（{activeMeta.label}）</span>
            </p>
            <p className="text-[11px] text-slate-500">
              點擊彩色標記即可睇價錢同導航，按右上角 ＋／－ 可自由縮放
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowMapView((prev) => !prev)}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold inline-flex items-center gap-1 shrink-0 transition cursor-pointer"
          >
            <span>{showMapView ? '收起地圖' : '展開地圖'}</span>
            {showMapView ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {showMapView && (
          <LocalSpotsMap
            spots={filteredSpots}
            selectedSpotId={selectedMapSpotId}
            onSelectSpot={setSelectedMapSpotId}
            isOnline={isOnline}
            onCopyText={onCopyText}
          />
        )}
      </div>

      {/* Google Maps 即時資料查詢列（支援快取離線重溫） */}
      <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-snow-900">
              Google Maps 最新動態補充（{activeMeta.label}）
            </p>
            <p className="text-[11px] text-slate-600">
              {activeGrounded
                ? `已快取 Google Maps 即時資料（更新：${formatUpdatedTime(activeGrounded.fetchedAt)}）`
                : '有網絡時可即時透過 Google Maps 取得最新營業及評價，並自動寫入本機快取'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleFetchGoogleMapsData()}
            disabled={isGroundingLoading}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer"
          >
            {!isOnline ? (
              <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <RefreshCw
                className={`w-3.5 h-3.5 shrink-0 ${
                  isGroundingLoading ? 'animate-spin' : ''
                }`}
                aria-hidden="true"
              />
            )}
            <span>
              {isGroundingLoading
                ? '查詢 Google Maps…'
                : activeGrounded
                  ? '更新 Google Maps'
                  : '查 Google Maps 最新'}
            </span>
          </button>
        </div>

        {groundingError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] text-amber-950 flex items-start gap-1.5">
            <AlertCircle
              className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>{groundingError}</span>
          </div>
        )}

        {activeGrounded && (
          <div className="bg-white/95 border border-sky-200/70 rounded-xl p-3 space-y-2.5">
            {activeGrounded.summary && (
              <SafeMarkdownSummary text={activeGrounded.summary} />
            )}

            {activeGrounded.places.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="block text-[11px] font-bold text-snow-900">
                  Google Maps 實時地點連結（{activeGrounded.places.length}）：
                </span>
                <div className="space-y-1.5">
                  {activeGrounded.places.map((place, idx) => (
                    <div
                      key={`${place.uri}-${idx}`}
                      className="bg-sky-50/70 border border-sky-200/70 rounded-xl p-2.5 space-y-1"
                    >
                      <a
                        href={place.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-sky-800 hover:text-sky-950 inline-flex items-center gap-1.5 underline underline-offset-2"
                      >
                        <MapPin
                          className="w-3.5 h-3.5 text-rose-600 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{place.title}</span>
                        <ExternalLink
                          className="w-3 h-3 shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                      {place.reviewSnippets.length > 0 && (
                        <div className="space-y-1 pl-5">
                          {place.reviewSnippets.map((snippet, sIdx) => (
                            <p
                              key={sIdx}
                              className="text-[11px] text-slate-600 leading-snug"
                            >
                              「{snippet.text}」
                              {snippet.uri && (
                                <a
                                  href={snippet.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-sky-700 underline"
                                >
                                  查看評論
                                </a>
                              )}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 內置離線地標卡片列表 */}
      <div className="space-y-3">
        {filteredSpots.map((spot) => {
          const catMeta = SPOT_CATEGORY_META[spot.category as SpotCategory];
          const isFocusedOnMap = selectedMapSpotId === spot.id;
          return (
            <article
              key={spot.id}
              className={`bg-white/95 border rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5 transition ${
                isFocusedOnMap
                  ? 'border-indigo-400 ring-2 ring-indigo-200/80'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`ui-pill border ${catMeta.badgeClass}`}>
                    {getCategoryIcon(spot.category, 'w-3 h-3 shrink-0')}
                    <span>{catMeta.label}</span>
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    {spot.area}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-sky-900 bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 rounded-full">
                  {spot.distanceKm === 0
                    ? spot.driveMinutesText
                    : `距酒店約 ${spot.distanceKm} km · ${spot.driveMinutesText}`}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {spot.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  日文對照：{spot.jpName}
                </p>
              </div>

              {spot.priceNote && (
                <div className="bg-indigo-50/90 border border-indigo-200/90 rounded-xl px-3 py-2 text-xs text-indigo-950 flex items-start gap-2">
                  <Tag
                    className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">
                    <strong className="font-bold">參考租借價目：</strong>
                    {spot.priceNote}
                  </span>
                </div>
              )}

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {spot.summary}
              </p>

              {/* 營業與泊車資訊 */}
              <div className="bg-slate-50/90 border border-slate-200/70 rounded-xl p-2.5 space-y-1 text-[11px] text-slate-700">
                <div className="flex items-start gap-1.5">
                  <Clock
                    className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>參考時間：</strong>
                    {spot.hours}
                  </span>
                </div>
                <div className="flex items-start gap-1.5">
                  <ParkingCircle
                    className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    <strong>泊車提示：</strong>
                    {spot.parkingNote}
                  </span>
                </div>
              </div>

              {/* 特色標籤 */}
              <div className="flex flex-wrap gap-1">
                {spot.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-900 border border-sky-200/70"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 複製車機資訊、地圖定位與一鍵導航 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleFocusSpotOnMap(spot.id)}
                  aria-label={`喺互動地圖定位 ${spot.name}`}
                  className="min-h-[40px] text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold px-3 py-1.5 rounded-xl border border-indigo-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MapPin
                    className="w-3.5 h-3.5 text-indigo-700"
                    aria-hidden="true"
                  />
                  <span>地圖定位</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCopyText(spot.addressJp)}
                  aria-label={`複製 ${spot.name} 日文地址`}
                  className="min-h-[40px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                  <span>複製地址</span>
                </button>
                {spot.phone && (
                  <button
                    type="button"
                    onClick={() => onCopyText(spot.phone as string)}
                    aria-label={`複製 ${spot.name} 車機電話 ${spot.phone}`}
                    className="min-h-[40px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone
                      className="w-3.5 h-3.5 text-sky-700"
                      aria-hidden="true"
                    />
                    <span>{spot.phone}</span>
                  </button>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.mapsQuery}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`一鍵開啟 Google Maps 導航去 ${spot.name}`}
                  className="min-h-[40px] flex-1 sm:flex-none text-xs bg-snow-900 hover:bg-snow-700 text-white font-bold px-3.5 py-1.5 rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5"
                >
                  <CornerUpRight
                    className="w-3.5 h-3.5 text-sky-300 shrink-0"
                    aria-hidden="true"
                  />
                  <span>Google Maps 導航</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
