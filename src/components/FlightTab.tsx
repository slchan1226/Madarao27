import React, {useEffect, useState} from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ExternalLink,
  Info,
  Luggage,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Ticket,
  X,
} from 'lucide-react';
import {
  BOOKING_GROUPS,
  getOutboundSeat,
  type BookingRefId,
} from '../data/flightSeats';
import type {TabId} from '../types/trip';
import {A321neoSeatMap} from './A321neoSeatMap';

interface FlightTabProps {
  isBackupMode?: boolean;
  defaultLeg?: 'outbound' | 'inbound';
  mySeat: string | null;
  onSelectSeat: (seatCode: string | null) => void;
  onCopyText: (text: string) => void;
  onBackHome?: () => void;
  onNavigateTab: (tab: TabId) => void;
}

export const FlightTab: React.FC<FlightTabProps> = ({
  isBackupMode = false,
  defaultLeg = 'outbound',
  mySeat,
  onSelectSeat,
  onCopyText,
  onBackHome,
  onNavigateTab,
}) => {
  const [activeLeg, setActiveLeg] = useState<'outbound' | 'inbound'>(defaultLeg);

  useEffect(() => {
    setActiveLeg(defaultLeg);
  }, [defaultLeg]);

  const claimedSeat = getOutboundSeat(mySeat);
  const claimedBooking = claimedSeat
    ? BOOKING_GROUPS[claimedSeat.bookingRef]
    : null;

  return (
    <section
      id="panel-flight"
      role="tabpanel"
      aria-labelledby="tab-flight"
      className="space-y-4"
    >
      {isBackupMode && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 flex items-center justify-between gap-2 text-xs text-sky-950">
          <div className="flex items-start gap-2 min-w-0">
            <Info
              className="w-4 h-4 text-sky-700 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span className="leading-snug">
              目前為<strong>航班備查模式</strong>（2 月 19 日起會自動恢復顯示於底部主導航）
            </span>
          </div>
          {onBackHome && (
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[36px] px-2.5 py-1 rounded-xl bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>回首頁</span>
            </button>
          )}
        </div>
      )}

      {/* 去程 / 回程分段聚焦切換 */}
      <div
        role="tablist"
        aria-label="切換去程或回程航班"
        className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-white/95 border border-slate-200/85 shadow-2xs"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeLeg === 'outbound'}
          onClick={() => setActiveLeg('outbound')}
          className={`min-h-[46px] px-2.5 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap tabular-nums ${
            activeLeg === 'outbound'
              ? 'bg-snow-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PlaneTakeoff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>去程 GK28 · 2/14</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeLeg === 'inbound'}
          onClick={() => setActiveLeg('inbound')}
          className={`min-h-[46px] px-2.5 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition cursor-pointer whitespace-nowrap tabular-nums ${
            activeLeg === 'inbound'
              ? 'bg-snow-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PlaneLanding className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>回程 GK27 · 2/20</span>
        </button>
      </div>

      {/* 一體化登機證與航段詳情主卡 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-4">
        {/* 1. 航段標題與起降時間軸 */}
        {activeLeg === 'outbound' ? (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  捷星日本 Jetstar Japan · GK28
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  去程 · Airbus A321neo · 2027年2月14日 (日)
                </p>
              </div>
              <span className="text-xs font-bold text-sky-800 whitespace-nowrap">
                起飛前 2.5h 辦雪具寄艙
              </span>
            </div>

            <div className="bg-sky-50/85 border border-sky-200 rounded-2xl p-3.5 sm:p-4 tabular-nums">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <div className="min-w-0">
                  <div className="fluid-time font-bold text-slate-900 leading-none">
                    01:10
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                    香港 HKG
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    T1 航廈（60 分鐘前關櫃）
                  </div>
                </div>
                <div className="shrink-0 w-[72px] sm:w-[96px] text-center">
                  <div className="text-[11px] font-bold text-sky-800 leading-tight">
                    A321neo
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

            {/* 2. 個人已認領座位摘要條（跟「我的分車／房號」體驗貫通） */}
            {claimedSeat && claimedBooking ? (
              <div className="bg-gradient-to-r from-snow-900 to-sky-800 text-white rounded-2xl p-3.5 shadow-sm space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-sky-200">
                      我的去程登機座位（已同步至首頁）
                    </div>
                    <div className="text-sm sm:text-base font-bold mt-0.5 leading-snug tabular-nums">
                      {claimedSeat.code}（{claimedSeat.position}）·{' '}
                      {claimedSeat.passengerName}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectSeat(null)}
                    aria-label="取消標記我的座位"
                    className="min-h-[36px] min-w-[36px] rounded-xl bg-white/15 hover:bg-white/25 inline-flex items-center justify-center shrink-0 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="pt-2 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sky-100">
                    <span>
                      訂單：<strong className="text-white">{claimedBooking.ref}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      寄艙：<strong className="text-white">{claimedBooking.checkedKgPerPax}kg</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>手提 7kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopyText(claimedBooking.ref)}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer whitespace-nowrap"
                  >
                    <Copy className="w-3 h-3" aria-hidden="true" />
                    <span>複製 {claimedBooking.ref}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50/85 border border-amber-200/80 rounded-2xl px-3.5 py-2.5 text-xs text-amber-950 flex items-center gap-2">
                <Ticket
                  className="w-4 h-4 text-amber-700 shrink-0"
                  aria-hidden="true"
                />
                <span className="leading-snug">
                  在下方 <strong>A321neo 座位圖</strong> 點一下自己的名字，即可鎖定座位、訂單碼與個人寄艙額度。
                </span>
              </div>
            )}

            {/* 3. 無縫內嵌 A321neo 去程互動座位圖 */}
            <div className="pt-1 border-t border-slate-200/75">
              <A321neoSeatMap
                mySeat={mySeat}
                onSelectSeat={onSelectSeat}
                onCopyText={onCopyText}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                  捷星日本 Jetstar Japan · GK27
                </h2>
                <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  回程 · Airbus A321neo · 2027年2月20日 (六)
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                建議 16:30 抵達成田 T3
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 sm:p-4 tabular-nums">
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <div className="min-w-0">
                  <div className="fluid-time font-bold text-slate-900 leading-none">
                    19:30
                  </div>
                  <div className="text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                    東京成田 NRT
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                    T3 航廈（預留還車＋寄雪具）
                  </div>
                </div>
                <div className="shrink-0 w-[72px] sm:w-[96px] text-center">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">
                    A321neo
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

            <p className="text-xs text-slate-600 bg-slate-50/90 border border-slate-200/80 rounded-2xl px-3.5 py-2.5 leading-relaxed">
              回程座位暫未另行分配（去程第 4–7 排座位圖只適用於 2/14 GK28）；請於 2/20 早上 10:00 前退房，由斑尾自駕返成田還車建議最遲 11:00 出發。
            </p>
          </div>
        )}

        {/* 4. 訂單代號與行李額度速查（取代原本密密麻麻純文字清單） */}
        <div className="pt-3 border-t border-slate-200/75 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-bold text-snow-900 inline-flex items-center gap-1.5">
              <Luggage
                className="w-4 h-4 text-sky-700 shrink-0"
                aria-hidden="true"
              />
              <span>訂位代號與行李配額（點代號一鍵複製）</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 tabular-nums">
            {(['TUKQQH', 'VLNWFF'] as BookingRefId[]).map((ref) => {
              const group = BOOKING_GROUPS[ref];
              const isHighlighted = claimedSeat?.bookingRef === ref;
              return (
                <button
                  key={ref}
                  type="button"
                  onClick={() => onCopyText(group.ref)}
                  aria-label={`複製訂位代號 ${group.ref}`}
                  className={`text-left rounded-2xl border p-3 transition cursor-pointer active:scale-[0.98] ${
                    isHighlighted
                      ? 'bg-sky-50/95 border-sky-400 ring-1 ring-sky-400/70'
                      : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-snow-900 tracking-wide">
                      {group.ref}
                    </span>
                    <span className="text-[11px] font-bold text-sky-800 inline-flex items-center gap-1">
                      <Copy className="w-3 h-3" aria-hidden="true" />
                      <span>複製</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1 leading-snug">
                    {group.paxCount} 人 · 每人{' '}
                    <strong>{group.checkedKgPerPax}kg</strong>（共{' '}
                    {group.totalCheckedKg}kg）·{' '}
                    <strong>{group.oversizedCount} 件特大行李</strong>
                  </p>
                </button>
              );
            })}
          </div>

          {/* 精簡登機規矩 + Visit Japan Web */}
          <div className="bg-amber-50/80 border border-amber-200/85 rounded-2xl p-3 text-xs text-amber-950 space-y-2">
            <p className="leading-relaxed text-amber-900">
              兩單合共寄艙 <strong>315kg</strong>（單件上限 32kg）、特大行李{' '}
              <strong>3 件</strong>（連同團其餘 3 人訂單請預留超規板袋寄艙時間）；每人手提限重{' '}
              <strong>7kg</strong>（1 登機箱＋1 隨身袋）。
            </p>
            {activeLeg === 'outbound' && (
              <a
                href="https://www.vjw.digital.go.jp/main/#/vjwplo001"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="開啟 Visit Japan Web 入境申報網站"
                className="min-h-[40px] w-full bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
              >
                <span>開啟 Visit Japan Web（入境電子申報 QR Code）</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {/* 5. 下一步行程銜接 */}
        <button
          type="button"
          onClick={() =>
            onNavigateTab(activeLeg === 'outbound' ? 'route' : 'local')
          }
          aria-label={
            activeLeg === 'outbound'
              ? '前往去程自駕路線分頁'
              : '前往周邊自駕分頁'
          }
          className="min-h-[48px] w-full py-3.5 px-4 rounded-2xl bg-snow-700 hover:bg-snow-900 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <span>
            {activeLeg === 'outbound'
              ? '落機後下一步：查看成田 ➔ 斑尾自駕路線'
              : '查看斑尾周邊自駕與加油站資訊'}
          </span>
          <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};
