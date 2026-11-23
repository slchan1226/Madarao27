import React, {useMemo, useState} from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CornerUpRight,
  MapPin,
  Utensils,
} from 'lucide-react';

type RestaurantAreaKey = 'all' | 'madarao' | 'iiyama';

interface NearbyRestaurant {
  id: string;
  areaKey: 'madarao' | 'iiyama';
  areaLabel: string;
  driveNote: string;
  name: string;
  jpName: string;
  cuisineType: string;
  hours: string;
  highlight: string;
  addressJp: string;
  mapsQuery: string;
}

const NEARBY_RESTAURANTS: NearbyRestaurant[] = [
  // ===== 斑尾高原周邊 =====
  {
    id: 'dining-akis-pub',
    areaKey: 'madarao',
    areaLabel: '斑尾高原',
    driveNote: '距酒店約 3 分鐘（步行約 8 分鐘）',
    name: "Aki's Pub & Café",
    jpName: "Aki's Pub & Café 斑尾",
    cuisineType: '美式小館・咖喱',
    hours: '11:30 – 21:30（雪季晚市建議訂位）',
    highlight: '手工漢堡、炸雞、熱咖喱配精釀啤酒，英文日文皆通。',
    addressJp: '長野県飯山市斑尾高原 11492-366',
    mapsQuery: 'Akis+Pub+Cafe+Madarao+Nagano',
  },
  {
    id: 'dining-rudolf',
    areaKey: 'madarao',
    areaLabel: '斑尾高原',
    driveNote: '距酒店約 3 – 4 分鐘',
    name: 'レストラン ルドルフ（Rudolf）',
    jpName: 'レストラン ルドルフ',
    cuisineType: '石窯薄餅・西餐',
    hours: '11:30 – 14:30 / 17:30 – 21:00',
    highlight: '木屋薪火石窯即烤拿坡里 Pizza、濃郁意粉，適合一班人 Share。',
    addressJp: '長野県飯山市斑尾高原 1101-152',
    mapsQuery: 'Restaurant+Rudolf+Madarao+Nagano',
  },
  {
    id: 'dining-heidi',
    areaKey: 'madarao',
    areaLabel: '斑尾高原雪場',
    driveNote: '距酒店約 3 分鐘（雪場底直達）',
    name: 'レストラン ハイジ（Heidi）',
    jpName: '斑尾高原スキー場 レストランハイジ',
    cuisineType: '雪場餐廳・拉麵咖喱',
    hours: '09:00 – 16:00（雪季午市為主）',
    highlight: '雪場最大主餐廳，座位多唔怕 14 人搵位，巨型炸雞扒咖喱人氣高。',
    addressJp: '新潟県妙高市樽本斑尾 1053-1',
    mapsQuery: 'Restaurant+Heidi+Madarao+Ski+Resort',
  },

  // ===== JR 飯山站周邊 =====
  {
    id: 'dining-yoshikiyo',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 22 分鐘（飯山站徒歩約 7 分）',
    name: '寿司のよし清（よし清すし店）',
    jpName: 'よし清すし店（飯山市）',
    cuisineType: '壽司',
    hours: '11:00 – 14:00 / 16:00 – 21:00（逢週三休）',
    highlight: '飯山在地高口碑江戶前壽司老店，北陸直送時令鮮魚握壽司。',
    addressJp: '長野県飯山市飯山 1126',
    mapsQuery: 'Yoshikiyo+Sushi+Iiyama+Nagano',
  },
  {
    id: 'dining-kappa-sushi',
    areaKey: 'iiyama',
    areaLabel: '飯山市區（近飯山站）',
    driveNote: '車程約 20 分鐘（超大停車場）',
    name: 'かっぱ寿司 新飯山店',
    jpName: 'かっぱ寿司 新飯山店',
    cuisineType: '迴轉壽司',
    hours: '11:00 – 22:00（週末多提早於 10:00 營業）',
    highlight: '平板點餐方便 14 人大團分枱食，門口大型平面免費車位好泊車。',
    addressJp: '長野県飯山市静間 1383-1',
    mapsQuery: 'Kappa+Sushi+Shin+Iiyama+Nagano',
  },
  {
    id: 'dining-ogiya-ramen',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 21 分鐘（開到凌晨 2 點）',
    name: 'おおぎやラーメン 長野飯山店',
    jpName: 'おおぎやラーメン 長野飯山店',
    cuisineType: '拉麵（味噌招牌）',
    hours: '11:00 – 翌日 02:00（宵夜必選）',
    highlight: '招牌濃郁蒜香味噌拉麵配免費白飯，落山食宵夜唔怕閂門！',
    addressJp: '長野県飯山市南町 32-3',
    mapsQuery: 'Ogiya+Ramen+Iiyama+Nagano',
  },
  {
    id: 'dining-roppo-ramen',
    areaKey: 'iiyama',
    areaLabel: '飯山市區（近飯山站）',
    driveNote: '車程約 22 分鐘',
    name: '麺とび六方 飯山店',
    jpName: '麺とび六方 飯山店',
    cuisineType: '拉麵（二郎系）',
    hours: '11:00 – 14:30 / 17:00 – 21:00（L.O. 20:30）',
    highlight: '長野超人氣粗麵濃厚二郎系拉麵，蔬菜／蒜蓉免費加量超飽肚。',
    addressJp: '長野県飯山市静間 2131-1',
    mapsQuery: 'Mentobi+Roppo+Iiyama+Nagano',
  },
  {
    id: 'dining-inari',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 22 分鐘（飯山站徒歩 7 分）',
    name: 'イナリ食堂',
    jpName: 'イナリ食堂（飯山市）',
    cuisineType: '拉麵・豬扒丼',
    hours: '11:00 – 14:30 / 17:00 – 20:00（不定期公休）',
    highlight: '在地人氣食堂，招牌大份量蔬菜拉麵與厚切炸豬扒丼（カツ丼）。',
    addressJp: '長野県飯山市飯山 1221-1',
    mapsQuery: 'Inari+Shokudo+Iiyama+Nagano',
  },
  {
    id: 'dining-eppe',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站 1F 構內',
    driveNote: '車程約 22 分鐘（站內直達）',
    name: '駅ナカ酒場 えっぺ',
    jpName: '飯山駅 駅ナカ酒場 えっぺ',
    cuisineType: '居酒屋',
    hours: '11:30 – 14:00 / 17:00 – 22:00',
    highlight: '位於飯山站 1 樓構內，主打信州地酒「水尾」、鯖魚咖喱烏冬及鄉土小食。',
    addressJp: '長野県飯山市飯山 772-6（JR飯山駅1F）',
    mapsQuery: 'Ekinaka+Sakaba+Eppe+Iiyama+Station',
  },
  {
    id: 'dining-issho',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 22 分鐘（飯山站徒歩 8 分）',
    name: '海鮮居酒屋 一升',
    jpName: '海鮮居酒屋 一升',
    cuisineType: '海鮮居酒屋',
    hours: '11:00 – 14:00 / 17:00 – 22:00（日祝休・宜預約）',
    highlight: '設個室適合大團聚餐，北陸鮮魚刺身、信州三文魚及みゆき豚極出色。',
    addressJp: '長野県飯山市南町 10-5',
    mapsQuery: 'Kaisen+Izakaya+Issho+Iiyama+Nagano',
  },
  {
    id: 'dining-gon',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 22 分鐘（飯山站徒歩 8 分）',
    name: '居酒屋 ごん',
    jpName: '居酒屋 ごん（飯山市）',
    cuisineType: '居酒屋・刺身',
    hours: '16:30 – 23:00（不定休）',
    highlight: '鄰近壽司店體系經營，刺身拼盤新鮮厚切、日本酒選擇極齊全。',
    addressJp: '長野県飯山市飯山（飯山駅周辺）',
    mapsQuery: 'Izakaya+Gon+Iiyama+Nagano',
  },
  {
    id: 'dining-tomikura-soba',
    areaKey: 'iiyama',
    areaLabel: 'JR 飯山站周邊',
    driveNote: '車程約 22 分鐘',
    name: '富倉そば（飯山名物手打蕎麥麵）',
    jpName: '飯山市街 富倉そば',
    cuisineType: '手打蕎麥麵',
    hours: '11:00 – 15:00（午市為主，售完即止）',
    highlight: '飯山獨有以山牛蒡葉纖維手打嘅彈牙蕎麥麵，配山菜天婦羅必試。',
    addressJp: '長野県飯山市飯山（JR飯山駅周邊）',
    mapsQuery: 'Tomikura+Soba+Iiyama+Nagano',
  },
];

interface NearbyRestaurantsSectionProps {
  onCopyText: (text: string) => void;
}

export const NearbyRestaurantsSection: React.FC<
  NearbyRestaurantsSectionProps
> = ({onCopyText}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [areaFilter, setAreaFilter] = useState<RestaurantAreaKey>('all');

  const counts = useMemo(() => {
    const madarao = NEARBY_RESTAURANTS.filter(
      (r) => r.areaKey === 'madarao',
    ).length;
    const iiyama = NEARBY_RESTAURANTS.filter(
      (r) => r.areaKey === 'iiyama',
    ).length;
    return {all: NEARBY_RESTAURANTS.length, madarao, iiyama};
  }, []);

  const visibleRestaurants = useMemo(() => {
    if (areaFilter === 'all') return NEARBY_RESTAURANTS;
    return NEARBY_RESTAURANTS.filter((r) => r.areaKey === areaFilter);
  }, [areaFilter]);

  const filterTabs: Array<{key: RestaurantAreaKey; label: string; count: number}> =
    [
      {key: 'all', label: '全部餐廳', count: counts.all},
      {key: 'madarao', label: '斑尾高原', count: counts.madarao},
      {key: 'iiyama', label: 'JR 飯山站', count: counts.iiyama},
    ];

  return (
    <div className="glass-card jp-pattern-subtle rounded-3xl shadow-sm border border-amber-200/80 overflow-hidden">
      {/* 可展開／收起標題欄（預設收起以保持頁面俐落） */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-controls="nearby-restaurants-body"
        className="w-full min-h-[60px] p-4 sm:p-5 text-left flex items-center justify-between gap-3 hover:bg-amber-50/40 transition cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-amber-800 text-[11px] font-bold tracking-wider">
            <Utensils className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>飯山站・斑尾高原重點美食</span>
          </div>
          <h3 className="font-serif text-base sm:text-lg font-bold text-snow-900 mt-0.5">
            附近餐廳清單（壽司／拉麵／居酒屋／薄餅）
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            斑尾高原 {counts.madarao} 間・JR 飯山站 {counts.iiyama} 間（共 {counts.all} 間 · 離線可用）
          </p>
        </div>

        <span className="min-h-[36px] px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span>{isExpanded ? '收起' : '展開'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
        </span>
      </button>

      {isExpanded && (
        <div
          id="nearby-restaurants-body"
          className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-amber-200/60 space-y-4"
        >
          {/* 區域快速篩選器 */}
          <div
            role="tablist"
            aria-label="附近餐廳區域篩選"
            className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/70"
          >
        {filterTabs.map((tab) => {
          const active = areaFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setAreaFilter(tab.key)}
              className={`min-h-[40px] px-2 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-snow-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}（{tab.count}）
            </button>
          );
        })}
      </div>

      {/* 餐廳列表 */}
      <div className="divide-y divide-slate-200/75 bg-white/95 border border-slate-200/85 rounded-2xl overflow-hidden">
        {visibleRestaurants.map((item) => (
          <article key={item.id} className="p-3.5 sm:p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                  <span className="font-bold text-amber-800">
                    {item.cuisineType}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-0.5 font-medium text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{item.areaLabel}</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{item.driveNote}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500">{item.jpName}</p>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-xs text-slate-700">
              <Clock
                className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span className="tabular-nums">
                <strong className="text-slate-900">營業時間：</strong>
                {item.hours}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {item.highlight}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => onCopyText(item.addressJp)}
                aria-label={`複製 ${item.name} 日文地址`}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 inline-flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5 text-sky-700 shrink-0" aria-hidden="true" />
                <span>複製地址</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${item.mapsQuery}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`開啟 Google Maps 直接導航至 ${item.name}`}
                className="min-h-[40px] flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-snow-900 hover:bg-snow-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition whitespace-nowrap"
              >
                <CornerUpRight
                  className="w-3.5 h-3.5 text-sky-300 shrink-0"
                  aria-hidden="true"
                />
                <span>Google Maps 導航</span>
              </a>
            </div>
          </article>
        ))}
          </div>
        </div>
      )}
    </div>
  );
};
