/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ArrowLeft,
  Bed,
  Car,
  CloudSnow,
  HelpCircle,
  Home,
  MountainSnow,
  PlaneTakeoff,
  Route,
  Smartphone,
} from 'lucide-react';
import {
  BannerBackdrop,
  BANNER_THEME_LABELS,
  getBannerGradientClass,
} from './components/BannerBackdrop';
import {CountdownWidget} from './components/CountdownWidget';
import {FlightTab} from './components/FlightTab';
import {GuideModal} from './components/GuideModal';
import {HomeTab} from './components/HomeTab';
import {HotelTab} from './components/HotelTab';
import {InstallModal} from './components/InstallModal';
import {LocalTab} from './components/LocalTab';
import {MapLightbox} from './components/MapLightbox';
import {OfflineBanner} from './components/OfflineBanner';
import {RouteTab} from './components/RouteTab';
import {SkiMapTab} from './components/SkiMapTab';
import {WeatherTab} from './components/WeatherTab';
import {
  BOOKING_GROUPS,
  getOutboundSeat,
  readStoredSeat,
  saveStoredSeat,
} from './data/flightSeats';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {usePWAInstall} from './hooks/usePWAInstall';
import {useSkiWeather} from './hooks/useSkiWeather';
import {
  readStoredTripStage,
  resolveTripTimeline,
  saveStoredTripStage,
} from './lib/tripTimeline';
import {
  isJapanDaytimeNow,
  type BannerWeatherTheme,
  type DayPeriod,
} from './lib/weather';
import type {
  CarId,
  MapMode,
  ResortKey,
  TabId,
  TripStagePreview,
} from './types/trip';

const STORAGE_KEYS = {
  lastTab: 'madarao_2027_last_tab',
  myCar: 'madarao_2027_my_car',
  myRoom: 'madarao_2027_my_room',
} as const;

const VALID_TABS: TabId[] = [
  'home',
  'flight',
  'route',
  'hotel',
  'skimap',
  'weather',
  'local',
];
const VALID_CARS: CarId[] = ['Car A', 'Car B', 'Car C'];

const TAB_PAGE_TITLES: Record<TabId, string> = {
  home: '斑尾高原滑雪之旅',
  flight: '航班資訊',
  route: '去程自駕路線',
  hotel: '酒店與房號',
  skimap: '雪場地圖',
  weather: '雪場氣象',
  local: '周邊自駕',
};

function readInitialTab(initialStage: TripStagePreview): TabId {
  const initialTimeline = resolveTripTimeline(initialStage);
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.lastTab);
    if (saved && VALID_TABS.includes(saved as TabId)) {
      if (saved === 'flight' && !initialTimeline.showFlightTab) {
        return 'home';
      }
      return saved as TabId;
    }
  } catch {
    // Ignore storage access errors in private browsing
  }
  return 'home';
}

function readInitialCar(): CarId | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.myCar);
    if (saved && VALID_CARS.includes(saved as CarId)) {
      return saved as CarId;
    }
  } catch {
    // Ignore storage access errors
  }
  return null;
}

function readInitialRoom(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.myRoom);
  } catch {
    return null;
  }
}

export default function App() {
  const [tripStage, setTripStage] = useState<TripStagePreview>(
    readStoredTripStage,
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    readInitialTab(readStoredTripStage()),
  );
  const [isFlightBackupView, setIsFlightBackupView] = useState<boolean>(false);
  const [myCar, setMyCar] = useState<CarId | null>(readInitialCar);
  const [myRoom, setMyRoom] = useState<string | null>(readInitialRoom);
  const [mySeat, setMySeat] = useState<string | null>(readStoredSeat);

  const [cardMapModes, setCardMapModes] = useState<Record<ResortKey, MapMode>>({
    madarao: 'svg',
    romance: 'svg',
    nozawa: 'svg',
  });
  const [lightboxResort, setLightboxResort] = useState<ResortKey | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<BannerWeatherTheme | null>(
    null,
  );
  const [previewPeriod, setPreviewPeriod] = useState<DayPeriod | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {canNativeInstall, isInstalled, triggerNativeInstall} = usePWAInstall();
  const isOnline = useOnlineStatus();

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastVisible(false);
    }, 2200);
  }, []);

  const skiWeather = useSkiWeather(showToast);
  const madaraoWeather = skiWeather.derivedByResort.madarao ?? null;
  const madaraoUpdatedAt = skiWeather.weatherMap.madarao?.fetchedAt;

  const [japanIsDay, setJapanIsDay] = useState<boolean>(() =>
    isJapanDaytimeNow(),
  );

  useEffect(() => {
    const syncClock = () => {
      setJapanIsDay(isJapanDaytimeNow());
      setNowMs(Date.now());
    };
    syncClock();
    const timer = window.setInterval(syncClock, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const timeline = useMemo(
    () => resolveTripTimeline(tripStage, nowMs),
    [tripStage, nowMs],
  );

  // 若時間進入隱藏航班分頁視窗且並非從「備查入口」主動開啟，自動導向首頁
  useEffect(() => {
    if (
      activeTab === 'flight' &&
      !timeline.showFlightTab &&
      !isFlightBackupView
    ) {
      setActiveTab('home');
      try {
        localStorage.setItem(STORAGE_KEYS.lastTab, 'home');
      } catch {
        // Ignore storage write errors
      }
    }
  }, [activeTab, isFlightBackupView, timeline.showFlightTab]);

  const activeBannerTheme: BannerWeatherTheme =
    previewTheme ?? madaraoWeather?.bannerTheme ?? 'snow';
  const activeIsDay: boolean =
    previewPeriod !== null ? previewPeriod === 'day' : japanIsDay;
  const bannerGradientClass = getBannerGradientClass(
    activeBannerTheme,
    activeIsDay,
  );

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({top: 0, behavior: 'smooth'});
    } else {
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
  }, []);

  const switchTab = useCallback(
    (tab: TabId) => {
      setIsFlightBackupView(false);
      setActiveTab(tab);
      try {
        localStorage.setItem(STORAGE_KEYS.lastTab, tab);
      } catch {
        // Ignore storage access errors
      }
      scrollToTop();
    },
    [scrollToTop],
  );

  const handleOpenFlightBackup = useCallback(() => {
    setIsFlightBackupView(!timeline.showFlightTab);
    setActiveTab('flight');
    scrollToTop();
  }, [scrollToTop, timeline.showFlightTab]);

  const handleSelectTripStage = useCallback(
    (nextStage: TripStagePreview) => {
      setTripStage(nextStage);
      saveStoredTripStage(nextStage);
      const resolved = resolveTripTimeline(nextStage);
      if (!resolved.showFlightTab && activeTab === 'flight') {
        setIsFlightBackupView(false);
        setActiveTab('home');
      }
      showToast(
        nextStage === 'auto'
          ? '已切換回跟隨真實時間'
          : `已預覽階段：${resolved.previewLabel ?? nextStage}`,
      );
    },
    [activeTab, showToast],
  );

  const handleSelectCar = useCallback(
    (car: CarId) => {
      setMyCar(car);
      try {
        localStorage.setItem(STORAGE_KEYS.myCar, car);
      } catch {
        // Ignore storage access errors
      }
      showToast(`已記住你的車輛：${car}`);
    },
    [showToast],
  );

  const handleSetRoom = useCallback(
    (roomLabel: string) => {
      setMyRoom(roomLabel);
      try {
        localStorage.setItem(STORAGE_KEYS.myRoom, roomLabel);
      } catch {
        // Ignore storage access errors
      }
      showToast(`已置頂你的房間：${roomLabel}`);
    },
    [showToast],
  );

  const handleClearRoom = useCallback(() => {
    setMyRoom(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.myRoom);
    } catch {
      // Ignore storage access errors
    }
    showToast('已取消房間置頂');
  }, [showToast]);

  const handleSelectSeat = useCallback(
    (seatCode: string | null) => {
      setMySeat(seatCode);
      saveStoredSeat(seatCode);
      if (!seatCode) {
        showToast('已取消去程座位標記');
        return;
      }
      const seat = getOutboundSeat(seatCode);
      if (seat) {
        const booking = BOOKING_GROUPS[seat.bookingRef];
        showToast(
          `已記住座位：${seat.code} ${seat.passengerName}（${booking.ref} · ${booking.checkedKgPerPax}kg）`,
        );
      }
    },
    [showToast],
  );

  const handleCopyText = useCallback(
    async (text: string) => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          showToast(`已複製：${text}`);
          return;
        }
      } catch {
        // Fall back to execCommand below
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast(`已複製：${text}`);
      } catch {
        showToast('複製失敗，請手動選取');
      }
      document.body.removeChild(textarea);
    },
    [showToast],
  );

  const handleToggleCardMapMode = useCallback(
    (resort: ResortKey, mode: MapMode) => {
      setCardMapModes((prev) => ({...prev, [resort]: mode}));
    },
    [],
  );

  const handleToggleLightboxMode = useCallback(() => {
    if (!lightboxResort) return;
    setCardMapModes((prev) => ({
      ...prev,
      [lightboxResort]: prev[lightboxResort] === 'svg' ? 'webp' : 'svg',
    }));
  }, [lightboxResort]);

  const handleLightboxWebpFallback = useCallback(() => {
    if (!lightboxResort) return;
    setCardMapModes((prev) => ({...prev, [lightboxResort]: 'svg'}));
    showToast('尚未偵測到 WebP 原圖，已自動顯示 SVG 概覽圖');
  }, [lightboxResort, showToast]);

  const handleInstallAction = useCallback(async () => {
    if (canNativeInstall) {
      const accepted = await triggerNativeInstall();
      if (accepted) {
        showToast('已開始安裝「斑尾滑雪 27」');
        setInstallModalOpen(false);
      }
    } else {
      setInstallModalOpen(true);
    }
  }, [canNativeInstall, triggerNativeInstall, showToast]);

  const handleModalNativeInstall = useCallback(async () => {
    const accepted = await triggerNativeInstall();
    if (accepted) {
      showToast('已開始安裝「斑尾滑雪 27」');
      setInstallModalOpen(false);
    }
  }, [triggerNativeInstall, showToast]);

  const navItems = useMemo(() => {
    type NavItem = {
      id: TabId;
      label: string;
      ariaLabel: string;
      icon: React.ReactNode;
      isCenter?: boolean;
    };

    const leftItems: NavItem[] = [];

    if (timeline.showFlightTab) {
      leftItems.push({
        id: 'flight',
        label: '航班',
        ariaLabel: '航班資料分頁',
        icon: <PlaneTakeoff className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      });
    }

    leftItems.push(
      {
        id: 'route',
        label: '去程',
        ariaLabel: '去程自駕路線分頁',
        icon: <Route className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      },
      {
        id: 'hotel',
        label: '酒店',
        ariaLabel: '酒店與房號分頁',
        icon: <Bed className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      },
    );

    const centerHome: NavItem = {
      id: 'home',
      label: '首頁',
      ariaLabel: '行程首頁總覽',
      icon: <Home className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      isCenter: true,
    };

    const rightItems: NavItem[] = [
      {
        id: 'skimap',
        label: '雪圖',
        ariaLabel: '四大雪場地圖分頁',
        icon: <MountainSnow className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      },
      {
        id: 'weather',
        label: '氣象',
        ariaLabel: '斑尾高原雪場氣象分頁',
        icon: <CloudSnow className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      },
      {
        id: 'local',
        label: '周邊',
        ariaLabel: '周邊自駕分頁',
        icon: <Car className="w-4 h-4 mb-0.5" aria-hidden="true" />,
      },
    ];

    return [...leftItems, centerHome, ...rightItems];
  }, [timeline.showFlightTab]);

  const isHomeTab = activeTab === 'home';

  return (
    <div className="app-shell">
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div ref={scrollContainerRef} className="app-scroll-area">
        {/* 雙模式 Header：首頁顯示完整雪山氛圍橫幅；子頁顯示俐落單列 52px 工具列 */}
        {isHomeTab ? (
          <header
            className={`relative overflow-hidden bg-gradient-to-br ${bannerGradientClass} text-white shadow-lg safe-top-header transition-colors duration-700`}
          >
            <BannerBackdrop theme={activeBannerTheme} isDay={activeIsDay} />

            <div className="relative w-full max-w-xl mx-auto px-3.5 sm:px-5 pb-6">
              <div className="flex items-center justify-between gap-1.5 mb-2.5">
                <div className="ui-pill-header min-w-0 bg-white/15 backdrop-blur-md text-white border border-white/25 shadow-sm">
                  <img
                    id="header-app-icon"
                    src="./icon-192.png"
                    alt="App Icon"
                    className="w-4 h-4 rounded-sm shrink-0 object-cover"
                  />
                  <span className="truncate">2027.02.14–20 · 14人團</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    id="header-guide-btn"
                    onClick={() => setGuideModalOpen(true)}
                    aria-label="打開手冊使用說明"
                    className="ui-pill-header shrink-0 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 transition cursor-pointer"
                  >
                    <HelpCircle
                      className="w-3.5 h-3.5 text-sky-200 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="hidden sm:inline">使用說明</span>
                    <span className="sm:hidden">說明</span>
                  </button>

                  {!isInstalled && (
                    <button
                      type="button"
                      id="header-install-btn"
                      onClick={handleInstallAction}
                      aria-label="將應用程式加到主畫面"
                      className="ui-pill-header shrink-0 bg-white/20 hover:bg-white/30 active:scale-95 text-white border border-white/30 transition cursor-pointer"
                    >
                      <Smartphone
                        className="w-3.5 h-3.5 text-sky-200 shrink-0"
                        aria-hidden="true"
                      />
                      <span
                        id="header-install-text"
                        className="hidden sm:inline"
                      >
                        {canNativeInstall ? '一鍵安裝' : '加到主畫面'}
                      </span>
                      <span className="sm:hidden">
                        {canNativeInstall ? '安裝' : '主畫面'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif fluid-title font-bold tracking-wide drop-shadow-sm">
                    斑尾高原滑雪之旅
                  </h1>
                  <p className="text-sky-200 fluid-subtitle font-sans font-semibold mt-0.5 leading-snug">
                    Madarao Kogen Snowboard Trip
                  </p>

                  {(timeline.isPreviewActive ||
                    previewTheme !== null ||
                    previewPeriod !== null) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {timeline.isPreviewActive && (
                        <button
                          type="button"
                          onClick={() => setGuideModalOpen(true)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-400/25 border border-amber-200/50 text-amber-100 hover:bg-amber-400/35 transition cursor-pointer"
                        >
                          階段預覽：{timeline.previewLabel}
                        </button>
                      )}
                      {(previewTheme !== null || previewPeriod !== null) && (
                        <button
                          type="button"
                          onClick={() => switchTab('weather')}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/15 border border-white/30 text-sky-100 hover:bg-white/25 transition cursor-pointer"
                        >
                          天氣主題：{BANNER_THEME_LABELS[activeBannerTheme]}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5 opacity-90 pointer-events-none select-none pt-0.5">
                  <div className="border border-rose-300/70 bg-rose-600/25 text-rose-100 text-[10px] font-serif px-1.5 py-0.5 rounded tracking-widest leading-tight text-center">
                    雪
                    <br />
                    見
                    <br />旅
                  </div>
                  <div
                    className="text-[10px] font-serif tracking-[0.2em] text-sky-200/85 leading-snug"
                    style={{writingMode: 'vertical-rl'}}
                  >
                    信州斑尾
                  </div>
                </div>
              </div>
            </div>
          </header>
        ) : (
          <header className="sticky top-0 z-30 bg-snow-900/95 backdrop-blur-md text-white border-b border-white/10 shadow-sm pt-[env(safe-area-inset-top)]">
            <div className="w-full max-w-xl mx-auto px-3 sm:px-4 h-[52px] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => switchTab('home')}
                  aria-label="返回行程首頁"
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sky-100 text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
                >
                  <ArrowLeft
                    className="w-3.5 h-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>首頁</span>
                </button>
                <h1 className="font-serif text-sm sm:text-base font-bold truncate">
                  {TAB_PAGE_TITLES[activeTab]}
                </h1>
                {timeline.isPreviewActive && (
                  <button
                    type="button"
                    onClick={() => setGuideModalOpen(true)}
                    className="hidden sm:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-200/35 whitespace-nowrap cursor-pointer"
                  >
                    {timeline.previewLabel}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id="header-guide-btn"
                  onClick={() => setGuideModalOpen(true)}
                  aria-label="打開手冊使用說明"
                  className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white/12 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
                >
                  <HelpCircle
                    className="w-3.5 h-3.5 text-sky-200 shrink-0"
                    aria-hidden="true"
                  />
                  <span>說明</span>
                </button>
                {!isInstalled && (
                  <button
                    type="button"
                    id="header-install-btn"
                    onClick={handleInstallAction}
                    aria-label="將應用程式加到主畫面"
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-sky-600/80 hover:bg-sky-600 text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
                  >
                    <Smartphone
                      className="w-3.5 h-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>{canNativeInstall ? '安裝' : '主畫面'}</span>
                  </button>
                )}
              </div>
            </div>
          </header>
        )}

        {/* 山區訊號中斷時自動顯示的輕量離線提示 */}
        <OfflineBanner isOnline={isOnline} />

        {/* 出發倒數小工具（只在首頁顯示，釋放子頁可視空間） */}
        {isHomeTab && <CountdownWidget />}

        {/* 主內容容器 */}
        <main className="w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-3 pb-5 space-y-5">
          {activeTab === 'home' && (
            <HomeTab
              isOnline={isOnline}
              madaraoWeather={madaraoWeather}
              madaraoUpdatedAt={madaraoUpdatedAt}
              isWeatherLoading={skiWeather.isLoading}
              myCar={myCar}
              myRoom={myRoom}
              mySeat={mySeat}
              showFlightTab={timeline.showFlightTab}
              showHomeOutboundCard={timeline.showHomeOutboundCard}
              showHomeInboundCard={timeline.showHomeInboundCard}
              onNavigateTab={switchTab}
              onOpenFlightBackup={handleOpenFlightBackup}
            />
          )}
          {activeTab === 'flight' && (
            <FlightTab
              isBackupMode={!timeline.showFlightTab}
              defaultLeg={timeline.showHomeInboundCard ? 'inbound' : 'outbound'}
              mySeat={mySeat}
              onSelectSeat={handleSelectSeat}
              onCopyText={handleCopyText}
              onBackHome={() => switchTab('home')}
              onNavigateTab={switchTab}
            />
          )}
          {activeTab === 'route' && (
            <RouteTab
              isOnline={isOnline}
              myCar={myCar}
              onSelectCar={handleSelectCar}
              onCopyText={handleCopyText}
            />
          )}
          {activeTab === 'hotel' && (
            <HotelTab
              myRoom={myRoom}
              onSetRoom={handleSetRoom}
              onClearRoom={handleClearRoom}
              onCopyText={handleCopyText}
            />
          )}
          {activeTab === 'skimap' && (
            <SkiMapTab
              cardMapModes={cardMapModes}
              onToggleMode={handleToggleCardMapMode}
              onOpenViewer={(resort) => setLightboxResort(resort)}
            />
          )}
          {activeTab === 'weather' && (
            <WeatherTab
              isOnline={isOnline}
              weatherMap={skiWeather.weatherMap}
              derivedByResort={skiWeather.derivedByResort}
              isLoading={skiWeather.isLoading}
              isRefreshing={skiWeather.isRefreshing}
              errorMessage={skiWeather.errorMessage}
              onRefresh={() => void skiWeather.refreshAll(true)}
              activeBannerTheme={activeBannerTheme}
              activeIsDay={activeIsDay}
              previewTheme={previewTheme}
              previewPeriod={previewPeriod}
              onSelectPreviewTheme={(theme) => {
                setPreviewTheme(theme);
                if (theme) {
                  scrollContainerRef.current?.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  });
                }
              }}
              onSelectPreviewPeriod={(period) => {
                setPreviewPeriod(period);
                if (period) {
                  scrollContainerRef.current?.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  });
                }
              }}
            />
          )}
          {activeTab === 'local' && (
            <LocalTab isOnline={isOnline} onCopyText={handleCopyText} />
          )}
        </main>
      </div>

      {/* 底部原生 PWA 固定導航欄（首頁置中錨點；航班分頁隨行程自動收放 7/6 格） */}
      <nav
        aria-label="主要行程導航"
        className="shrink-0 relative z-40 w-full bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,41,74,0.06)] safe-bottom-nav"
      >
        <div
          role="tablist"
          className={`max-w-xl mx-auto px-1 pt-1.5 grid gap-0.5 sm:gap-1 ${
            navItems.length === 7 ? 'grid-cols-7' : 'grid-cols-6'
          }`}
        >
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            const isCenter = Boolean(item.isCenter);
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`tab-${item.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${item.id}`}
                aria-label={item.ariaLabel}
                onClick={() => switchTab(item.id)}
                className={`min-h-[48px] min-w-0 flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 rounded-xl transition cursor-pointer ${
                  isSelected
                    ? isCenter
                      ? 'bg-sky-700 text-white shadow-sm'
                      : 'bg-snow-900 text-white shadow-sm'
                    : isCenter
                      ? 'bg-sky-50/90 text-sky-900 border border-sky-200/80 hover:bg-sky-100'
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span className="text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap leading-tight">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 手冊使用說明與行程階段預覽彈窗 */}
      <GuideModal
        isOpen={guideModalOpen}
        isInstalled={isInstalled}
        showFlightTab={timeline.showFlightTab}
        tripStage={tripStage}
        onSelectTripStage={handleSelectTripStage}
        onOpenFlightBackup={handleOpenFlightBackup}
        onOpenInstall={handleInstallAction}
        onClose={() => setGuideModalOpen(false)}
      />

      {/* 加入主畫面教學與原生安裝彈窗 */}
      <InstallModal
        isOpen={installModalOpen}
        canNativeInstall={canNativeInstall}
        onTriggerNativeInstall={handleModalNativeInstall}
        onClose={() => setInstallModalOpen(false)}
      />

      {/* 複製 / 儲存成功提示 Toast */}
      <div
        id="toast"
        role="status"
        aria-live="polite"
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg pointer-events-none transition-opacity duration-200 whitespace-nowrap ${
          toastVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {toastMessage || '已複製到剪貼簿'}
      </div>

      {/* 雪道圖全螢幕放大檢視燈箱 */}
      <MapLightbox
        resort={lightboxResort}
        mode={lightboxResort ? cardMapModes[lightboxResort] : 'svg'}
        onSelectResort={(nextResort) => setLightboxResort(nextResort)}
        onToggleMode={handleToggleLightboxMode}
        onFallbackToSvg={handleLightboxWebpFallback}
        onClose={() => setLightboxResort(null)}
      />
    </div>
  );
}
