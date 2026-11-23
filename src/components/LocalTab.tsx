import React from 'react';
import {Clock, CornerUpRight} from 'lucide-react';
import {LocalDriveSvg} from './SkiMapSvgs';

export const LocalTab: React.FC = () => {
  return (
    <section
      id="panel-local"
      role="tabpanel"
      aria-labelledby="tab-local"
      className="space-y-5"
    >
      <div className="glass-card jp-pattern-subtle rounded-3xl p-5 space-y-3">
        <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
          LOCAL DRIVE · 周辺ドライブ
        </span>
        <h2 className="font-serif text-xl font-bold text-slate-900">
          由酒店出發・周邊自駕路線與時間
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          所有路線均以<strong>倉本温泉 ホテルシルクイン斑尾</strong>
          為出發參考，撳藍色按鈕會自動用 Google Maps App 由你
          <strong>當下即時位置</strong>規劃駕車導航。
        </p>

        <div className="bg-gradient-to-b from-sky-50 to-white rounded-2xl p-3 border border-sky-100 shadow-inner">
          <LocalDriveSvg />
        </div>
      </div>

      {/* 路線 1：酒店 -> 飯山市區 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full">
            路線 01 · 距離約 13 km
          </span>
          <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>雪地車程：約 20 – 25 分鐘</span>
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            飯山市區 / JR 飯山站周邊
          </h3>
          <p className="text-xs text-slate-600">
            日文對照：飯山市街・飯山駅（縣道 97 號落山直達）
          </p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          由斑尾高原落山最近嘅市中心！有大型超市（
          <strong>Tsuruya ツルヤ 飯山店</strong>
          ）、藥妝店、居酒屋、拉麵店及便利店，晚上想出市區買啤酒零食或食宵夜最方便。
        </p>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Iiyama+Station+Nagano&travelmode=driving"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="一鍵導航去飯山市區 JR 飯山站"
          className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
        >
          <CornerUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>一鍵導航去 飯山市區（JR 飯山站）</span>
        </a>
      </div>

      {/* 路線 2：酒店 -> スノーリゾートロマンスの神様 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full">
            路線 02 · 距離約 20 km
          </span>
          <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-rose-700" aria-hidden="true" />
            <span>雪地車程：約 30 – 35 分鐘</span>
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            スノーリゾートロマンスの神様
          </h3>
          <p className="text-xs text-slate-600">
            日文對照：長野県下高井郡木島平村大字上木島 3876-2
          </p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          由斑尾落山穿過飯山市區（過千曲川大橋）後上高社山即達，全程約半小時，朝早
          08:15 由酒店出發啱啱好趕到開門頭纜車。
        </p>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Snow+Resort+Romance+no+Kamisama&travelmode=driving"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="一鍵導航去スノーリゾートロマンスの神様"
          className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
        >
          <CornerUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>一鍵導航去 スノーリゾートロマンスの神様</span>
        </a>
      </div>

      {/* 路線 3：酒店 -> 野沢温泉スキー場 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white bg-snow-900 px-2.5 py-1 rounded-full">
            路線 03 · 距離約 26 km
          </span>
          <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-snow-800" aria-hidden="true" />
            <span>雪地車程：約 40 – 45 分鐘</span>
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            野沢温泉スキー場（長坂中心 / 日影）
          </h3>
          <p className="text-xs text-slate-600">
            日文對照：野沢温泉スキー場 長坂センターハウス（Tel: 0269-85-3166）
          </p>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          落山經飯山市區後沿千曲川（國道 117
          號）向北行駛，最後一段上野澤溫泉村斜路較窄且多積雪，建議預留 45
          分鐘車程，滑完雪仲可以順便行溫泉街同食溫泉蛋！
        </p>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=Nozawa+Onsen+Snow+Resort+Nagasaka+Center+House&travelmode=driving"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="一鍵導航去野沢温泉スキー場長坂中心"
          className="nav-btn min-h-[48px] w-full inline-flex items-center justify-center gap-2 bg-snow-900 hover:bg-snow-700 text-white text-sm font-bold py-3 px-4 rounded-2xl shadow-sm"
        >
          <CornerUpRight
            className="w-4 h-4 text-sky-300 shrink-0"
            aria-hidden="true"
          />
          <span>一鍵導航去 野沢温泉スキー場</span>
        </a>
      </div>
    </section>
  );
};
