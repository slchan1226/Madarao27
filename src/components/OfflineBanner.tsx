import React from 'react';
import {WifiOff} from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({isOnline}) => {
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full max-w-xl mx-auto px-3.5 sm:px-4 pt-3"
    >
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50/95 border border-amber-300/90 px-3.5 py-2.5 text-xs text-amber-950 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 shrink-0">
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <p className="font-bold leading-snug truncate">
            離線模式・正使用本機快取雪道圖與行程手冊
          </p>
        </div>
        <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      </div>
    </div>
  );
};
