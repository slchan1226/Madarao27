import React, {useEffect, useState} from 'react';
import {
  AlertTriangle,
  Car,
  ChevronDown,
  ChevronUp,
  Copy,
  CornerUpRight,
  Flag,
  Map as MapIcon,
  Navigation,
  Phone,
} from 'lucide-react';
import stopAeonTakasakiImg from '../assets/images/stop_aeon_takasaki_1795444585110.jpg';
import stopMapleHouseImg from '../assets/images/stop_maple_house_1795444585216.jpg';
import stopMatsushiroPaImg from '../assets/images/stop_matsushiro_pa_1795444584077.jpg';
import stopMiyoshiPaImg from '../assets/images/stop_miyoshi_pa_1795444582845.jpg';
import stopNaritaT3Img from '../assets/images/stop_narita_t3_1795444584850.jpg';
import stopSilkInMadaraoImg from '../assets/images/stop_silk_in_madarao_1795444584497.jpg';
import type {CarId} from '../types/trip';
import {HighwayRouteSvg} from './SkiMapSvgs';

interface RouteTabProps {
  isOnline: boolean;
  myCar: CarId | null;
  onSelectCar: (car: CarId) => void;
  onCopyText: (text: string) => void;
}

interface StopPhotoPayload {
  photoUri: string | null;
  attributionName?: string;
  attributionUri?: string;
}

interface HighwayStopItem {
  id: string;
  stepTag: string;
  timeWindow: string;
  legSummary: string;
  title: string;
  jpReference: string;
  description: string;
  alertNote?: {
    title: string;
    text: string;
    tone: 'amber' | 'rose';
  };
  fallbackImg: string;
  imgAlt: string;
  mapsUrl: string;
  navLabel: string;
  navAriaLabel: string;
  navBtnCls: string;
  dotCls: string;
  cardBorderCls?: string;
  navIcon: 'origin' | 'stop' | 'finish';
  copyActions?: Array<{
    label: string;
    value: string;
    icon: 'copy' | 'phone';
    ariaLabel: string;
  }>;
}

const CARS: CarId[] = ['Car A', 'Car B', 'Car C'];

const HIGHWAY_STOPS: HighwayStopItem[] = [
  {
    id: 'narita-t3',
    stepTag: '起點',
    timeWindow: '09:30 開車出發',
    legSummary: '06:20 GK28 抵達成田',
    title: '成田國際機場 第3航廈（取車點）',
    jpReference: '成田空港 第3ターミナル ➔ 東関東自動車道',
    description:
      '辦好租車手續、雪板袋與大行李上車，確認已配雪胎（スタッドレスタイヤ）及插好 ETC 卡，09:30 準時出發。',
    fallbackImg: stopNaritaT3Img,
    imgAlt: '成田國際機場第3航廈外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Narita+International+Airport+Terminal+3&destination_place_id=ChIJYd_6WXnzImAR89wPaFU25-8&travelmode=driving',
    navLabel: 'Google Maps 查看成田 T3 位置',
    navAriaLabel: '開啟 Google Maps 導航至成田國際機場第3航廈',
    navBtnCls: 'bg-slate-800 hover:bg-slate-900 text-white',
    dotCls: 'bg-sky-600',
    navIcon: 'origin',
  },
  {
    id: 'miyoshi-pa',
    stepTag: '第 1 站',
    timeWindow: '10:55 – 11:25（停 30 分）',
    legSummary: '114km · 約 1h23m',
    title: '三芳 PA 下行（Pasar 三芳）',
    jpReference: '関越自動車道・三芳パーキングエリア（下り）',
    description:
      '由外環道轉入關越道第一個大型休息站，適合落機行車後去洗手間、買熱咖啡提神及川越番薯甜點。',
    fallbackImg: stopMiyoshiPaImg,
    imgAlt: '三芳 PA 下行 Pasar 三芳建築外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Miyoshi+Parking+Area+Down&destination_place_id=ChIJPZZcG-TcGGAReH_JmzI5t5A&travelmode=driving',
    navLabel: '一鍵導航去 第 1 站：三芳 PA（下り）',
    navAriaLabel: '一鍵導航去第 1 站三芳 PA 下行',
    navBtnCls: 'bg-sky-700 hover:bg-sky-800 text-white',
    dotCls: 'bg-sky-500',
    navIcon: 'stop',
  },
  {
    id: 'aeon-takasaki',
    stepTag: '第 2 站 · 午餐補貨',
    timeWindow: '12:30 – 14:15（停 1h45m）',
    legSummary: '82.9km · 約 1h06m',
    title: 'AEON MALL 高崎（路線正中大補貨）',
    jpReference: '前橋IC出口 ➔ イオンモール高崎',
    description:
      '正值午飯時間！全館食肆與 Food Court 開齊，順道在大型 AEON 超市掃齊 6 晚滑雪零食、杯麵、飲品、暖包及保濕用品。',
    alertNote: {
      title: '泊車提示：',
      text: '有裝車頂行李箱（Roof Box）的車輛請泊露天平面停車場，避免入限高室內場。',
      tone: 'amber',
    },
    fallbackImg: stopAeonTakasakiImg,
    imgAlt: 'AEON MALL 高崎商場與平面停車場外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=AEON+MALL+Takasaki&destination_place_id=ChIJ9RKkNYSMHmARnWhbGboVq_Q&travelmode=driving',
    navLabel: '一鍵導航去 第 2 站：AEON MALL 高崎',
    navAriaLabel: '一鍵導航去第 2 站 AEON MALL 高崎',
    navBtnCls: 'bg-amber-600 hover:bg-amber-700 text-white',
    dotCls: 'bg-amber-500',
    cardBorderCls: 'border-amber-300/90',
    navIcon: 'stop',
  },
  {
    id: 'matsushiro-pa',
    stepTag: '第 3 站',
    timeWindow: '15:55 – 16:25（停 30 分）',
    legSummary: '141km · 約 1h41m',
    title: '松代 PA 下行（上雪山前最後補給）',
    jpReference: '上信越自動車道・松代パーキングエリア（下り）',
    description:
      '臨上斑尾高原山路前最後一個休息站，必去洗手間及買熱飲、信州蘋果批；開車前記得開大燈準備入夜上山。',
    fallbackImg: stopMatsushiroPaImg,
    imgAlt: '松代 PA 下行休息站雪山景觀外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Matsushiro+Parking+Area+Northbound&destination_place_id=ChIJlXPx48WEHWARtfIzJcirHHA&travelmode=driving',
    navLabel: '一鍵導航去 第 3 站：松代 PA（下り）',
    navAriaLabel: '一鍵導航去第 3 站松代 PA 下行',
    navBtnCls: 'bg-sky-700 hover:bg-sky-800 text-white',
    dotCls: 'bg-sky-500',
    navIcon: 'stop',
  },
  {
    id: 'maple-house',
    stepTag: '第 4 站 · 任務站',
    timeWindow: '拯救金金大行洞',
    legSummary: '41km · 約 35m',
    title: 'Maple House Backpackers',
    jpReference: '長野県飯山市斑尾高原 1101-66（豊田飯山IC出口）',
    description:
      '入酒店 Check-in 前先順路去 Maple House Backpackers 匯合上車，之後再開約 3 分鐘即達酒店。',
    alertNote: {
      title: '備註：',
      text: '拯救金金大行洞！確認所有人及行李上齊車後即前往終點酒店。',
      tone: 'rose',
    },
    fallbackImg: stopMapleHouseImg,
    imgAlt: 'Maple House Backpackers 斑尾高原木屋旅舍外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Maple+House+Backpackers+Madarao+1101-66+Iiyama+Nagano&travelmode=driving',
    navLabel: '一鍵導航去 第 4 站：Maple House Backpackers',
    navAriaLabel: '一鍵導航去第 4 站 Maple House Backpackers（拯救金金大行洞）',
    navBtnCls: 'bg-rose-600 hover:bg-rose-700 text-white',
    dotCls: 'bg-rose-600',
    cardBorderCls: 'border-rose-300/90',
    navIcon: 'stop',
    copyActions: [
      {
        label: '複製日文地址',
        value: '長野県飯山市斑尾高原 1101-66',
        icon: 'copy',
        ariaLabel: '複製 Maple House Backpackers 日文地址',
      },
    ],
  },
  {
    id: 'silk-in-madarao',
    stepTag: '終點 · 住宿',
    timeWindow: '預計 17:15 – 17:25 抵達',
    legSummary: '約 1km · 3 分鐘',
    title: '倉本温泉 ホテルシルクイン斑尾',
    jpReference: '長野県飯山市斑尾高原 11492-376（免費住客停車場）',
    description:
      '沿斑尾高原主路開約 3 分鐘即達，門口設有免費住客停車場，落行李 Check-in 後即享酒店自助晚餐。',
    fallbackImg: stopSilkInMadaraoImg,
    imgAlt: '倉本温泉 ホテルシルクイン斑尾酒店外觀',
    mapsUrl:
      'https://www.google.com/maps/dir/?api=1&destination=Hotel+Silk+In+Madarao&destination_place_id=ChIJ6-PetV0j9l8RvC39yyIm7lw&travelmode=driving',
    navLabel: '一鍵導航去 終點：ホテルシルクイン斑尾',
    navAriaLabel: '一鍵導航去終點ホテルシルクイン斑尾',
    navBtnCls: 'bg-snow-900 hover:bg-snow-700 text-white',
    dotCls: 'bg-snow-900',
    cardBorderCls: 'border-snow-800/35',
    navIcon: 'finish',
    copyActions: [
      {
        label: '車機電話: 0269-64-3241',
        value: '0269-64-3241',
        icon: 'phone',
        ariaLabel: '複製酒店車機電話號碼 0269-64-3241',
      },
      {
        label: '複製日文地址',
        value: '長野県飯山市斑尾高原 11492-376',
        icon: 'copy',
        ariaLabel: '複製酒店日文地址',
      },
    ],
  },
];

export const RouteTab: React.FC<RouteTabProps> = ({
  isOnline,
  myCar,
  onSelectCar,
  onCopyText,
}) => {
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(false);
  const [livePhotos, setLivePhotos] = useState<
    Record<string, StopPhotoPayload>
  >({});
  const [failedLiveIds, setFailedLiveIds] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (!isOnline) return;
    let cancelled = false;

    const loadStopPhotos = async () => {
      try {
        const res = await fetch('/api/places/stop-photos');
        if (!res.ok) return;
        const payload = (await res.json()) as {
          photos?: Record<string, StopPhotoPayload>;
          quotaExceeded?: boolean;
        };
        if (payload.quotaExceeded) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled && payload.photos) {
          setLivePhotos(payload.photos);
        }
      } catch {
        // Offline or network error -> bundled fallback images remain visible
      }
    };

    void loadStopPhotos();
    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  return (
    <section
      id="panel-route"
      role="tabpanel"
      aria-labelledby="tab-route"
      className="space-y-4"
    >
      {/* 1. 緊湊單行分車選擇條 */}
      <div className="glass-card rounded-2xl px-3.5 py-2.5 border border-slate-200/85 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Car className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
            我的分車
          </span>
        </div>
        <div
          className="grid grid-cols-3 gap-1.5 flex-1 max-w-[230px]"
          role="group"
          aria-label="選擇我的車輛"
        >
          {CARS.map((car) => {
            const active = myCar === car;
            return (
              <button
                key={car}
                type="button"
                onClick={() => onSelectCar(car)}
                aria-label={`標記為 ${car} 乘客`}
                aria-pressed={active}
                className={`min-h-[40px] rounded-xl border text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-snow-900 text-white border-snow-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {car}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 可收合高速路線總覽圖（預設收起，首屏即見站點清單） */}
      <div className="glass-card rounded-2xl border border-sky-200/80 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOverviewOpen((prev) => !prev)}
          aria-expanded={isOverviewOpen}
          aria-controls="highway-route-overview-body"
          className="w-full min-h-[52px] px-4 py-3 text-left flex items-center justify-between gap-3 hover:bg-sky-50/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-2 min-w-0">
            <MapIcon
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <div className="text-sm font-bold text-snow-900 truncate">
                2 月 14 日去程高速路線圖
              </div>
              <div className="text-[11px] text-slate-500">
                成田 T3 ➔ 斑尾高原 · 共 6 站 · 全程約 7.5 小時
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-sky-800 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
            <span>{isOverviewOpen ? '收起' : '展開路線圖'}</span>
            {isOverviewOpen ? (
              <ChevronUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </span>
        </button>

        {isOverviewOpen && (
          <div
            id="highway-route-overview-body"
            className="px-4 pb-4 pt-1 border-t border-sky-100 space-y-2.5"
          >
            <div className="bg-gradient-to-b from-sky-100/60 via-sky-50/30 to-white rounded-2xl p-3 border border-sky-100">
              <HighwayRouteSvg />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              點按各站底部導航掣會直接開啟 Google Maps App，自動由你當下即時位置開始帶路，3 部車各自開導航也不怕失散。
            </p>
          </div>
        )}
      </div>

      {/* 3. 逐站實景相片時間軸卡片（Google Places 實拍優先，離線自動以內置圖保底） */}
      <div className="relative pl-5 border-l-2 border-sky-200 space-y-4 ml-1.5">
        {HIGHWAY_STOPS.map((stop) => {
          const liveEntry = livePhotos[stop.id];
          const useLivePhoto =
            Boolean(liveEntry?.photoUri) && !failedLiveIds[stop.id];
          const imageSrc = useLivePhoto
            ? (liveEntry.photoUri as string)
            : stop.fallbackImg;

          return (
            <article
              key={stop.id}
              className={`relative glass-card rounded-3xl overflow-hidden border ${
                stop.cardBorderCls ?? 'border-slate-200/85'
              } shadow-xs`}
            >
              <span
                className={`absolute -left-[27px] top-6 w-3.5 h-3.5 rounded-full ring-4 ring-white shadow-xs ${stop.dotCls}`}
                aria-hidden="true"
              />

              {/* 16:9 目的地／店面實景相片 */}
              <div className="relative aspect-[16/9] w-full bg-slate-200 overflow-hidden">
                <img
                  src={imageSrc}
                  alt={stop.imgAlt}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => {
                    if (useLivePhoto) {
                      setFailedLiveIds((prev) => ({...prev, [stop.id]: true}));
                    }
                  }}
                  className="w-full h-full object-cover"
                />

                {/* 漸層遮罩確保文字 4.5:1+ 對比 */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent pt-10 pb-2.5 px-3.5 flex items-end justify-between gap-2 text-white"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-sky-200 tracking-wide">
                      {stop.stepTag} · {stop.timeWindow}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-white/90 shrink-0 tabular-nums">
                    {stop.legSummary}
                  </span>
                </div>

                {/* 右上角極細相片來源／Google Places 攝影署名 */}
                <div className="absolute top-2 right-2 bg-slate-950/55 backdrop-blur-xs text-white/90 text-[10px] px-2 py-0.5 rounded-md max-w-[70%] truncate">
                  {useLivePhoto ? (
                    liveEntry.attributionName && liveEntry.attributionUri ? (
                      <a
                        href={liveEntry.attributionUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Google 實景 · {liveEntry.attributionName}
                      </a>
                    ) : (
                      <span>Google Places 實景</span>
                    )
                  ) : (
                    <span>離線實景參考圖</span>
                  )}
                </div>
              </div>

              {/* 站點文字與一鍵導航 */}
              <div className="p-4 space-y-2.5">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                    {stop.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {stop.jpReference}
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {stop.description}
                </p>

                {stop.alertNote && (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs flex items-start gap-1.5 border ${
                      stop.alertNote.tone === 'rose'
                        ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                        : 'bg-amber-50/90 border-amber-200 text-amber-950'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        stop.alertNote.tone === 'rose'
                          ? 'text-rose-600'
                          : 'text-amber-700'
                      }`}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{stop.alertNote.title}</strong>
                      {stop.alertNote.text}
                    </span>
                  </div>
                )}

                {stop.copyActions && stop.copyActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {stop.copyActions.map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => onCopyText(action.value)}
                        aria-label={action.ariaLabel}
                        className="min-h-[44px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {action.icon === 'phone' ? (
                          <Phone
                            className="w-3.5 h-3.5 text-sky-700 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Copy
                            className="w-3.5 h-3.5 text-sky-700 shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <a
                    href={stop.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={stop.navAriaLabel}
                    className={`nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 text-sm font-bold py-3 px-4 rounded-2xl shadow-xs transition ${stop.navBtnCls}`}
                  >
                    {stop.navIcon === 'origin' ? (
                      <Navigation
                        className="w-4 h-4 text-sky-300 shrink-0"
                        aria-hidden="true"
                      />
                    ) : stop.navIcon === 'finish' ? (
                      <Flag
                        className="w-4 h-4 text-sky-300 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <CornerUpRight
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>{stop.navLabel}</span>
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
