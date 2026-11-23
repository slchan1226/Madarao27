import React from 'react';
import {Copy, DoorOpen, MapPin, Star} from 'lucide-react';

interface HotelTabProps {
  myRoom: string | null;
  onSetRoom: (roomLabel: string) => void;
  onClearRoom: () => void;
  onCopyText: (text: string) => void;
}

interface RoomEntry {
  roomKey: string;
  label: string;
  badge: string;
  badgeClass: string;
  striped: boolean;
  ariaLabel: string;
}

const ROOMS: RoomEntry[] = [
  {
    roomKey: '2樓 · 1201 室（1 人房）',
    label: '2樓 · 1201 室',
    badge: '1 人房',
    badgeClass: 'bg-slate-100 text-slate-700',
    striped: false,
    ariaLabel: '將 1201 室設為我的房間',
  },
  {
    roomKey: '2樓 · 1206 室（2 人房）',
    label: '2樓 · 1206 室',
    badge: '2 人房',
    badgeClass: 'bg-sky-100 text-sky-900',
    striped: true,
    ariaLabel: '將 1206 室設為我的房間',
  },
  {
    roomKey: '3樓 · 1301 室（2 人房）',
    label: '3樓 · 1301 室',
    badge: '2 人房',
    badgeClass: 'bg-sky-100 text-sky-900',
    striped: false,
    ariaLabel: '將 1301 室設為我的房間',
  },
  {
    roomKey: '3樓 · 1306 室（2 人房）',
    label: '3樓 · 1306 室',
    badge: '2 人房',
    badgeClass: 'bg-sky-100 text-sky-900',
    striped: true,
    ariaLabel: '將 1306 室設為我的房間',
  },
  {
    roomKey: '4樓 · 1406 室（2 人房）',
    label: '4樓 · 1406 室',
    badge: '2 人房',
    badgeClass: 'bg-sky-100 text-sky-900',
    striped: false,
    ariaLabel: '將 1406 室設為我的房間',
  },
  {
    roomKey: '5樓 · 1501 室（2 人房）',
    label: '5樓 · 1501 室',
    badge: '2 人房',
    badgeClass: 'bg-sky-100 text-sky-900',
    striped: true,
    ariaLabel: '將 1501 室設為我的房間',
  },
  {
    roomKey: '5樓 · 1506 室（3 人房）',
    label: '5樓 · 1506 室',
    badge: '3 人房（男性3名）',
    badgeClass: 'bg-amber-100 text-amber-900',
    striped: false,
    ariaLabel: '將 1506 室設為我的房間',
  },
];

export const HotelTab: React.FC<HotelTabProps> = ({
  myRoom,
  onSetRoom,
  onClearRoom,
  onCopyText,
}) => {
  return (
    <section
      id="panel-hotel"
      role="tabpanel"
      aria-labelledby="tab-hotel"
      className="space-y-4"
    >
      <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-sm space-y-5">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-sky-700 uppercase">
            STEP 3 · ACCOMMODATION
          </span>
          <h2 className="font-serif text-xl font-bold text-slate-900">
            倉本温泉 ホテルシルクイン斑尾
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            預約編號：<strong>1235</strong> ｜ 2027/02/14 – 02/20（共 6 晚）
          </p>
        </div>

        {myRoom && (
          <div
            id="my-room-banner"
            className="bg-gradient-to-r from-snow-900 to-sky-800 text-white rounded-2xl p-3.5 shadow-md"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  MY ROOM · 已置頂儲存
                </span>
                <div id="my-room-title" className="text-base font-bold mt-0.5">
                  {myRoom}
                </div>
              </div>
              <button
                type="button"
                onClick={onClearRoom}
                aria-label="取消標記我的房間"
                className="min-h-[48px] min-w-[48px] text-xs bg-white/15 hover:bg-white/25 px-3 py-2 rounded-xl font-bold transition cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3">
            <div className="text-slate-600 font-medium">入住 / 退房時間</div>
            <div className="font-bold text-slate-900 mt-0.5">
              15:00 後 / 10:00 前
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3">
            <div className="text-slate-600 font-medium">膳食安排</div>
            <div className="font-bold text-slate-900 mt-0.5">
              包早晚自助餐 Buffet
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3">
            <div className="text-slate-600 font-medium">住客泊車</div>
            <div className="font-bold text-emerald-800 mt-0.5">
              免費停車場（免預約）
            </div>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3">
            <div className="text-slate-600 font-medium">酒店雪具租借</div>
            <div className="font-bold text-slate-900 mt-0.5">
              板鞋 ¥4,000 / 衫褲 ¥2,000
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              <DoorOpen
                className="w-4 h-4 text-sky-700 shrink-0"
                aria-hidden="true"
              />
              <span>本館和洋室房號（點星號標記自己房間）</span>
            </span>
            <span className="text-[11px] font-medium text-slate-600 shrink-0">
              29–36㎡ 禁煙
            </span>
          </h3>
          <div
            id="room-list-container"
            className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden text-xs"
          >
            {ROOMS.map((room) => {
              const isPinned = myRoom === room.roomKey;
              return (
                <div
                  key={room.roomKey}
                  className={`flex items-center justify-between px-3.5 py-2 ${
                    room.striped ? 'bg-slate-50/70' : 'bg-white'
                  }`}
                >
                  <div>
                    <span className="font-bold text-snow-900 text-sm">
                      {room.label}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full font-medium ${room.badgeClass}`}
                    >
                      {room.badge}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSetRoom(room.roomKey)}
                    aria-label={room.ariaLabel}
                    aria-pressed={isPinned}
                    className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl text-slate-600 hover:bg-sky-50 hover:text-sky-700 transition cursor-pointer"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        isPinned
                          ? 'fill-amber-500 text-amber-500'
                          : 'text-slate-600'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => onCopyText('長野県飯山市斑尾高原 11492-376')}
            aria-label="複製酒店日文地址"
            className="min-h-[48px] flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold py-3 px-4 rounded-2xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>複製日文地址</span>
          </button>
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=Hotel+Silk+In+Madarao&destination_place_id=ChIJ6-PetV0j9l8RvC39yyIm7lw&travelmode=driving"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="開啟 Google Maps 導航至ホテルシルクイン斑尾"
            className="min-h-[48px] flex-1 bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold py-3 px-4 rounded-2xl inline-flex items-center justify-center gap-1.5 transition"
          >
            <MapPin
              className="w-4 h-4 text-sky-300 shrink-0"
              aria-hidden="true"
            />
            <span>開啟酒店地圖導航</span>
          </a>
        </div>
      </div>
    </section>
  );
};
