import type {WeatherResortId} from '../lib/weather';

export interface OfflineLiftReference {
  name: string;
  role: string;
  typicalHours: string;
}

export interface ResortLiftSchedule {
  resortId: WeatherResortId;
  resortQueryName: string;
  standardHours: string;
  lastLiftNote: string;
  nightSkiNote: string;
  totalLiftsSummary: string;
  ticketCounterHours: string;
  officialStatusUrl: string;
  officialStatusLabel: string;
  keyLifts: OfflineLiftReference[];
}

export const RESORT_LIFT_SCHEDULES: Record<WeatherResortId, ResortLiftSchedule> =
  {
    madarao: {
      resortId: 'madarao',
      resortQueryName: '斑尾高原スキー場 Madarao Mountain Resort',
      standardHours: '08:30 – 16:00',
      lastLiftNote: '第 11、13、15 號高處及樹林區吊椅多於 15:30 – 15:45 停運',
      nightSkiNote: '只限指定週末及假期晚間開放（一般為 16:30 – 21:00，2 月中旬多以日間為主）',
      totalLiftsSummary: '主雪場 9–11 條主要吊椅（連通 Tangram 共約 15 條）',
      ticketCounterHours: '08:00 – 16:00（白樺／餐廳海蒂售票處）',
      officialStatusUrl: 'https://www.madarao.jp/ski/conditions',
      officialStatusLabel: '斑尾高原官網即時運行狀況',
      keyLifts: [
        {
          name: 'Super Quad（スーパークワッド）',
          role: '主幹道高速四人吊椅・直上中腹',
          typicalHours: '08:30 – 16:00',
        },
        {
          name: '第 11 號／第 12 號吊椅',
          role: '通往山頂＆樹林粉雪區（Powder Wave）',
          typicalHours: '08:45 – 15:45',
        },
        {
          name: '第 13 號單人吊椅',
          role: '登頂大潮樹林・受強風影響易暫停',
          typicalHours: '09:00 – 15:30',
        },
        {
          name: '第 15 號吊椅',
          role: '連接 Tangram 共通雪道關鍵吊椅',
          typicalHours: '08:45 – 15:45',
        },
      ],
    },
    tangram: {
      resortId: 'tangram',
      resortQueryName: 'タングラムスキーサーカス Tangram Ski Circus',
      standardHours: '08:30 – 16:30',
      lastLiftNote: '往斑尾高原山頂連接道吊椅約 15:30 停止最後上山',
      nightSkiNote: '只限特定年末及指定週末夜滑，平日多為日間營運',
      totalLiftsSummary: '共 5 條吊椅（2 條四人高速 + 3 條雙人）',
      ticketCounterHours: '08:15 – 16:30（Hotel Tangram 正門）',
      officialStatusUrl: 'https://www.tangram.jp/ski/ski/lift.php',
      officialStatusLabel: 'Tangram 官網雪道與纜車運行表',
      keyLifts: [
        {
          name: '第 1 高速四人吊椅（第1クワッド）',
          role: '基地主幹線・全雪道出發點',
          typicalHours: '08:30 – 16:30',
        },
        {
          name: '第 3 高速四人吊椅（第3クワッド）',
          role: '上野尻湖露台及連接斑尾關鍵線',
          typicalHours: '08:45 – 15:45',
        },
        {
          name: '第 5 吊椅（第5リフト）',
          role: '主攻初級及中級壓雪巡航道',
          typicalHours: '08:45 – 16:00',
        },
      ],
    },
    romance: {
      resortId: 'romance',
      resortQueryName:
        'スノーリゾートロマンスの神様 旧木島平スキー場 Snow Resort Romance no Kamisama Kijimadaira',
      standardHours: '08:45 – 16:30',
      lastLiftNote: '上段高速吊椅多於 15:45 – 16:00 結束載客',
      nightSkiNote: '目前無常設夜滑（日間營運為主）',
      totalLiftsSummary: '共 6–8 條吊椅（主打超闊壓雪道與 46° Pioneer 陡坡）',
      ticketCounterHours: '08:15 – 16:00（雪場中心票亭）',
      officialStatusUrl: 'https://kijimadaira-ski.com/',
      officialStatusLabel: 'ロマンスの神様 官網運行情報',
      keyLifts: [
        {
          name: '第 1 雙人／主要高速四人吊椅',
          role: '基地往主雪道與超闊入門緩坡',
          typicalHours: '08:45 – 16:30',
        },
        {
          name: '上段中級＆急坡吊椅',
          role: '通往高社山景觀線與 Pioneer 粉雪陡坡',
          typicalHours: '09:00 – 15:45',
        },
      ],
    },
    nozawa: {
      resortId: 'nozawa',
      resortQueryName: '野沢温泉スキー場 Nozawa Onsen Snow Resort',
      standardHours: '08:30 – 16:30',
      lastLiftNote: '山頂毛無山及山彥區吊椅約 15:30 – 15:45 起陸續停運',
      nightSkiNote: '逢指定星期六及節假日於長坂／日影區開放夜滑（約 16:30 – 20:00）',
      totalLiftsSummary: '共 18–20 條纜車吊椅（含長坂・日影 2 條大型箱型纜車）',
      ticketCounterHours: '08:10 – 16:30（長坂・日影中心；遊步道 08:00 開放）',
      officialStatusUrl: 'https://nozawaski.com/winter/lift_price/lift_time/',
      officialStatusLabel: '野澤溫泉官網即時纜車＆雪道表',
      keyLifts: [
        {
          name: '長坂箱型纜車（長坂ゴンドラ）',
          role: '最新 10 人座主纜車・約 8 分鐘直達上ノ平',
          typicalHours: '08:30 – 16:00',
        },
        {
          name: '日影箱型纜車（日影ゴンドラ）',
          role: '由日影基地直上上ノ平（連通遊步道）',
          typicalHours: '08:30 – 16:00',
        },
        {
          name: '山彥四人吊椅（やまびこフォー）',
          role: '山頂 1,650m 毛無山頂級粉雪區',
          typicalHours: '08:45 – 15:30',
        },
        {
          name: '上ノ平四人吊椅（上の平フォー）',
          role: '中段超闊巡航道・新手最愛',
          typicalHours: '08:45 – 15:45',
        },
      ],
    },
  };
