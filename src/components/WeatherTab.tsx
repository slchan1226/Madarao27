import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  ExternalLink,
  Moon,
  Mountain,
  Palette,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Sun,
  Thermometer,
  WifiOff,
  Wind,
} from 'lucide-react';
import {BANNER_THEME_LABELS} from './BannerBackdrop';
import {
  WEATHER_RESORTS,
  describeWeatherCode,
  formatJapanTimeNow,
  formatUpdatedTime,
  type BannerWeatherTheme,
  type DayPeriod,
  type DerivedResortWeather,
  type WeatherIconKind,
  type WeatherMap,
  type WeatherResortId,
} from '../lib/weather';

interface WeatherTabProps {
  isOnline: boolean;
  weatherMap: WeatherMap;
  derivedByResort: Partial<Record<WeatherResortId, DerivedResortWeather>>;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
  activeBannerTheme: BannerWeatherTheme;
  activeIsDay: boolean;
  previewTheme: BannerWeatherTheme | null;
  previewPeriod: DayPeriod | null;
  onSelectPreviewTheme: (theme: BannerWeatherTheme | null) => void;
  onSelectPreviewPeriod: (period: DayPeriod | null) => void;
}

const WeatherIcon: React.FC<{
  kind: WeatherIconKind;
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

const PREVIEW_THEME_OPTIONS: Array<{
  id: BannerWeatherTheme;
  label: string;
}> = [
  {id: 'sunny', label: '晴天'},
  {id: 'cloudy', label: '陰天'},
  {id: 'snow', label: '降雪'},
  {id: 'heavy-snow', label: '降大雪'},
  {id: 'rain', label: '降雨'},
];

export const WeatherTab: React.FC<WeatherTabProps> = ({
  isOnline,
  weatherMap,
  derivedByResort,
  isLoading,
  isRefreshing,
  errorMessage,
  onRefresh,
  activeBannerTheme,
  activeIsDay,
  previewTheme,
  previewPeriod,
  onSelectPreviewTheme,
  onSelectPreviewPeriod,
}) => {
  const [selectedResortId, setSelectedResortId] =
    useState<WeatherResortId>('madarao');
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

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
      return {text: '早雪／積雪累積中', cls: 'bg-amber-100 text-amber-900'};
    }
    return {text: '模型網格未達雪線・請對照官網', cls: 'bg-slate-100 text-slate-600'};
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
                <span className="ui-pill bg-amber-100 text-amber-950 border border-amber-300">
                  <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>離線快取數據</span>
                </span>
              ) : (
                <span className="ui-pill bg-emerald-100 text-emerald-950 border border-emerald-300">
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
            onClick={onRefresh}
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
            <span className="ui-pill text-sky-800 bg-sky-50 border border-sky-200">
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
              onClick={onRefresh}
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
                  <span className="text-xs font-bold">積雪深度（估算）</span>
                  <Snowflake
                    className="w-4 h-4 text-sky-600 shrink-0"
                    aria-hidden="true"
                  />
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-snow-900 tracking-tight tabular-nums">
                      {derived.snowDepthCm !== null ? derived.snowDepthCm : '--'}
                    </span>
                    <span className="text-sm font-bold text-sky-700">cm</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    來源：{derived.snowDepthSource}
                    {derived.past72hSnowCm > 0
                      ? ` · 近72h降雪 +${derived.past72hSnowCm}cm`
                      : ''}
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
                    <span className="font-serif text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">
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

            {/* 直達雪場官網實測積雪報告按鈕 */}
            <a
              href={activeResort.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`前往 ${activeResort.fullName} 官網查看官方實測積雪與纜車狀況`}
              className="min-h-[48px] w-full bg-sky-50 hover:bg-sky-100 text-snow-900 border border-sky-200 text-xs font-bold py-2.5 px-3.5 rounded-2xl inline-flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>對照 {activeResort.shortName} 官網實測積雪 &amp; 纜車開放</span>
            </a>
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
              <strong>多模型積雪與山頂離線快取：</strong>為解決日本 JMA 開放模型不含地面積雪欄位的問題，本頁同步整合{' '}
              <span className="font-semibold text-slate-800">
                ECMWF IFS、NOAA GFS、DWD ICON 及 JMA
              </span>{' '}
              多模型估算，並全部寫入 Service Worker 離線快取；由於衛星／數值網格（約 9–13km）與雪道人工造雪／山頂雪尺仍有差異，建議出門前可一鍵對照上方官網實測數字。
            </p>
          </div>
        </div>
      )}

      {/* 頂部橫幅天氣主題與日夜效果預覽器（預設收起，點擊展開） */}
      <div className="glass-card rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsPreviewOpen((prev) => !prev)}
          aria-expanded={isPreviewOpen}
          aria-controls="banner-theme-preview-panel"
          className="w-full min-h-[48px] px-4 py-3 sm:px-5 flex items-center justify-between gap-2 text-left hover:bg-slate-50/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Palette
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <span className="font-serif text-sm sm:text-base font-bold text-snow-900 truncate">
              頂部橫幅天氣主題預覽
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="ui-pill bg-sky-50 text-sky-900 border border-sky-200">
              {previewTheme === null && previewPeriod === null
                ? `自動：${BANNER_THEME_LABELS[activeBannerTheme]}（${activeIsDay ? '日間' : '夜間'}）`
                : `預覽：${BANNER_THEME_LABELS[activeBannerTheme]}（${activeIsDay ? '日間' : '夜間'}）`}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                isPreviewOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </button>

        {isPreviewOpen && (
          <div
            id="banner-theme-preview-panel"
            className="px-4 pb-4 pt-1 sm:px-5 sm:pb-5 border-t border-slate-100 space-y-3"
          >
            <p className="text-[11px] text-slate-600 leading-relaxed pt-2">
              平時按斑尾高原即時天氣與日本時間自動切換（斑尾現時{' '}
              <strong className="text-slate-800">JST {formatJapanTimeNow()}</strong>
              ，06:00–18:00 為日間）；撳下面掣可即時試睇 5 種天氣同日夜氛圍：
            </p>

            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="選擇頂部橫幅天氣主題預覽"
            >
              <button
                type="button"
                onClick={() => {
                  onSelectPreviewTheme(null);
                  onSelectPreviewPeriod(null);
                }}
                aria-pressed={previewTheme === null && previewPeriod === null}
                className={`ui-pill cursor-pointer border transition ${
                  previewTheme === null && previewPeriod === null
                    ? 'bg-snow-900 text-white border-snow-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                自動（即時）
              </button>

              {PREVIEW_THEME_OPTIONS.map((opt) => {
                const isActive = previewTheme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectPreviewTheme(opt.id)}
                    aria-pressed={isActive}
                    className={`ui-pill cursor-pointer border transition ${
                      isActive
                        ? 'bg-sky-700 text-white border-sky-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* 日夜微調切換 */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-600">
                日夜微調測試
              </span>
              <div
                className="flex items-center gap-1.5"
                role="group"
                aria-label="切換日夜預覽"
              >
                <button
                  type="button"
                  onClick={() => onSelectPreviewPeriod('day')}
                  aria-pressed={previewPeriod === 'day'}
                  className={`ui-pill cursor-pointer border transition ${
                    previewPeriod === 'day'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  <Sun className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>日間</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreviewPeriod('night')}
                  aria-pressed={previewPeriod === 'night'}
                  className={`ui-pill cursor-pointer border transition ${
                    previewPeriod === 'night'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>夜間</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
