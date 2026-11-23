import React, {useEffect, useState} from 'react';
import {CalendarClock, Snowflake} from 'lucide-react';

const MS_PER_DAY = 86_400_000;
const DEPARTURE_UTC_DATE = Date.UTC(2027, 1, 14); // 2027-02-14 (month is 0-indexed)
const TRIP_DURATION_DAYS = 7; // Feb 14 – Feb 20, 2027

function computeDaysUntilDeparture(): number {
  const now = new Date();
  const todayUtcDate = Date.UTC(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return Math.round((DEPARTURE_UTC_DATE - todayUtcDate) / MS_PER_DAY);
}

export const CountdownWidget: React.FC = () => {
  const [daysLeft, setDaysLeft] = useState<number>(computeDaysUntilDeparture);

  useEffect(() => {
    const refresh = () => setDaysLeft(computeDaysUntilDeparture());
    const intervalId = window.setInterval(refresh, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const isBeforeTrip = daysLeft > 0;
  const isDuringTrip = daysLeft <= 0 && daysLeft > -TRIP_DURATION_DAYS;
  const tripDayNumber = Math.abs(daysLeft) + 1;

  return (
    <div className="w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-3">
      <div
        id="departure-countdown-widget"
        role="region"
        aria-label="距離 2027 年 2 月 14 日出發倒數"
        className="glass-card rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 border border-sky-200/85 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-snow-900 flex items-center justify-center shrink-0 border border-sky-200/70">
            {isDuringTrip ? (
              <Snowflake className="w-4 h-4 text-sky-700" aria-hidden="true" />
            ) : (
              <CalendarClock
                className="w-4 h-4 text-sky-700"
                aria-hidden="true"
              />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-snow-900 leading-snug">
              {isBeforeTrip
                ? '距離 2027 斑尾出發倒數'
                : isDuringTrip
                  ? '斑尾高原滑雪之旅進行中'
                  : '2027 斑尾滑雪團圓滿結束'}
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
              {isBeforeTrip
                ? '2027年2月14日 · HKG 01:10 GK28'
                : isDuringTrip
                  ? '2027/02/14 – 02/20 · 祝大家粉雪滿滿'
                  : '2027/02/14 – 02/20 · 行程手冊留念'}
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-gradient-to-br from-snow-900 to-sky-800 text-white rounded-xl px-3 py-1.5 shadow-sm text-center min-w-[82px]">
          {isBeforeTrip ? (
            <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
              <span className="text-[10px] font-medium text-sky-200">仲有</span>
              <span className="font-serif text-xl sm:text-2xl font-bold leading-none tabular-nums">
                {daysLeft}
              </span>
              <span className="text-[11px] font-bold text-sky-100">天</span>
            </div>
          ) : isDuringTrip ? (
            <div className="flex items-baseline justify-center gap-1 whitespace-nowrap">
              <span className="text-[10px] font-medium text-sky-200">DAY</span>
              <span className="font-serif text-xl sm:text-2xl font-bold leading-none tabular-nums">
                {tripDayNumber}
              </span>
              <span className="text-[10px] font-medium text-sky-200">
                / {TRIP_DURATION_DAYS}
              </span>
            </div>
          ) : (
            <span className="text-xs font-bold text-sky-100 whitespace-nowrap">
              已完成
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
