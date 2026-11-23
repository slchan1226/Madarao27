import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import {RESORT_CONFIGS, type MapMode, type ResortKey} from '../types/trip';
import {ResortOverviewSvg} from './SkiMapSvgs';

interface MapLightboxProps {
  resort: ResortKey | null;
  mode: MapMode;
  onSelectResort?: (resort: ResortKey) => void;
  onToggleMode: () => void;
  onFallbackToSvg: () => void;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4.5;

const RESORT_TABS: Array<{key: ResortKey; label: string}> = [
  {key: 'madarao', label: '斑尾×Tangram'},
  {key: 'romance', label: 'ロマンスの神様'},
  {key: 'nozawa', label: '野沢温泉'},
];

function clampOffset(
  x: number,
  y: number,
  nextScale: number,
  viewport: HTMLDivElement | null,
): {x: number; y: number} {
  if (nextScale <= 1 || !viewport) {
    return {x: 0, y: 0};
  }
  const maxX = Math.max(120, (viewport.clientWidth * (nextScale - 1)) / 2 + 120);
  const maxY = Math.max(120, (viewport.clientHeight * (nextScale - 1)) / 2 + 120);
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

export const MapLightbox: React.FC<MapLightboxProps> = ({
  resort,
  mode,
  onSelectResort,
  onToggleMode,
  onFallbackToSvg,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [smooth, setSmooth] = useState(true);
  const [hudVisible, setHudVisible] = useState(true);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef({scale: 1, x: 0, y: 0});
  const tapTimerRef = useRef<number | null>(null);
  const gestureRef = useRef({
    isDragging: false,
    isMouseDragging: false,
    moved: false,
    downX: 0,
    downY: 0,
    startX: 0,
    startY: 0,
    initialDistance: 0,
    initialScale: 1,
    pinchMidX: 0,
    pinchMidY: 0,
    initialX: 0,
    initialY: 0,
    lastTap: 0,
    didPinch: false,
  });

  const syncTransform = useCallback(
    (nextScale: number, nextX: number, nextY: number, isSmooth: boolean) => {
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      const clamped = clampOffset(
        nextX,
        nextY,
        clampedScale,
        viewportRef.current,
      );
      transformRef.current = {
        scale: clampedScale,
        x: clamped.x,
        y: clamped.y,
      };
      setSmooth(isSmooth);
      setScale(clampedScale);
      setOffset(clamped);
    },
    [],
  );

  const resetZoom = useCallback(() => {
    syncTransform(1, 0, 0, true);
  }, [syncTransform]);

  // Zoom anchored to a specific screen point (clientX, clientY), or viewport center if omitted
  const zoomToPoint = useCallback(
    (
      targetScale: number,
      clientX?: number,
      clientY?: number,
      isSmooth = true,
    ) => {
      const clampedScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale));
      if (clampedScale <= MIN_SCALE) {
        syncTransform(1, 0, 0, isSmooth);
        return;
      }

      const viewport = viewportRef.current;
      if (!viewport || clientX === undefined || clientY === undefined) {
        const ratio = clampedScale / transformRef.current.scale;
        syncTransform(
          clampedScale,
          transformRef.current.x * ratio,
          transformRef.current.y * ratio,
          isSmooth,
        );
        return;
      }

      const rect = viewport.getBoundingClientRect();
      const dx = clientX - (rect.left + rect.width / 2);
      const dy = clientY - (rect.top + rect.height / 2);
      const ratio = clampedScale / transformRef.current.scale;
      const nextX = dx - (dx - transformRef.current.x) * ratio;
      const nextY = dy - (dy - transformRef.current.y) * ratio;
      syncTransform(clampedScale, nextX, nextY, isSmooth);
    },
    [syncTransform],
  );

  const zoomBy = useCallback(
    (delta: number, clientX?: number, clientY?: number) => {
      const next = +(transformRef.current.scale + delta).toFixed(2);
      zoomToPoint(next, clientX, clientY, true);
    },
    [zoomToPoint],
  );

  // Reset zoom and reveal HUD whenever resort or mode changes
  useEffect(() => {
    if (resort) {
      resetZoom();
      setHudVisible(true);
    }
  }, [resort, mode, resetZoom]);

  // Clear pending single-tap timer on unmount
  useEffect(() => {
    return () => {
      if (tapTimerRef.current !== null) {
        window.clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  // Lock background scroll & bind keyboard shortcuts while open
  useEffect(() => {
    if (!resort) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomBy(0.5);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        zoomBy(-0.5);
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resort, onClose, zoomBy, resetZoom]);

  // Non-passive touch listeners for silky pinch-to-zoom (anchored to finger midpoint), pan, double-tap zoom-to-point, and single-tap HUD toggle
  useEffect(() => {
    if (!resort) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        gestureRef.current.isDragging = false;
        gestureRef.current.didPinch = true;
        gestureRef.current.initialDistance = getDistance(
          e.touches[0],
          e.touches[1],
        );
        gestureRef.current.initialScale = transformRef.current.scale;
        gestureRef.current.initialX = transformRef.current.x;
        gestureRef.current.initialY = transformRef.current.y;
        const rect = viewport.getBoundingClientRect();
        gestureRef.current.pinchMidX =
          (e.touches[0].clientX + e.touches[1].clientX) / 2 -
          (rect.left + rect.width / 2);
        gestureRef.current.pinchMidY =
          (e.touches[0].clientY + e.touches[1].clientY) / 2 -
          (rect.top + rect.height / 2);
      } else if (e.touches.length === 1) {
        gestureRef.current.didPinch = false;
        gestureRef.current.moved = false;
        gestureRef.current.downX = e.touches[0].clientX;
        gestureRef.current.downY = e.touches[0].clientY;
        if (transformRef.current.scale > 1) {
          gestureRef.current.isDragging = true;
          gestureRef.current.startX =
            e.touches[0].clientX - transformRef.current.x;
          gestureRef.current.startY =
            e.touches[0].clientY - transformRef.current.y;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        const ratio = currentDist / (gestureRef.current.initialDistance || 1);
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, gestureRef.current.initialScale * ratio),
        );
        if (nextScale <= MIN_SCALE) {
          syncTransform(1, 0, 0, false);
        } else {
          const actualRatio = nextScale / gestureRef.current.initialScale;
          const dx = gestureRef.current.pinchMidX;
          const dy = gestureRef.current.pinchMidY;
          const nextX = dx - (dx - gestureRef.current.initialX) * actualRatio;
          const nextY = dy - (dy - gestureRef.current.initialY) * actualRatio;
          syncTransform(nextScale, nextX, nextY, false);
        }
      } else if (e.touches.length === 1) {
        const dist = Math.hypot(
          e.touches[0].clientX - gestureRef.current.downX,
          e.touches[0].clientY - gestureRef.current.downY,
        );
        if (dist > 6) {
          gestureRef.current.moved = true;
        }
        if (gestureRef.current.isDragging && transformRef.current.scale > 1) {
          e.preventDefault();
          const nextX = e.touches[0].clientX - gestureRef.current.startX;
          const nextY = e.touches[0].clientY - gestureRef.current.startY;
          syncTransform(transformRef.current.scale, nextX, nextY, false);
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      gestureRef.current.isDragging = false;
      if (e.touches.length > 0) return;

      if (gestureRef.current.didPinch || gestureRef.current.moved) {
        return;
      }

      const touch = e.changedTouches[0];
      const now = Date.now();
      if (now - gestureRef.current.lastTap < 270) {
        if (tapTimerRef.current !== null) {
          window.clearTimeout(tapTimerRef.current);
          tapTimerRef.current = null;
        }
        gestureRef.current.lastTap = 0;
        if (transformRef.current.scale > 1.05) {
          resetZoom();
        } else {
          zoomToPoint(2.3, touch?.clientX, touch?.clientY, true);
        }
      } else {
        gestureRef.current.lastTap = now;
        tapTimerRef.current = window.setTimeout(() => {
          setHudVisible((prev) => !prev);
          tapTimerRef.current = null;
        }, 270);
      }
    };

    viewport.addEventListener('touchstart', onTouchStart, {passive: true});
    viewport.addEventListener('touchmove', onTouchMove, {passive: false});
    viewport.addEventListener('touchend', onTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
    };
  }, [resort, syncTransform, resetZoom, zoomToPoint]);

  if (!resort) return null;

  const config = RESORT_CONFIGS[resort];
  const isZoomed = scale > 1.01;
  const isMaxZoom = scale >= MAX_SCALE - 0.01;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    zoomBy(delta, e.clientX, e.clientY);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    gestureRef.current.moved = false;
    gestureRef.current.downX = e.clientX;
    gestureRef.current.downY = e.clientY;
    if (transformRef.current.scale <= 1) return;
    gestureRef.current.isMouseDragging = true;
    gestureRef.current.startX = e.clientX - transformRef.current.x;
    gestureRef.current.startY = e.clientY - transformRef.current.y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      Math.hypot(
        e.clientX - gestureRef.current.downX,
        e.clientY - gestureRef.current.downY,
      ) > 5
    ) {
      gestureRef.current.moved = true;
    }
    if (!gestureRef.current.isMouseDragging || transformRef.current.scale <= 1) {
      return;
    }
    syncTransform(
      transformRef.current.scale,
      e.clientX - gestureRef.current.startX,
      e.clientY - gestureRef.current.startY,
      false,
    );
  };

  const handleMouseUp = () => {
    gestureRef.current.isMouseDragging = false;
  };

  const handleViewportClick = () => {
    if (gestureRef.current.moved) return;
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
    }
    tapTimerRef.current = window.setTimeout(() => {
      setHudVisible((prev) => !prev);
      tapTimerRef.current = null;
    }, 240);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (tapTimerRef.current !== null) {
      window.clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    if (transformRef.current.scale > 1.05) {
      resetZoom();
    } else {
      zoomToPoint(2.3, e.clientX, e.clientY, true);
    }
  };

  return (
    <div
      id="map-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-lightbox-title"
      className="fixed inset-0 z-50 bg-[#F7F8FA] text-slate-900 flex flex-col select-none"
    >
      {/* 無障礙標題供讀屏器使用 */}
      <h2 id="map-lightbox-title" className="sr-only">
        {config.title}
      </h2>

      {/* 純白無縫全螢幕地圖畫布（單點即可自動收起／顯示全部按鈕） */}
      <div
        ref={viewportRef}
        id="map-lightbox-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleViewportClick}
        onDoubleClick={handleDoubleClick}
        className={`relative flex-1 w-full h-full overflow-hidden touch-none flex items-center justify-center ${
          isZoomed ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
      >
        <div
          id="map-lightbox-body"
          className="origin-center flex items-center justify-center p-2 sm:p-6"
          style={{
            transition: smooth
              ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          }}
        >
          {mode === 'webp' ? (
            <img
              src={config.webpSrc}
              alt={config.title}
              draggable={false}
              onError={onFallbackToSvg}
              className="max-w-[96vw] max-h-[86vh] object-contain rounded-lg bg-white ring-1 ring-slate-900/[0.06] shadow-[0_12px_36px_rgba(15,23,42,0.06)]"
            />
          ) : (
            <ResortOverviewSvg
              resort={resort}
              className="w-[95vw] max-w-3xl h-auto bg-white rounded-lg p-2 sm:p-4 ring-1 ring-slate-900/[0.06] shadow-[0_12px_36px_rgba(15,23,42,0.06)] select-none"
            />
          )}
        </div>
      </div>

      {/* 頂部日系極簡編輯列：左上「返回」＋ 無底框純文字底線切換雪場 */}
      <header
        className={`fixed top-0 inset-x-0 z-20 bg-[#F7F8FA]/88 backdrop-blur-xl border-b border-slate-900/[0.07] pt-[env(safe-area-inset-top)] transition-all duration-200 ease-out ${
          hudVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-full pointer-events-none'
        }`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-13 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="返回雪場地圖列表"
            className="min-h-[44px] -ml-1.5 px-2 text-slate-800 hover:text-slate-950 active:opacity-60 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span>返回</span>
          </button>

          {onSelectResort ? (
            <nav
              role="tablist"
              aria-label="切換雪場地圖"
              className="flex items-center gap-4 sm:gap-7 overflow-x-auto no-scrollbar h-full"
            >
              {RESORT_TABS.map((tab) => {
                const active = tab.key === resort;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onSelectResort(tab.key)}
                    className={`relative h-full min-h-[44px] inline-flex items-center text-xs sm:text-[13px] tracking-tight whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-700 font-normal'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {active && (
                      <span
                        className="absolute bottom-0 inset-x-0 h-[1.5px] bg-slate-950"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          ) : (
            <span className="text-xs sm:text-sm font-serif font-semibold text-slate-900 truncate">
              {config.title}
            </span>
          )}
        </div>
      </header>

      {/* 左下角極靜謐比例讀數（僅放大時淡淡出現，無底框） */}
      <div
        className={`pointer-events-none fixed left-4 sm:left-6 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20 transition-opacity duration-200 ${
          hudVisible && isZoomed ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span
          id="zoom-level-label"
          className="font-mono text-[11px] font-medium text-slate-500 tabular-nums tracking-tight"
        >
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* 右下角日系精巧毛玻璃微調群組（絕不佔底部闊度，純白 1px 灰線＋純墨黑幼線圖示） */}
      <div
        className={`fixed right-3.5 sm:right-6 bottom-[max(1.15rem,env(safe-area-inset-bottom))] z-20 flex flex-col items-end gap-2 transition-all duration-200 ease-out ${
          hudVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {/* 放大後才浮現嘅極簡重設 1× 鍵 */}
        {isZoomed && (
          <button
            type="button"
            onClick={resetZoom}
            aria-label="重設地圖縮放比例為 100%"
            className="min-h-[40px] px-3 rounded-xl bg-white/90 hover:bg-white active:scale-95 text-slate-800 border border-slate-900/[0.1] backdrop-blur-xl shadow-[0_4px_16px_rgba(15,23,42,0.07)] text-[11px] font-semibold tabular-nums inline-flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} aria-hidden="true" />
            <span>重設</span>
          </button>
        )}

        {/* 緊湊直排縮放微調方塊 */}
        <div className="flex flex-col rounded-xl bg-white/90 backdrop-blur-xl border border-slate-900/[0.1] shadow-[0_4px_16px_rgba(15,23,42,0.07)] divide-y divide-slate-900/[0.08] overflow-hidden">
          <button
            type="button"
            onClick={() => zoomBy(0.5)}
            disabled={isMaxZoom}
            aria-label="放大地圖"
            className="w-11 h-11 flex items-center justify-center text-slate-800 hover:bg-slate-900/[0.04] active:bg-slate-900/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.5)}
            disabled={!isZoomed}
            aria-label="縮小地圖"
            className="w-11 h-11 flex items-center justify-center text-slate-800 hover:bg-slate-900/[0.04] active:bg-slate-900/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer"
          >
            <Minus className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* 切換原圖／概覽 單一純白毛玻璃方塊 */}
        <button
          type="button"
          id="lightbox-toggle-btn"
          onClick={onToggleMode}
          aria-label={mode === 'svg' ? '切換至官方 WebP 原圖' : '切換至向量 SVG 概覽'}
          className="min-h-[44px] px-3.5 rounded-xl bg-white/90 hover:bg-white active:scale-95 text-slate-900 border border-slate-900/[0.1] backdrop-blur-xl shadow-[0_4px_16px_rgba(15,23,42,0.07)] text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer"
        >
          {mode === 'svg' ? (
            <>
              <ImageIcon className="w-3.5 h-3.5 text-slate-700 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>原圖</span>
            </>
          ) : (
            <>
              <Layers className="w-3.5 h-3.5 text-slate-700 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>概覽</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
