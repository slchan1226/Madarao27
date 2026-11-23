import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  AlertTriangle,
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Mountain,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
  WifiOff,
  Wind,
} from 'lucide-react';

interface WeatherTabProps {
  isOnline: boolean;
  onShowToast: (message: string) => void;
}

type WeatherResortId = 'madarao' | 'tangram' | 'romance' | 'nozawa';

interface WeatherResortMeta {
  id: WeatherResortId;
  shortName: string;
  fullName: string;
  subLabel: string;
  latitude: number;
  longitude: number;
  elevation: number;
  elevationRange: string;
  apiUrl: string;
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current_units?: {
    temperature_2m?: string;
    apparent_temperature?: string;
    wind_speed_10m?: string;
    snowfall?: string;
    snow_depth?: string;
  };
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    snowfall: number;
    snow_depth: number | null;
  };
  hourly_units?: {
    temperature_2m?: string;
    snowfall?: string;
    snow_depth?: string;
    wind_speed_10m?: string;
    precipitation_probability?: string;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    snowfall: number[];
    snow_depth: Array<number | null>;
    weather_code: number[];
    wind_speed_10m: number[];
    precipitation_probability?: Array<number | null>;
  };
}

interface ResortWeatherEntry {
  data: OpenMeteoResponse;
  fetchedAt: string;
  fromCache: boolean;
}

type WeatherMap = Partial<Record<WeatherResortId, ResortWeatherEntry>>;

interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  isTomorrow: boolean;
  snowfallCm: number;
  tempC: number;
  windKmh: number;
  weatherCode: number;
  precipProb: number | null;
}

interface DerivedResortWeather {
  snowDepthCm: number | null;
  total24hSnowCm: number;
  maxHourlySnowCm: number;
  min24hTemp: number;
  max24hTemp: number;
  max24hWind: number;
  currentTemp: number;
  feelsLike: number;
  windSpeed: number;
  currentWeather: ReturnType<typeof describeWeatherCode>;
  next24h: HourlyForecastItem[];
  blocks: Array<{
    label: string;
    range: string;
    snowSum: number;
    avgTemp: number;
  }>;
  elevationM: number;
}

function buildOpenMeteoUrl(
  latitude: number,
  longitude: number,
  elevation: number,
): string {
  return (
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&elevation=${elevation}` +
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,snowfall,snow_depth' +
    '&hourly=temperature_2m,snowfall,snow_depth,weather_code,wind_speed_10m,precipitation_probability' +
    '&timezone=Asia%2FTokyo' +
    '&forecast_days=2'
  );
}

const WEATHER_RESORTS: WeatherResortMeta[] = [
  {
    id: 'madarao',
    shortName: '斑尾高原',
    fullName: '斑尾高原スキー場',
    subLabel: 'Madarao Kogen',
    latitude: 36.8475,
    longitude: 138.2936,
    elevation: 1150,
    elevationRange: '海拔 910m–1,350m（中段 1,150m 基準）',
    apiUrl: buildOpenMeteoUrl(36.8475, 138.2936, 1150),
  },
  {
    id: 'tangram',
    shortName: 'Tangram',
    fullName: 'タングラムスキーサーカス',
    subLabel: 'Tangram Ski Circus',
    latitude: 36.8428,
    longitude: 138.2738,
    elevation: 1050,
    elevationRange: '海拔 800m–1,320m（中段 1,050m 基準）',
    apiUrl: buildOpenMeteoUrl(36.8428, 138.2738, 1050),
  },
  {
    id: 'romance',
    shortName: 'ロマンスの神様',
    fullName: 'スノーリゾートロマンスの神様',
    subLabel: '木島平 Kijimadaira',
    latitude: 36.8355,
    longitude: 138.4316,
    elevation: 950,
    elevationRange: '海拔 550m–1,351m（中段 950m 基準）',
    apiUrl: buildOpenMeteoUrl(36.8355, 138.4316, 950),
  },
  {
    id: 'nozawa',
    shortName: '野沢温泉',
    fullName: '野沢温泉スキー場',
    subLabel: 'Nozawa Onsen',
    latitude: 36.9154,
    longitude: 138.4586,
    elevation: 1250,
    elevationRange: '海拔 565m–1,650m（中段 1,250m 基準）',
    apiUrl: buildOpenMeteoUrl(36.9154, 138.4586, 1250),
  },
];

const WEATHER_STORAGE_KEY = 'madarao_2027_weather_cache_v2';

function readStoredWeatherMap(): WeatherMap {
  try {
    const raw = localStorage.getItem(WEATHER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WeatherMap;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return {};
}

function saveStoredWeatherMap(map: WeatherMap): void {
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function convertSnowDepthToCm(
  rawDepth: number | null | undefined,
  unit?: string,
): number | null {
  if (rawDepth === null || rawDepth === undefined || Number.isNaN(rawDepth)) {
    return null;
  }
  if (unit === 'cm') {
    return Math.max(0, Math.round(rawDepth));
  }
  // Open-Meteo returns snow_depth in meters (m) by default
  return Math.max(0, Math.round(rawDepth * 100));
}

function formatUpdatedTime(isoString: string | null | undefined): string {
  if (!isoString) return '尚未載入';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '剛才更新';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function describeWeatherCode(code: number): {
  label: string;
  icon:
    | 'sun'
    | 'partly'
    | 'cloud'
    | 'fog'
    | 'rain'
    | 'snow'
    | 'heavy-snow'
    | 'storm';
} {
  if (code === 0) return {label: '晴朗藍天', icon: 'sun'};
  if (code === 1 || code === 2) return {label: '天晴間中多雲', icon: 'partly'};
  if (code === 3) return {label: '陰天多雲', icon: 'cloud'};
  if (code === 45 || code === 48) return {label: '山區有霧 / 霧凇', icon: 'fog'};
  if (code >= 51 && code <= 67) return {label: '微雨 / 濕雪', icon: 'rain'};
  if (code === 71 || code === 73 || code === 85) {
    return {label: '降雪中', icon: 'snow'};
  }
  if (code === 75 || code === 77 || code === 86) {
    return {label: '大雪 / 強陣雪', icon: 'heavy-snow'};
  }
  if (code >= 80 && code <= 82) return {label: '驟雨', icon: 'rain'};
  if (code >= 95) return {label: '雷暴陣雪', icon: 'storm'};
  return {label: '山區多雲', icon: 'cloud'};
}

function deriveResortWeather(
  weatherData: OpenMeteoResponse | undefined,
  fallbackElevation: number,
): DerivedResortWeather | null {
  if (!weatherData || !weatherData.hourly || !Array.isArray(weatherData.hourly.time)) {
    return null;
  }

  const {
    current,
    current_units: currentUnits,
    hourly,
    hourly_units: hourlyUnits,
  } = weatherData;

  const currentHourPrefix = current?.time ? current.time.slice(0, 13) : '';
  let startIdx = currentHourPrefix
    ? hourly.time.findIndex((t) => t.startsWith(currentHourPrefix))
    : 0;
  if (startIdx < 0) startIdx = 0;

  const currentDateStr = hourly.time[startIdx]?.slice(0, 10) ?? '';
  const sliceEnd = Math.min(startIdx + 24, hourly.time.length);
  const next24h: HourlyForecastItem[] = [];

  for (let i = startIdx; i < sliceEnd; i++) {
    const timeStr = hourly.time[i];
    const datePart = timeStr.slice(0, 10);
    const hourLabel = timeStr.slice(11, 16);
    next24h.push({
      time: timeStr,
      hourLabel,
      isTomorrow: Boolean(currentDateStr && datePart !== currentDateStr),
      snowfallCm: Number((hourly.snowfall[i] ?? 0).toFixed(1)),
      tempC: Math.round(hourly.temperature_2m[i] ?? 0),
      windKmh: Math.round(hourly.wind_speed_10m[i] ?? 0),
      weatherCode: hourly.weather_code[i] ?? 3,
      precipProb:
        hourly.precipitation_probability &&
        hourly.precipitation_probability[i] !== null &&
        hourly.precipitation_probability[i] !== undefined
          ? Math.round(hourly.precipitation_probability[i] as number)
          : null,
    });
  }

  const total24hSnowCm = Number(
    next24h.reduce((sum, item) => sum + item.snowfallCm, 0).toFixed(1),
  );
  const maxHourlySnowCm = Math.max(
    ...next24h.map((item) => item.snowfallCm),
    1,
  );
  const min24hTemp =
    next24h.length > 0 ? Math.min(...next24h.map((i) => i.tempC)) : 0;
  const max24hTemp =
    next24h.length > 0 ? Math.max(...next24h.map((i) => i.tempC)) : 0;
  const max24hWind =
    next24h.length > 0 ? Math.max(...next24h.map((i) => i.windKmh)) : 0;

  const snowDepthCm =
    convertSnowDepthToCm(current?.snow_depth, currentUnits?.snow_depth) ??
    convertSnowDepthToCm(
      hourly.snow_depth?.[startIdx],
      hourlyUnits?.snow_depth,
    );

  const blocks = [
    {label: '未來 0–6h', items: next24h.slice(0, 6)},
    {label: '未來 6–12h', items: next24h.slice(6, 12)},
    {label: '未來 12–18h', items: next24h.slice(12, 18)},
    {label: '未來 18–24h', items: next24h.slice(18, 24)},
  ]
    .filter((b) => b.items.length > 0)
    .map((block) => {
      const snowSum = Number(
        block.items.reduce((acc, i) => acc + i.snowfallCm, 0).toFixed(1),
      );
      const avgTemp = Math.round(
        block.items.reduce((acc, i) => acc + i.tempC, 0) / block.items.length,
      );
      const firstHour = block.items[0].hourLabel;
      const lastHour = block.items[block.items.length - 1].hourLabel;
      return {
        label: block.label,
        range: `${firstHour}–${lastHour}`,
        snowSum,
        avgTemp,
      };
    });

  const currentTemp = Math.round(
    current?.temperature_2m ?? next24h[0]?.tempC ?? 0,
  );
  const feelsLike = Math.round(current?.apparent_temperature ?? currentTemp);
  const windSpeed = Math.round(
    current?.wind_speed_10m ?? next24h[0]?.windKmh ?? 0,
  );
  const currentWeather = describeWeatherCode(
    current?.weather_code ?? next24h[0]?.weatherCode ?? 3,
  );

  return {
    snowDepthCm,
    total24hSnowCm,
    maxHourlySnowCm,
    min24hTemp,
    max24hTemp,
    max24hWind,
    currentTemp,
    feelsLike,
    windSpeed,
    currentWeather,
    next24h,
    blocks,
    elevationM: Math.round(weatherData.elevation || fallbackElevation),
  };
}

const WeatherIcon: React.FC<{
  kind: ReturnType<typeof describeWeatherCode>['icon'];
  className?: string;
}> = ({kind, className = 'w-5 h-5'}) => {
  switch (kind) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} aria-hidden="true" />;
    case 'partly':
      return (
        <CloudSun className={`${className} text-amber-500`} aria-hidden="true" />
      );
    case 'fog':
      return (
        <CloudFog className={`${className} text-slate-500`} aria-hidden="true" />
      );
    case 'rain':
      return (
        <CloudRain className={`${className} text-sky-600`} aria-hidden="true" />
      );
    case 'snow':
      return (
        <CloudSnow className={`${className} text-sky-600`} aria-hidden="true" />
      );
    case 'heavy-snow':
      return (
        <Snowflake className={`${className} text-blue-600`} aria-hidden="true" />
      );
    case 'storm':
      return (
        <CloudLightning
          className={`${className} text-indigo-600`}
          aria-hidden="true"
        />
      );
    default:
      return <Cloud className={`${className} text-slate-500`} aria-hidden="true" />;
  }
};

export const WeatherTab: React.FC<WeatherTabProps> = ({
  isOnline,
  onShowToast,
}) => {
  const initialMap = useMemo(() => readStoredWeatherMap(), []);

  const [selectedResortId, setSelectedResortId] =
    useState<WeatherResortId>('madarao');
  const [weatherMap, setWeatherMap] = useState<WeatherMap>(initialMap);
  const [isLoading, setIsLoading] = useState<boolean>(
    Object.keys(initialMap).length === 0,
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAllResorts = useCallback(
    async (manual = false) => {
      if (manual) {
        setIsRefreshing(true);
      } else if (Object.keys(weatherMap).length === 0) {
        setIsLoading(true);
      }
      setErrorMessage(null);

      const previousMap = readStoredWeatherMap();
      const nextMap: WeatherMap = {...previousMap};
      let liveSuccessCount = 0;
      let cacheHitCount = 0;

      const results = await Promise.allSettled(
        WEATHER_RESORTS.map(async (resort) => {
          const response = await fetch(resort.apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const swCacheStatus = response.headers.get('X-SW-Cache');
          const swCachedAt = response.headers.get('X-SW-Cached-At');
          const json = (await response.json()) as OpenMeteoResponse;

          if (!json || !json.hourly || !Array.isArray(json.hourly.time)) {
            throw new Error('INVALID_WEATHER_PAYLOAD');
          }

          const isSwCachedFallback = swCacheStatus === 'HIT' || !navigator.onLine;
          const prevEntry = previousMap[resort.id];
          const timestamp =
            isSwCachedFallback && swCachedAt
              ? swCachedAt
              : isSwCachedFallback && prevEntry?.fetchedAt
                ? prevEntry.fetchedAt
                : new Date().toISOString();

          return {
            id: resort.id,
            entry: {
              data: json,
              fetchedAt: timestamp,
              fromCache: isSwCachedFallback,
            } satisfies ResortWeatherEntry,
          };
        }),
      );

      results.forEach((result, index) => {
        const resortId = WEATHER_RESORTS[index].id;
        if (result.status === 'fulfilled') {
          nextMap[resortId] = result.value.entry;
          if (result.value.entry.fromCache) {
            cacheHitCount += 1;
          } else {
            liveSuccessCount += 1;
          }
        } else if (previousMap[resortId]) {
          nextMap[resortId] = {
            ...previousMap[resortId]!,
            fromCache: true,
          };
          cacheHitCount += 1;
        }
      });

      const hasAnyData = Object.keys(nextMap).length > 0;
      if (hasAnyData) {
        setWeatherMap(nextMap);
        saveStoredWeatherMap(nextMap);
      } else {
        setErrorMessage(
          '目前處於離線狀態且尚未快取四大雪場氣象數據，請於有網絡時先載入一次。',
        );
      }

      if (manual) {
        if (liveSuccessCount > 0) {
          onShowToast(`已更新 ${liveSuccessCount} 大雪場即時氣象並寫入離線快取`);
        } else if (cacheHitCount > 0) {
          onShowToast('目前無訊號，已載入最後一次快取的四大雪場氣象');
        } else {
          onShowToast('載入失敗，請檢查網絡連線');
        }
      }

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [onShowToast, weatherMap],
  );

  useEffect(() => {
    void fetchAllResorts(false);
    // Run once on mount; manual refresh button updates all 4 resorts on demand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derivedByResort = useMemo(() => {
    const map: Partial<Record<WeatherResortId, DerivedResortWeather>> = {};
    WEATHER_RESORTS.forEach((resort) => {
      const entry = weatherMap[resort.id];
      const derived = deriveResortWeather(entry?.data, resort.elevation);
      if (derived) {
        map[resort.id] = derived;
      }
    });
    return map;
  }, [weatherMap]);

  const activeResort = useMemo(
    () =>
      WEATHER_RESORTS.find((r) => r.id === selectedResortId) ??
      WEATHER_RESORTS[0],
    [selectedResortId],
  );

  const activeEntry = weatherMap[activeResort.id];
  const derived = derivedByResort[activeResort.id] ?? null;

  const snowDepthTag = useMemo(() => {
    if (!derived || derived.snowDepthCm === null) {
      return {text: '暫無積雪測值', cls: 'bg-slate-100 text-slate-600'};
    }
    if (derived.snowDepthCm >= 150) {
      return {text: '深雪基層・樹林區狀態佳', cls: 'bg-sky-100 text-sky-900'};
    }
    if (derived.snowDepthCm >= 60) {
      return {text: '積雪充足・全山暢滑', cls: 'bg-emerald-100 text-emerald-900'};
    }
    if (derived.snowDepthCm > 0) {
      return {text: '雪層較薄・留意邊緣雪況', cls: 'bg-amber-100 text-amber-900'};
    }
    return {text: '目前無積雪（非雪季）', cls: 'bg-slate-100 text-slate-600'};
  }, [derived]);

  const powderTag = useMemo(() => {
    if (!derived) return '';
    if (derived.total24hSnowCm >= 20) return '深粉雪警報！早起搶頭班車';
    if (derived.total24hSnowCm >= 8) return '明顯降雪補給・粉雪機會高';
    if (derived.total24hSnowCm > 0) return '零星飄雪・雪道表面保持乾爽';
    return '未來 24h 暫無明顯新雪・適合巡航練 Carving';
  }, [derived]);

  const ridingTips = useMemo(() => {
    if (!derived) return [];
    const tips: string[] = [];

    if (derived.total24hSnowCm >= 15) {
      tips.push(
        `${activeResort.shortName} 預計有大量新雪，建議帶粉雪板或將 Binding 稍微後移（Setback），準備衝粉雪！`,
      );
    } else if (derived.total24hSnowCm > 0) {
      tips.push(
        '山區持續飄雪，能見度可能偏低，建議配戴增亮鏡片（Hi-Contrast / Pink / Yellow Lens）。',
      );
    } else {
      tips.push(
        '天色較穩定無大雪，適合長距離巡航壓雪道，記得搽防曬同戴抗反光雪鏡。',
      );
    }

    if (derived.feelsLike <= -8 || derived.max24hWind >= 28) {
      tips.push(
        `山中體感低至 ${derived.feelsLike}°C / 陣風達 ${derived.max24hWind} km/h，上高處吊椅務必戴面罩（Balaclava）及防風外殼。`,
      );
    } else if (derived.max24hTemp >= 2) {
      tips.push(
        `日間氣溫接近 ${derived.max24hTemp}°C，午後低海拔雪質或變軟偏濕，建議做好雪板打蠟及穿著透氣分層。`,
      );
    } else {
      tips.push(
        `氣溫介乎 ${derived.min24hTemp}°C 至 ${derived.max24hTemp}°C，屬於典型信州乾粉雪溫度，中層保暖即可。`,
      );
    }

    return tips;
  }, [activeResort.shortName, derived]);

  const showOfflineBadge = !isOnline || Boolean(activeEntry?.fromCache);

  return (
    <section
      id="panel-weather"
      role="tabpanel"
      aria-labelledby="tab-weather"
      className="space-y-4"
    >
      {/* 四大雪場一覽切換器 + 全部更新 */}
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg sm:text-xl font-bold text-snow-900">
                四大雪場・即時氣象
              </h2>
              {showOfflineBadge ? (
                <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 border border-amber-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>離線快取數據</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-950 border border-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>4 雪場已快取</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span>最後更新：{formatUpdatedTime(activeEntry?.fetchedAt)}（JST）</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchAllResorts(true)}
            disabled={isRefreshing}
            aria-label="重新整理四大雪場氣象"
            className="min-h-[48px] min-w-[48px] shrink-0 bg-snow-900 hover:bg-snow-700 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? '更新中' : '全部更新'}</span>
          </button>
        </div>

        {/* 4 大雪場快速比較卡片（點擊切換詳細預報） */}
        <div
          role="tablist"
          aria-label="切換雪場氣象"
          className="grid grid-cols-2 gap-2"
        >
          {WEATHER_RESORTS.map((resort) => {
            const isSelected = resort.id === activeResort.id;
            const summary = derivedByResort[resort.id];

            return (
              <button
                key={resort.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedResortId(resort.id)}
                className={`min-h-[68px] text-left rounded-2xl p-3 border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-snow-900 text-white border-snow-900 shadow-md'
                    : 'bg-white/90 hover:bg-sky-50/80 text-slate-900 border-slate-200/90'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs font-bold truncate">
                    {resort.shortName}
                  </span>
                  {summary ? (
                    <span
                      className={`text-[11px] font-bold shrink-0 ${
                        isSelected ? 'text-sky-200' : 'text-slate-700'
                      }`}
                    >
                      {summary.currentTemp}°C
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] shrink-0 ${
                        isSelected ? 'text-sky-200/80' : 'text-slate-400'
                      }`}
                    >
                      --
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                  <span
                    className={
                      isSelected ? 'text-sky-100 font-medium' : 'text-slate-600'
                    }
                  >
                    積雪{' '}
                    <strong className={isSelected ? 'text-white' : 'text-snow-900'}>
                      {summary && summary.snowDepthCm !== null
                        ? `${summary.snowDepthCm}cm`
                        : '--'}
                    </strong>
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-bold shrink-0 ${
                      isSelected
                        ? 'bg-white/15 text-sky-200'
                        : summary && summary.total24hSnowCm > 0
                          ? 'bg-sky-100 text-sky-900'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    24h{' '}
                    {summary
                      ? summary.total24hSnowCm > 0
                        ? `+${summary.total24hSnowCm}cm`
                        : '0cm'
                      : '--'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 所選雪場詳細數據主卡 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-4">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-serif text-lg font-bold text-snow-900">
              {activeResort.fullName}
            </h3>
            <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full">
              {activeResort.subLabel}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
            <Mountain
              className="w-3.5 h-3.5 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <span>{activeResort.elevationRange}</span>
          </p>
        </div>

        {/* 載入中骨架屏 */}
        {isLoading && !derived && (
          <div className="space-y-3 animate-pulse" aria-busy="true">
            <div className="grid grid-cols-2 gap-3">
              <div className="h-28 bg-sky-100/80 rounded-2xl" />
              <div className="h-28 bg-slate-200/80 rounded-2xl" />
            </div>
            <div className="h-16 bg-slate-100 rounded-2xl" />
          </div>
        )}

        {/* 首次無網失敗畫面 */}
        {!isLoading && !derived && errorMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="font-bold text-sm">暫未能取得氣象資料</p>
                <p className="leading-relaxed text-amber-900">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchAllResorts(true)}
              className="min-h-[48px] w-full bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl px-4 py-2.5 transition cursor-pointer"
            >
              重新嘗試載入
            </button>
          </div>
        )}

        {/* 核心雪況大數據：目前積雪深度 + 未來 24 小時降雪預測 */}
        {derived && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {/* 積雪深度 */}
              <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-200 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between gap-1 text-sky-900">
                  <span className="text-xs font-bold">目前積雪深度</span>
                  <Snowflake
                    className="w-4 h-4 text-sky-600 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-snow-900 tracking-tight">
                      {derived.snowDepthCm !== null ? derived.snowDepthCm : '--'}
                    </span>
                    <span className="text-sm font-bold text-sky-700">cm</span>
                  </div>
                </div>
                <span
                  className={`inline-block self-start text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-lg ${snowDepthTag.cls}`}
                >
                  {snowDepthTag.text}
                </span>
              </div>

              {/* 未來 24h 總降雪預測 */}
              <div className="bg-gradient-to-br from-snow-900 via-[#153e75] to-sky-800 text-white rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between gap-1 text-sky-100">
                  <span className="text-xs font-bold">未來 24h 降雪</span>
                  <CloudSnow
                    className="w-4 h-4 text-sky-200 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                      {derived.total24hSnowCm > 0
                        ? `+${derived.total24hSnowCm}`
                        : '0'}
                    </span>
                    <span className="text-sm font-bold text-sky-200">cm</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-[11px] text-sky-100 leading-snug font-medium">
                  {powderTag}
                </p>
              </div>
            </div>

            {/* 即時山中環境數據列 */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center">
                <WeatherIcon
                  kind={derived.currentWeather.icon}
                  className="w-5 h-5 mb-1"
                />
                <span className="text-sm font-bold text-slate-900">
                  {derived.currentTemp}°C
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5 truncate max-w-full">
                  {derived.currentWeather.label}
                </span>
              </div>

              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center">
                <Thermometer
                  className="w-5 h-5 text-sky-700 mb-1"
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-slate-900">
                  {derived.feelsLike}°C
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5">
                  體感溫度
                </span>
              </div>

              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-3 flex flex-col items-center text-center">
                <Wind
                  className={`w-5 h-5 mb-1 ${
                    derived.windSpeed >= 28 ? 'text-rose-600' : 'text-sky-700'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-slate-900">
                  {derived.windSpeed}{' '}
                  <span className="text-[10px] font-medium">km/h</span>
                </span>
                <span className="text-[10px] text-slate-600 mt-0.5">
                  {derived.windSpeed >= 28 ? '山風偏強' : '中段風速'}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 未來 24 小時降雪預測：6小時分段摘要 + 逐小時柱狀圖 */}
      {derived && (
        <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-snow-900">
                {activeResort.shortName}・未來 24 小時降雪預測
              </h3>
              <p className="text-[11px] text-slate-600">
                以日本時間（JST）顯示，左右滑動睇每小時降雪量與氣溫
              </p>
            </div>
            <span className="text-[11px] font-bold bg-sky-50 text-sky-900 border border-sky-200 px-2.5 py-1 rounded-xl shrink-0">
              {derived.min24hTemp}°C ～ {derived.max24hTemp}°C
            </span>
          </div>

          {/* 4 段 6 小時速覽 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {derived.blocks.map((block) => (
              <div
                key={block.label}
                className="bg-sky-50/75 border border-sky-100 rounded-2xl px-3 py-2.5 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-snow-900">
                    {block.label}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {block.avgTemp}°C
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-1">
                  <span
                    className={`text-sm font-bold ${
                      block.snowSum > 0 ? 'text-sky-700' : 'text-slate-600'
                    }`}
                  >
                    {block.snowSum > 0 ? `+${block.snowSum} cm` : '0 cm'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {block.range}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 逐小時橫向滑動降雪圖表 */}
          <div
            className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
            aria-label={`${activeResort.fullName} 未來 24 小時逐小時降雪預報`}
          >
            {derived.next24h.map((item, idx) => {
              const barPct =
                item.snowfallCm > 0
                  ? Math.max(
                      16,
                      Math.round(
                        (item.snowfallCm / derived.maxHourlySnowCm) * 100,
                      ),
                    )
                  : 0;
              const info = describeWeatherCode(item.weatherCode);
              const isNow = idx === 0;

              return (
                <div
                  key={item.time}
                  className={`snap-start shrink-0 w-[64px] rounded-2xl border px-2 py-2.5 flex flex-col items-center text-center transition ${
                    isNow
                      ? 'bg-snow-900 text-white border-snow-900 shadow-sm'
                      : item.snowfallCm >= 1
                        ? 'bg-sky-50/90 border-sky-200 text-slate-900'
                        : 'bg-white border-slate-200/80 text-slate-800'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold ${
                      isNow ? 'text-sky-200' : 'text-slate-500'
                    }`}
                  >
                    {isNow ? '現在' : item.isTomorrow ? '明日' : '今日'}
                  </span>
                  <span className="text-xs font-bold mt-0.5">
                    {item.hourLabel}
                  </span>

                  <div className="w-full h-14 my-2 flex flex-col items-center justify-end">
                    <span
                      className={`text-[10px] font-bold mb-1 ${
                        isNow
                          ? 'text-sky-200'
                          : item.snowfallCm > 0
                            ? 'text-sky-700'
                            : 'text-slate-400'
                      }`}
                    >
                      {item.snowfallCm > 0 ? `${item.snowfallCm}cm` : '0'}
                    </span>
                    <div
                      className={`w-4 h-9 rounded-md flex items-end overflow-hidden ${
                        isNow ? 'bg-white/15' : 'bg-slate-100'
                      }`}
                    >
                      {barPct > 0 && (
                        <div
                          className={`w-full rounded-t-sm transition-all ${
                            isNow
                              ? 'bg-sky-300'
                              : item.snowfallCm >= 2
                                ? 'bg-blue-600'
                                : 'bg-sky-400'
                          }`}
                          style={{height: `${barPct}%`}}
                        />
                      )}
                    </div>
                  </div>

                  <WeatherIcon kind={info.icon} className="w-4 h-4 mb-1" />
                  <span className="text-xs font-bold">{item.tempC}°</span>
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isNow ? 'text-sky-200' : 'text-slate-500'
                    }`}
                  >
                    {item.precipProb !== null
                      ? `${item.precipProb}%`
                      : `${item.windKmh}k`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 滑雪裝備與離線快取說明卡片 */}
      {derived && (
        <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/70 space-y-3">
          <h3 className="font-serif text-base font-bold text-snow-900 flex items-center gap-2">
            <Snowflake
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <span>{activeResort.shortName}・今日雪況與裝備建議</span>
          </h3>
          <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
            {ridingTips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 bg-sky-50/60 border border-sky-100 rounded-xl p-2.5"
              >
                <span className="bg-snow-900 text-white text-[10px] font-bold w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
            <ShieldCheck
              className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p>
              <strong>四大雪場山頂離線保護：</strong>每次更新均會透過{' '}
              <span className="font-semibold text-slate-800">Open-Meteo</span>{' '}
              同步抓取斑尾高原、Tangram、ロマンスの神様及野沢温泉數據並寫入 Service Worker 快取，上到山頂無訊號仍可自由切換四個雪場的最後快取數據。
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
