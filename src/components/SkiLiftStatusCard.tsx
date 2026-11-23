import React, {useEffect, useState} from 'react';
import {
  AlertCircle,
  CableCar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Moon,
  RefreshCw,
  Snowflake,
  Ticket,
  WifiOff,
} from 'lucide-react';
import {RESORT_LIFT_SCHEDULES} from '../data/skiLiftSchedules';
import {
  formatUpdatedTime,
  type WeatherResortId,
  type WeatherResortMeta,
} from '../lib/weather';

interface LiveLiftItem {
  name: string;
  status: string;
  hours?: string;
  note?: string;
}

interface LiveSourceLink {
  title: string;
  uri: string;
}

export interface LiveResortLiftReport {
  resortId: WeatherResortId;
  operationState: 'open' | 'partial' | 'closed' | 'offseason' | 'unknown';
  statusBadgeText: string;
  openLiftsSummary: string;
  operatingHours: string;
  nightSkiStatus: string;
  officialSnowDepth: string;
  advisory: string;
  lifts: LiveLiftItem[];
  summaryMarkdown?: string;
  sources: LiveSourceLink[];
  fetchedAt: string;
}

type LiftReportCacheMap = Partial<Record<WeatherResortId, LiveResortLiftReport>>;

const LIFT_CACHE_STORAGE_KEY = 'madarao_2027_ski_lifts_cache_v1';

function readLiftCache(): LiftReportCacheMap {
  try {
    const raw = localStorage.getItem(LIFT_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LiftReportCacheMap;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    // Ignore storage read errors
  }
  return {};
}

function saveLiftCache(map: LiftReportCacheMap): void {
  try {
    localStorage.setItem(LIFT_CACHE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors
  }
}

function getOperationTone(state: LiveResortLiftReport['operationState']): {
  labelClass: string;
  iconClass: string;
} {
  switch (state) {
    case 'open':
      return {
        labelClass: 'text-emerald-800 bg-emerald-50 border-emerald-200',
        iconClass: 'text-emerald-600',
      };
    case 'partial':
      return {
        labelClass: 'text-amber-900 bg-amber-50 border-amber-200',
        iconClass: 'text-amber-600',
      };
    case 'closed':
    case 'offseason':
      return {
        labelClass: 'text-slate-700 bg-slate-100 border-slate-200',
        iconClass: 'text-slate-500',
      };
    default:
      return {
        labelClass: 'text-sky-900 bg-sky-50 border-sky-200',
        iconClass: 'text-sky-700',
      };
  }
}

function getLiftStatusTextClass(status: string): string {
  const s = status.toLowerCase();
  if (
    s.includes('運行') ||
    s.includes('開放') ||
    s.includes('open') ||
    s.includes('正常')
  ) {
    return 'text-emerald-700 font-bold';
  }
  if (
    s.includes('暫停') ||
    s.includes('強風') ||
    s.includes('延遲') ||
    s.includes('hold') ||
    s.includes('準備')
  ) {
    return 'text-amber-700 font-bold';
  }
  if (
    s.includes('停運') ||
    s.includes('關閉') ||
    s.includes('休止') ||
    s.includes('closed') ||
    s.includes('未開')
  ) {
    return 'text-slate-500 font-semibold';
  }
  return 'text-sky-800 font-semibold';
}

interface SkiLiftStatusCardProps {
  resort: WeatherResortMeta;
  isOnline: boolean;
}

export const SkiLiftStatusCard: React.FC<SkiLiftStatusCardProps> = ({
  resort,
  isOnline,
}) => {
  const schedule = RESORT_LIFT_SCHEDULES[resort.id];
  const [cacheMap, setCacheMap] = useState<LiftReportCacheMap>(readLiftCache);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const liveReport = cacheMap[resort.id] ?? null;

  useEffect(() => {
    setErrorMsg(null);
  }, [resort.id]);

  const handleFetchLiveLifts = async (forceRefresh = false) => {
    if (!isOnline) {
      setErrorMsg(
        '目前處於離線狀態，下方已完整顯示常規雪季營業時間與上次快取的即時報告。',
      );
      return;
    }

    setIsFetching(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/ski/lifts', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          resortId: resort.id,
          forceRefresh,
        }),
      });

      const payload = (await response.json()) as Partial<LiveResortLiftReport> & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error || `即時纜車查詢失敗（HTTP ${response.status}）`,
        );
      }

      const report: LiveResortLiftReport = {
        resortId: resort.id,
        operationState: payload.operationState ?? 'unknown',
        statusBadgeText: payload.statusBadgeText ?? '已更新最新情報',
        openLiftsSummary: payload.openLiftsSummary ?? '請參閱下方摘要與官網',
        operatingHours: payload.operatingHours ?? schedule.standardHours,
        nightSkiStatus: payload.nightSkiStatus ?? schedule.nightSkiNote,
        officialSnowDepth: payload.officialSnowDepth ?? '請對照官方最新報告',
        advisory: payload.advisory ?? '',
        lifts: Array.isArray(payload.lifts) ? payload.lifts : [],
        summaryMarkdown: payload.summaryMarkdown,
        sources: Array.isArray(payload.sources) ? payload.sources : [],
        fetchedAt: payload.fetchedAt ?? new Date().toISOString(),
      };

      setCacheMap((prev) => {
        const next = {...prev, [resort.id]: report};
        saveLiftCache(next);
        return next;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : '未能連線取得即時纜車狀況，請先參考常規營業時間或直達官網。';
      setErrorMsg(message);
    } finally {
      setIsFetching(false);
    }
  };

  const opTone = liveReport
    ? getOperationTone(liveReport.operationState)
    : null;

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm border border-sky-200/80 space-y-4">
      {/* 標題與即時查詢操作 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-snow-900">
            <CableCar
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <h3 className="font-serif text-base sm:text-lg font-bold truncate">
              {resort.shortName}・纜車開放與營業時間
            </h3>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {liveReport
              ? `即時情報已快取 · 更新於 ${formatUpdatedTime(liveReport.fetchedAt)}（JST）`
              : '內置常規雪季時間表（離線可用）· 按右掣可即時檢索官網運行狀況'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleFetchLiveLifts(Boolean(liveReport))}
          disabled={isFetching}
          aria-label={`查詢 ${resort.shortName} 即時纜車開放狀況`}
          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-snow-900 hover:bg-snow-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer whitespace-nowrap"
        >
          {!isOnline ? (
            <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <RefreshCw
              className={`w-3.5 h-3.5 shrink-0 ${isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          )}
          <span>
            {isFetching
              ? '查詢中…'
              : liveReport
                ? '更新即時狀況'
                : '查即時纜車'}
          </span>
        </button>
      </div>

      {/* 錯誤提示 */}
      {errorMsg && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-2.5 text-xs text-amber-950 flex items-start gap-2">
          <AlertCircle
            className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span className="leading-relaxed">{errorMsg}</span>
        </div>
      )}

      {/* 即時查詢結果區（已獲取並快取時顯示） */}
      {liveReport && opTone && (
        <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${opTone.labelClass}`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${opTone.iconClass}`}
                aria-hidden="true"
              />
              <span>{liveReport.statusBadgeText}</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
              {liveReport.openLiftsSummary}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1 border-t border-sky-200/60">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                今日／最新營業時間
              </span>
              <p className="font-bold text-slate-900 tabular-nums">
                {liveReport.operatingHours}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                官方實測積雪／雪況
              </span>
              <p className="font-bold text-slate-900 tabular-nums">
                {liveReport.officialSnowDepth}
              </p>
            </div>
          </div>

          {liveReport.nightSkiStatus && (
            <div className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-sky-200/60 flex items-start gap-2">
              <Moon
                className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                <strong className="text-slate-900">夜滑（ナイター）：</strong>
                {liveReport.nightSkiStatus}
              </span>
            </div>
          )}

          {liveReport.lifts.length > 0 && (
            <div className="pt-2 border-t border-sky-200/60 space-y-1.5">
              <span className="text-[11px] font-bold text-snow-900 block">
                主要纜車／吊椅實時狀態
              </span>
              <div className="divide-y divide-sky-200/60 bg-white/85 rounded-xl border border-sky-200/70">
                {liveReport.lifts.map((lift, idx) => (
                  <div
                    key={`${lift.name}-${idx}`}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {lift.name}
                      </p>
                      {(lift.hours || lift.note) && (
                        <p className="text-[11px] text-slate-500 truncate tabular-nums">
                          {[lift.hours, lift.note].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs shrink-0 whitespace-nowrap ${getLiftStatusTextClass(
                        lift.status,
                      )}`}
                    >
                      {lift.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {liveReport.advisory && (
            <p className="text-xs text-slate-700 leading-relaxed pt-2 border-t border-sky-200/60">
              <strong className="text-snow-900">營運及天氣提示：</strong>
              {liveReport.advisory}
            </p>
          )}

          {liveReport.summaryMarkdown && liveReport.lifts.length === 0 && (
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-2 border-t border-sky-200/60">
              {liveReport.summaryMarkdown}
            </p>
          )}

          {liveReport.sources.length > 0 && (
            <div className="pt-2 border-t border-sky-200/60 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span className="font-bold text-slate-600">資料來源：</span>
              {liveReport.sources.slice(0, 4).map((src, idx) => (
                <a
                  key={`${src.uri}-${idx}`}
                  href={src.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-800 hover:text-sky-950 underline underline-offset-2 inline-flex items-center gap-1 max-w-[200px]"
                >
                  <span className="truncate">{src.title}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 100% 離線常規營運基準表 */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
              <Clock className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>雪季常規營業時間</span>
            </div>
            <p className="text-sm font-bold text-snow-900 tabular-nums">
              {schedule.standardHours}
            </p>
            <p className="text-[11px] text-slate-600 leading-snug">
              {schedule.lastLiftNote}
            </p>
          </div>

          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
              <Ticket className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
              <span>纜車規模與售票</span>
            </div>
            <p className="text-xs font-bold text-snow-900 leading-snug">
              {schedule.totalLiftsSummary}
            </p>
            <p className="text-[11px] text-slate-600 leading-snug tabular-nums">
              售票：{schedule.ticketCounterHours}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-2 px-1">
          <Snowflake
            className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            <strong className="text-slate-900">夜滑參考：</strong>
            {schedule.nightSkiNote}
          </span>
        </div>

        {/* 主要纜車常規時刻表（離線速查） */}
        <div className="border-t border-slate-200/70 pt-2.5 space-y-1.5">
          <span className="text-[11px] font-bold text-slate-600 block">
            主要纜車常規時刻參考（離線速查）
          </span>
          <div className="divide-y divide-slate-100">
            {schedule.keyLifts.map((lift) => (
              <div
                key={lift.name}
                className="py-2 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{lift.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {lift.role}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-snow-900 tabular-nums shrink-0">
                  {lift.typicalHours}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 直達官網實時運行頁面 */}
        <a
          href={schedule.officialStatusUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`前往 ${resort.fullName} 官網查看即時纜車與積雪報告`}
          className="min-h-[44px] w-full bg-sky-50 hover:bg-sky-100 text-snow-900 border border-sky-200 text-xs font-bold py-2.5 px-3.5 rounded-2xl inline-flex items-center justify-center gap-1.5 transition"
        >
          <ExternalLink
            className="w-3.5 h-3.5 text-sky-700 shrink-0"
            aria-hidden="true"
          />
          <span>{schedule.officialStatusLabel}</span>
        </a>
      </div>
    </div>
  );
};
