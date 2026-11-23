/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Bed,
  Car,
  CloudSnow,
  HelpCircle,
  MountainSnow,
  PlaneLanding,
  PlaneTakeoff,
  Route,
  Smartphone,
  Wifi,
} from 'lucide-react';
import {FlightTab} from './components/FlightTab';
import {GuideModal} from './components/GuideModal';
import {HotelTab} from './components/HotelTab';
import {InstallModal} from './components/InstallModal';
import {LocalTab} from './components/LocalTab';
import {MapLightbox} from './components/MapLightbox';
import {OfflineBanner} from './components/OfflineBanner';
import {RouteTab} from './components/RouteTab';
import {SkiMapTab} from './components/SkiMapTab';
import {WeatherTab} from './components/WeatherTab';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {usePWAInstall} from './hooks/usePWAInstall';
import type {CarId, MapMode, ResortKey, TabId} from './types/trip';

const STORAGE_KEYS = {
  lastTab: 'madarao_2027_last_tab',
  myCar: 'madarao_2027_my_car',
  myRoom: 'madarao_2027_my_room',
} as const;

const VALID_TABS: TabId[] = [
  'flight',
  'route',
  'hotel',
  'skimap',
  'weather',
  'local',
];
const VALID_CARS: CarId[] = ['Car A', 'Car B', 'Car C'];

function readInitialTab(): TabId {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.lastTab);
    if (saved && VALID_TABS.includes(saved as TabId)) {
      return saved as TabId;
    }
  } catch {
    // Ignore storage access errors in private browsing
  }
  return 'flight';
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
  const [activeTab, setActiveTab] = useState<TabId>(readInitialTab);
  const [myCar, setMyCar] = useState<CarId | null>(readInitialCar);
  const [myRoom, setMyRoom] = useState<string | null>(readInitialRoom);

  const [cardMapModes, setCardMapModes] = useState<Record<ResortKey, MapMode>>({
    madarao: 'svg',
    romance: 'svg',
    nozawa: 'svg',
  });
  const [lightboxResort, setLightboxResort] = useState<ResortKey | null>(null);
  const [installModalOpen, setInstallModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const switchTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    try {
      localStorage.setItem(STORAGE_KEYS.lastTab, tab);
    } catch {
      // Ignore storage access errors
    }
    window.scrollTo({top: 0, behavior: 'smooth'});
  }, []);

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

  const navItems: Array<{
    id: TabId;
    label: string;
    ariaLabel: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'flight',
      label: '航班',
      ariaLabel: '航班資料分頁',
      icon: <PlaneTakeoff className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
    {
      id: 'route',
      label: '去程自駕',
      ariaLabel: '去程自駕路線分頁',
      icon: <Route className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
    {
      id: 'hotel',
      label: '酒店房號',
      ariaLabel: '酒店與房號分頁',
      icon: <Bed className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
    {
      id: 'skimap',
      label: '雪場地圖',
      ariaLabel: '四大雪場地圖分頁',
      icon: <MountainSnow className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
    {
      id: 'weather',
      label: '雪場氣象',
      ariaLabel: '斑尾高原雪場氣象分頁',
      icon: <CloudSnow className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
    {
      id: 'local',
      label: '周邊自駕',
      ariaLabel: '周邊自駕分頁',
      icon: <Car className="w-4 h-4 mb-0.5" aria-hidden="true" />,
    },
  ];

  return (
    <>
      {/* 頂部日系雪山主題橫幅 */}
      <header className="relative overflow-hidden bg-gradient-to-br from-snow-900 via-[#153e75] to-sky-700 text-white shadow-lg safe-top-header">
        <div
          aria-hidden="true"
          className="inset-0 absolute overflow-hidden pointer-events-none"
        >
          <span
            className="snowflake"
            style={{left: '8%', animationDuration: '7s', animationDelay: '0s'}}
          >
            ❄
          </span>
          <span
            className="snowflake"
            style={{
              left: '22%',
              animationDuration: '9s',
              animationDelay: '2s',
              fontSize: '8px',
            }}
          >
            •
          </span>
          <span
            className="snowflake"
            style={{left: '38%', animationDuration: '6.5s', animationDelay: '1s'}}
          >
            ❄
          </span>
          <span
            className="snowflake"
            style={{
              left: '55%',
              animationDuration: '8.5s',
              animationDelay: '3s',
              fontSize: '9px',
            }}
          >
            •
          </span>
          <span
            className="snowflake"
            style={{
              left: '72%',
              animationDuration: '7.5s',
              animationDelay: '0.5s',
            }}
          >
            ❄
          </span>
          <span
            className="snowflake"
            style={{
              left: '89%',
              animationDuration: '9.5s',
              animationDelay: '1.5s',
              fontSize: '8px',
            }}
          >
            •
          </span>
        </div>

        <svg
          className="absolute bottom-0 left-0 w-full h-24 pointer-events-none"
          viewBox="0 0 1440 220"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="rgba(186, 230, 253, 0.16)"
            d="M0,160 L180,75 L340,145 L560,45 L790,155 L1020,55 L1240,135 L1440,65 L1440,220 L0,220 Z"
          />
          <path
            fill="rgba(224, 242, 254, 0.25)"
            d="M0,185 L240,105 L460,175 L690,85 L940,165 L1180,95 L1440,160 L1440,220 L0,220 Z"
          />
          <path
            fill="#eff6ff"
            d="M0,200 L140,168 L290,192 L490,152 L680,196 L910,158 L1130,190 L1320,162 L1440,185 L1440,220 L0,220 Z"
          />
        </svg>

        <div className="relative w-full max-w-xl mx-auto px-4 sm:px-5 pb-12">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="min-w-0 inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium border border-white/25 shadow-sm">
              <img
                id="header-app-icon"
                src="./icon-192.png"
                alt="App Icon"
                className="w-4 h-4 rounded-sm shrink-0 object-cover"
              />
              <span className="truncate">2027.02.14–20 ｜ 14人團</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="header-guide-btn"
                onClick={() => setGuideModalOpen(true)}
                aria-label="打開手冊使用說明"
                className="min-h-[48px] min-w-[48px] shrink-0 whitespace-nowrap bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-full border border-white/25 transition inline-flex items-center justify-center gap-1 cursor-pointer"
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
                  className="min-h-[48px] min-w-[48px] shrink-0 whitespace-nowrap bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-bold px-3 sm:px-3.5 py-2 rounded-full border border-white/30 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Smartphone
                    className="w-3.5 h-3.5 text-sky-200 shrink-0"
                    aria-hidden="true"
                  />
                  <span id="header-install-text" className="hidden sm:inline">
                    {canNativeInstall ? '一鍵安裝 App' : '加到主畫面'}
                  </span>
                  <span className="sm:hidden">
                    {canNativeInstall ? '安裝' : '主畫面'}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="font-serif fluid-title font-bold tracking-wide drop-shadow-sm">
                斑尾高原滑雪之旅
              </h1>
              <p className="text-sky-200 fluid-subtitle font-sans font-semibold mt-0.5 truncate">
                Madarao Kogen Snowboard Trip
              </p>
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

          <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-sky-100">
            <span className="whitespace-nowrap bg-snow-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/15 inline-flex items-center gap-1">
              <PlaneLanding
                className="w-3.5 h-3.5 text-sky-300 shrink-0"
                aria-hidden="true"
              />
              <span>去程 09:30 成田出發</span>
            </span>
            <span className="whitespace-nowrap bg-snow-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/15 inline-flex items-center gap-1">
              <MountainSnow
                className="w-3.5 h-3.5 text-sky-300 shrink-0"
                aria-hidden="true"
              />
              <span>4 大雪場中高級攻略</span>
            </span>
            <span className="whitespace-nowrap bg-snow-900/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/15 inline-flex items-center gap-1">
              <Wifi
                className="w-3.5 h-3.5 text-emerald-300 shrink-0"
                aria-hidden="true"
              />
              <span>支援離線查閱</span>
            </span>
          </div>
        </div>
      </header>

      {/* 山區訊號中斷時自動顯示的輕量離線提示 */}
      <OfflineBanner isOnline={isOnline} />

      {/* 主內容容器 */}
      <main className="w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-4 space-y-6">
        {activeTab === 'flight' && <FlightTab onNavigateTab={switchTab} />}
        {activeTab === 'route' && (
          <RouteTab
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
          <WeatherTab isOnline={isOnline} onShowToast={showToast} />
        )}
        {activeTab === 'local' && <LocalTab />}
      </main>

      {/* 底部原生 PWA 固定導航欄 */}
      <nav
        aria-label="主要行程導航"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,41,74,0.06)] safe-bottom-nav"
      >
        <div
          role="tablist"
          className="max-w-xl mx-auto px-1 pt-1.5 grid grid-cols-6 gap-0.5 sm:gap-1"
        >
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
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
                className={`min-h-[48px] min-w-0 flex flex-col items-center justify-center py-1.5 px-0.5 sm:px-1 rounded-xl transition cursor-pointer ${
                  isSelected
                    ? 'bg-snow-900 text-white shadow-sm'
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

      {/* 手冊使用說明彈窗 */}
      <GuideModal
        isOpen={guideModalOpen}
        isInstalled={isInstalled}
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
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg pointer-events-none transition-opacity duration-200 whitespace-nowrap ${
          toastVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {toastMessage || '已複製到剪貼簿'}
      </div>

      {/* 雪道圖全螢幕放大檢視燈箱 */}
      <MapLightbox
        resort={lightboxResort}
        mode={lightboxResort ? cardMapModes[lightboxResort] : 'svg'}
        onToggleMode={handleToggleLightboxMode}
        onFallbackToSvg={handleLightboxWebpFallback}
        onClose={() => setLightboxResort(null)}
      />
    </>
  );
}
