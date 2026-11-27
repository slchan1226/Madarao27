import React, {useEffect, useState} from 'react';
import {Check, Copy, Maximize2, Plane, X} from 'lucide-react';
import a321CabinShellImg from '../assets/images/a321neo_cabin_shell_1795745256708.jpg';
import {
  BOOKING_GROUPS,
  OUTBOUND_SEATS,
  OUTBOUND_SEAT_BY_CODE,
  OUTBOUND_SEAT_ROWS,
  type BookingRefId,
  type OutboundSeatAssignment,
} from '../data/flightSeats';

interface A321neoSeatMapProps {
  mySeat: string | null;
  onSelectSeat: (seatCode: string | null) => void;
  onCopyText: (text: string) => void;
}

const LEFT_LETTERS = ['A', 'B', 'C'] as const;
const RIGHT_LETTERS = ['D', 'E', 'F'] as const;

function getSeatTileClasses(
  seat: OutboundSeatAssignment,
  isMine: boolean,
): {
  button: string;
  codeText: string;
  nameText: string;
  metaText: string;
} {
  if (isMine) {
    return {
      button:
        'bg-amber-400/25 border-amber-500 ring-2 ring-amber-400/90 shadow-sm text-snow-900',
      codeText: 'text-amber-950',
      nameText: 'text-slate-950',
      metaText: 'text-amber-900',
    };
  }
  if (seat.bookingRef === 'TUKQQH') {
    return {
      button:
        'bg-sky-50/95 hover:bg-sky-100/90 border-sky-300/90 text-snow-900 shadow-2xs',
      codeText: 'text-sky-900',
      nameText: 'text-slate-900',
      metaText: 'text-sky-700',
    };
  }
  return {
    button:
      'bg-teal-50/95 hover:bg-teal-100/85 border-teal-300/90 text-teal-950 shadow-2xs',
    codeText: 'text-teal-900',
    nameText: 'text-slate-900',
    metaText: 'text-teal-700',
  };
}

export const A321neoSeatMap: React.FC<A321neoSeatMapProps> = ({
  mySeat,
  onSelectSeat,
  onCopyText,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isFullscreen]);

  const handleToggleSeat = (seatCode: string) => {
    onSelectSeat(mySeat === seatCode ? null : seatCode);
  };

  const renderCabinGrid = (expanded: boolean) => (
    <div className="relative rounded-[26px] border-2 border-slate-300/90 bg-gradient-to-b from-sky-50/55 via-white to-slate-50/75 px-2.5 sm:px-4 py-3.5 shadow-inner">
      {/* 左右機身舷窗視覺刻度 */}
      <div
        className="pointer-events-none absolute left-1 top-14 bottom-5 flex flex-col justify-around"
        aria-hidden="true"
      >
        {OUTBOUND_SEAT_ROWS.map((r) => (
          <span
            key={`wl-${r}`}
            className="w-1 h-4 rounded-full bg-sky-300/80"
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute right-1 top-14 bottom-5 flex flex-col justify-around"
        aria-hidden="true"
      >
        {OUTBOUND_SEAT_ROWS.map((r) => (
          <span
            key={`wr-${r}`}
            className="w-1 h-4 rounded-full bg-slate-300/75"
          />
        ))}
      </div>

      {/* 前門出口與機頭方向標示 */}
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-slate-500 pb-2 mb-2 border-b border-dashed border-slate-200">
        <span className="text-rose-700/85">◄ 前門 EXIT</span>
        <span className="inline-flex items-center gap-1 text-snow-900">
          <Plane className="w-3 h-3 -rotate-45 text-sky-700" aria-hidden="true" />
          <span>機頭方向 · Upfront 前段（第 4–7 排）</span>
        </span>
        <span className="text-rose-700/85">EXIT ►</span>
      </div>

      {/* 欄位字母標頭（左側 A-B-C 寬格清楚顯示全名；右側 D-E-F 精簡作走道對照） */}
      <div
        className={`grid items-center gap-1 sm:gap-1.5 text-[10px] font-bold text-slate-500 text-center mb-1.5 ${
          expanded
            ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_28px_36px_36px_36px]'
            : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_22px_20px_20px_20px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_28px_36px_36px_36px]'
        }`}
      >
        <span className="text-sky-800">A 窗</span>
        <span className="text-sky-800">B 中</span>
        <span className="text-sky-800">C 廊</span>
        <span className="text-[9px] text-slate-400">走道</span>
        <span className="text-slate-400">D</span>
        <span className="text-slate-400">E</span>
        <span className="text-slate-400">F</span>
      </div>

      {/* 第 4–7 排座位行 */}
      <div className="space-y-1.5 relative">
        {OUTBOUND_SEAT_ROWS.map((row) => (
          <div
            key={row}
            className={`grid items-stretch gap-1 sm:gap-1.5 ${
              expanded
                ? 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_28px_36px_36px_36px]'
                : 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_22px_20px_20px_20px] sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_28px_36px_36px_36px]'
            }`}
          >
            {LEFT_LETTERS.map((letter) => {
              const code = `${row}${letter}`;
              const seat = OUTBOUND_SEAT_BY_CODE[code];

              if (!seat) {
                return (
                  <div
                    key={code}
                    className="min-h-[64px] rounded-xl border border-dashed border-slate-300 bg-slate-100/70 px-1.5 py-2 flex flex-col items-center justify-center text-center"
                    aria-label={`${code} 未列於此兩張訂單`}
                  >
                    <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                      {code}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                      其他／空位
                    </span>
                  </div>
                );
              }

              const isMine = mySeat === seat.code;
              const tone = getSeatTileClasses(seat, isMine);

              return (
                <button
                  key={seat.code}
                  type="button"
                  onClick={() => handleToggleSeat(seat.code)}
                  aria-pressed={isMine}
                  aria-label={`${seat.code} ${seat.passengerName}，訂單 ${seat.bookingRef}，點擊${isMine ? '取消' : '標記'}我的座位`}
                  className={`min-h-[64px] rounded-xl border px-1.5 py-1.5 text-left flex flex-col justify-between transition active:scale-[0.97] cursor-pointer ${tone.button}`}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span
                      className={`text-[11px] font-extrabold tabular-nums leading-none ${tone.codeText}`}
                    >
                      {seat.code}
                    </span>
                    {isMine ? (
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white inline-flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5" aria-hidden="true" />
                      </span>
                    ) : (
                      <span
                        className={`text-[9px] font-bold leading-none ${tone.metaText}`}
                      >
                        {seat.initials}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] sm:text-xs font-bold leading-tight mt-1 break-words ${tone.nameText}`}
                  >
                    {seat.passengerName}
                  </div>
                </button>
              );
            })}

            {/* 中央走道排數標記 */}
            <div className="flex flex-col items-center justify-center relative">
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-dashed border-slate-300/80 pointer-events-none"
                aria-hidden="true"
              />
              <span className="relative z-10 bg-white/95 border border-slate-200/90 text-slate-600 text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center tabular-nums">
                {row}
              </span>
            </div>

            {/* 右側 D-E-F 參考座椅輪廓（保持 Airbus A321neo 3-3 空間方位感） */}
            {RIGHT_LETTERS.map((letter) => (
              <div
                key={`${row}${letter}`}
                aria-hidden="true"
                className="rounded-lg border border-slate-200/80 bg-slate-100/55 flex items-center justify-center text-[9px] font-medium text-slate-400 tabular-nums"
              >
                <span className={expanded ? 'inline' : 'hidden sm:inline'}>
                  {row}
                  {letter}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部方向提示 */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
        <span>點選自己個位即可儲存並同步至首頁航班卡</span>
        <span>機尾方向 ▼</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Nano Banana A321neo 機艙俯視藍圖導覽頭 + 圖例 */}
      <div className="flex items-center gap-3 bg-sky-50/55 border border-sky-200/75 rounded-2xl p-3">
        {/* Nano Banana 生成的 Airbus A321neo 俯視機艙結構圖（附左側 4–7 排高亮區位） */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          aria-label="全螢幕檢視 Airbus A321neo 座位圖"
          className="relative w-[70px] sm:w-[82px] aspect-[3/4] shrink-0 rounded-xl bg-white border border-sky-200/85 overflow-hidden shadow-2xs cursor-pointer group"
        >
          <img
            src={a321CabinShellImg}
            alt="Airbus A321neo 機艙前段俯視結構圖"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top mix-blend-multiply scale-[1.55] origin-top transition-transform duration-200 group-hover:scale-[1.62]"
          />
          {/* 左側前段（第 4–7 排 A-C）位置高亮標記 */}
          <span
            aria-hidden="true"
            className="absolute left-[26%] top-[53%] w-[21%] h-[28%] rounded-sm bg-sky-600/35 border border-sky-700/80 shadow-2xs"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-1 right-1 w-4 h-4 rounded-md bg-snow-900/80 text-white flex items-center justify-center"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-snow-900 leading-snug">
                Airbus A321neo 去程機艙座位圖
              </h3>
              <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                11 位團友集中坐前段左側（第 4–7 排 A–C 區）
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="放大檢視 A321neo 完整座位圖與名單"
              className="min-h-[34px] px-2.5 py-1 rounded-xl bg-white hover:bg-sky-50 text-snow-900 border border-sky-200 text-[11px] font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-sky-700" aria-hidden="true" />
              <span>放大</span>
            </button>
          </div>

          {/* 訂單色標圖例 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-700 tabular-nums">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm bg-sky-100 border border-sky-400 inline-block shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-sky-900">TUKQQH</strong> 8人·30kg
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm bg-teal-100 border border-teal-400 inline-block shrink-0"
                aria-hidden="true"
              />
              <span>
                <strong className="text-teal-900">VLNWFF</strong> 3人·25kg
              </span>
            </span>
            {mySeat && (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm bg-amber-300/70 border border-amber-500 inline-block shrink-0"
                  aria-hidden="true"
                />
                <span className="font-bold text-amber-900">我的座位</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 主互動機艙座位表 */}
      {renderCabinGrid(false)}

      {/* 全螢幕放大檢視燈箱（含 A321neo 藍圖 + 互動座位圖 + 兩張訂單完整名單） */}
      {isFullscreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a321-seatmap-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsFullscreen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-2.5 sm:p-4"
        >
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3.5 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <h3
                  id="a321-seatmap-modal-title"
                  className="font-serif text-base sm:text-lg font-bold text-snow-900 leading-snug"
                >
                  GK28 去程 · Airbus A321neo 座位平面圖
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  2027/02/14 01:10 HKG T1 ➔ 06:20 NRT T3（僅去程適用）
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="關閉全螢幕座位圖"
                className="min-h-[44px] min-w-[44px] shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Nano Banana 機艙整體位置參考 */}
              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-3 flex items-center gap-3.5">
                <div className="relative w-20 aspect-[3/4] shrink-0 rounded-xl bg-white border border-sky-200/80 overflow-hidden">
                  <img
                    src={a321CabinShellImg}
                    alt="Airbus A321neo 俯視藍圖"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute left-[34%] top-[39%] w-[14%] h-[22%] rounded-xs bg-sky-600/35 border border-sky-700/80"
                  />
                </div>
                <div className="min-w-0 text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-snow-900">
                    全體 11 人坐於前段左側 Upfront 區
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    登機後通過前門往後數第 4–7 排左手邊（A 窗邊、B 中間、C 走廊），落機領取雪具更快。
                  </p>
                </div>
              </div>

              {/* 放大版互動座位表 */}
              {renderCabinGrid(true)}

              {/* 按訂單分組之團友清單（點擊亦可認領座位或複製訂單代號） */}
              {(['TUKQQH', 'VLNWFF'] as BookingRefId[]).map((ref) => {
                const group = BOOKING_GROUPS[ref];
                const members = OUTBOUND_SEATS.filter(
                  (s) => s.bookingRef === ref,
                );
                return (
                  <div
                    key={ref}
                    className="rounded-2xl border border-slate-200/85 overflow-hidden"
                  >
                    <div
                      className={`px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs ${
                        ref === 'TUKQQH'
                          ? 'bg-sky-50/90 text-sky-950'
                          : 'bg-teal-50/90 text-teal-950'
                      }`}
                    >
                      <div className="tabular-nums">
                        <span className="font-extrabold tracking-wide">
                          {group.ref}
                        </span>
                        <span className="ml-2 text-[11px] font-medium opacity-85">
                          {group.paxCount} 人 · 每人 {group.checkedKgPerPax}kg ·{' '}
                          {group.oversizedCount} 件特大行李
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyText(group.ref)}
                        className="min-h-[32px] px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white border border-slate-200/80 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition"
                      >
                        <Copy className="w-3 h-3" aria-hidden="true" />
                        <span>複製代號</span>
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 bg-white">
                      {members.map((member) => {
                        const isMine = mySeat === member.code;
                        return (
                          <button
                            key={member.code}
                            type="button"
                            onClick={() => handleToggleSeat(member.code)}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left text-xs transition cursor-pointer ${
                              isMine ? 'bg-amber-50/80' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`w-8 h-7 rounded-lg font-extrabold text-xs inline-flex items-center justify-center shrink-0 tabular-nums ${
                                  isMine
                                    ? 'bg-amber-500 text-white'
                                    : ref === 'TUKQQH'
                                      ? 'bg-sky-100 text-sky-900'
                                      : 'bg-teal-100 text-teal-900'
                                }`}
                              >
                                {member.code}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 leading-snug">
                                  {member.passengerName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {member.position} · {member.seatTypeLabel}
                                </div>
                              </div>
                            </div>
                            <span
                              className={`text-[11px] font-bold shrink-0 ${
                                isMine ? 'text-amber-800' : 'text-slate-400'
                              }`}
                            >
                              {isMine ? '我的座位' : '點選認領'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
