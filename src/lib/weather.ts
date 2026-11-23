export type WeatherResortId = 'madarao' | 'tangram' | 'romance' | 'nozawa';

export interface WeatherResortMeta {
  id: WeatherResortId;
  shortName: string;
  fullName: string;
  subLabel: string;
  latitude: number;
  longitude: number;
  elevation: number;
  elevationRange: string;
  officialUrl: string;
  apiUrl: string;
}

export interface OpenMeteoMultiModelResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current_units?: Record<string, string>;
  current?: Record<string, string | number | null>;
  hourly_units?: Record<string, string>;
  hourly?: {
    time: string[];
    [key: string]: Array<number | null> | string[];
  };
}

export interface ResortWeatherEntry {
  data: OpenMeteoMultiModelResponse;
  fetchedAt: string;
  fromCache: boolean;
}

export type WeatherMap = Partial<Record<WeatherResortId, ResortWeatherEntry>>;

export type WeatherIconKind =
  | 'sun'
  | 'partly'
  | 'cloud'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'heavy-snow'
  | 'storm';

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  isTomorrow: boolean;
  snowfallCm: number;
  tempC: number;
  windKmh: number;
  weatherCode: number;
  precipProb: number | null;
}

export type BannerWeatherTheme =
  | 'sunny'
  | 'cloudy'
  | 'snow'
  | 'heavy-snow'
  | 'rain';

export type DayPeriod = 'day' | 'night';

export interface DerivedResortWeather {
  snowDepthCm: number | null;
  snowDepthSource: string;
  past72hSnowCm: number;
  total24hSnowCm: number;
  maxHourlySnowCm: number;
  min24hTemp: number;
  max24hTemp: number;
  max24hWind: number;
  currentTemp: number;
  feelsLike: number;
  windSpeed: number;
  isDay: boolean;
  bannerTheme: BannerWeatherTheme;
  currentWeather: {
    label: string;
    icon: WeatherIconKind;
  };
  next24h: HourlyForecastItem[];
  blocks: Array<{
    label: string;
    range: string;
    snowSum: number;
    avgTemp: number;
  }>;
  elevationM: number;
}

// Multi-model Open-Meteo query:
// - best_match (JMA MSM 5km in Japan) gives accurate Japanese temp, wind, and snowfall
// - ecmwf_ifs025, gfs_seamless, icon_global natively track ground snowpack (snow_depth),
//   fixing JMA's missing/null snow_depth field in Japan.
// - past_days=3 provides recent 72h snowfall accumulation for early-season snowpack accuracy.
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
    '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,snowfall,snow_depth,is_day' +
    '&hourly=temperature_2m,snowfall,snow_depth,weather_code,wind_speed_10m,precipitation_probability' +
    '&models=best_match,ecmwf_ifs025,gfs_seamless,icon_global' +
    '&timezone=Asia%2FTokyo' +
    '&past_days=3' +
    '&forecast_days=2'
  );
}

export const WEATHER_RESORTS: WeatherResortMeta[] = [
  {
    id: 'madarao',
    shortName: '斑尾高原',
    fullName: '斑尾高原スキー場',
    subLabel: 'Madarao Kogen',
    latitude: 36.8475,
    longitude: 138.2936,
    elevation: 1150,
    elevationRange: '海拔 910m–1,350m（中段 1,150m 基準）',
    officialUrl: 'https://www.madarao.jp/ski',
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
    officialUrl: 'https://www.tangram.jp/ski/',
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
    officialUrl: 'https://kijimadaira-ski.com/',
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
    officialUrl: 'https://nozawaski.com/',
    apiUrl: buildOpenMeteoUrl(36.9154, 138.4586, 1250),
  },
];

export const WEATHER_STORAGE_KEY = 'madarao_2027_weather_cache_v3';

export function readStoredWeatherMap(): WeatherMap {
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

export function saveStoredWeatherMap(map: WeatherMap): void {
  try {
    localStorage.setItem(WEATHER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatUpdatedTime(isoString: string | null | undefined): string {
  if (!isoString) return '尚未載入';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '剛才更新';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

export function describeWeatherCode(code: number): {
  label: string;
  icon: WeatherIconKind;
} {
  if (code === 0) return {label: '晴朗藍天', icon: 'sun'};
  if (code === 1 || code === 2) return {label: '天晴多雲', icon: 'partly'};
  if (code === 3) return {label: '陰天多雲', icon: 'cloud'};
  if (code === 45 || code === 48) return {label: '山區有霧', icon: 'fog'};
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

export function resolveBannerWeatherTheme(code: number): BannerWeatherTheme {
  if (code === 0 || code === 1 || code === 2) return 'sunny';
  if (code === 3 || code === 45 || code === 48) return 'cloudy';
  if (code === 71 || code === 73 || code === 85) return 'snow';
  if (code === 75 || code === 77 || code === 86 || code >= 95) {
    return 'heavy-snow';
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  return 'cloudy';
}

export function isJapanDaytimeNow(): boolean {
  const jstHour = new Date(Date.now() + 9 * 3600_000).getUTCHours();
  return jstHour >= 6 && jstHour < 17;
}

const PRIMARY_MODEL_ORDER = [
  'best_match',
  'ecmwf_ifs025',
  'gfs_seamless',
  'icon_global',
] as const;

const SNOW_DEPTH_MODELS: Array<{key: string; label: string}> = [
  {key: 'ecmwf_ifs025', label: 'ECMWF IFS'},
  {key: 'gfs_seamless', label: 'NOAA GFS'},
  {key: 'icon_global', label: 'DWD ICON'},
  {key: 'best_match', label: 'JMA/綜合'},
];

function readNumericCurrent(
  current: Record<string, string | number | null> | undefined,
  field: string,
): number | null {
  if (!current) return null;
  const plain = current[field];
  if (typeof plain === 'number' && !Number.isNaN(plain)) return plain;
  for (const model of PRIMARY_MODEL_ORDER) {
    const val = current[`${field}_${model}`];
    if (typeof val === 'number' && !Number.isNaN(val)) return val;
  }
  return null;
}

function readHourlySeries(
  hourly: OpenMeteoMultiModelResponse['hourly'],
  field: string,
): Array<number | null> | null {
  if (!hourly) return null;
  const plain = hourly[field];
  if (Array.isArray(plain) && plain.some((v) => typeof v === 'number')) {
    return plain as Array<number | null>;
  }
  for (const model of PRIMARY_MODEL_ORDER) {
    const candidate = hourly[`${field}_${model}`];
    if (Array.isArray(candidate) && candidate.some((v) => typeof v === 'number')) {
      return candidate as Array<number | null>;
    }
  }
  return null;
}

function readHourlyValueAt(
  series: Array<number | null> | null,
  index: number,
): number | null {
  if (!series || index < 0 || index >= series.length) return null;
  const v = series[index];
  return typeof v === 'number' && !Number.isNaN(v) ? v : null;
}

function convertSnowDepthToCm(rawDepth: number, unit?: string): number {
  if (unit === 'cm') {
    return Math.max(0, Math.round(rawDepth));
  }
  // Open-Meteo snow_depth is in meters (m)
  return Math.max(0, Math.round(rawDepth * 100));
}

function findNearestNumber(
  series: Array<number | null> | undefined,
  targetIdx: number,
  maxRadius = 4,
): number | null {
  if (!Array.isArray(series)) return null;
  for (let delta = 0; delta <= maxRadius; delta++) {
    const backIdx = targetIdx - delta;
    if (backIdx >= 0 && backIdx < series.length) {
      const val = series[backIdx];
      if (typeof val === 'number' && !Number.isNaN(val)) return val;
    }
    if (delta > 0) {
      const fwdIdx = targetIdx + delta;
      if (fwdIdx >= 0 && fwdIdx < series.length) {
        const val = series[fwdIdx];
        if (typeof val === 'number' && !Number.isNaN(val)) return val;
      }
    }
  }
  return null;
}

export function deriveResortWeather(
  weatherData: OpenMeteoMultiModelResponse | undefined,
  fallbackElevation: number,
): DerivedResortWeather | null {
  if (
    !weatherData ||
    !weatherData.hourly ||
    !Array.isArray(weatherData.hourly.time) ||
    weatherData.hourly.time.length === 0
  ) {
    return null;
  }

  const {
    current,
    current_units: currentUnits,
    hourly,
    hourly_units: hourlyUnits,
  } = weatherData;

  const times = hourly.time;
  const currentTimeStr =
    typeof current?.time === 'string' ? current.time : '';
  const currentHourPrefix = currentTimeStr ? currentTimeStr.slice(0, 13) : '';
  let startIdx = currentHourPrefix
    ? times.findIndex((t) => t.startsWith(currentHourPrefix))
    : -1;
  if (startIdx < 0) {
    // Fallback to nearest JST hour to now
    const nowJst = new Date(Date.now() + 9 * 3600_000)
      .toISOString()
      .slice(0, 13);
    startIdx = times.findIndex((t) => t.startsWith(nowJst));
  }
  if (startIdx < 0) startIdx = Math.max(0, times.length - 48);

  const tempSeries = readHourlySeries(hourly, 'temperature_2m');
  const snowSeries = readHourlySeries(hourly, 'snowfall');
  const windSeries = readHourlySeries(hourly, 'wind_speed_10m');
  const codeSeries = readHourlySeries(hourly, 'weather_code');
  const precipSeries = readHourlySeries(hourly, 'precipitation_probability');

  // Compute past 72h snowfall accumulation (helps catch early-season alpine snowpack)
  const pastStart = Math.max(0, startIdx - 72);
  let past72hSnowRaw = 0;
  for (let i = pastStart; i < startIdx; i++) {
    const val = readHourlyValueAt(snowSeries, i);
    if (val !== null && val > 0) past72hSnowRaw += val;
  }
  const past72hSnowCm = Number(past72hSnowRaw.toFixed(1));

  // Extract best available snow_depth across ECMWF IFS, NOAA GFS, DWD ICON, and best_match
  let bestDepthCm: number | null = null;
  let bestDepthSource = 'ECMWF / GFS 模型';

  const checkCandidate = (raw: number | null, unit: string | undefined, label: string) => {
    if (raw === null || Number.isNaN(raw)) return;
    const cm = convertSnowDepthToCm(raw, unit);
    if (bestDepthCm === null || cm > bestDepthCm) {
      bestDepthCm = cm;
      bestDepthSource = `${label} 模型`;
    }
  };

  for (const model of SNOW_DEPTH_MODELS) {
    const curKey = `snow_depth_${model.key}`;
    const curVal = current?.[curKey];
    if (typeof curVal === 'number') {
      checkCandidate(curVal, currentUnits?.[curKey], model.label);
    }

    const hrSeries = hourly[curKey] as Array<number | null> | undefined;
    const hrVal = findNearestNumber(hrSeries, startIdx, 4);
    if (hrVal !== null) {
      checkCandidate(hrVal, hourlyUnits?.[curKey], model.label);
    }
  }

  // Fallback for single-model un-suffixed payloads
  const plainCurrentDepth = current?.snow_depth;
  if (typeof plainCurrentDepth === 'number') {
    checkCandidate(plainCurrentDepth, currentUnits?.snow_depth, '氣象模型');
  }
  const plainHourlyDepth = findNearestNumber(
    hourly.snow_depth as Array<number | null> | undefined,
    startIdx,
    4,
  );
  if (plainHourlyDepth !== null) {
    checkCandidate(plainHourlyDepth, hourlyUnits?.snow_depth, '氣象模型');
  }

  // If coarse global grids still report 0cm during early-season mountain snowfalls,
  // surface the recent 72h alpine snowfall accumulation so riders aren't misled by valley-averaged 0cm.
  if ((bestDepthCm === null || bestDepthCm === 0) && past72hSnowCm >= 1) {
    bestDepthCm = Math.round(past72hSnowCm);
    bestDepthSource = '近 72h 降雪估算';
  }

  // Build next 24h forecast slice
  const currentDateStr = times[startIdx]?.slice(0, 10) ?? '';
  const sliceEnd = Math.min(startIdx + 24, times.length);
  const next24h: HourlyForecastItem[] = [];

  for (let i = startIdx; i < sliceEnd; i++) {
    const timeStr = times[i];
    const datePart = timeStr.slice(0, 10);
    const hourLabel = timeStr.slice(11, 16);
    next24h.push({
      time: timeStr,
      hourLabel,
      isTomorrow: Boolean(currentDateStr && datePart !== currentDateStr),
      snowfallCm: Number((readHourlyValueAt(snowSeries, i) ?? 0).toFixed(1)),
      tempC: Math.round(readHourlyValueAt(tempSeries, i) ?? 0),
      windKmh: Math.round(readHourlyValueAt(windSeries, i) ?? 0),
      weatherCode: readHourlyValueAt(codeSeries, i) ?? 3,
      precipProb:
        readHourlyValueAt(precipSeries, i) !== null
          ? Math.round(readHourlyValueAt(precipSeries, i) as number)
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

  const currentTempRaw = readNumericCurrent(current, 'temperature_2m');
  const feelsLikeRaw = readNumericCurrent(current, 'apparent_temperature');
  const windRaw = readNumericCurrent(current, 'wind_speed_10m');
  const codeRaw = readNumericCurrent(current, 'weather_code');
  const isDayRaw = readNumericCurrent(current, 'is_day');

  const resolvedCode = codeRaw ?? next24h[0]?.weatherCode ?? 3;
  const currentTemp = Math.round(currentTempRaw ?? next24h[0]?.tempC ?? 0);
  const feelsLike = Math.round(feelsLikeRaw ?? currentTemp);
  const windSpeed = Math.round(windRaw ?? next24h[0]?.windKmh ?? 0);
  const isDay =
    isDayRaw !== null ? isDayRaw === 1 : isJapanDaytimeNow();
  const currentWeather = describeWeatherCode(resolvedCode);
  const bannerTheme = resolveBannerWeatherTheme(resolvedCode);

  return {
    snowDepthCm: bestDepthCm,
    snowDepthSource: bestDepthSource,
    past72hSnowCm,
    total24hSnowCm,
    maxHourlySnowCm,
    min24hTemp,
    max24hTemp,
    max24hWind,
    currentTemp,
    feelsLike,
    windSpeed,
    isDay,
    bannerTheme,
    currentWeather,
    next24h,
    blocks,
    elevationM: Math.round(weatherData.elevation || fallbackElevation),
  };
}
