import React, {useState} from 'react';
import {FileImage, Image as ImageIcon, Layers, ZoomIn} from 'lucide-react';
import {RESORT_CONFIGS, type MapMode, type ResortKey} from '../types/trip';
import {ResortOverviewSvg} from './SkiMapSvgs';

interface SkiMapTabProps {
  cardMapModes: Record<ResortKey, MapMode>;
  onToggleMode: (resort: ResortKey, mode: MapMode) => void;
  onOpenViewer: (resort: ResortKey) => void;
}

export const SkiMapTab: React.FC<SkiMapTabProps> = ({
  cardMapModes,
  onToggleMode,
  onOpenViewer,
}) => {
  const [failedWebps, setFailedWebps] = useState<
    Partial<Record<ResortKey, boolean>>
  >({});

  const markFailed = (resort: ResortKey) => {
    setFailedWebps((prev) => ({...prev, [resort]: true}));
  };

  const renderMapBody = (resort: ResortKey, alt: string) => {
    const mode = cardMapModes[resort];
    const config = RESORT_CONFIGS[resort];

    if (mode === 'svg') {
      return <ResortOverviewSvg resort={resort} />;
    }

    if (failedWebps[resort]) {
      return (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
          <FileImage
            className="w-7 h-7 text-slate-500 mx-auto"
            aria-hidden="true"
          />
          <p className="text-xs font-bold text-slate-800">
            尚未偵測到官方原圖（maps/{config.filename}）
          </p>
          <p className="text-[11px] text-slate-600">
            請確認部署資料夾的 <code>maps/{config.filename}</code>{' '}
            檔案，或先點擊「概覽圖 (SVG)」檢視。
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMode(resort, 'svg');
            }}
            className="min-h-[48px] mt-1 px-4 py-2 rounded-xl bg-sky-700 text-white text-xs font-bold cursor-pointer"
          >
            切回概覽圖 (SVG)
          </button>
        </div>
      );
    }

    return (
      <img
        src={config.webpSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => markFailed(resort)}
        className="w-full h-auto rounded-xl object-contain"
      />
    );
  };

  return (
    <section
      id="panel-skimap"
      role="tabpanel"
      aria-labelledby="tab-skimap"
      className="space-y-5"
    >
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 space-y-2.5">
        <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
          INTERMEDIATE &amp; ADVANCED · 中上級ゲレンデガイド
        </span>
        <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
          四大雪場雪道圖與中高級路線攻略
        </h2>
        <p className="text-xs text-slate-700 leading-relaxed">
          每張地圖均支援<strong>「概覽 SVG（離線極速）」</strong>與
          <strong>「官方原圖 WebP（細節放大）」</strong>
          雙模式自由切換，點擊地圖即可全螢幕雙指縮放。
        </p>
      </div>

      {/* 1 & 2. Madarao & Tangram 雙山共通雪道圖 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold bg-sky-700 text-white px-2.5 py-0.5 rounded-full">
                主場雙山共通
              </span>
              <span className="text-[11px] font-bold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full">
                海拔 1,381m 斑尾山
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              斑尾高原スキー場 × タングラム斑尾
            </h3>
            <p className="text-xs text-slate-600">
              Madarao Mountain Resort &amp; Tangram Ski Circus
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenViewer('madarao')}
            aria-label="全螢幕放大檢視斑尾高原與 Tangram 雪道圖"
            className="min-h-[48px] min-w-[48px] shrink-0 bg-sky-100 hover:bg-sky-200 text-sky-950 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>全螢幕</span>
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl"
          role="group"
          aria-label="切換斑尾地圖顯示模式"
        >
          <button
            type="button"
            onClick={() => onToggleMode('madarao', 'svg')}
            aria-label="切換至斑尾概覽 SVG 圖"
            aria-pressed={cardMapModes.madarao === 'svg'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.madarao === 'svg'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>概覽圖 (SVG)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('madarao', 'webp')}
            aria-label="切換至斑尾官方原圖 WebP"
            aria-pressed={cardMapModes.madarao === 'webp'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.madarao === 'webp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
            <span>官方原圖 (WebP)</span>
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenViewer('madarao')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenViewer('madarao');
            }
          }}
          aria-label="點擊全螢幕檢視斑尾高原與 Tangram 雪道圖"
          className="cursor-zoom-in bg-gradient-to-b from-sky-100/70 via-white to-slate-50 rounded-2xl p-2.5 border border-sky-100 shadow-inner relative"
        >
          {renderMapBody('madarao', '斑尾高原與 Tangram 官方雪道圖')}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5">
            <span className="font-bold text-sky-950 block">🌲 樹林與天然半管</span>
            <span className="text-sky-900 text-[11px]">
              SAWA I–III 天然地形半管、NINJA、Powder Wave 2、Powder Theater 及
              Adventure Aisle。
            </span>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-2.5">
            <span className="font-bold text-purple-950 block">
              ⚡ 高速 Carving 與公園
            </span>
            <span className="text-purple-900 text-[11px]">
              8 號 Carving、9 號 Giant、14 號 Powder Line 及 Tangram
              側寬闊中上級高速坡。
            </span>
          </div>
        </div>
      </div>

      {/* 3. スノーリゾートロマンスの神様 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold bg-rose-700 text-white px-2.5 py-0.5 rounded-full">
                高社山 1,351m
              </span>
              <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                40度非壓雪陡坡 · 350m 斜壁道
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              スノーリゾートロマンスの神様
            </h3>
            <p className="text-xs text-slate-600">
              Snow Resort Romance no Kamisama（舊木島平スキー場）
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenViewer('romance')}
            aria-label="全螢幕放大檢視スノーリゾートロマンスの神様雪道圖"
            className="min-h-[48px] min-w-[48px] shrink-0 bg-rose-100 hover:bg-rose-200 text-rose-950 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>全螢幕</span>
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl"
          role="group"
          aria-label="切換ロマンスの神様地圖顯示模式"
        >
          <button
            type="button"
            onClick={() => onToggleMode('romance', 'svg')}
            aria-label="切換至ロマンスの神様概覽 SVG 圖"
            aria-pressed={cardMapModes.romance === 'svg'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.romance === 'svg'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-700" aria-hidden="true" />
            <span>概覽圖 (SVG)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('romance', 'webp')}
            aria-label="切換至ロマンスの神様官方原圖 WebP"
            aria-pressed={cardMapModes.romance === 'webp'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.romance === 'webp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <ImageIcon
              className="w-3.5 h-3.5 text-rose-700"
              aria-hidden="true"
            />
            <span>官方原圖 (WebP)</span>
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenViewer('romance')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenViewer('romance');
            }
          }}
          aria-label="點擊全螢幕檢視スノーリゾートロマンスの神様雪道圖"
          className="cursor-zoom-in bg-gradient-to-b from-sky-100/70 via-white to-slate-50 rounded-2xl p-2.5 border border-sky-100 shadow-inner"
        >
          {renderMapBody('romance', 'スノーリゾートロマンスの神様官方雪道圖')}
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900">中高級亮點：</strong>
          乘搭「パイオニアリフト」直上 1,351m
          山頂，可挑戰全非壓雪粉雪區<strong>パイオニアコース</strong>
          、新開放上級黑線<strong>ウエッスンコース</strong>
          ，以及最大斜度達 40 度嘅 <strong>R40</strong>；中段「シルクコース」設有{' '}
          <strong>350m Banked Slalom（斜壁回轉道）</strong>
          ，極啱單板玩家練轉向同地形玩法。
        </p>
      </div>

      {/* 4. 野沢温泉スキー場 */}
      <div className="glass-card rounded-3xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold bg-snow-900 text-white px-2.5 py-0.5 rounded-full">
                毛無山 1,650m
              </span>
              <span className="text-[11px] font-bold bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-full">
                垂直落差 1,085m · 3.5km 山脊紅線
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              野沢温泉スキー場（Nozawa Onsen）
            </h3>
            <p className="text-xs text-slate-600">
              長野県下高井郡野沢温泉村豊郷 7653｜Tel: 0269-85-3166
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenViewer('nozawa')}
            aria-label="全螢幕放大檢視野沢温泉スキー場雪道圖"
            className="min-h-[48px] min-w-[48px] shrink-0 bg-slate-200 hover:bg-slate-300 text-slate-950 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>全螢幕</span>
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl"
          role="group"
          aria-label="切換野澤溫泉地圖顯示模式"
        >
          <button
            type="button"
            onClick={() => onToggleMode('nozawa', 'svg')}
            aria-label="切換至野澤溫泉概覽 SVG 圖"
            aria-pressed={cardMapModes.nozawa === 'svg'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.nozawa === 'svg'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-snow-800" aria-hidden="true" />
            <span>概覽圖 (SVG)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMode('nozawa', 'webp')}
            aria-label="切換至野澤溫泉官方原圖 WebP"
            aria-pressed={cardMapModes.nozawa === 'webp'}
            className={`min-h-[48px] rounded-xl text-xs font-bold transition inline-flex items-center justify-center gap-1.5 cursor-pointer ${
              cardMapModes.nozawa === 'webp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <ImageIcon
              className="w-3.5 h-3.5 text-snow-800"
              aria-hidden="true"
            />
            <span>官方原圖 (WebP)</span>
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenViewer('nozawa')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenViewer('nozawa');
            }
          }}
          aria-label="點擊全螢幕檢視野沢温泉スキー場雪道圖"
          className="cursor-zoom-in bg-gradient-to-b from-sky-100/70 via-white to-slate-50 rounded-2xl p-2.5 border border-sky-100 shadow-inner"
        >
          {renderMapBody('nozawa', '野沢温泉スキー場 2026 官方雪道圖')}
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-700 space-y-1">
          <p>
            <strong className="text-slate-900">中高級路線建議：</strong>
            泊車於<strong>長坂中心（Nagasaka Center House）</strong>
            ，搭長坂箱纜直上 1,417m 主攻{' '}
            <strong>YAMABIKO（山彥 A–E 非壓雪與樹林）</strong>，之後沿{' '}
            <strong>3,500m SKYLINE</strong> 山脊高速衝落山腳，或挑戰{' '}
            <strong>Challenge 39度壁</strong>、<strong>Schneider</strong> 及{' '}
            <strong>Kandahar</strong> 黑線！
          </p>
          <p className="text-[11px] font-medium text-slate-600">
            救護巡邏（Patrol）：0269-85-3456 ｜ 日影中心：0269-85-2133
          </p>
        </div>
      </div>
    </section>
  );
};
