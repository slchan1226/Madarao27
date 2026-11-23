import React, {useCallback, useEffect, useState} from 'react';
import {
  Bed,
  Car,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  LocateFixed,
  Mountain,
  MountainSnow,
  Plane,
  PlaneTakeoff,
  RefreshCw,
  Route,
  Snowflake,
  Sun,
} from 'lucide-react';
import {
  buildOpenMeteoUrl,
  deriveResortWeather,
  describeGpsLocationLabel,
  formatUpdatedTime,
  getSnowProbStyle,
  type DerivedResortWeather,
  type OpenMeteoMultiModelResponse,
  type WeatherIconKind,
} from '../lib/weather';
import type {CarId, TabId} from '../types/trip';

interface HomeTabProps {
  isOnline: boolean;
  madaraoWeather: DerivedResortWeather | null;
  madaraoUpdatedAt?: string;
  isWeatherLoading: boolean;
  myCar: CarId | null;
  myRoom: string | null;
  showFlightTab: boolean;
  showHomeOutboundCard: boolean;
  showHomeInboundCard: boolean;
  onNavigateTab: (tab: TabId) => void;
  onOpenFlightBackup: () => void;
}

interface GpsWeatherSnapshot {
  title: string;
  subtitle: string;
  derived: DerivedResortWeather;
  fetchedAt: string;
}

const GPS_WEATHER_CACHE_KEY = 'madarao_2027_home_gps_weather_v1';

function readStoredGpsWeather(): GpsWeatherSnapshot | null {
  try {
    const raw = localStorage.getItem(GPS_WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GpsWeatherSnapshot;
    if (parsed && parsed.derived && typeof parsed.title === 'string') {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

const MiniWeatherIcon: React.FC<{
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

export const HomeTab: React.FC<HomeTabProps> = ({
  isOnline,
  madaraoWeather,
  madaraoUpdatedAt,
  isWeatherLoading,
  myCar,
  myRoom,
  showFlightTab,
  showHomeOutboundCard,
  showHomeInboundCard,
  onNavigateTab,
  onOpenFlightBackup,
}) => {
  const [locationMode, setLocationMode] = useState<'madarao' | 'gps'>('madarao');
  const [gpsWeather, setGpsWeather] = useState<GpsWeatherSnapshot | null>(
    readStoredGpsWeather,
  );
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  useEffect(() => {
    if (locationMode === 'madarao') {
      setGpsNotice(null);
    }
  }, [locationMode]);

  const handleLocateCurrentWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsNotice('此裝置瀏覽器不支援 GPS 定位，已繼續顯示斑尾高原雪況。');
      return;
    }
    if (!isOnline) {
      if (gpsWeather) {
        setLocationMode('gps');
        setGpsNotice('目前離線，已顯示上次定位的快取天氣。');
      } else {
        setGpsNotice('目前離線無法抓取 GPS 即時天氣，已顯示斑尾高原快取雪況。');
      }
      return;
    }

    setIsLocating(true);
    setGpsNotice(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const url = buildOpenMeteoUrl(lat, lng);
          const response = await fetch(url, {cache: 'no-store'});
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const raw = (await response.json()) as OpenMeteoMultiModelResponse;
          const derived = deriveResortWeather(raw, 0);
          if (!derived) {
            throw new Error('無有效氣象數據');
          }
          const label = describeGpsLocationLabel(lat, lng);
          const snapshot: GpsWeatherSnapshot = {
            title: label.title,
            subtitle: label.subtitle,
            derived,
            fetchedAt: new Date().toISOString(),
          };
          setGpsWeather(snapshot);
          setLocationMode('gps');
          try {
            localStorage.setItem(
              GPS_WEATHER_CACHE_KEY,
              JSON.stringify(snapshot),
            );
          } catch {
            // Ignore quota errors
          }
        } catch {
          setGpsNotice('未能取得 GPS 座標氣象，已保留斑尾高原數據。');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsNotice('未授權定位權限，已繼續顯示斑尾高原雪況。');
        } else {
          setGpsNotice('GPS 定位逾時或訊號偏弱，請稍後再試。');
        }
      },
      {enableHighAccuracy: false, timeout: 9000, maximumAge: 180_000},
    );
  }, [gpsWeather, isOnline]);

  const activeWeather =
    locationMode === 'gps' && gpsWeather ? gpsWeather.derived : madaraoWeather;
  const activeLocationTitle =
    locationMode === 'gps' && gpsWeather
      ? gpsWeather.title
      : '斑尾高原スキー場';
  const activeLocationSubtitle =
    locationMode === 'gps' && gpsWeather
      ? gpsWeather.subtitle
      : '主基地預設 · 海拔 1,150m 基準';
  const activeUpdatedAt =
    locationMode === 'gps' && gpsWeather
      ? gpsWeather.fetchedAt
      : madaraoUpdatedAt;

  const probStyle = getSnowProbStyle(activeWeather?.snowProb24h);

  const shortcuts: Array<{
    id: TabId;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    iconBg: string;
  }> = [
    ...(showFlightTab
      ? [
          {
            id: 'flight' as TabId,
            title: '航班資訊',
            subtitle: 'GK28 / GK27 · 行李與 VJW',
            icon: (
              <PlaneTakeoff
                className="w-4 h-4 text-sky-700"
                aria-hidden="true"
              />
            ),
            iconBg: 'bg-sky-50 border-sky-200/80',
          },
        ]
      : []),
    {
      id: 'route',
      title: '去程自駕',
      subtitle: '成田 T3 ➔ 斑尾 6 站實景',
      icon: <Route className="w-4 h-4 text-blue-700" aria-hidden="true" />,
      iconBg: 'bg-blue-50 border-blue-200/80',
    },
    {
      id: 'hotel',
      title: '酒店房號',
      subtitle: 'シルクイン斑尾 · 預約 1235',
      icon: <Bed className="w-4 h-4 text-indigo-700" aria-hidden="true" />,
      iconBg: 'bg-indigo-50 border-indigo-200/80',
    },
    {
      id: 'skimap',
      title: '雪場地圖',
      subtitle: '斑尾 · ロマンス · 野澤全螢幕',
      icon: (
        <MountainSnow className="w-4 h-4 text-cyan-800" aria-hidden="true" />
      ),
      iconBg: 'bg-cyan-50 border-cyan-200/80',
    },
    {
      id: 'weather',
      title: '雪場氣象',
      subtitle: '4 大雪場積雪、降雪與纜車',
      icon: <CloudSnow className="w-4 h-4 text-sky-800" aria-hidden="true" />,
      iconBg: 'bg-sky-50 border-sky-200/80',
    },
    {
      id: 'local',
      title: '周邊自駕',
      subtitle: '飯山餐廳、溫泉、雪具與地圖',
      icon: <Car className="w-4 h-4 text-amber-800" aria-hidden="true" />,
      iconBg: 'bg-amber-50 border-amber-200/80',
    },
  ];

  const handleOpenFlightDetail = () => {
    if (showFlightTab) {
      onNavigateTab('flight');
    } else {
      onOpenFlightBackup();
    }
  };

  return (
    <section
      id="panel-home"
      role="tabpanel"
      aria-labelledby="tab-home"
      className="space-y-4"
    >
      {/* 1. 焦點雪況與即時天氣卡（預設斑尾高原 ＋ 一鍵 GPS 定位目前位置） */}
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-snow-900 leading-snug">
              {activeLocationTitle}
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              {activeLocationSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {locationMode === 'gps' ? (
              <>
                <button
                  type="button"
                  onClick={handleLocateCurrentWeather}
                  disabled={isLocating}
                  aria-label="重新整理 GPS 目前位置氣象"
                  className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 inline-flex items-center justify-center transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('madarao')}
                  className="min-h-[44px] px-3 rounded-xl bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
                >
                  <Mountain className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>切回斑尾</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleLocateCurrentWeather}
                disabled={isLocating}
                aria-label="以 GPS 定位顯示目前所在位置的天氣與雪況"
                className="min-h-[44px] px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-snow-900 border border-sky-200 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <LocateFixed
                  className={`w-3.5 h-3.5 text-sky-700 shrink-0 ${
                    isLocating ? 'animate-pulse' : ''
                  }`}
                  aria-hidden="true"
                />
                <span>{isLocating ? '定位中...' : '定位目前位置'}</span>
              </button>
            )}
          </div>
        </div>

        {gpsNotice && (
          <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200/80 rounded-xl px-3 py-2">
            {gpsNotice}
          </p>
        )}

        {/* 4 核心雪況指標：天氣氣溫、積雪深度、24h 降雪量、24h 降雪概率（依區間自動變底色） */}
        {isWeatherLoading && !activeWeather ? (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-pulse"
            aria-busy="true"
          >
            <div className="h-20 bg-slate-100 rounded-2xl" />
            <div className="h-20 bg-slate-100 rounded-2xl" />
            <div className="h-20 bg-slate-100 rounded-2xl" />
            <div className="h-20 bg-sky-100/70 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 當前天氣與氣溫 */}
            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500">
                <span>即時天氣</span>
                {activeWeather && (
                  <MiniWeatherIcon
                    kind={activeWeather.currentWeather.icon}
                    className="w-4 h-4 shrink-0"
                  />
                )}
              </div>
              <div className="mt-1.5">
                <div className="font-serif text-2xl font-bold text-snow-900 leading-none tabular-nums">
                  {activeWeather ? `${activeWeather.currentTemp}°C` : '--'}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                  {activeWeather ? activeWeather.currentWeather.label : '載入中'}
                </div>
              </div>
            </div>

            {/* 積雪量 */}
            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500">
                <span>積雪量</span>
                <Snowflake
                  className="w-3.5 h-3.5 text-sky-600 shrink-0"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-serif text-2xl font-bold text-snow-900 leading-none tabular-nums">
                    {activeWeather && activeWeather.snowDepthCm !== null
                      ? activeWeather.snowDepthCm
                      : '--'}
                  </span>
                  <span className="text-xs font-bold text-sky-700">cm</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                  {activeWeather?.snowDepthSource ?? '多模型估算'}
                </div>
              </div>
            </div>

            {/* 未來 24h 降雪量 */}
            <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500">
                <span>24h 降雪量</span>
                <CloudSnow
                  className="w-3.5 h-3.5 text-blue-600 shrink-0"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1.5">
                <div className="flex items-baseline gap-0.5">
                  <span className="font-serif text-2xl font-bold text-snow-900 leading-none tabular-nums">
                    {activeWeather
                      ? activeWeather.total24hSnowCm > 0
                        ? `+${activeWeather.total24hSnowCm}`
                        : '0'
                      : '--'}
                  </span>
                  <span className="text-xs font-bold text-sky-700">cm</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 leading-snug tabular-nums">
                  {activeWeather
                    ? `${activeWeather.min24hTemp}° ～ ${activeWeather.max24hTemp}°C`
                    : '未來 24 小時'}
                </div>
              </div>
            </div>

            {/* 降雪概率（依數據區間調整背景色） */}
            <div
              className={`rounded-2xl p-3 border flex flex-col justify-between transition ${probStyle.cardBgCls} ${probStyle.unselectedBorderCls}`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-700">
                <span>降雪概率</span>
                <CloudSnow
                  className={`w-3.5 h-3.5 shrink-0 ${probStyle.iconCls}`}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-1.5">
                <div className="flex items-baseline gap-0.5">
                  <span
                    className={`font-serif text-2xl font-bold leading-none tabular-nums ${probStyle.valueCls}`}
                  >
                    {activeWeather ? activeWeather.snowProb24h : '--'}
                  </span>
                  <span className={`text-xs font-bold ${probStyle.valueCls}`}>
                    %
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-700 mt-1 leading-snug">
                  {activeWeather ? `24h 最高 · ${probStyle.label}` : '--'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70 text-[11px]">
          <span className="text-slate-500 tabular-nums">
            更新：{formatUpdatedTime(activeUpdatedAt)} JST
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('weather')}
            className="min-h-[36px] text-sky-800 hover:text-snow-900 font-bold inline-flex items-center gap-0.5 transition cursor-pointer shrink-0 whitespace-nowrap"
          >
            <span>四大雪場預報與纜車</span>
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 2. 條件式即時航班摘要卡（去程：落地前顯示；回程：2/19 18:00 JST 後顯示） */}
      {showHomeOutboundCard && (
        <button
          type="button"
          onClick={handleOpenFlightDetail}
          aria-label="查看去程 GK28 航班與行李詳情"
          className="w-full text-left glass-card rounded-3xl p-4 border border-sky-300/85 bg-gradient-to-br from-sky-50/90 to-white hover:border-sky-400 shadow-xs transition active:scale-[0.99] cursor-pointer space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="font-bold text-sky-900">
              去程航班 · GK28（落地前提醒）
            </span>
            <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
              2027/02/14 (日)
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div>
              <div className="text-2xl font-bold text-snow-900 leading-none tabular-nums">
                01:10
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-1">
                香港 HKG · T1
              </div>
            </div>
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700">
                <Plane className="w-3.5 h-3.5 rotate-45" aria-hidden="true" />
                <span>4h 10m</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                TUKQQH · VLNWFF
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-snow-900 leading-none tabular-nums">
                06:20
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-1">
                東京成田 NRT · T3
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-sky-200/60 flex items-center justify-between text-[11px] text-sky-800 font-semibold">
            <span>點擊查看 315kg 寄艙行李配額與 Visit Japan Web</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </div>
        </button>
      )}

      {showHomeInboundCard && (
        <button
          type="button"
          onClick={handleOpenFlightDetail}
          aria-label="查看回程 GK27 航班與行李詳情"
          className="w-full text-left glass-card rounded-3xl p-4 border border-slate-300/90 bg-gradient-to-br from-slate-50 to-white hover:border-slate-400 shadow-xs transition active:scale-[0.99] cursor-pointer space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
            <span className="font-bold text-slate-900">
              回程航班 · GK27（返港提醒）
            </span>
            <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
              2027/02/20 (六)
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none tabular-nums">
                19:30
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-1">
                東京成田 NRT · T3
              </div>
            </div>
            <div className="text-center px-2">
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700">
                <Plane className="w-3.5 h-3.5 rotate-45" aria-hidden="true" />
                <span>5h 15m</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                建議 16:30 抵機場
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900 leading-none tabular-nums">
                23:45
              </div>
              <div className="text-[11px] font-semibold text-slate-600 mt-1">
                香港 HKG · T1
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-700 font-semibold">
            <span>點擊查看完整回程航班、訂位代號與行李限額</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* 3. 我的個人分車與房號速查條 */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onNavigateTab('route')}
          className="min-h-[60px] glass-card rounded-2xl px-3.5 py-2.5 border border-slate-200/85 hover:border-sky-300 text-left flex items-center justify-between gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-500">
              我的分車
            </div>
            <div className="text-sm font-bold text-snow-900 leading-snug mt-0.5">
              {myCar ?? '未選擇'}
            </div>
          </div>
          <ChevronRight
            className="w-4 h-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('hotel')}
          className="min-h-[60px] glass-card rounded-2xl px-3.5 py-2.5 border border-slate-200/85 hover:border-sky-300 text-left flex items-center justify-between gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-semibold text-slate-500">
              我的房號
            </div>
            <div className="text-sm font-bold text-snow-900 leading-snug mt-0.5">
              {myRoom ? myRoom.split('（')[0] : '未置頂'}
            </div>
          </div>
          <ChevronRight
            className="w-4 h-4 text-slate-400 shrink-0"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* 4. 全站直達功能捷徑網格 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-serif text-sm font-bold text-snow-900">
            快速直達各行程分頁
          </h3>
          <span className="text-[11px] text-slate-500">
            點擊卡片直接前往
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {shortcuts.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.id)}
              className="min-h-[82px] glass-card rounded-2xl p-3.5 border border-slate-200/85 hover:border-sky-300 hover:bg-white text-left flex flex-col justify-between gap-2 transition active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  {item.icon}
                </span>
                <ChevronRight
                  className="w-4 h-4 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  {item.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {item.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
