import React, {useMemo, useState} from 'react';
import {
  AlertTriangle,
  CableCar,
  ChevronDown,
  ChevronRight,
  Clock,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  LayoutGrid,
  Moon,
  Mountain,
  Palette,
  RefreshCw,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Sun,
  Thermometer,
  WifiOff,
  Wind,
} from 'lucide-react';
import {BANNER_THEME_LABELS} from './BannerBackdrop';
import {SkiLiftStatusCard} from './SkiLiftStatusCard';
import {
  RESORT_COLOR_MAP,
  SnowProbabilityTrendChart,
} from './SnowProbabilityTrendChart';
import {
  WEATHER_RESORTS,
  describeWeatherCode,
  formatJapanTimeNow,
  formatUpdatedTime,
  getSnowProbStyle,
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

type WeatherSectionTab = 'compare' | 'hourly' | 'lifts';

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
  const [sectionTab, setSectionTab] = useState<WeatherSectionTab>('compare');
  const [selectedResortId, setSelectedResortId] =
    useState<WeatherResortId>('madarao');
  const [isUtilityOpen, setIsUtilityOpen] = useState<boolean>(false);

  const activeResort = useMemo(
    () =>
      WEATHER_RESORTS.find((r) => r.id === selectedResortId) ??
      WEATHER_RESORTS[0],
    [selectedResortId],
  );

  const activeEntry = weatherMap[activeResort.id];
  const derived = derivedByResort[activeResort.id] ?? null;

  // 綜合比較四場 24h 降雪量與降雪概率，自動給出一句選場參考
  const bestSnowPick = useMemo(() => {
    const candidates = WEATHER_RESORTS.map((resort) => ({
      resort,
      data: derivedByResort[resort.id] ?? null,
    })).filter(
      (
        item,
      ): item is {
        resort: (typeof WEATHER_RESORTS)[number];
        data: DerivedResortWeather;
      } => item.data !== null,
    );

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      if (b.data.total24hSnowCm !== a.data.total24hSnowCm) {
        return b.data.total24hSnowCm - a.data.total24hSnowCm;
      }
      if (b.data.snowProb24h !== a.data.snowProb24h) {
        return b.data.snowProb24h - a.data.snowProb24h;
      }
      return (b.data.snowDepthCm ?? 0) - (a.data.snowDepthCm ?? 0);
    });

    return candidates[0];
  }, [derivedByResort]);

  const snowDepthNote = useMemo(() => {
    if (!derived || derived.snowDepthCm === null) return '暫無積雪測值';
    if (derived.snowDepthCm >= 150) return '深雪基層・樹林區狀態佳';
    if (derived.snowDepthCm >= 60) return '積雪充足・全山暢滑';
    if (derived.snowDepthCm > 0) return '早雪／積雪累積中';
    return '網格未達雪線・請對照官網';
  }, [derived]);

  const powderTag = useMemo(() => {
    if (!derived) return '';
    if (derived.total24hSnowCm >= 20) return '深粉雪警報！早起搶頭班車';
    if (derived.total24hSnowCm >= 8) return '明顯降雪補給・粉雪機會高';
    if (derived.total24hSnowCm > 0) return '零星飄雪・雪面保持乾爽';
    return '未來 24h 暫無明顯新雪・適合巡航 Carving';
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

  const openResortHourly = (resortId: WeatherResortId) => {
    setSelectedResortId(resortId);
    setSectionTab('hourly');
  };

  return (
    <section
      id="panel-weather"
      role="tabpanel"
      aria-labelledby="tab-weather"
      className="space-y-4"
    >
      {/* 1. 頂部狀態與三段式流程切換（四場對比 → 逐小時預報 → 纜車營業） */}
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 shadow-sm border border-sky-200/80 space-y-3">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <h2 className="font-serif text-base sm:text-lg font-bold text-snow-900">
              四大雪場氣象中心
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span>{formatUpdatedTime(activeEntry?.fetchedAt)} JST</span>
              </span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  showOfflineBadge
                    ? 'text-amber-800 font-semibold inline-flex items-center gap-0.5'
                    : 'text-emerald-800 font-semibold inline-flex items-center gap-0.5'
                }
              >
                {showOfflineBadge ? (
                  <>
                    <WifiOff className="w-3 h-3 shrink-0" aria-hidden="true" />
                    <span>離線快取</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      className="w-3 h-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span>4 雪場已快取</span>
                  </>
                )}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="重新整理四大雪場氣象"
            className="min-h-[42px] shrink-0 bg-snow-900 hover:bg-snow-700 disabled:opacity-60 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? '更新中' : '全部更新'}</span>
          </button>
        </div>

        {/* 主動線三段切換器 */}
        <div
          role="tablist"
          aria-label="切換氣象檢視模式"
          className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'compare'}
            onClick={() => setSectionTab('compare')}
            className={`min-h-[42px] px-1.5 sm:px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              sectionTab === 'compare'
                ? 'bg-snow-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>四場對比</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'hourly'}
            onClick={() => setSectionTab('hourly')}
            className={`min-h-[42px] px-1.5 sm:px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              sectionTab === 'hourly'
                ? 'bg-snow-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CloudSnow className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>逐時預報</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={sectionTab === 'lifts'}
            onClick={() => setSectionTab('lifts')}
            className={`min-h-[42px] px-1.5 sm:px-2 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold inline-flex items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer whitespace-nowrap ${
              sectionTab === 'lifts'
                ? 'bg-snow-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CableCar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>纜車營業</span>
          </button>
        </div>
      </div>

      {/* 載入錯誤提示（無快取時） */}
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
            className="min-h-[46px] w-full bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl px-4 py-2.5 transition cursor-pointer"
          >
            重新嘗試載入
          </button>
        </div>
      )}

      {/* ==================== 動線一：四場對比（揀雪場 + 24h 趨勢折線圖） ==================== */}
      {sectionTab === 'compare' && (
        <div className="space-y-4">
          {/* 今日選場一句結論（點擊直達該雪場逐小時預報） */}
          {bestSnowPick && (
            <button
              type="button"
              onClick={() => openResortHourly(bestSnowPick.resort.id)}
              className="w-full text-left glass-card rounded-2xl px-4 py-3 border border-sky-200/90 hover:bg-sky-50/60 transition flex items-center justify-between gap-2.5 cursor-pointer"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-800">
                  <Sparkles
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {bestSnowPick.data.total24hSnowCm >= 5 ||
                    bestSnowPick.data.snowProb24h >= 50
                      ? '未來 24h 降雪首選'
                      : '四場雪況摘要'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-snow-900 mt-0.5 leading-snug tabular-nums">
                  {bestSnowPick.data.total24hSnowCm > 0 ||
                  bestSnowPick.data.snowProb24h >= 30
                    ? `${bestSnowPick.resort.shortName} · 概率 ${bestSnowPick.data.snowProb24h}% · 新雪 +${bestSnowPick.data.total24hSnowCm}cm`
                    : `四場暫無明顯新雪 · ${bestSnowPick.resort.shortName}積雪最深 (${bestSnowPick.data.snowDepthCm ?? '--'}cm)`}
                </p>
              </div>
              <span className="text-xs font-bold text-sky-800 inline-flex items-center gap-0.5 shrink-0 whitespace-nowrap">
                <span>睇詳情</span>
                <ChevronRight
                  className="w-4 h-4 shrink-0"
                  aria-hidden="true"
                />
              </span>
            </button>
          )}

          {/* 四場降雪概率與雪況 2×2 對比卡片 */}
          <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
              <span className="font-bold text-snow-900">
                點選雪場聚焦趨勢線
              </span>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-400 inline-block"
                    aria-hidden="true"
                  />
                  <span>≥70%</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-300 inline-block"
                    aria-hidden="true"
                  />
                  <span>30–69%</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm bg-slate-50 border border-slate-300 inline-block"
                    aria-hidden="true"
                  />
                  <span>&lt;30%</span>
                </span>
              </div>
            </div>

            <div
              role="radiogroup"
              aria-label="選擇焦點雪場"
              className="grid grid-cols-2 gap-2.5"
            >
              {WEATHER_RESORTS.map((resort) => {
                const isSelected = resort.id === activeResort.id;
                const summary = derivedByResort[resort.id];
                const probStyle = getSnowProbStyle(summary?.snowProb24h);
                const lineColor = RESORT_COLOR_MAP[resort.id];

                return (
                  <div
                    key={resort.id}
                    className={`rounded-2xl border transition flex flex-col justify-between overflow-hidden ${
                      probStyle.cardBgCls
                    } ${
                      isSelected
                        ? 'border-snow-900 ring-2 ring-snow-900/85 shadow-md'
                        : `${probStyle.unselectedBorderCls} shadow-2xs`
                    }`}
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedResortId(resort.id)}
                      className="w-full text-left p-3 pb-2.5 cursor-pointer flex-1 flex flex-col justify-between"
                    >
                      {/* 名稱（左附趨勢線色條）＋ 即時氣溫 */}
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="inline-flex items-start gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-1 rounded-full shrink-0 mt-1.5"
                            style={{backgroundColor: lineColor}}
                            aria-hidden="true"
                          />
                          <span className="text-xs font-bold text-snow-900 leading-tight">
                            {resort.shortName}
                          </span>
                        </span>
                        <span className="text-xs font-bold text-slate-700 shrink-0 tabular-nums">
                          {summary ? `${summary.currentTemp}°C` : '--'}
                        </span>
                      </div>

                      {/* 降雪概率（主焦點數字） */}
                      <div className="mt-2 flex items-baseline justify-between gap-1 tabular-nums">
                        <span className="text-[11px] font-medium text-slate-600">
                          降雪概率
                        </span>
                        <span
                          className={`text-lg font-bold leading-none ${probStyle.valueCls}`}
                        >
                          {summary ? `${summary.snowProb24h}%` : '--'}
                        </span>
                      </div>

                      {/* 積雪 & 24h 新雪（乾淨純文字分隔，無多餘膠囊） */}
                      <div className="mt-2 pt-1.5 border-t border-slate-900/10 flex items-center justify-between gap-1 text-[11px] text-slate-700 tabular-nums">
                        <span>
                          積雪{' '}
                          <strong className="text-snow-900">
                            {summary && summary.snowDepthCm !== null
                              ? `${summary.snowDepthCm}cm`
                              : '--'}
                          </strong>
                        </span>
                        <span
                          className={
                            summary && summary.total24hSnowCm > 0
                              ? 'font-bold text-sky-900'
                              : 'font-medium text-slate-500'
                          }
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

                    {/* 底部一鍵直達該雪場逐小時預報 */}
                    <button
                      type="button"
                      onClick={() => openResortHourly(resort.id)}
                      className="w-full min-h-[34px] px-3 py-1.5 bg-white/65 hover:bg-white border-t border-slate-900/10 text-[11px] font-bold text-snow-900 flex items-center justify-between transition cursor-pointer"
                    >
                      <span>{probStyle.label}</span>
                      <span className="inline-flex items-center gap-0.5 text-sky-800">
                        <span>逐小時</span>
                        <ChevronRight
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 24 小時降雪概率趨勢折線圖 */}
          <SnowProbabilityTrendChart
            derivedByResort={derivedByResort}
            selectedResortId={activeResort.id}
            isLoading={isLoading}
            onSelectResort={(resortId) => setSelectedResortId(resortId)}
          />
        </div>
      )}

      {/* ==================== 動線二 & 三共用的 4 雪場快捷切換列 ==================== */}
      {sectionTab !== 'compare' && (
        <div
          role="tablist"
          aria-label="切換查看的雪場"
          className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-white/95 border border-slate-200/85 shadow-2xs"
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
                className={`min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center text-center transition cursor-pointer tabular-nums ${
                  isSelected
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                <span className="leading-tight">{resort.shortName}</span>
                {summary && (
                  <span
                    className={`text-[10px] font-semibold mt-0.5 ${
                      isSelected ? 'text-sky-100' : 'text-slate-500'
                    }`}
                  >
                    概率 {summary.snowProb24h}% · {summary.currentTemp}°C
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ==================== 動線二：單場深度預報（即時雪況 + 24h 節奏 + 裝備建議） ==================== */}
      {sectionTab === 'hourly' && (
        <div className="space-y-4">
          {isLoading && !derived && (
            <div
              className="glass-card rounded-3xl p-5 border border-sky-200/80 space-y-3 animate-pulse"
              aria-busy="true"
            >
              <div className="h-6 w-48 bg-slate-200 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-24 bg-sky-100/80 rounded-2xl" />
                <div className="h-24 bg-slate-200/80 rounded-2xl" />
              </div>
            </div>
          )}

          {derived && (
            <>
              {/* 單場核心雪況總覽卡（一卡整合積雪、24h新雪、概率、溫度與風速） */}
              <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif text-lg font-bold text-snow-900">
                      {activeResort.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-start gap-1 leading-snug">
                      <Mountain
                        className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{activeResort.elevationRange}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <div className="inline-flex items-center gap-1.5 text-lg font-bold text-snow-900">
                      <WeatherIcon
                        kind={derived.currentWeather.icon}
                        className="w-5 h-5"
                      />
                      <span>{derived.currentTemp}°C</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {derived.currentWeather.label}
                    </div>
                  </div>
                </div>

                {/* 雙主指標：積雪深度 + 未來 24h 新雪 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-sky-50/75 border border-sky-200/85 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-sky-900 text-xs font-bold">
                      <span>積雪深度</span>
                      <Snowflake
                        className="w-4 h-4 text-sky-600 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1 tabular-nums">
                      <span className="font-serif text-3xl font-bold text-snow-900 tracking-tight">
                        {derived.snowDepthCm !== null
                          ? derived.snowDepthCm
                          : '--'}
                      </span>
                      <span className="text-sm font-bold text-sky-700">cm</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      {snowDepthNote}
                      {derived.past72hSnowCm > 0
                        ? ` · 近72h +${derived.past72hSnowCm}cm`
                        : ''}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-snow-900 via-[#153e75] to-sky-800 text-white rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-sky-100 text-xs font-bold">
                      <span>未來 24h 降雪</span>
                      <CloudSnow
                        className="w-4 h-4 text-sky-200 shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="my-1.5 flex items-baseline gap-1 tabular-nums">
                      <span className="font-serif text-3xl font-bold tracking-tight">
                        {derived.total24hSnowCm > 0
                          ? `+${derived.total24hSnowCm}`
                          : '0'}
                      </span>
                      <span className="text-sm font-bold text-sky-200">cm</span>
                    </div>
                    <p className="text-[11px] text-sky-100 leading-snug">
                      {powderTag}
                    </p>
                  </div>
                </div>

                {/* 關鍵環境三欄分隔條（免嵌套多餘小盒） */}
                {(() => {
                  const activeProbStyle = getSnowProbStyle(derived.snowProb24h);
                  return (
                    <div className="grid grid-cols-3 divide-x divide-slate-200/80 border-t border-slate-200/80 pt-3 text-center tabular-nums">
                      <div className="px-1.5">
                        <div className="text-[11px] text-slate-500">
                          24h 降雪概率
                        </div>
                        <div
                          className={`text-base font-bold mt-0.5 ${activeProbStyle.valueCls}`}
                        >
                          {derived.snowProb24h}%
                        </div>
                        <div className="text-[10px] font-semibold text-slate-600">
                          {activeProbStyle.label}
                        </div>
                      </div>

                      <div className="px-1.5">
                        <div className="text-[11px] text-slate-500 inline-flex items-center gap-0.5">
                          <Thermometer
                            className="w-3 h-3 text-sky-700"
                            aria-hidden="true"
                          />
                          <span>體感溫度</span>
                        </div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">
                          {derived.feelsLike}°C
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {derived.min24hTemp}°～{derived.max24hTemp}°C
                        </div>
                      </div>

                      <div className="px-1.5">
                        <div className="text-[11px] text-slate-500 inline-flex items-center gap-0.5">
                          <Wind
                            className={`w-3 h-3 ${
                              derived.windSpeed >= 28
                                ? 'text-rose-600'
                                : 'text-sky-700'
                            }`}
                            aria-hidden="true"
                          />
                          <span>中段風速</span>
                        </div>
                        <div className="text-base font-bold text-slate-900 mt-0.5">
                          {derived.windSpeed}{' '}
                          <span className="text-[11px] font-medium">km/h</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {derived.windSpeed >= 28
                            ? '山風偏強'
                            : `陣風 ${derived.max24hWind}`}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 未來 24 小時 6h 分段節奏 + 逐小時條狀卡 */}
              <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base font-bold text-snow-900">
                      未來 24 小時逐時節奏
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      日本時間（JST）· 左右滑動查看每小時降雪量與概率
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSectionTab('lifts')}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
                  >
                    <CableCar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>睇纜車</span>
                  </button>
                </div>

                {/* 4 × 6h 節奏區塊 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {derived.blocks.map((block) => {
                    const blockProbStyle = getSnowProbStyle(block.snowProb);
                    return (
                      <div
                        key={block.label}
                        className={`border rounded-2xl px-3 py-2 flex flex-col justify-between tabular-nums ${blockProbStyle.blockCls}`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold text-snow-900">
                            {block.label}
                          </span>
                          <span className="text-slate-600">
                            {block.avgTemp}°C
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-1">
                          <span
                            className={`text-sm font-bold ${
                              block.snowSum > 0
                                ? 'text-sky-900'
                                : 'text-slate-600'
                            }`}
                          >
                            {block.snowSum > 0
                              ? `+${block.snowSum} cm`
                              : '0 cm'}
                          </span>
                          <span
                            className={`text-[11px] font-bold ${blockProbStyle.valueCls}`}
                          >
                            {block.snowProb}%
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {block.range}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 24 小時橫向滑動條 */}
                <div
                  className="flex gap-2 overflow-x-auto pb-1.5 -mx-1 px-1 snap-x"
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
                    const hourProbStyle = getSnowProbStyle(item.snowProb);

                    return (
                      <div
                        key={item.time}
                        className={`snap-start shrink-0 w-[64px] rounded-2xl border px-2 py-2.5 flex flex-col items-center text-center transition tabular-nums ${
                          isNow
                            ? 'bg-snow-900 text-white border-snow-900 shadow-sm'
                            : `${hourProbStyle.blockCls} text-slate-900`
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
                                  ? 'text-sky-800'
                                  : 'text-slate-400'
                            }`}
                          >
                            {item.snowfallCm > 0 ? `${item.snowfallCm}cm` : '0'}
                          </span>
                          <div
                            className={`w-4 h-9 rounded-md flex items-end overflow-hidden ${
                              isNow ? 'bg-white/15' : 'bg-white/75'
                            }`}
                          >
                            {barPct > 0 && (
                              <div
                                className={`w-full rounded-t-sm transition-all ${
                                  isNow
                                    ? 'bg-sky-300'
                                    : item.snowfallCm >= 2
                                      ? 'bg-blue-600'
                                      : 'bg-sky-500'
                                }`}
                                style={{height: `${barPct}%`}}
                              />
                            )}
                          </div>
                        </div>

                        <WeatherIcon kind={info.icon} className="w-4 h-4 mb-1" />
                        <span className="text-xs font-bold">{item.tempC}°</span>
                        <span
                          className={`text-[10px] font-bold mt-0.5 ${
                            isNow ? 'text-sky-200' : hourProbStyle.valueCls
                          }`}
                          title="該時段降雪概率"
                        >
                          {item.snowProb}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 今日著裝與裝備建議（直接整合在單場預報尾段，免額外展開） */}
              <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-2.5">
                <h3 className="font-serif text-sm sm:text-base font-bold text-snow-900">
                  {activeResort.shortName} · 今日裝備與鏡片建議
                </h3>
                <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                  {ridingTips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2.5 pt-2 first:pt-0 border-t first:border-t-0 border-slate-100"
                    >
                      <span className="text-[11px] font-bold text-sky-800 shrink-0 tabular-nums mt-0.5">
                        0{index + 1}.
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ==================== 動線三：即時纜車開放與營業時間 ==================== */}
      {sectionTab === 'lifts' && (
        <SkiLiftStatusCard resort={activeResort} isOnline={isOnline} />
      )}

      {/* 底部精簡摺疊工具：多模型數據說明 ＋ 首頁雪山橫幅天氣預覽（不干擾主流程） */}
      <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsUtilityOpen((prev) => !prev)}
          aria-expanded={isUtilityOpen}
          aria-controls="weather-utility-panel"
          className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50/70 transition cursor-pointer"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Palette
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <span className="font-serif text-sm font-bold text-snow-900 leading-snug">
              模型說明與首頁橫幅預覽
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
              {BANNER_THEME_LABELS[activeBannerTheme]} ·{' '}
              {activeIsDay ? '日間' : '夜間'}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                isUtilityOpen ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </div>
        </button>

        {isUtilityOpen && (
          <div
            id="weather-utility-panel"
            className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-3"
          >
            <p className="text-[11px] text-slate-600 leading-relaxed">
              氣象整合 ECMWF IFS、NOAA GFS、DWD ICON 及 JMA 模型並支援離線快取；首頁橫幅平時按斑尾高原即時天氣與日本時間（現時{' '}
              <strong className="text-slate-800">
                JST {formatJapanTimeNow()}
              </strong>
              ）自動切換。
            </p>

            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label="選擇首頁橫幅天氣主題預覽"
            >
              <button
                type="button"
                onClick={() => {
                  onSelectPreviewTheme(null);
                  onSelectPreviewPeriod(null);
                }}
                aria-pressed={previewTheme === null && previewPeriod === null}
                className={`min-h-[36px] px-3 rounded-xl text-xs font-bold cursor-pointer border transition ${
                  previewTheme === null && previewPeriod === null
                    ? 'bg-snow-900 text-white border-snow-900'
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
                    className={`min-h-[36px] px-3 rounded-xl text-xs font-bold cursor-pointer border transition ${
                      isActive
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
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
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer border transition ${
                    previewPeriod === 'day'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>日間</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectPreviewPeriod('night')}
                  aria-pressed={previewPeriod === 'night'}
                  className={`min-h-[36px] px-3 rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer border transition ${
                    previewPeriod === 'night'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
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
