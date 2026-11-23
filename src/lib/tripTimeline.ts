import type {TripStagePreview} from '../types/trip';

// 去程 GK28: 2027-02-14 01:10 HKT 起飛 -> 06:20 JST 抵達成田 T3
// 過了登機／起飛時間 1 小時後（02:10 HKT / 03:10 JST）自動隱藏底部航班分頁
export const OUTBOUND_BOARDING_PLUS_1H_MS = Date.parse(
  '2027-02-14T02:10:00+08:00',
);
export const OUTBOUND_LANDING_MS = Date.parse('2027-02-14T06:20:00+09:00');

// 2027-02-19 00:00 JST 恢復底部航班分頁；2027-02-19 18:00 JST 起首頁開始顯示回程 GK27 摘要卡
export const FLIGHT_TAB_RESTORE_MS = Date.parse('2027-02-19T00:00:00+09:00');
export const INBOUND_CARD_SHOW_MS = Date.parse('2027-02-19T18:00:00+09:00');

export const TRIP_STAGE_STORAGE_KEY = 'madarao_2027_trip_stage_preview';

export const TRIP_STAGE_OPTIONS: Array<{
  id: TripStagePreview;
  label: string;
  desc: string;
}> = [
  {
    id: 'auto',
    label: '跟隨真實時間',
    desc: '按裝置時間自動判斷（預設）',
  },
  {
    id: 'pre-trip',
    label: '出發前',
    desc: '首頁顯示去程卡 · 底部顯示航班頁',
  },
  {
    id: 'in-flight',
    label: '2/14 飛行中',
    desc: '底部隱藏航班頁 · 首頁仍見去程落地',
  },
  {
    id: 'ski-days',
    label: '2/15 滑雪中',
    desc: '首頁無航班卡 · 底部隱藏航班頁',
  },
  {
    id: 'pre-return',
    label: '2/19 19:00',
    desc: '首頁浮現回程卡 · 底部重現航班頁',
  },
];

const PREVIEW_EPOCH_MAP: Record<Exclude<TripStagePreview, 'auto'>, number> = {
  'pre-trip': Date.parse('2027-02-13T18:00:00+08:00'),
  'in-flight': Date.parse('2027-02-14T04:00:00+09:00'),
  'ski-days': Date.parse('2027-02-15T10:00:00+09:00'),
  'pre-return': Date.parse('2027-02-19T19:00:00+09:00'),
};

export interface TripTimelineState {
  effectiveNowMs: number;
  isPreviewActive: boolean;
  previewLabel: string | null;
  showFlightTab: boolean;
  showHomeOutboundCard: boolean;
  showHomeInboundCard: boolean;
}

export function readStoredTripStage(): TripStagePreview {
  try {
    const raw = localStorage.getItem(TRIP_STAGE_STORAGE_KEY);
    if (
      raw === 'auto' ||
      raw === 'pre-trip' ||
      raw === 'in-flight' ||
      raw === 'ski-days' ||
      raw === 'pre-return'
    ) {
      return raw;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'auto';
}

export function saveStoredTripStage(stage: TripStagePreview): void {
  try {
    if (stage === 'auto') {
      localStorage.removeItem(TRIP_STAGE_STORAGE_KEY);
    } else {
      localStorage.setItem(TRIP_STAGE_STORAGE_KEY, stage);
    }
  } catch {
    // Ignore storage write errors
  }
}

export function resolveTripTimeline(
  stage: TripStagePreview,
  realNowMs = Date.now(),
): TripTimelineState {
  const effectiveNowMs =
    stage === 'auto' ? realNowMs : PREVIEW_EPOCH_MAP[stage];

  const showFlightTab =
    effectiveNowMs < OUTBOUND_BOARDING_PLUS_1H_MS ||
    effectiveNowMs >= FLIGHT_TAB_RESTORE_MS;

  const showHomeOutboundCard = effectiveNowMs < OUTBOUND_LANDING_MS;
  const showHomeInboundCard = effectiveNowMs >= INBOUND_CARD_SHOW_MS;

  const opt =
    stage === 'auto'
      ? null
      : (TRIP_STAGE_OPTIONS.find((item) => item.id === stage) ?? null);

  return {
    effectiveNowMs,
    isPreviewActive: stage !== 'auto',
    previewLabel: opt?.label ?? null,
    showFlightTab,
    showHomeOutboundCard,
    showHomeInboundCard,
  };
}
