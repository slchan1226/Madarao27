import React, {useCallback, useEffect, useRef, useState} from 'react';
import {X, ZoomIn, ZoomOut} from 'lucide-react';
import {RESORT_CONFIGS, type MapMode, type ResortKey} from '../types/trip';
import {ResortOverviewSvg} from './SkiMapSvgs';

interface MapLightboxProps {
  resort: ResortKey | null;
  mode: MapMode;
  onToggleMode: () => void;
  onFallbackToSvg: () => void;
  onClose: () => void;
}

export const MapLightbox: React.FC<MapLightboxProps> = ({
  resort,
  mode,
  onToggleMode,
  onFallbackToSvg,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({x: 0, y: 0});
  const [smooth, setSmooth] = useState(true);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const transformRef = useRef({scale: 1, x: 0, y: 0});
  const gestureRef = useRef({
    isDragging: false,
    isMouseDragging: false,
    startX: 0,
    startY: 0,
    initialDistance: 0,
    initialScale: 1,
    lastTap: 0,
  });

  const syncTransform = useCallback(
    (nextScale: number, nextX: number, nextY: number, isSmooth: boolean) => {
      transformRef.current = {scale: nextScale, x: nextX, y: nextY};
      setSmooth(isSmooth);
      setScale(nextScale);
      setOffset({x: nextX, y: nextY});
    },
    [],
  );

  const resetZoom = useCallback(() => {
    syncTransform(1, 0, 0, true);
  }, [syncTransform]);

  const zoomBy = useCallback(
    (delta: number) => {
      const next = Math.min(
        4.5,
        Math.max(1, +(transformRef.current.scale + delta).toFixed(2)),
      );
      if (next === 1) {
        syncTransform(1, 0, 0, true);
      } else {
        syncTransform(next, transformRef.current.x, transformRef.current.y, true);
      }
    },
    [syncTransform],
  );

  // Reset zoom whenever resort or display mode changes
  useEffect(() => {
    if (resort) {
      resetZoom();
    }
  }, [resort, mode, resetZoom]);

  // Lock background scroll & bind Escape key while open
  useEffect(() => {
    if (!resort) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resort, onClose]);

  // Bind non-passive touch listeners for silky mobile pinch-to-zoom & pan
  useEffect(() => {
    if (!resort) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        gestureRef.current.isDragging = false;
        gestureRef.current.initialDistance = getDistance(
          e.touches[0],
          e.touches[1],
        );
        gestureRef.current.initialScale = transformRef.current.scale;
      } else if (e.touches.length === 1 && transformRef.current.scale > 1) {
        gestureRef.current.isDragging = true;
        gestureRef.current.startX = e.touches[0].clientX - transformRef.current.x;
        gestureRef.current.startY = e.touches[0].clientY - transformRef.current.y;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const currentDist = getDistance(e.touches[0], e.touches[1]);
        const ratio = currentDist / (gestureRef.current.initialDistance || 1);
        const nextScale = Math.min(
          4.5,
          Math.max(1, gestureRef.current.initialScale * ratio),
        );
        if (nextScale === 1) {
          syncTransform(1, 0, 0, false);
        } else {
          syncTransform(
            nextScale,
            transformRef.current.x,
            transformRef.current.y,
            false,
          );
        }
      } else if (
        e.touches.length === 1 &&
        gestureRef.current.isDragging &&
        transformRef.current.scale > 1
      ) {
        e.preventDefault();
        const nextX = e.touches[0].clientX - gestureRef.current.startX;
        const nextY = e.touches[0].clientY - gestureRef.current.startY;
        syncTransform(transformRef.current.scale, nextX, nextY, false);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      gestureRef.current.isDragging = false;
      if (e.touches.length > 0) return;

      const now = Date.now();
      if (now - gestureRef.current.lastTap < 280) {
        if (transformRef.current.scale > 1) {
          resetZoom();
        } else {
          syncTransform(2.2, 0, 0, true);
        }
      }
      gestureRef.current.lastTap = now;
    };

    viewport.addEventListener('touchstart', onTouchStart, {passive: true});
    viewport.addEventListener('touchmove', onTouchMove, {passive: false});
    viewport.addEventListener('touchend', onTouchEnd);

    return () => {
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
    };
  }, [resort, syncTransform, resetZoom]);

  if (!resort) return null;

  const config = RESORT_CONFIGS[resort];

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.35 : -0.35;
    zoomBy(delta);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (transformRef.current.scale <= 1) return;
    gestureRef.current.isMouseDragging = true;
    gestureRef.current.startX = e.clientX - transformRef.current.x;
    gestureRef.current.startY = e.clientY - transformRef.current.y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

  return (
    <div
      id="map-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-lightbox-title"
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* 頂部標題與顯眼關閉按鈕 */}
      <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 text-white bg-slate-900/90 border-b border-white/15 z-20">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] text-sky-300 font-bold uppercase tracking-wider block">
            SKI TRAIL MAP · 支援雙指縮放 / 單指拖曳
          </span>
          <h3
            id="map-lightbox-title"
            className="font-serif text-sm sm:text-base font-bold truncate"
          >
            {config.title}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="lightbox-toggle-btn"
            onClick={onToggleMode}
            aria-label="在放大檢視中切換 SVG 或 WebP 原圖"
            className="min-h-[48px] px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            {mode === 'svg' ? '切換 WebP 原圖' : '切換 SVG 概覽'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉全螢幕地圖檢視"
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg whitespace-nowrap cursor-pointer"
          >
            <X className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>關閉</span>
          </button>
        </div>
      </div>

      {/* 可雙指縮放與拖曳的畫布區域 */}
      <div
        ref={viewportRef}
        id="map-lightbox-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={() => {
          if (scale > 1) {
            resetZoom();
          } else {
            syncTransform(2.2, 0, 0, true);
          }
        }}
        className={`relative flex-1 overflow-hidden touch-none flex items-center justify-center select-none ${
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
        }`}
      >
        <div
          id="map-lightbox-body"
          className="origin-center flex items-center justify-center p-3"
          style={{
            transition: smooth ? 'transform 0.18s ease-out' : 'none',
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
          }}
        >
          {mode === 'webp' ? (
            <img
              src={config.webpSrc}
              alt={config.title}
              draggable={false}
              onError={onFallbackToSvg}
              className="rounded-2xl shadow-2xl max-w-[94vw] max-h-[72vh] object-contain bg-white"
            />
          ) : (
            <ResortOverviewSvg
              resort={resort}
              className="bg-white rounded-2xl p-3 shadow-2xl w-[94vw] max-w-2xl h-auto select-none"
            />
          )}
        </div>
      </div>

      {/* 底部縮放與關閉工具列（單手拇指操作最方便） */}
      <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900/90 border-t border-white/15 z-20">
        <button
          type="button"
          onClick={() => zoomBy(-0.5)}
          aria-label="縮小地圖"
          className="min-h-[48px] min-w-[48px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <ZoomOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>縮小</span>
        </button>
        <button
          type="button"
          onClick={resetZoom}
          aria-label="重設地圖縮放比例"
          className="min-h-[48px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-sky-200 text-xs font-bold whitespace-nowrap cursor-pointer"
        >
          <span id="zoom-level-label">{Math.round(scale * 100)}%</span> 重設
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.5)}
          aria-label="放大地圖"
          className="min-h-[48px] min-w-[48px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
        >
          <ZoomIn className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>放大</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉全螢幕地圖"
          className="min-h-[48px] px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
        >
          <X className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>關閉地圖</span>
        </button>
      </div>
    </div>
  );
};
