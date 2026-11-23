export type TabId = 'flight' | 'route' | 'hotel' | 'skimap' | 'weather' | 'local';

export type ResortKey = 'madarao' | 'romance' | 'nozawa';

export type MapMode = 'svg' | 'webp';

export type CarId = 'Car A' | 'Car B' | 'Car C';

export interface ResortConfig {
  key: ResortKey;
  title: string;
  webpSrc: string;
  filename: string;
}

export const RESORT_CONFIGS: Record<ResortKey, ResortConfig> = {
  madarao: {
    key: 'madarao',
    title: '斑尾高原 × タングラム斑尾 雪道圖',
    webpSrc: './maps/madarao.webp',
    filename: 'madarao.webp',
  },
  romance: {
    key: 'romance',
    title: 'スノーリゾートロマンスの神様 雪道圖',
    webpSrc: './maps/romance.webp',
    filename: 'romance.webp',
  },
  nozawa: {
    key: 'nozawa',
    title: '野沢温泉スキー場 2026 雪道圖',
    webpSrc: './maps/nozawa.webp',
    filename: 'nozawa.webp',
  },
};
