import React, {useEffect} from 'react';
import {
  Bed,
  BookOpen,
  CalendarClock,
  ChevronRight,
  CloudSnow,
  Compass,
  MountainSnow,
  PlaneTakeoff,
  Smartphone,
  X,
} from 'lucide-react';
import {TRIP_STAGE_OPTIONS} from '../lib/tripTimeline';
import type {TripStagePreview} from '../types/trip';

interface GuideModalProps {
  isOpen: boolean;
  isInstalled: boolean;
  showFlightTab: boolean;
  tripStage: TripStagePreview;
  onSelectTripStage: (stage: TripStagePreview) => void;
  onOpenFlightBackup: () => void;
  onOpenInstall: () => void;
  onClose: () => void;
}

const GUIDE_STEPS: Array<{
  title: string;
  desc: string;
  icon: React.ReactNode;
  badgeClass: string;
}> = [
  {
    title: '1. 加到手機主畫面（山頂無訊號必備）',
    desc: '出發前按右上角「加到主畫面」安裝成獨立 App，並開一次地圖同氣象頁，上到雪山無訊號都照常開到。',
    icon: <Smartphone className="w-4 h-4" aria-hidden="true" />,
    badgeClass: 'bg-sky-100 text-sky-900',
  },
  {
    title: '2. 記低自己分車 & 置頂房號',
    desc: '喺「去程」揀你坐 Car A / B / C；喺「酒店」撳粒星 ★ 置頂自己間房，首頁會同步顯示唔使次次搵。',
    icon: <Bed className="w-4 h-4" aria-hidden="true" />,
    badgeClass: 'bg-indigo-100 text-indigo-900',
  },
  {
    title: '3. 一鍵 Google Maps 導航 & 複製電話',
    desc: '撳任何「導航」按鈕會直接由你而家嘅位置開始帶路；撳酒店或租車電話會自動複製，方便貼入車機 GPS。',
    icon: <Compass className="w-4 h-4" aria-hidden="true" />,
    badgeClass: 'bg-emerald-100 text-emerald-900',
  },
  {
    title: '4. 雪道圖切換官方原圖 & 雙指縮放',
    desc: '喺「雪圖」揀雪場並隨時切換「概覽圖」與「官方原圖」，撳放大即可雙指縮放（高達 450%）睇清雪道名稱。',
    icon: <MountainSnow className="w-4 h-4" aria-hidden="true" />,
    badgeClass: 'bg-blue-100 text-blue-900',
  },
  {
    title: '5. 四大雪場氣象自動離線快取',
    desc: '每日出門前去「氣象」撳一次「全部更新」，App 會一次過快取斑尾、Tangram、ロマンスの神様及野沢温泉的積雪、降雪量與降雪概率。',
    icon: <CloudSnow className="w-4 h-4" aria-hidden="true" />,
    badgeClass: 'bg-amber-100 text-amber-950',
  },
];

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  isInstalled,
  showFlightTab,
  tripStage,
  onSelectTripStage,
  onOpenFlightBackup,
  onOpenInstall,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="guide-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden">
        {/* 頂部標題列 */}
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-snow-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5 text-sky-200" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3
                id="guide-modal-title"
                className="font-serif text-lg font-bold text-slate-900 truncate"
              >
                手冊使用說明
              </h3>
              <p className="text-xs text-slate-600">
                30 秒上手・14 人團雪山離線攻略
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉使用說明視窗"
            className="min-h-[48px] min-w-[48px] shrink-0 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* 內容（可捲動） */}
        <div className="px-5 py-4 overflow-y-auto space-y-3">
          {/* 航班資訊備查入口（滑雪期間隱藏底部航班頁時仍可隨時翻查） */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFlightBackup();
            }}
            aria-label="查看航班資訊備查"
            className="w-full min-h-[56px] p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 flex items-center justify-between gap-3 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0">
                <PlaneTakeoff className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-snow-900">
                  航班資訊備查（GK28 / GK27）
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  {showFlightTab
                    ? '查看訂位代號、315kg 行李配額與 Visit Japan Web'
                    : '底部航班分頁目前自動隱藏，按此仍可隨時翻查'}
                </p>
              </div>
            </div>
            <ChevronRight
              className="w-4 h-4 text-sky-700 shrink-0"
              aria-hidden="true"
            />
          </button>

          {/* 步驟指引 */}
          <div className="space-y-2">
            {GUIDE_STEPS.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-3 bg-slate-50/90 border border-slate-200/75 rounded-2xl p-3"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${step.badgeClass}`}
                >
                  {step.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 行程階段預覽（方便即時測試航班自動隱藏／重現與首頁航班卡規則） */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <CalendarClock
                className="w-4 h-4 text-sky-700 shrink-0"
                aria-hidden="true"
              />
              <span>行程階段預覽（測試航班自動切換）</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              去程起飛 1 小時後（2/14 02:10 HKT）自動隱藏底部航班分頁，至 2/19 自動恢復；首頁去程卡於落地前顯示，回程卡於 2/19 18:00 後出現。
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {TRIP_STAGE_OPTIONS.map((opt) => {
                const active = tripStage === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelectTripStage(opt.id)}
                    aria-pressed={active}
                    className={`w-full min-h-[42px] px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      active
                        ? 'bg-snow-900 text-white border-snow-900 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-sky-50'
                    }`}
                  >
                    <span className="text-xs font-bold whitespace-nowrap">
                      {opt.label}
                    </span>
                    <span
                      className={`text-[10px] text-right leading-tight ${
                        active ? 'text-sky-200' : 'text-slate-500'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部操作按鈕 */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white flex gap-2 shrink-0">
          {!isInstalled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenInstall();
              }}
              aria-label="查看加到主畫面教學"
              className="min-h-[48px] flex-1 bg-sky-50 hover:bg-sky-100 text-snow-900 border border-sky-200 text-xs font-bold py-3 px-3 rounded-2xl inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>安裝教學</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="明白並開始使用手冊"
            className="min-h-[48px] flex-1 bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold py-3 px-4 rounded-2xl transition cursor-pointer shadow-sm"
          >
            明白，開始使用
          </button>
        </div>
      </div>
    </div>
  );
};
