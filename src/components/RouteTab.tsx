import React from 'react';
import {
  AlertTriangle,
  Car,
  Copy,
  CornerUpRight,
  Flag,
  Navigation,
  Phone,
} from 'lucide-react';
import type {CarId} from '../types/trip';
import {HighwayRouteSvg} from './SkiMapSvgs';

interface RouteTabProps {
  myCar: CarId | null;
  onSelectCar: (car: CarId) => void;
  onCopyText: (text: string) => void;
}

const CARS: CarId[] = ['Car A', 'Car B', 'Car C'];

export const RouteTab: React.FC<RouteTabProps> = ({
  myCar,
  onSelectCar,
  onCopyText,
}) => {
  return (
    <section
      id="panel-route"
      role="tabpanel"
      aria-labelledby="tab-route"
      className="space-y-6"
    >
      {/* 我的分車快速記憶卡 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
            <Car className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
            <span>我的分車編排（自動儲存於本機）</span>
          </span>
          <span
            id="selected-car-badge"
            className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full shrink-0"
          >
            {myCar ? `已選：${myCar}` : '未選擇'}
          </span>
        </div>
        <div
          className="grid grid-cols-3 gap-2"
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
                className={`min-h-[48px] rounded-2xl border text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-snow-900 text-white border-snow-900 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {car}
              </button>
            );
          })}
        </div>
      </div>

      {/* 路線總覽卡片 + 日系 SVG 路線地圖 */}
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
              STEP 2 · HIGHWAY ROUTE
            </span>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              2月14日去程自駕路線圖
            </h2>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xs font-bold bg-sky-100/90 text-sky-900 px-3 py-1 rounded-full border border-sky-200/70">
            全程約 7.5 小時
          </span>
        </div>

        <div className="bg-gradient-to-b from-sky-100/70 via-sky-50/40 to-white rounded-2xl p-3.5 border border-sky-100 shadow-inner">
          <HighwayRouteSvg />
        </div>

        <div className="mt-3 bg-sky-50/90 border border-sky-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-sky-900">
          <CornerUpRight
            className="w-4 h-4 text-sky-600 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <strong>一鍵導航用法：</strong>
            每張站點卡都有藍色導航掣，撳落去會直接彈去你手機嘅{' '}
            <strong>Google Maps App</strong>，自動以你
            <strong>當下即時位置</strong>做起點帶路，唔怕分車行失散！
          </div>
        </div>
      </div>

      {/* 逐站時間軸卡片 */}
      <div className="relative pl-6 border-l-2 border-sky-300 space-y-5 ml-2">
        {/* 起點：成田機場 T3 */}
        <div className="relative glass-card rounded-3xl p-4 sm:p-5 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-serif text-7xl font-bold text-slate-100 pointer-events-none select-none"
          >
            00
          </div>
          <span className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-sky-600 ring-4 ring-white shadow" />
          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                起點 · 09:30 開車出發
              </span>
              <span className="text-xs font-medium text-slate-600">
                06:20 GK28 抵達成田
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              成田國際機場 第3航廈（取車點）
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              日文路牌對照：成田空港 第3ターミナル ➔ 東関東自動車道
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              辦好租車手續、將雪板袋同大行李上車，check 清楚架車裝咗
              <strong>雪胎（スタッドレスタイヤ）</strong>同插好 ETC
              卡，09:30 準時出發！
            </p>
            <div className="mt-3.5">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Narita+International+Airport+Terminal+3&destination_place_id=ChIJYd_6WXnzImAR89wPaFU25-8&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="開啟 Google Maps 導航至成田國際機場第3航廈"
                className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
              >
                <Navigation
                  className="w-4 h-4 text-sky-300 shrink-0"
                  aria-hidden="true"
                />
                <span>Google Maps 查看成田 T3 位置</span>
              </a>
            </div>
          </div>
        </div>

        {/* 第 1 站：三芳 PA (下り) */}
        <div className="relative glass-card rounded-3xl p-4 sm:p-5 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-serif text-7xl font-bold text-sky-50 pointer-events-none select-none"
          >
            01
          </div>
          <span className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white shadow" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                第 1 站 · 10:55 – 11:25 (停30分)
              </span>
              <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                <span>上段 114km / 約 1h23m</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              三芳 PA 下行（Pasar 三芳）
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              日文路牌對照：関越自動車道・三芳パーキングエリア（下り）
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              由外環道轉入關越道第一個大型休息站。啱晒大家落機坐咗個幾鐘車落嚟去洗手間、買杯熱咖啡提神，仲有川越番薯甜點同狹山茶手信買。
            </p>
            <div className="mt-3.5">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Miyoshi+Parking+Area+Down&destination_place_id=ChIJPZZcG-TcGGAReH_JmzI5t5A&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="一鍵導航去第 1 站三芳 PA 下行"
                className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
              >
                <CornerUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>一鍵導航去 第 1 站：三芳 PA（下り）</span>
              </a>
            </div>
          </div>
        </div>

        {/* 第 2 站：AEON MALL 高崎 */}
        <div className="relative glass-card rounded-3xl p-4 sm:p-5 border-2 border-amber-300/90 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-serif text-7xl font-bold text-amber-50 pointer-events-none select-none"
          >
            02
          </div>
          <span className="absolute -left-[34px] top-6 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white shadow" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full">
                ★ 第 2 站 · 12:30 – 14:15 (停1h45m)
              </span>
              <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>上段 82.9km / 約 1h06m</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              AEON MALL 高崎（路線正中大補貨）
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              日文路牌對照：前橋IC出口 ➔ イオンモール高崎
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              正值午飯黃金時間！全館鋪頭同 Food Court
              開齊，大家可分頭食 Lunch，再去大型 AEON 超市掃齊 6
              晚滑雪零食、杯麵、飲品、暖包同保濕用品。
            </p>
            <div className="mt-2.5 bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 flex items-start gap-1.5">
              <AlertTriangle
                className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                <strong>泊車提示：</strong>有裝車頂行李箱（Roof Box）嘅車請泊
                <strong>露天平面停車場</strong>，避免入限高室內場。
              </span>
            </div>
            <div className="mt-3.5">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=AEON+MALL+Takasaki&destination_place_id=ChIJ9RKkNYSMHmARnWhbGboVq_Q&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="一鍵導航去第 2 站 AEON MALL 高崎"
                className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
              >
                <CornerUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>一鍵導航去 第 2 站：AEON MALL 高崎</span>
              </a>
            </div>
          </div>
        </div>

        {/* 第 3 站：松代 PA (下り) */}
        <div className="relative glass-card rounded-3xl p-4 sm:p-5 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-serif text-7xl font-bold text-sky-50 pointer-events-none select-none"
          >
            03
          </div>
          <span className="absolute -left-[33px] top-6 w-4 h-4 rounded-full bg-sky-500 ring-4 ring-white shadow" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-0.5 rounded-full">
                第 3 站 · 15:55 – 16:25 (停30分)
              </span>
              <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-sky-600" aria-hidden="true" />
                <span>上段 141km / 約 1h41m</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              松代 PA 下行（上雪山前最後補給）
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              日文路牌對照：上信越自動車道・松代パーキングエリア（下り）
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              臨上斑尾高原山路前最後一個中型休息站！必去洗手間、買信州蘋果批、野澤菜小食同熱飲。開車前記得開大車頭燈準備入夜上雪山。
            </p>
            <div className="mt-3.5">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Matsushiro+Parking+Area+Northbound&destination_place_id=ChIJlXPx48WEHWARtfIzJcirHHA&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="一鍵導航去第 3 站松代 PA 下行"
                className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
              >
                <CornerUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>一鍵導航去 第 3 站：松代 PA（下り）</span>
              </a>
            </div>
          </div>
        </div>

        {/* 終點：ホテルシルクイン斑尾 */}
        <div className="relative glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 border-2 border-snow-800/30 overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -right-2 font-serif text-7xl font-bold text-sky-100/70 pointer-events-none select-none"
          >
            宿
          </div>
          <span className="absolute -left-[34px] top-6 w-4 h-4 rounded-full bg-snow-900 ring-4 ring-white shadow" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-xs font-bold text-white bg-snow-900 px-2.5 py-0.5 rounded-full">
                終點 · 預計 17:00 – 17:15 抵達
              </span>
              <span className="text-xs font-medium text-slate-600 inline-flex items-center gap-1">
                <Car className="w-3.5 h-3.5 text-snow-700" aria-hidden="true" />
                <span>上段 40.6km / 約 35m</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2">
              倉本温泉 ホテルシルクイン斑尾
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              日文路牌對照：豊田飯山IC出口 ➔ 斑尾高原方面
            </p>
            <p className="text-sm text-slate-700 mt-2 leading-relaxed">
              由豐田飯山 IC 落高速後行約 25
              分鐘雪地山路上山即達！酒店門口有
              <strong>免費住客停車場</strong>，落行李辦理 Check-in
              後就食得酒店自助晚餐。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopyText('0269-64-3241')}
                aria-label="複製酒店車機電話號碼 0269-64-3241"
                className="min-h-[48px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                <span>複製車機電話: 0269-64-3241</span>
              </button>
              <button
                type="button"
                onClick={() => onCopyText('長野県飯山市斑尾高原 11492-376')}
                aria-label="複製酒店日文地址"
                className="min-h-[48px] text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 transition inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                <span>複製日文地址</span>
              </button>
            </div>
            <div className="mt-3.5">
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=Hotel+Silk+In+Madarao&destination_place_id=ChIJ6-PetV0j9l8RvC39yyIm7lw&travelmode=driving"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="一鍵導航去終點ホテルシルクイン斑尾"
                className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-snow-900 hover:bg-snow-700 text-white text-sm font-bold py-3.5 px-4 rounded-2xl shadow"
              >
                <Flag
                  className="w-4 h-4 text-sky-300 shrink-0"
                  aria-hidden="true"
                />
                <span>一鍵導航去 終點：ホテルシルクイン斑尾</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
