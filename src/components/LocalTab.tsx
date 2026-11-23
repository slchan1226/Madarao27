import React, {useState} from 'react';
import {ChevronDown, ChevronUp, Clock, CornerUpRight, Map} from 'lucide-react';
import {LocalSpotsExplorer} from './LocalSpotsExplorer';
import {NearbyRestaurantsSection} from './NearbyRestaurantsSection';
import {OfflineDistanceTool} from './OfflineDistanceTool';
import {LocalDriveSvg} from './SkiMapSvgs';

interface LocalTabProps {
  isOnline: boolean;
  onCopyText: (text: string) => void;
}

interface PrimaryDriveRoute {
  id: string;
  order: string;
  title: string;
  subtitle: string;
  distanceKm: string;
  driveTime: string;
  summary: string;
  mapsHref: string;
  ctaLabel: string;
  ariaLabel: string;
  accentBarClass: string;
  ctaClass: string;
}

const PRIMARY_ROUTES: PrimaryDriveRoute[] = [
  {
    id: 'iiyama',
    order: '01',
    title: '飯山市區 / JR 飯山站周邊',
    subtitle: '飯山市街・縣道 97 號落山直達',
    distanceKm: '13 km',
    driveTime: '20–25 分鐘',
    summary:
      '最近市中心，集中 Tsuruya 大型超市、藥妝、拉麵、壽司居酒屋與便利店，夜晚補貨或宵夜最方便。',
    mapsHref:
      'https://www.google.com/maps/dir/?api=1&destination=Iiyama+Station+Nagano&travelmode=driving',
    ctaLabel: '導航去 飯山市區（JR 飯山站）',
    ariaLabel: '一鍵導航去飯山市區 JR 飯山站',
    accentBarClass: 'bg-sky-600',
    ctaClass: 'bg-sky-700 hover:bg-sky-800 text-white',
  },
  {
    id: 'romance',
    order: '02',
    title: 'スノーリゾートロマンスの神様',
    subtitle: '長野県下高井郡木島平村大字上木島 3876-2',
    distanceKm: '20 km',
    driveTime: '30–35 分鐘',
    summary:
      '落山經飯山市區過千曲川大橋上高社山即達，朝早 08:15 由酒店出發啱啱好趕上開門頭纜車。',
    mapsHref:
      'https://www.google.com/maps/dir/?api=1&destination=Snow+Resort+Romance+no+Kamisama&travelmode=driving',
    ctaLabel: '導航去 ロマンスの神様',
    ariaLabel: '一鍵導航去スノーリゾートロマンスの神様',
    accentBarClass: 'bg-rose-600',
    ctaClass: 'bg-rose-700 hover:bg-rose-800 text-white',
  },
  {
    id: 'nozawa',
    order: '03',
    title: '野沢温泉スキー場（長坂中心 / 日影）',
    subtitle: '長坂センターハウス · Tel 0269-85-3166',
    distanceKm: '26 km',
    driveTime: '40–45 分鐘',
    summary:
      '沿千曲川國道 117 號北上，最後上溫泉村斜路較窄多雪建議留 45 分鐘，滑完可順道逛溫泉街。',
    mapsHref:
      'https://www.google.com/maps/dir/?api=1&destination=Nozawa+Onsen+Snow+Resort+Nagasaka+Center+House&travelmode=driving',
    ctaLabel: '導航去 野沢温泉スキー場',
    ariaLabel: '一鍵導航去野沢温泉スキー場長坂中心',
    accentBarClass: 'bg-snow-900',
    ctaClass: 'bg-snow-900 hover:bg-snow-700 text-white',
  },
];

export const LocalTab: React.FC<LocalTabProps> = ({isOnline, onCopyText}) => {
  const [showOverviewMap, setShowOverviewMap] = useState(false);

  return (
    <section
      id="panel-local"
      role="tabpanel"
      aria-labelledby="tab-local"
      className="space-y-4"
    >
      {/* 精簡出發參考與可收起示意圖 */}
      <div className="glass-card jp-pattern-subtle rounded-3xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
              由酒店出發・周邊自駕
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              以<strong>ホテルシルクイン斑尾</strong>為基準；點擊導航會由你的
              <strong>當下位置</strong>直接規劃雪地路線。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOverviewMap((prev) => !prev)}
            aria-expanded={showOverviewMap}
            aria-controls="local-drive-svg-panel"
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap transition cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{showOverviewMap ? '收起示意圖' : '路線示意圖'}</span>
            {showOverviewMap ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown
                className="w-3.5 h-3.5 shrink-0"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {showOverviewMap && (
          <div
            id="local-drive-svg-panel"
            className="bg-gradient-to-b from-sky-50 to-white rounded-2xl p-3 border border-sky-100 shadow-inner"
          >
            <LocalDriveSvg />
          </div>
        )}
      </div>

      {/* 3 條置頂主力導航路線（俐落精簡卡） */}
      <div className="space-y-3">
        {PRIMARY_ROUTES.map((route) => (
          <div
            key={route.id}
            className="glass-card rounded-3xl overflow-hidden shadow-sm border border-slate-200/80"
          >
            <div className="p-4 sm:p-5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${route.accentBarClass}`}
                    aria-hidden="true"
                  />
                  <span className="font-bold text-slate-600">
                    路線 {route.order} · 約 {route.distanceKm}
                  </span>
                </div>
                <span className="font-bold text-slate-900 inline-flex items-center gap-1 shrink-0">
                  <Clock
                    className="w-3.5 h-3.5 text-sky-700 shrink-0"
                    aria-hidden="true"
                  />
                  <span>雪地 {route.driveTime}</span>
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {route.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {route.subtitle}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {route.summary}
              </p>

              <a
                href={route.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={route.ariaLabel}
                className={`nav-btn min-h-[46px] w-full inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold py-2.5 px-4 rounded-2xl shadow-sm transition ${route.ctaClass}`}
              >
                <CornerUpRight
                  className="w-4 h-4 shrink-0"
                  aria-hidden="true"
                />
                <span>{route.ctaLabel}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 三大統一手風琴（全部預設收起） */}
      <NearbyRestaurantsSection onCopyText={onCopyText} />
      <LocalSpotsExplorer isOnline={isOnline} onCopyText={onCopyText} />
      <OfflineDistanceTool />
    </section>
  );
};
