import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Copy,
  CornerUpRight,
  Maximize2,
  Minus,
  Plus,
  Tag,
  WifiOff,
} from 'lucide-react';
import {
  HOTEL_BASE_COORD,
  SPOT_CATEGORY_META,
  type LocalSpot,
  type SpotCategory,
} from '../data/localSpots';

interface LocalSpotsMapProps {
  spots: LocalSpot[];
  selectedSpotId: string | null;
  onSelectSpot: (id: string | null) => void;
  isOnline: boolean;
  onCopyText: (text: string) => void;
}

const DEFAULT_CENTER = {
  lat: 36.876,
  lng: 138.356,
};

const LEGEND_ITEMS: Array<{label: string; color: string}> = [
  {label: '酒店本營', color: '#0f294a'},
  {label: '雪具', color: SPOT_CATEGORY_META.gear.pinBg},
  {label: '溫泉', color: SPOT_CATEGORY_META.onsen.pinBg},
  {label: '餐廳', color: SPOT_CATEGORY_META.restaurant.pinBg},
  {label: '超商', color: SPOT_CATEGORY_META.store.pinBg},
  {label: '景點', color: SPOT_CATEGORY_META.attraction.pinBg},
];

interface MapControllerProps {
  spots: LocalSpot[];
  selectedSpot: LocalSpot | null;
}

const MapCameraAndZoomControls: React.FC<MapControllerProps> = ({
  spots,
  selectedSpot,
}) => {
  const map = useMap();

  const fitAllPoints = useCallback(() => {
    if (!map) return;

    const points = [
      {lat: HOTEL_BASE_COORD.lat, lng: HOTEL_BASE_COORD.lng},
      ...spots.map((s) => ({lat: s.lat, lng: s.lng})),
    ];

    let north = -90;
    let south = 90;
    let east = -180;
    let west = 180;

    for (const pt of points) {
      if (pt.lat > north) north = pt.lat;
      if (pt.lat < south) south = pt.lat;
      if (pt.lng > east) east = pt.lng;
      if (pt.lng < west) west = pt.lng;
    }

    if (Math.abs(north - south) < 0.004 && Math.abs(east - west) < 0.004) {
      map.panTo({lat: (north + south) / 2, lng: (east + west) / 2});
      map.setZoom(15);
      return;
    }

    map.fitBounds(
      {north, south, east, west},
      {top: 44, right: 32, bottom: 44, left: 32},
    );
  }, [map, spots]);

  // 切換分類時自動調整視野涵蓋全部地標
  useEffect(() => {
    if (!map || selectedSpot) return;
    fitAllPoints();
  }, [map, spots, selectedSpot, fitAllPoints]);

  // 點選卡片或標記時平滑對焦並放大
  useEffect(() => {
    if (!map || !selectedSpot) return;
    map.panTo({lat: selectedSpot.lat, lng: selectedSpot.lng});
    const currentZoom = map.getZoom() ?? 12;
    if (currentZoom < 15) {
      map.setZoom(15);
    }
  }, [map, selectedSpot]);

  const handleZoomIn = () => {
    if (!map) return;
    const current = map.getZoom() ?? 12;
    map.setZoom(Math.min(19, current + 1));
  };

  const handleZoomOut = () => {
    if (!map) return;
    const current = map.getZoom() ?? 12;
    map.setZoom(Math.max(8, current - 1));
  };

  return (
    <div
      className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1.5"
      aria-label="地圖縮放控制"
    >
      <button
        type="button"
        onClick={handleZoomIn}
        title="放大地圖"
        aria-label="放大地圖"
        className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-300/90 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={handleZoomOut}
        title="縮小地圖"
        aria-label="縮小地圖"
        className="w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-slate-800 border border-slate-300/90 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={fitAllPoints}
        title="顯示全部標記"
        aria-label="顯示全部標記"
        className="w-9 h-9 rounded-xl bg-snow-900/95 hover:bg-snow-900 text-white border border-snow-900 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer"
      >
        <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
};

export const LocalSpotsMap: React.FC<LocalSpotsMapProps> = ({
  spots,
  selectedSpotId,
  onSelectSpot,
  isOnline,
  onCopyText,
}) => {
  const envKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();
  const [resolvedKey, setResolvedKey] = useState<string>(envKey);
  const [isLoadingKey, setIsLoadingKey] = useState<boolean>(!envKey && isOnline);

  useEffect(() => {
    if (envKey || !isOnline) {
      setIsLoadingKey(false);
      return;
    }

    let cancelled = false;
    setIsLoadingKey(true);
    fetch('/api/config/maps')
      .then((res) => (res.ok ? res.json() : {apiKey: ''}))
      .then((data: {apiKey?: string}) => {
        if (!cancelled && typeof data.apiKey === 'string' && data.apiKey.trim()) {
          setResolvedKey(data.apiKey.trim());
        }
      })
      .catch(() => {
        // Fallback silently to offline state
      })
      .finally(() => {
        if (!cancelled) setIsLoadingKey(false);
      });

    return () => {
      cancelled = true;
    };
  }, [envKey, isOnline]);

  const activeSpot = useMemo(
    () => spots.find((s) => s.id === selectedSpotId) ?? null,
    [spots, selectedSpotId],
  );

  const hasHotelSpotInList = useMemo(
    () => spots.some((s) => s.id === 'onsen-silk-in'),
    [spots],
  );

  if (!isOnline) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/95 p-4 text-center space-y-1.5">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 text-amber-800 mx-auto">
          <WifiOff className="w-4 h-4" aria-hidden="true" />
        </div>
        <p className="text-xs font-bold text-slate-800">
          目前處於離線模式，Google 地圖圖磚需連線載入
        </p>
        <p className="text-[11px] text-slate-600">
          下方全部 {spots.length} 個地標的距離、車程、高階雪具價目與日文地址均已離線完整載入。
        </p>
      </div>
    );
  }

  if (isLoadingKey) {
    return (
      <div className="h-[340px] sm:h-[400px] w-full rounded-2xl border border-sky-200/80 bg-sky-50/60 flex items-center justify-center text-xs font-bold text-sky-900">
        正在載入互動式 Google Maps…
      </div>
    );
  }

  if (!resolvedKey) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-center space-y-1">
        <p className="text-xs font-bold text-amber-950">
          尚未偵測到 Google Maps 地圖金鑰
        </p>
        <p className="text-[11px] text-amber-900">
          仍可直接點擊下方每個地標卡片的「Google Maps 導航」開啟外部地圖。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-[340px] sm:h-[400px] w-full rounded-2xl overflow-hidden border border-sky-200/90 shadow-xs bg-slate-100">
        <APIProvider apiKey={resolvedKey} language="zh-TW" region="JP">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={11}
            gestureHandling="greedy"
            zoomControl={false}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            onClick={() => onSelectSpot(null)}
            className="w-full h-full"
          >
            <MapCameraAndZoomControls spots={spots} selectedSpot={activeSpot} />

            {/* 倉本溫泉酒店本營參考釘（當篩選唔包含酒店本身時仍顯示方便對照位置） */}
            {!hasHotelSpotInList && (
              <AdvancedMarker
                position={{
                  lat: HOTEL_BASE_COORD.lat,
                  lng: HOTEL_BASE_COORD.lng,
                }}
                title={HOTEL_BASE_COORD.name}
                zIndex={40}
              >
                <Pin
                  background="#0f294a"
                  borderColor="#ffffff"
                  glyphColor="#fde047"
                  scale={1.1}
                />
              </AdvancedMarker>
            )}

            {/* 當前篩選結果全部地標釘 */}
            {spots.map((spot) => {
              const catMeta = SPOT_CATEGORY_META[spot.category as SpotCategory];
              const isSelected = spot.id === selectedSpotId;
              const isHotel = spot.id === 'onsen-silk-in';
              return (
                <AdvancedMarker
                  key={spot.id}
                  position={{lat: spot.lat, lng: spot.lng}}
                  title={spot.name}
                  zIndex={isSelected ? 70 : isHotel ? 50 : 25}
                  onClick={() => onSelectSpot(spot.id)}
                >
                  <Pin
                    background={isHotel ? '#0f294a' : catMeta.pinBg}
                    borderColor={isSelected ? '#ffffff' : catMeta.pinBorder}
                    glyphColor={isHotel ? '#fde047' : '#ffffff'}
                    scale={isSelected ? 1.25 : isHotel ? 1.12 : 0.96}
                  />
                </AdvancedMarker>
              );
            })}

            {/* 點擊標記彈出詳情視窗 */}
            {activeSpot && (
              <InfoWindow
                position={{lat: activeSpot.lat, lng: activeSpot.lng}}
                pixelOffset={[0, -34]}
                onCloseClick={() => onSelectSpot(null)}
              >
                <div className="max-w-[240px] text-slate-900 space-y-1.5 pr-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        SPOT_CATEGORY_META[activeSpot.category as SpotCategory]
                          .badgeClass
                      }`}
                    >
                      {
                        SPOT_CATEGORY_META[activeSpot.category as SpotCategory]
                          .label
                      }
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {activeSpot.area}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {activeSpot.name}
                  </p>

                  <p className="text-[11px] font-semibold text-sky-800">
                    {activeSpot.distanceKm === 0
                      ? activeSpot.driveMinutesText
                      : `距酒店約 ${activeSpot.distanceKm} km · ${activeSpot.driveMinutesText}`}
                  </p>

                  {activeSpot.priceNote && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1 text-[10px] text-indigo-950 leading-snug flex items-start gap-1">
                      <Tag
                        className="w-3 h-3 text-indigo-700 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>{activeSpot.priceNote}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onCopyText(activeSpot.addressJp)}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-sky-700" aria-hidden="true" />
                      <span>複製地址</span>
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${activeSpot.mapsQuery}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-snow-900 hover:bg-snow-700 text-white inline-flex items-center gap-1"
                    >
                      <CornerUpRight
                        className="w-3 h-3 text-sky-300"
                        aria-hidden="true"
                      />
                      <span>導航</span>
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </APIProvider>
      </div>

      {/* 圖例與操作提示 */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-2.5">
          {LEGEND_ITEMS.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{backgroundColor: item.color}}
                aria-hidden="true"
              />
              <span className="font-semibold text-slate-700">{item.label}</span>
            </span>
          ))}
        </div>
        <span className="text-[10px] font-semibold text-slate-500">
          顯示 {spots.length} 點 · 可雙指／滾輪或按 ＋／－ 縮放
        </span>
      </div>
    </div>
  );
};
