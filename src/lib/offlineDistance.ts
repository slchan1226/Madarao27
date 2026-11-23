export interface OfflineLandmark {
  id: string;
  name: string;
  shortName: string;
  jpName: string;
  category: 'hotel' | 'resort' | 'town' | 'hub';
  lat: number;
  lng: number;
  elevationM: number;
  isPopular: boolean;
  keywords: string[];
  mapsQuery: string;
}

export type RoadCondition = 'snow' | 'dry';
export type TripMode = 'oneway' | 'roundtrip';

export interface FuelPreset {
  id: string;
  label: string;
  kmPerLiter: number;
}

export interface DistanceEstimate {
  landmark: OfflineLandmark;
  distanceKm: number;
  driveMinutes: number;
  driveMinutesMin: number;
  driveMinutesMax: number;
  fuelLiters: number;
  estimatedYen: number;
  isCalibrated: boolean;
}

export const DEFAULT_FUEL_KM_PER_L = 11;
export const DEFAULT_GAS_PRICE_YEN = 175;

export const FUEL_PRESETS: FuelPreset[] = [
  {id: 'minivan4wd', label: '7人車 / 4WD SUV (11 km/L)', kmPerLiter: 11},
  {id: 'hiace', label: 'HiAce / 大車 (9 km/L)', kmPerLiter: 9},
  {id: 'hybrid', label: '混能 Hybrid (16 km/L)', kmPerLiter: 16},
];

export const OFFLINE_LANDMARKS: OfflineLandmark[] = [
  {
    id: 'madarao',
    name: '斑尾高原スキー場',
    shortName: '斑尾高原',
    jpName: '斑尾高原スキー場',
    category: 'resort',
    lat: 36.8475,
    lng: 138.2936,
    elevationM: 1050,
    isPopular: true,
    keywords: ['斑尾', '斑尾高原', 'madarao', '雪場', 'スキー場'],
    mapsQuery: 'Madarao+Kogen+Ski+Resort',
  },
  {
    id: 'silk-in',
    name: '倉本温泉 ホテルシルクイン斑尾',
    shortName: '倉本温泉（酒店）',
    jpName: 'ホテルシルクイン斑尾',
    category: 'hotel',
    lat: 36.8516,
    lng: 138.2932,
    elevationM: 1000,
    isPopular: true,
    keywords: ['倉本', '倉本温泉', '倉本溫泉', '酒店', 'hotel', 'silk in', 'シルクイン', '住宿'],
    mapsQuery: 'Hotel+Silk+In+Madarao',
  },
  {
    id: 'nozawa',
    name: '野沢温泉スキー場（長坂）',
    shortName: '野澤溫泉',
    jpName: '野沢温泉スキー場 長坂センターハウス',
    category: 'resort',
    lat: 36.9228,
    lng: 138.4508,
    elevationM: 630,
    isPopular: true,
    keywords: ['野澤', '野沢', '野澤溫泉', '野沢温泉', 'nozawa', '長坂', '溫泉街'],
    mapsQuery: 'Nozawa+Onsen+Snow+Resort+Nagasaka+Center+House',
  },
  {
    id: 'romance',
    name: 'スノーリゾートロマンスの神様',
    shortName: '木島平雪場',
    jpName: 'スノーリゾートロマンスの神様（木島平）',
    category: 'resort',
    lat: 36.8355,
    lng: 138.4316,
    elevationM: 580,
    isPopular: true,
    keywords: ['木島平', 'ロマンス', '神様', 'romance', 'kijimadaira'],
    mapsQuery: 'Snow+Resort+Romance+no+Kamisama',
  },
  {
    id: 'tangram',
    name: 'Tangram Ski Circus',
    shortName: 'Tangram 雪場',
    jpName: 'タングラムスキーサーカス',
    category: 'resort',
    lat: 36.8428,
    lng: 138.2738,
    elevationM: 930,
    isPopular: true,
    keywords: ['tangram', 'タングラム', '斑尾東急'],
    mapsQuery: 'Tangram+Ski+Circus',
  },
  {
    id: 'iiyama-station',
    name: 'JR 飯山站 / 飯山市區',
    shortName: '飯山市區',
    jpName: '飯山駅・飯山市街',
    category: 'town',
    lat: 36.8453,
    lng: 138.3586,
    elevationM: 315,
    isPopular: true,
    keywords: ['飯山', '飯山站', '飯山駅', '市區', 'iiyama', 'jr'],
    mapsQuery: 'Iiyama+Station+Nagano',
  },
  {
    id: 'tsuruya',
    name: 'Tsuruya ツルヤ 飯山店（超市）',
    shortName: 'Tsuruya 超市',
    jpName: 'ツルヤ 飯山店',
    category: 'town',
    lat: 36.8388,
    lng: 138.3536,
    elevationM: 315,
    isPopular: false,
    keywords: ['tsuruya', 'ツルヤ', '超市', '買餸', '補貨', '飯山'],
    mapsQuery: 'Tsuruya+Iiyama+Nagano',
  },
  {
    id: 'maple-house',
    name: 'Maple House Backpackers',
    shortName: 'Maple House',
    jpName: 'Maple House Backpackers（斑尾高原）',
    category: 'hub',
    lat: 36.8548,
    lng: 138.2882,
    elevationM: 990,
    isPopular: false,
    keywords: ['maple', 'backpackers', '拯救金金', '金金', '大行洞'],
    mapsQuery: 'Maple+House+Backpackers+Madarao+1101-66+Iiyama+Nagano',
  },
  {
    id: 'toyota-iiyama-ic',
    name: '豐田飯山 IC（上信越道）',
    shortName: '豐田飯山 IC',
    jpName: '上信越自動車道 豊田飯山IC',
    category: 'hub',
    lat: 36.7916,
    lng: 138.3347,
    elevationM: 340,
    isPopular: false,
    keywords: ['豐田飯山', '豊田飯山', 'ic', '高速', '上信越', 'toyota iiyama'],
    mapsQuery: 'Toyota-Iiyama+Interchange+Nagano',
  },
  {
    id: 'matsushiro-pa',
    name: '松代 PA（上信越道下り）',
    shortName: '松代 PA',
    jpName: '松代パーキングエリア（下り）',
    category: 'hub',
    lat: 36.5656,
    lng: 138.2216,
    elevationM: 370,
    isPopular: false,
    keywords: ['松代', '松代pa', 'matsushiro', '休息站'],
    mapsQuery: 'Matsushiro+Parking+Area+Northbound',
  },
];

// Calibrated real alpine driving distances (km) between key Madarao/Iiyama/Nozawa landmarks
// Ensures 100% consistency with the itinerary cards and actual mountain road switchbacks.
const CALIBRATED_ROAD_KM: Record<string, number> = {
  'madarao|silk-in': 0.9,
  'maple-house|silk-in': 1.0,
  'madarao|maple-house': 1.4,
  'madarao|tangram': 4.5,
  'silk-in|tangram': 4.8,
  'maple-house|tangram': 4.2,
  'iiyama-station|silk-in': 13.0,
  'iiyama-station|madarao': 13.2,
  'silk-in|tsuruya': 12.2,
  'madarao|tsuruya': 12.5,
  'iiyama-station|tsuruya': 1.4,
  'romance|silk-in': 20.0,
  'madarao|romance': 20.2,
  'iiyama-station|romance': 8.2,
  'nozawa|silk-in': 26.0,
  'madarao|nozawa': 26.4,
  'iiyama-station|nozawa': 14.5,
  'nozawa|romance': 13.8,
  'nozawa|tsuruya': 15.6,
  'nozawa|tangram': 30.5,
  'silk-in|toyota-iiyama-ic': 12.5,
  'madarao|toyota-iiyama-ic': 12.8,
  'iiyama-station|toyota-iiyama-ic': 7.5,
  'nozawa|toyota-iiyama-ic': 21.5,
  'romance|toyota-iiyama-ic': 14.5,
  'matsushiro-pa|silk-in': 41.0,
  'madarao|matsushiro-pa': 41.2,
  'matsushiro-pa|toyota-iiyama-ic': 28.5,
};

function makePairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const a =
    sinLat * sinLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function parseCoordinateInput(
  raw: string,
): {lat: number; lng: number} | null {
  const cleaned = raw.trim().replace(/[，\s]+/g, ',');
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return {lat, lng};
}

export function searchOfflineLandmarks(query: string): OfflineLandmark[] {
  const q = query.trim().toLowerCase();
  if (!q) return OFFLINE_LANDMARKS;
  return OFFLINE_LANDMARKS.filter((lm) => {
    const haystack = [lm.name, lm.shortName, lm.jpName, ...lm.keywords]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function estimateDrivingToLandmarks(options: {
  originLat: number;
  originLng: number;
  originLandmarkId?: string | null;
  roadCondition: RoadCondition;
  tripMode: TripMode;
  kmPerLiter: number;
  gasPriceYen?: number;
}): DistanceEstimate[] {
  const {
    originLat,
    originLng,
    originLandmarkId,
    roadCondition,
    tripMode,
    kmPerLiter,
    gasPriceYen = DEFAULT_GAS_PRICE_YEN,
  } = options;

  const safeKmPerL = Math.max(4, Math.min(35, kmPerLiter || DEFAULT_FUEL_KM_PER_L));
  // Winter snow-tire + heater + alpine incline uses ~15% more fuel than dry flat driving
  const effectiveKmPerL =
    roadCondition === 'snow' ? safeKmPerL * 0.87 : safeKmPerL;
  // Shinshu mountain avg speed: ~36 km/h in snow, ~46 km/h dry
  const avgSpeedKmh = roadCondition === 'snow' ? 36 : 46;
  const tripMultiplier = tripMode === 'roundtrip' ? 2 : 1;

  return OFFLINE_LANDMARKS.filter((lm) => lm.id !== originLandmarkId).map(
    (landmark) => {
      let oneWayKm: number;
      let isCalibrated = false;

      if (originLandmarkId) {
        const key = makePairKey(originLandmarkId, landmark.id);
        if (CALIBRATED_ROAD_KM[key] !== undefined) {
          oneWayKm = CALIBRATED_ROAD_KM[key];
          isCalibrated = true;
        } else {
          const straightKm = haversineKm(
            originLat,
            originLng,
            landmark.lat,
            landmark.lng,
          );
          oneWayKm = Math.max(0.4, Number((straightKm * 1.42).toFixed(1)));
        }
      } else {
        const straightKm = haversineKm(
          originLat,
          originLng,
          landmark.lat,
          landmark.lng,
        );
        oneWayKm =
          straightKm < 0.25
            ? 0.3
            : Number((straightKm * 1.42).toFixed(1));
      }

      const totalKm = Number((oneWayKm * tripMultiplier).toFixed(1));
      const baseMinutes = Math.max(
        2,
        Math.round((oneWayKm / avgSpeedKmh) * 60 + (oneWayKm >= 5 ? 2 : 1)),
      );
      const totalMinutes = baseMinutes * tripMultiplier;
      const spread = Math.max(2, Math.round(totalMinutes * 0.12));
      const driveMinutesMin = Math.max(2, totalMinutes - Math.floor(spread / 2));
      const driveMinutesMax = totalMinutes + Math.ceil(spread / 2);

      const fuelLiters = Number((totalKm / effectiveKmPerL).toFixed(2));
      const estimatedYen = Math.round(fuelLiters * gasPriceYen);

      return {
        landmark,
        distanceKm: totalKm,
        driveMinutes: totalMinutes,
        driveMinutesMin,
        driveMinutesMax,
        fuelLiters,
        estimatedYen,
        isCalibrated,
      };
    },
  );
}
