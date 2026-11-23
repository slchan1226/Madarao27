import React, {useMemo, useState} from 'react';
import {TrendingUp} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  WEATHER_RESORTS,
  type DerivedResortWeather,
  type WeatherResortId,
} from '../lib/weather';

interface SnowProbabilityTrendChartProps {
  derivedByResort: Partial<Record<WeatherResortId, DerivedResortWeather>>;
  selectedResortId: WeatherResortId;
  isLoading: boolean;
  onSelectResort: (resortId: WeatherResortId) => void;
}

interface ResortSeriesConfig {
  id: WeatherResortId;
  shortName: string;
  color: string;
}

export const RESORT_SERIES: ResortSeriesConfig[] = [
  {id: 'madarao', shortName: '斑尾高原', color: '#0369a1'},
  {id: 'tangram', shortName: 'Tangram', color: '#0d9488'},
  {id: 'romance', shortName: 'ロマンスの神様', color: '#e11d48'},
  {id: 'nozawa', shortName: '野沢温泉', color: '#4f46e5'},
];

export const RESORT_COLOR_MAP: Record<WeatherResortId, string> = {
  madarao: '#0369a1',
  tangram: '#0d9488',
  romance: '#e11d48',
  nozawa: '#4f46e5',
};

interface ChartDatum {
  index: number;
  hourLabel: string;
  displayTime: string;
  isTomorrow: boolean;
  madarao: number | null;
  tangram: number | null;
  romance: number | null;
  nozawa: number | null;
  madaraoSnow: number;
  tangramSnow: number;
  romanceSnow: number;
  nozawaSnow: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey?: string;
    value?: number | null;
    color?: string;
    payload?: ChartDatum;
  }>;
}

const SnowProbTooltip: React.FC<CustomTooltipProps> = ({active, payload}) => {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-lg px-3 py-2.5 text-xs tabular-nums min-w-[168px]">
      <div className="font-bold text-snow-900 pb-1.5 mb-1.5 border-b border-slate-100">
        {datum.displayTime} JST
      </div>
      <div className="space-y-1">
        {RESORT_SERIES.map((series) => {
          const item = payload.find((p) => p.dataKey === series.id);
          if (!item || typeof item.value !== 'number') return null;
          const snowKey = `${series.id}Snow` as
            | 'madaraoSnow'
            | 'tangramSnow'
            | 'romanceSnow'
            | 'nozawaSnow';
          const snowCm = datum[snowKey];
          return (
            <div
              key={series.id}
              className="flex items-center justify-between gap-3"
            >
              <span className="inline-flex items-center gap-1.5 text-slate-700">
                <span
                  className="w-2.5 h-0.5 rounded-full shrink-0"
                  style={{backgroundColor: series.color}}
                  aria-hidden="true"
                />
                <span>{series.shortName}</span>
              </span>
              <span className="font-bold text-slate-900 shrink-0">
                {item.value}%
                {snowCm > 0 && (
                  <span className="text-[10px] font-semibold text-sky-700 ml-1">
                    +{snowCm}cm
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const SnowProbabilityTrendChart: React.FC<
  SnowProbabilityTrendChartProps
> = ({derivedByResort, selectedResortId, isLoading, onSelectResort}) => {
  const [hiddenResorts, setHiddenResorts] = useState<
    Partial<Record<WeatherResortId, boolean>>
  >({});
  const [focusSelectedOnly, setFocusSelectedOnly] = useState<boolean>(false);

  const visibleResortIds = useMemo(() => {
    if (focusSelectedOnly) return [selectedResortId];
    const active = RESORT_SERIES.map((s) => s.id).filter(
      (id) => !hiddenResorts[id],
    );
    return active.length > 0 ? active : [selectedResortId];
  }, [focusSelectedOnly, hiddenResorts, selectedResortId]);

  const chartData = useMemo<ChartDatum[]>(() => {
    const baseDerived =
      derivedByResort[selectedResortId] ??
      derivedByResort.madarao ??
      WEATHER_RESORTS.map((r) => derivedByResort[r.id]).find(Boolean);

    if (!baseDerived || baseDerived.next24h.length === 0) return [];

    const lookupByResort: Record<
      WeatherResortId,
      Map<string, {snowProb: number; snowfallCm: number}>
    > = {
      madarao: new Map(),
      tangram: new Map(),
      romance: new Map(),
      nozawa: new Map(),
    };

    for (const resort of WEATHER_RESORTS) {
      const items = derivedByResort[resort.id]?.next24h ?? [];
      for (const item of items) {
        lookupByResort[resort.id].set(item.time, {
          snowProb: item.snowProb,
          snowfallCm: item.snowfallCm,
        });
      }
    }

    return baseDerived.next24h.map((baseItem, idx) => {
      const resolvePoint = (id: WeatherResortId) => {
        const byTime = lookupByResort[id].get(baseItem.time);
        if (byTime) return byTime;
        const fallback = derivedByResort[id]?.next24h[idx];
        return fallback
          ? {snowProb: fallback.snowProb, snowfallCm: fallback.snowfallCm}
          : null;
      };

      const m = resolvePoint('madarao');
      const t = resolvePoint('tangram');
      const r = resolvePoint('romance');
      const n = resolvePoint('nozawa');

      return {
        index: idx,
        hourLabel: idx === 0 ? '現在' : baseItem.hourLabel,
        displayTime:
          idx === 0
            ? `現在 (${baseItem.hourLabel})`
            : `${baseItem.isTomorrow ? '明日' : '今日'} ${baseItem.hourLabel}`,
        isTomorrow: baseItem.isTomorrow,
        madarao: m ? m.snowProb : null,
        tangram: t ? t.snowProb : null,
        romance: r ? r.snowProb : null,
        nozawa: n ? n.snowProb : null,
        madaraoSnow: m?.snowfallCm ?? 0,
        tangramSnow: t?.snowfallCm ?? 0,
        romanceSnow: r?.snowfallCm ?? 0,
        nozawaSnow: n?.snowfallCm ?? 0,
      };
    });
  }, [derivedByResort, selectedResortId]);

  const peakSummary = useMemo(() => {
    if (chartData.length === 0) return null;
    let bestProb = -1;
    let bestResortName = '';
    let bestTime = '';

    for (const id of visibleResortIds) {
      const meta = RESORT_SERIES.find((s) => s.id === id);
      if (!meta) continue;
      for (const row of chartData) {
        const prob = row[id];
        if (typeof prob === 'number' && prob > bestProb) {
          bestProb = prob;
          bestResortName = meta.shortName;
          bestTime = row.displayTime;
        }
      }
    }

    if (bestProb < 0) return null;
    return {bestProb, bestResortName, bestTime};
  }, [chartData, visibleResortIds]);

  const toggleResortLine = (id: WeatherResortId) => {
    if (focusSelectedOnly) {
      onSelectResort(id);
      return;
    }
    setHiddenResorts((prev) => {
      const currentlyHidden = Boolean(prev[id]);
      const next = {...prev, [id]: !currentlyHidden};
      const remaining = RESORT_SERIES.filter((s) => !next[s.id]);
      if (remaining.length === 0) {
        return prev;
      }
      return next;
    });
  };

  if (isLoading && chartData.length === 0) {
    return (
      <div
        className="glass-card rounded-3xl p-4 sm:p-5 border border-sky-200/80 shadow-sm space-y-3 animate-pulse"
        aria-busy="true"
      >
        <div className="h-5 w-44 bg-slate-200 rounded-lg" />
        <div className="h-[200px] w-full bg-sky-50 rounded-2xl" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  const activeResortMeta = RESORT_SERIES.find((s) => s.id === selectedResortId);

  return (
    <div className="glass-card rounded-3xl p-4 sm:p-5 border border-sky-200/80 shadow-sm space-y-3">
      {/* 標題與對比／單場切換 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-serif text-base font-bold text-snow-900 inline-flex items-center gap-1.5">
            <TrendingUp
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
            <span>24 小時降雪概率趨勢</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            點擊圖表睇逐小時概率與降雪量 · 藍底 ≥70%
          </p>
        </div>

        <div
          role="group"
          aria-label="切換四場對比或單看所選雪場"
          className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0"
        >
          <button
            type="button"
            onClick={() => setFocusSelectedOnly(false)}
            aria-pressed={!focusSelectedOnly}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
              !focusSelectedOnly
                ? 'bg-white text-snow-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            四場對比
          </button>
          <button
            type="button"
            onClick={() => setFocusSelectedOnly(true)}
            aria-pressed={focusSelectedOnly}
            className={`min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
              focusSelectedOnly
                ? 'bg-white text-snow-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            單場焦點
          </button>
        </div>
      </div>

      {/* 可互動雪場圖例（對齊上方四場卡片線色） */}
      <div
        className="flex flex-wrap items-center gap-1.5"
        role="group"
        aria-label="顯示或隱藏個別雪場趨勢線"
      >
        {RESORT_SERIES.map((series) => {
          const isVisible = visibleResortIds.includes(series.id);
          const isSelected = series.id === selectedResortId;

          return (
            <button
              key={series.id}
              type="button"
              onClick={() => toggleResortLine(series.id)}
              aria-pressed={isVisible}
              className={`min-h-[34px] px-2.5 py-1 rounded-xl border text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                isVisible
                  ? isSelected
                    ? 'bg-snow-900 text-white border-snow-900 shadow-2xs'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                  : 'bg-slate-50 text-slate-400 border-slate-200/70 line-through'
              }`}
            >
              <span
                className="w-2.5 h-1 rounded-full shrink-0"
                style={{
                  backgroundColor: isVisible ? series.color : '#cbd5e1',
                }}
                aria-hidden="true"
              />
              <span>{series.shortName}</span>
            </button>
          );
        })}
      </div>

      {/* Recharts 24 小時降雪概率折線圖 */}
      <div
        className="w-full h-[216px] min-w-0 select-none"
        role="img"
        aria-label="四大雪場未來 24 小時降雪概率趨勢折線圖"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{top: 10, right: 14, left: 0, bottom: 4}}
          >
            <ReferenceArea
              y1={70}
              y2={100}
              fill="#e0f2fe"
              fillOpacity={0.5}
              ifOverflow="extendDomain"
            />
            <CartesianGrid
              stroke="#e2e8f0"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="hourLabel"
              interval={3}
              tick={{fontSize: 10, fill: '#64748b'}}
              tickLine={false}
              axisLine={{stroke: '#cbd5e1'}}
            />
            <YAxis
              width={36}
              domain={[0, 100]}
              ticks={[0, 30, 70, 100]}
              tickFormatter={(v: number) => `${v}%`}
              tick={{fontSize: 10, fill: '#64748b'}}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine
              y={70}
              stroke="#0284c7"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
            />
            <ReferenceLine
              y={30}
              stroke="#d97706"
              strokeDasharray="3 3"
              strokeOpacity={0.45}
            />
            <Tooltip
              content={<SnowProbTooltip />}
              cursor={{stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3'}}
            />

            {RESORT_SERIES.map((series) => {
              if (!visibleResortIds.includes(series.id)) return null;
              const isSelected = series.id === selectedResortId;
              return (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={series.id}
                  name={series.shortName}
                  stroke={series.color}
                  strokeWidth={isSelected || focusSelectedOnly ? 2.8 : 1.8}
                  strokeOpacity={isSelected || focusSelectedOnly ? 1 : 0.72}
                  dot={
                    focusSelectedOnly
                      ? {r: 2.5, strokeWidth: 1.5, fill: '#ffffff'}
                      : false
                  }
                  activeDot={{
                    r: 4.5,
                    strokeWidth: 2,
                    stroke: '#ffffff',
                    fill: series.color,
                  }}
                  connectNulls
                  isAnimationActive={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 簡潔趨勢摘要 */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-2 border-t border-slate-100 text-[11px] text-slate-600 tabular-nums">
        <span>
          {peakSummary && peakSummary.bestProb >= 30 ? (
            <>
              最高降雪時段：
              <strong className="text-snow-900">
                {peakSummary.bestResortName} {peakSummary.bestTime}
              </strong>
              （{peakSummary.bestProb}%）
            </>
          ) : (
            <>
              未來 24 小時整體降雪概率偏低
              {peakSummary ? `（最高 ${peakSummary.bestProb}%）` : ''}
            </>
          )}
        </span>
        {focusSelectedOnly && activeResortMeta && (
          <span className="text-[10px] text-slate-500">
            焦點：{activeResortMeta.shortName}
          </span>
        )}
      </div>
    </div>
  );
};
