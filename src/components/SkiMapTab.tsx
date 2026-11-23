import React, {useState} from 'react';
import {FileImage, Image as ImageIcon, Layers, ZoomIn} from 'lucide-react';
import {RESORT_CONFIGS, type MapMode, type ResortKey} from '../types/trip';
import {ResortOverviewSvg} from './SkiMapSvgs';

interface SkiMapTabProps {
  cardMapModes: Record<ResortKey, MapMode>;
  onToggleMode: (resort: ResortKey, mode: MapMode) => void;
  onOpenViewer: (resort: ResortKey) => void;
}

const RESORT_TABS: Array<{
  key: ResortKey;
  tabLabel: string;
  metaLine: string;
  title: string;
  subtitle: string;
  alt: string;
  accentIconCls: string;
}> = [
  {
    key: 'madarao',
    tabLabel: '斑尾 × Tangram',
    metaLine: '主場雙山共通 · 海拔 1,381m 斑尾山',
    title: '斑尾高原スキー場 × タングラム斑尾',
    subtitle: 'Madarao Mountain Resort & Tangram Ski Circus',
    alt: '斑尾高原與 Tangram 官方雪道圖',
    accentIconCls: 'text-sky-700',
  },
  {
    key: 'romance',
    tabLabel: 'ロマンスの神様',
    metaLine: '高社山 1,351m · 40度非壓雪陡坡 · 350m 斜壁道',
    title: 'スノーリゾートロマンスの神様',
    subtitle: '舊木島平スキー場 · 距酒店約 30–35 分鐘',
    alt: 'スノーリゾートロマンスの神様官方雪道圖',
    accentIconCls: 'text-rose-700',
  },
  {
    key: 'nozawa',
    tabLabel: '野沢温泉',
    metaLine: '毛無山 1,650m · 垂直落差 1,085m · 3.5km 山脊紅線',
    title: '野沢温泉スキー場（Nozawa Onsen）',
    subtitle: '長野県下高井郡野沢温泉村豊郷 7653 · Tel: 0269-85-3166',
    alt: '野沢温泉スキー場 2026 官方雪道圖',
    accentIconCls: 'text-snow-800',
  },
];

export const SkiMapTab: React.FC<SkiMapTabProps> = ({
  cardMapModes,
  onToggleMode,
  onOpenViewer,
}) => {
  const [selectedResort, setSelectedResort] = useState<ResortKey>('madarao');
  const [failedWebps, setFailedWebps] = useState<
    Partial<Record<ResortKey, boolean>>
  >({});

  const activeInfo =
    RESORT_TABS.find((t) => t.key === selectedResort) ?? RESORT_TABS[0];
  const mode = cardMapModes[selectedResort];
  const config = RESORT_CONFIGS[selectedResort];

  const markFailed = (resort: ResortKey) => {
    setFailedWebps((prev) => ({...prev, [resort]: true}));
  };

  return (
    <section
      id="panel-skimap"
      role="tabpanel"
      aria-labelledby="tab-skimap"
      className="space-y-4"
    >
      {/* 頂部三雪場一鍵切換器（單屏聚焦，無需長捲動） */}
      <div
        role="tablist"
        aria-label="選擇雪場地圖"
        className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white/95 border border-slate-200/85 shadow-2xs"
      >
        {RESORT_TABS.map((tab) => {
          const active = selectedResort === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedResort(tab.key)}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer truncate ${
                active
                  ? 'bg-snow-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.tabLabel}
            </button>
          );
        })}
      </div>

      {/* 所選雪場專注檢視卡片 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 border border-slate-200/85 space-y-3.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-sky-800">
              {activeInfo.metaLine}
            </p>
            <h2 className="font-serif text-lg font-bold text-slate-900 mt-0.5 leading-snug">
              {activeInfo.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeInfo.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenViewer(selectedResort)}
            aria-label={`全螢幕放大檢視 ${activeInfo.title} 雪道圖`}
            className="min-h-[48px] shrink-0 bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold px-3.5 py-2 rounded-2xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
          >
            <ZoomIn className="w-4 h-4 text-sky-300 shrink-0" aria-hidden="true" />
            <span>全螢幕</span>
          </button>
        </div>

        {/* SVG / WebP 切換條 */}
        <div
          className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl"
          role="group"
          aria-label="切換雪道圖顯示模式"
        >
          <button
            type="button"
            onClick={() => onToggleMode(selectedResort, 'svg')}
            aria-pressed={mode === 'svg'}
            className={`min-h-[44px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'svg'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers
              className={`w-3.5 h-3.5 ${activeInfo.accentIconCls}`}
              aria-hidden="true"
            />
            <span>概覽圖 (SVG)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode(selectedResort, 'webp')}
            aria-pressed={mode === 'webp'}
            className={`min-h-[44px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'webp'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon
              className={`w-3.5 h-3.5 ${activeInfo.accentIconCls}`}
              aria-hidden="true"
            />
            <span>官方原圖 (WebP)</span>
          </button>
        </div>

        {/* 地圖檢視區（點擊進入純白無縫全螢幕縮放） */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenViewer(selectedResort)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenViewer(selectedResort);
            }
          }}
          aria-label={`點擊全螢幕檢視 ${activeInfo.title}`}
          className="cursor-zoom-in bg-[#F7F8FA] rounded-2xl p-2.5 border border-slate-200/80 relative"
        >
          {mode === 'svg' ? (
            <ResortOverviewSvg resort={selectedResort} />
          ) : failedWebps[selectedResort] ? (
            <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
              <FileImage
                className="w-7 h-7 text-slate-500 mx-auto"
                aria-hidden="true"
              />
              <p className="text-xs font-bold text-slate-800">
                尚未偵測到官方原圖（maps/{config.filename}）
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMode(selectedResort, 'svg');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold cursor-pointer"
              >
                切回概覽圖 (SVG)
              </button>
            </div>
          ) : (
            <img
              src={config.webpSrc}
              alt={activeInfo.alt}
              loading="lazy"
              decoding="async"
              onError={() => markFailed(selectedResort)}
              className="w-full h-auto rounded-xl object-contain"
            />
          )}
        </div>

        {/* 精簡中高級雪道重點 */}
        {selectedResort === 'madarao' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-3">
              <div className="font-bold text-sky-950">樹林與天然半管</div>
              <p className="text-sky-900/90 text-[11px] mt-0.5 leading-relaxed">
                SAWA I–III 天然地形半管、NINJA、Powder Wave 2、Powder Theater 及 Adventure Aisle。
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
              <div className="font-bold text-slate-900">高速 Carving 與連通</div>
              <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">
                8 號 Carving、9 號 Giant、14 號 Powder Line 及 Tangram 側寬闊中上級高速坡。
              </p>
            </div>
          </div>
        )}

        {selectedResort === 'romance' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700 leading-relaxed">
            <strong className="text-slate-900">中高級亮點：</strong>
            搭「パイオニアリフト」直上 1,351m 山頂，挑戰全非壓雪{' '}
            <strong>パイオニアコース</strong>、上級黑線{' '}
            <strong>ウエッスンコース</strong> 及 40 度斜坡 <strong>R40</strong>
            ；中段シルクコース設 <strong>350m Banked Slalom 斜壁道</strong>。
          </div>
        )}

        {selectedResort === 'nozawa' && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-700 space-y-1 leading-relaxed">
            <p>
              <strong className="text-slate-900">中高級建議：</strong>
              泊車於<strong>長坂中心</strong>，搭長坂箱纜直上 1,417m 主攻{' '}
              <strong>YAMABIKO（山彥 A–E 樹林）</strong>，接{' '}
              <strong>3,500m SKYLINE</strong> 山脊長道，或挑戰 Challenge 39 度壁與 Kandahar 黑線。
            </p>
            <p className="text-[11px] text-slate-500">
              救護巡邏：0269-85-3456 · 日影中心：0269-85-2133
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
