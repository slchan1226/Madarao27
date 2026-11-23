import React, {useMemo, useState} from 'react';
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  CornerUpRight,
  Fuel,
  LocateFixed,
  MapPin,
  Search,
  Snowflake,
  Sun,
} from 'lucide-react';
import {
  DEFAULT_FUEL_KM_PER_L,
  DEFAULT_GAS_PRICE_YEN,
  FUEL_PRESETS,
  OFFLINE_LANDMARKS,
  estimateDrivingToLandmarks,
  parseCoordinateInput,
  searchOfflineLandmarks,
  type OfflineLandmark,
  type RoadCondition,
  type TripMode,
} from '../lib/offlineDistance';

const FUEL_STORAGE_KEY = 'madarao_2027_fuel_kmpl';

function readStoredKmPerL(): number {
  try {
    const raw = localStorage.getItem(FUEL_STORAGE_KEY);
    if (!raw) return DEFAULT_FUEL_KM_PER_L;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed >= 4 && parsed <= 35) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_FUEL_KM_PER_L;
}

const QUICK_ORIGIN_IDS = [
  'silk-in',
  'iiyama-station',
  'nozawa',
  'romance',
  'toyota-iiyama-ic',
] as const;

type OriginState =
  | {
      type: 'landmark';
      landmark: OfflineLandmark;
    }
  | {
      type: 'coords';
      label: string;
      lat: number;
      lng: number;
    };

export const OfflineDistanceTool: React.FC = () => {
  const defaultOriginLandmark =
    OFFLINE_LANDMARKS.find((l) => l.id === 'iiyama-station') ??
    OFFLINE_LANDMARKS[0];

  const [origin, setOrigin] = useState<OriginState>({
    type: 'landmark',
    landmark: defaultOriginLandmark,
  });
  const [query, setQuery] = useState<string>(defaultOriginLandmark.shortName);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const [roadCondition, setRoadCondition] = useState<RoadCondition>('snow');
  const [tripMode, setTripMode] = useState<TripMode>('oneway');
  const [kmPerLiter, setKmPerLiter] = useState<number>(readStoredKmPerL);
  const [showAllLandmarks, setShowAllLandmarks] = useState<boolean>(false);

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  const matchedSuggestions = useMemo(() => {
    if (!isInputFocused) return [];
    const coords = parseCoordinateInput(query);
    if (coords) return [];
    return searchOfflineLandmarks(query).slice(0, 6);
  }, [isInputFocused, query]);

  const parsedTypedCoords = useMemo(() => parseCoordinateInput(query), [query]);

  const handleSelectLandmarkOrigin = (landmark: OfflineLandmark) => {
    setOrigin({type: 'landmark', landmark});
    setQuery(landmark.shortName);
    setGpsStatus(null);
    setIsInputFocused(false);
  };

  const handleApplyInput = () => {
    const coords = parseCoordinateInput(query);
    if (coords) {
      setOrigin({
        type: 'coords',
        label: `自訂座標 (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        lat: coords.lat,
        lng: coords.lng,
      });
      setGpsStatus(null);
      setIsInputFocused(false);
      return;
    }

    const matches = searchOfflineLandmarks(query);
    if (matches.length > 0) {
      handleSelectLandmarkOrigin(matches[0]);
    }
  };

  const handleLocateGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('此裝置不支援 GPS 定位，請直接揀選或輸入周邊地標。');
      return;
    }
    setIsLocating(true);
    setGpsStatus('正在讀取手機本機 GPS 衛星位置（無訊號亦可使用）…');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const {latitude, longitude} = position.coords;
        const label = `本機 GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        setOrigin({
          type: 'coords',
          label,
          lat: latitude,
          lng: longitude,
        });
        setQuery(label);
        setGpsStatus('已透過本機 GPS 鎖定當前位置，即時計算各熱門點車程與油耗。');
        setIsLocating(false);
      },
      () => {
        setGpsStatus(
          '未能取得 GPS 權限或訊號，你可直接輸入地標名稱（如「飯山」、「野澤」）或經緯度。',
        );
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60_000,
      },
    );
  };

  const handleUpdateKmPerL = (value: number) => {
    const clamped = Math.max(4, Math.min(35, value));
    setKmPerLiter(clamped);
    try {
      localStorage.setItem(FUEL_STORAGE_KEY, String(clamped));
    } catch {
      // Ignore storage write errors
    }
  };

  const estimates = useMemo(() => {
    const originLat =
      origin.type === 'landmark' ? origin.landmark.lat : origin.lat;
    const originLng =
      origin.type === 'landmark' ? origin.landmark.lng : origin.lng;
    const originLandmarkId =
      origin.type === 'landmark' ? origin.landmark.id : null;

    const all = estimateDrivingToLandmarks({
      originLat,
      originLng,
      originLandmarkId,
      roadCondition,
      tripMode,
      kmPerLiter,
      gasPriceYen: DEFAULT_GAS_PRICE_YEN,
    });

    const filtered = showAllLandmarks
      ? all
      : all.filter((item) => item.landmark.isPopular);

    return filtered;
  }, [kmPerLiter, origin, roadCondition, showAllLandmarks, tripMode]);

  const currentOriginLabel =
    origin.type === 'landmark' ? origin.landmark.name : origin.label;

  return (
    <div className="glass-card jp-pattern-subtle rounded-3xl shadow-sm border border-sky-200/80 overflow-hidden">
      {/* 可展開／收起標題欄（預設收起，與周邊餐廳及地標一致） */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="offline-distance-tool-body"
        className="w-full min-h-[60px] p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-sky-50/40 transition cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sky-700 text-[11px] font-bold tracking-wider">
            <Compass className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>100% 離線可用・山區無網照計</span>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-snow-900 mt-0.5">
            離線地標距離・雪地車程與油耗計算
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            支援 GPS 定位、雪地／乾爽路況與車型油耗估算（{OFFLINE_LANDMARKS.length} 個地標）
          </p>
        </div>

        <span className="min-h-[36px] px-2.5 py-1 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span>{isExpanded ? '收起' : '展開'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
        </span>
      </button>

      {isExpanded && (
        <div
          id="offline-distance-tool-body"
          className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-sky-200/60 space-y-4"
        >

      {/* 當前位置輸入框 + 本機 GPS 定位 */}
      <div className="space-y-2.5">
        <label
          htmlFor="offline-origin-input"
          className="block text-xs font-bold text-slate-800"
        >
          輸入或選擇當前位置（支援中／日／英文地標或經緯度）
        </label>

        <div className="relative flex gap-2">
          <div className="relative flex-1 min-w-0">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="offline-origin-input"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsInputFocused(true);
              }}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsInputFocused(false), 160);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyInput();
                }
              }}
              placeholder="例如：飯山市區、野澤溫泉、36.845, 138.358"
              autoComplete="off"
              className="w-full min-h-[46px] pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 focus:border-sky-600 focus:ring-2 focus:ring-sky-200 rounded-2xl text-slate-900 outline-none transition"
            />

            {/* 離線即時搜尋建議下拉 */}
            {isInputFocused &&
              (matchedSuggestions.length > 0 || parsedTypedCoords) && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                  {parsedTypedCoords ? (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleApplyInput();
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-sky-50 flex items-center gap-2 text-sky-900 font-bold cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>
                        使用輸入座標：{parsedTypedCoords.lat.toFixed(4)},{' '}
                        {parsedTypedCoords.lng.toFixed(4)}
                      </span>
                    </button>
                  ) : (
                    matchedSuggestions.map((lm) => (
                      <button
                        key={lm.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectLandmarkOrigin(lm);
                        }}
                        className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-sky-50 border-b last:border-b-0 border-slate-100 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="font-bold text-slate-900 truncate">
                          {lm.name}
                        </span>
                        <span className="text-[10px] text-slate-500 shrink-0">
                          {lm.elevationM}m
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
          </div>

          <button
            type="button"
            onClick={handleLocateGps}
            disabled={isLocating}
            aria-label="使用手機本機 GPS 鎖定當前位置"
            className="min-h-[46px] px-3.5 rounded-2xl bg-snow-900 hover:bg-snow-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer"
          >
            <LocateFixed
              className={`w-4 h-4 shrink-0 ${isLocating ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />
            <span>{isLocating ? '定位中' : 'GPS 定位'}</span>
          </button>
        </div>

        {/* 快速起點膠囊 */}
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="快速選擇當前出發位置"
        >
          {QUICK_ORIGIN_IDS.map((id) => {
            const lm = OFFLINE_LANDMARKS.find((item) => item.id === id);
            if (!lm) return null;
            const isActive =
              origin.type === 'landmark' && origin.landmark.id === lm.id;
            return (
              <button
                key={lm.id}
                type="button"
                onClick={() => handleSelectLandmarkOrigin(lm)}
                aria-pressed={isActive}
                className={`ui-pill border transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                }`}
              >
                <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{lm.shortName}</span>
              </button>
            );
          })}
        </div>

        {gpsStatus && (
          <p className="text-[11px] text-sky-900 bg-sky-50 border border-sky-200/80 rounded-xl px-3 py-2">
            {gpsStatus}
          </p>
        )}
      </div>

      {/* 路況、單程/來回 與 車型油耗設定 */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex items-center gap-1.5"
            role="group"
            aria-label="選擇路面狀況"
          >
            <button
              type="button"
              onClick={() => setRoadCondition('snow')}
              aria-pressed={roadCondition === 'snow'}
              className={`ui-pill border transition cursor-pointer ${
                roadCondition === 'snow'
                  ? 'bg-snow-900 text-white border-snow-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Snowflake className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>雪地山路</span>
            </button>
            <button
              type="button"
              onClick={() => setRoadCondition('dry')}
              aria-pressed={roadCondition === 'dry'}
              className={`ui-pill border transition cursor-pointer ${
                roadCondition === 'dry'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
              }`}
            >
              <Sun className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>乾爽路面</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setTripMode((prev) =>
                prev === 'oneway' ? 'roundtrip' : 'oneway',
              )
            }
            aria-label="切換單程或來回計算"
            className={`ui-pill border transition cursor-pointer ${
              tripMode === 'roundtrip'
                ? 'bg-sky-700 text-white border-sky-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
            }`}
          >
            <ArrowLeftRight className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span>{tripMode === 'roundtrip' ? '來回計算' : '單程計算'}</span>
          </button>
        </div>

        {/* 車型油耗預設與自訂 km/L */}
        <div className="pt-2 border-t border-slate-200/70 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-700 inline-flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>車輛平均油耗（雪地已自動計入暖氣及雪胎約 +15%）</span>
            </span>
            <label className="inline-flex items-center gap-1 text-xs font-bold text-snow-900">
              <input
                type="number"
                min={4}
                max={35}
                step={0.5}
                value={kmPerLiter}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!Number.isNaN(val)) handleUpdateKmPerL(val);
                }}
                aria-label="自訂每公升行駛公里數"
                className="w-16 px-2 py-1 text-center text-xs font-bold bg-white border border-slate-300 rounded-xl text-snow-900 focus:border-sky-600 outline-none"
              />
              <span>km/L</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FUEL_PRESETS.map((preset) => {
              const active = Math.abs(kmPerLiter - preset.kmPerLiter) < 0.1;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleUpdateKmPerL(preset.kmPerLiter)}
                  aria-pressed={active}
                  className={`ui-pill border transition cursor-pointer ${
                    active
                      ? 'bg-sky-100 text-sky-950 border-sky-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 計算結果標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-700">
          出發點：<strong className="text-snow-900">{currentOriginLabel}</strong>
        </p>
        <button
          type="button"
          onClick={() => setShowAllLandmarks((prev) => !prev)}
          className="text-[11px] font-bold text-sky-700 hover:text-sky-900 underline underline-offset-2 cursor-pointer"
        >
          {showAllLandmarks ? '只顯示熱門點' : `顯示全部 ${OFFLINE_LANDMARKS.length} 個地標`}
        </button>
      </div>

      {/* 目的地車程與油耗清單 */}
      <div className="space-y-2.5">
        {estimates.map((item) => (
          <div
            key={item.landmark.id}
            className="bg-white/90 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">
                    {item.landmark.name}
                  </h4>
                  {item.landmark.isPopular && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                      熱門
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.landmark.jpName} · 海拔約 {item.landmark.elevationM}m
                </p>
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.landmark.mapsQuery}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`開啟 Google Maps 導航去 ${item.landmark.name}`}
                className="shrink-0 w-9 h-9 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center justify-center transition"
                title="有訊號時一鍵開 Google Maps"
              >
                <CornerUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center tabular-nums">
              <div className="bg-slate-50 border border-slate-200/70 rounded-xl py-1.5 px-2">
                <span className="block text-[10px] text-slate-500 font-medium">
                  {tripMode === 'roundtrip' ? '來回距離' : '估計距離'}
                </span>
                <span className="block text-sm font-bold text-snow-900">
                  {item.distanceKm} km
                </span>
              </div>

              <div className="bg-sky-50/75 border border-sky-200/70 rounded-xl py-1.5 px-2">
                <span className="text-[10px] text-sky-800 font-medium inline-flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                  <span>{roadCondition === 'snow' ? '雪地車程' : '預估車程'}</span>
                </span>
                <span className="block text-sm font-bold text-sky-900">
                  {item.driveMinutesMin}–{item.driveMinutesMax} 分
                </span>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/70 rounded-xl py-1.5 px-2">
                <span className="text-[10px] text-amber-900 font-medium inline-flex items-center gap-0.5">
                  <Fuel className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                  <span>預估耗油</span>
                </span>
                <span className="block text-sm font-bold text-amber-950">
                  {item.fuelLiters} L
                </span>
                <span className="block text-[10px] text-amber-800/90">
                  約 ¥{item.estimatedYen.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        ※ 距離已結合信州山區實際道路數據及離線球面演算法估算，油費以日本 Regular 汽油約 ¥{DEFAULT_GAS_PRICE_YEN}/L 參考計算；大雪塞車或結冰路段請額外預留 10–15 分鐘緩衝。
      </p>
        </div>
      )}
    </div>
  );
};
