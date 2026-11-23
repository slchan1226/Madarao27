import React from 'react';
import {ArrowRight, Luggage, Plane} from 'lucide-react';
import type {TabId} from '../types/trip';

interface FlightTabProps {
  onNavigateTab: (tab: TabId) => void;
}

export const FlightTab: React.FC<FlightTabProps> = ({onNavigateTab}) => {
  return (
    <section
      id="panel-flight"
      role="tabpanel"
      aria-labelledby="tab-flight"
      className="space-y-4"
    >
      <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
            STEP 1 · FLIGHT SCHEDULE
          </span>
          <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
            捷星日本 Jetstar Japan 航班資訊
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            請於起飛前至少 2.5 小時到達機場辦理大件雪具寄艙手續
          </p>
        </div>

        {/* 去程航班 */}
        <div className="bg-sky-50/85 border border-sky-200 rounded-2xl p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-white bg-sky-700 px-2.5 py-0.5 rounded-full">
                去程 OUTBOUND
              </span>
              <span className="text-[11px] font-bold text-sky-800 bg-white/80 border border-sky-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                A320
              </span>
            </div>
            <span className="text-xs font-bold text-sky-900 whitespace-nowrap">
              2027年2月14日 (日)
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 mt-3.5">
            <div className="min-w-0">
              <div className="fluid-time font-bold text-slate-900 leading-none">
                01:10
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                香港 HKG
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                T1 航廈
              </div>
            </div>
            <div className="shrink-0 w-[72px] sm:w-[96px] text-center">
              <div className="text-[11px] font-bold text-sky-800 leading-tight">
                GK28
              </div>
              <div className="border-t-2 border-dashed border-sky-300 my-2 relative flex justify-center">
                <span className="bg-sky-50 px-1 -mt-2 inline-flex items-center justify-center">
                  <Plane
                    className="w-3.5 h-3.5 text-sky-700 rotate-45"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                4h 10m
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className="fluid-time font-bold text-slate-900 leading-none">
                06:20
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                東京成田 NRT
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                T3 航廈
              </div>
            </div>
          </div>
        </div>

        {/* 回程航班 */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full">
                回程 INBOUND
              </span>
              <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                A320
              </span>
            </div>
            <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
              2027年2月20日 (六)
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 mt-3.5">
            <div className="min-w-0">
              <div className="fluid-time font-bold text-slate-900 leading-none">
                19:30
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                東京成田 NRT
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                T3 航廈
              </div>
            </div>
            <div className="shrink-0 w-[72px] sm:w-[96px] text-center">
              <div className="text-[11px] font-bold text-slate-800 leading-tight">
                GK27
              </div>
              <div className="border-t-2 border-dashed border-slate-300 my-2 relative flex justify-center">
                <span className="bg-slate-50 px-1 -mt-2 inline-flex items-center justify-center">
                  <Plane
                    className="w-3.5 h-3.5 text-slate-700 rotate-45"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <div className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                5h 15m
              </div>
            </div>
            <div className="min-w-0 text-right">
              <div className="fluid-time font-bold text-slate-900 leading-none">
                23:45
              </div>
              <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                香港 HKG
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                T1 航廈
              </div>
            </div>
          </div>
        </div>

        {/* 訂單與行李備忘 */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <Luggage className="w-4 h-4 shrink-0 text-amber-800" aria-hidden="true" />
            <span>行李與登機備忘：</span>
          </p>
          <ul className="list-disc pl-4 space-y-1 text-amber-900">
            <li>
              訂位代號參考：<strong>TUKQQH</strong>（8人訂單）、
              <strong>VLNWFF</strong>（3人訂單）及同團其餘訂單。
            </li>
            <li>
              寄艙行李配置：<strong>8人 30kg</strong>（240kg）＋
              <strong>3人 25kg</strong>（75kg），<strong>總寄艙重量 315kg</strong>
              （單件不可超過 32kg）；<strong>特大行李合計 4 件</strong>
              （板袋／雪具請預留時間辦理超規寄艙）。
            </li>
            <li>
              每人手提行李限重 <strong>7kg</strong>
              （1件登機箱＋1件隨身小包）。
            </li>
            <li>
              去程香港 T1 櫃檯於起飛前 <strong>60 分鐘</strong>
              停止辦理登機及寄艙。
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('route')}
          aria-label="前往去程自駕路線分頁"
          className="min-h-[48px] w-full py-3.5 px-4 rounded-2xl bg-snow-700 hover:bg-snow-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <span>落機後下一步：查看成田 ➔ 斑尾自駕路線</span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
