export type BookingRefId = 'TUKQQH' | 'VLNWFF';

export type SeatLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type SeatPositionLabel = '窗邊' | '中間' | '走廊';

export interface BookingGroupInfo {
  ref: BookingRefId;
  label: string;
  paxCount: number;
  checkedKgPerPax: number;
  totalCheckedKg: number;
  oversizedCount: number;
  seatZoneLabel: string;
}

export interface OutboundSeatAssignment {
  code: string;
  row: 4 | 5 | 6 | 7;
  letter: SeatLetter;
  passengerName: string;
  initials: string;
  bookingRef: BookingRefId;
  seatTypeLabel: string;
  position: SeatPositionLabel;
}

export const MY_SEAT_STORAGE_KEY = 'madarao_2027_my_seat';

export const BOOKING_GROUPS: Record<BookingRefId, BookingGroupInfo> = {
  TUKQQH: {
    ref: 'TUKQQH',
    label: '8人主團訂單',
    paxCount: 8,
    checkedKgPerPax: 30,
    totalCheckedKg: 240,
    oversizedCount: 2,
    seatZoneLabel: '第 4–6 排（含 5D）',
  },
  VLNWFF: {
    ref: 'VLNWFF',
    label: '3人同行訂單',
    paxCount: 3,
    checkedKgPerPax: 25,
    totalCheckedKg: 75,
    oversizedCount: 1,
    seatZoneLabel: '第 7 排 A–C',
  },
};

export const OUTBOUND_SEAT_ROWS = [4, 5, 6, 7] as const;

// 2027/02/14 去程 GK28（Airbus A321neo 3-3 佈局）最新已確認座位
export const OUTBOUND_SEATS: OutboundSeatAssignment[] = [
  // Row 4 - TUKQQH
  {
    code: '4A',
    row: 4,
    letter: 'A',
    passengerName: 'Ting Yuk Chau',
    initials: 'TC',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '窗邊',
  },
  {
    code: '4B',
    row: 4,
    letter: 'B',
    passengerName: 'Man Sze Angela Au',
    initials: 'MA',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '中間',
  },
  {
    code: '4C',
    row: 4,
    letter: 'C',
    passengerName: 'Kai Shun Wong',
    initials: 'KW',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '走廊',
  },
  // Row 5 - TUKQQH（含右側走廊位 5D）
  {
    code: '5A',
    row: 5,
    letter: 'A',
    passengerName: 'Chuen Yau Chan',
    initials: 'CC',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '窗邊',
  },
  {
    code: '5B',
    row: 5,
    letter: 'B',
    passengerName: 'Wing Hang Tam',
    initials: 'WT',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '中間',
  },
  {
    code: '5C',
    row: 5,
    letter: 'C',
    passengerName: 'Ka Yan Chan',
    initials: 'KC',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '走廊',
  },
  {
    code: '5D',
    row: 5,
    letter: 'D',
    passengerName: 'Hok Man Fung',
    initials: 'HF',
    bookingRef: 'TUKQQH',
    seatTypeLabel: 'Upfront 前排',
    position: '走廊',
  },
  // Row 6 - TUKQQH（6A、6B 未列於此兩張訂單）
  {
    code: '6C',
    row: 6,
    letter: 'C',
    passengerName: 'Tai Wai Poon',
    initials: 'TP',
    bookingRef: 'TUKQQH',
    seatTypeLabel: '標準位',
    position: '走廊',
  },
  // Row 7 - VLNWFF
  {
    code: '7A',
    row: 7,
    letter: 'A',
    passengerName: 'Chun Kwong Yuen',
    initials: 'CY',
    bookingRef: 'VLNWFF',
    seatTypeLabel: '標準／前段位',
    position: '窗邊',
  },
  {
    code: '7B',
    row: 7,
    letter: 'B',
    passengerName: 'Sui Kai Yuen',
    initials: 'SY',
    bookingRef: 'VLNWFF',
    seatTypeLabel: '標準／前段位',
    position: '中間',
  },
  {
    code: '7C',
    row: 7,
    letter: 'C',
    passengerName: 'Fei Lung Ng',
    initials: 'FN',
    bookingRef: 'VLNWFF',
    seatTypeLabel: '標準／前段位',
    position: '走廊',
  },
];

export const OUTBOUND_SEAT_BY_CODE: Record<string, OutboundSeatAssignment> =
  OUTBOUND_SEATS.reduce<Record<string, OutboundSeatAssignment>>((acc, seat) => {
    acc[seat.code] = seat;
    return acc;
  }, {});

export function getOutboundSeat(
  code: string | null | undefined,
): OutboundSeatAssignment | null {
  if (!code) return null;
  return OUTBOUND_SEAT_BY_CODE[code] ?? null;
}

export function readStoredSeat(): string | null {
  try {
    const saved = localStorage.getItem(MY_SEAT_STORAGE_KEY);
    if (saved === '6B') {
      localStorage.setItem(MY_SEAT_STORAGE_KEY, '5D');
      return '5D';
    }
    if (saved && OUTBOUND_SEAT_BY_CODE[saved]) {
      return saved;
    }
  } catch {
    // Ignore storage read errors
  }
  return null;
}

export function saveStoredSeat(code: string | null): void {
  try {
    if (code) {
      localStorage.setItem(MY_SEAT_STORAGE_KEY, code);
    } else {
      localStorage.removeItem(MY_SEAT_STORAGE_KEY);
    }
  } catch {
    // Ignore storage write errors
  }
}
