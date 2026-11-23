import React, {useEffect} from 'react';
import {Download, Share, X, Zap} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  canNativeInstall: boolean;
  onTriggerNativeInstall: () => void;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({
  isOpen,
  canNativeInstall,
  onTriggerNativeInstall,
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
      id="install-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              id="modal-app-icon"
              src="./icon-192.png"
              alt="斑尾滑雪2027 App Icon"
              className="w-14 h-14 rounded-2xl shadow-md border border-slate-200 shrink-0 object-cover"
            />
            <div className="min-w-0">
              <h3
                id="install-modal-title"
                className="font-serif text-lg font-bold text-slate-900 truncate"
              >
                斑尾滑雪 2027
              </h3>
              <p className="text-xs text-slate-600">
                加到手機主畫面・支援雪山離線開啟
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉安裝視窗"
            className="min-h-[48px] min-w-[48px] shrink-0 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {canNativeInstall && (
          <div
            id="native-prompt-box"
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-2.5"
          >
            <p className="font-bold flex items-center gap-1.5">
              <Zap
                className="w-4 h-4 text-emerald-700 shrink-0"
                aria-hidden="true"
              />
              <span>偵測到你的瀏覽器支援一鍵原生安裝：</span>
            </p>
            <button
              type="button"
              onClick={onTriggerNativeInstall}
              aria-label="立即安裝 PWA 應用程式"
              className="min-h-[48px] w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition cursor-pointer"
            >
              立即安裝「斑尾滑雪 27」到主畫面
            </button>
          </div>
        )}

        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3.5 text-xs text-slate-800 space-y-2.5">
          <div id="ios-install-guide" className="flex items-start gap-2.5">
            <span className="bg-snow-900 text-white font-bold px-2 py-0.5 rounded text-[11px] mt-0.5 shrink-0">
              iPhone
            </span>
            <p className="leading-relaxed">
              用 <strong>Safari</strong> 開啟此頁，撳底部中間嘅{' '}
              <Share
                className="w-3.5 h-3.5 text-sky-700 inline-block mx-0.5 -mt-0.5"
                aria-hidden="true"
              />{' '}
              <strong>「分享」</strong>，再揀 <strong>「加入主畫面」</strong>{' '}
              即完成。
            </p>
          </div>
          <div
            id="android-install-guide"
            className="border-t border-sky-200/70 pt-2.5 flex items-start gap-2.5"
          >
            <span className="bg-emerald-700 text-white font-bold px-2 py-0.5 rounded text-[11px] mt-0.5 shrink-0">
              Android
            </span>
            <p className="leading-relaxed">
              用 <strong>Chrome</strong> 開啟此頁，撳右上角 <strong>⋮</strong>{' '}
              選單，揀 <strong>「安裝應用程式」</strong> 或{' '}
              <strong>「加到主畫面」</strong>。
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            id="download-icon-btn"
            download="madarao-2027-icon.png"
            href="./icon-512.png"
            aria-label="下載 App Icon 圖示檔"
            className="min-h-[48px] flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3 px-3 rounded-2xl inline-flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>下載 Icon 圖示</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="完成並返回行程"
            className="min-h-[48px] flex-1 bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold py-3 px-3 rounded-2xl transition cursor-pointer"
          >
            明白，返去睇行程
          </button>
        </div>
      </div>
    </div>
  );
};
