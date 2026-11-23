export type SkiResortId = 'madarao' | 'tangram' | 'romance' | 'nozawa';

export interface LiveLiftRow {
  name: string;
  status: string;
  hours?: string;
  note?: string;
}

export interface LiveLiftPayload {
  resortId: SkiResortId;
  operationState: 'open' | 'partial' | 'closed' | 'offseason' | 'unknown';
  statusBadgeText: string;
  openLiftsSummary: string;
  operatingHours: string;
  nightSkiStatus: string;
  officialSnowDepth: string;
  advisory: string;
  lifts: LiveLiftRow[];
  summaryMarkdown?: string;
  sources: Array<{title: string; uri: string}>;
  fetchedAt: string;
}

function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#8451;|&deg;C/gi, '°C')
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLiftRunning(status: string): boolean {
  const s = status.trim();
  return (
    (s.includes('運行') && !s.includes('運休') && !s.includes('予定')) ||
    s.includes('営業中') ||
    s === '○' ||
    s === '◯' ||
    s.toLowerCase() === 'open'
  );
}

function normalizeLiftStatus(raw: string): string {
  const s = raw.trim();
  if (!s || s === '-' || s === '×') return '休止／未開放';
  if (s === '○' || s === '◯') return '運行中';
  if (s === '△') return '部分運行／減速';
  return s;
}

function computeOperationState(
  openCount: number,
  totalCount: number,
  textHint: string,
): {
  state: LiveLiftPayload['operationState'];
  badge: string;
} {
  if (openCount > 0 && openCount === totalCount) {
    return {state: 'open', badge: '全線正常運行中'};
  }
  if (openCount > 0) {
    return {state: 'partial', badge: '部分纜車運行中'};
  }
  if (
    /シーズン終了|オープン予定|準備中|グリーンシーズン|営業開始予定|からを予定/.test(
      textHint,
    )
  ) {
    return {state: 'offseason', badge: '非雪季／準備開季中'};
  }
  if (/営業終了|本日終了|CLOSE|運休|休止/.test(textHint)) {
    return {state: 'closed', badge: '本日營業結束／休止'};
  }
  return {state: 'unknown', badge: '已連線官網更新'};
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; MadaraoTripGuide/1.0; +https://madarao.jp)',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'ja,zh-TW;q=0.9,en;q=0.8',
    },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.text();
}

async function fetchMadaraoLive(): Promise<LiveLiftPayload> {
  const url = 'https://www.madarao.jp/ski/conditions';
  const html = await fetchHtml(url);
  const plain = stripHtmlToPlain(html);

  const updatedMatch = plain.match(/発表\s*([0-9/]+\s+[0-9:]+)/);
  const noticeMatch = plain.match(
    /(20\d{2}-\d{2}シーズン[^\s]*(?:\s+[^\s]{2,24})?オープン予定)/,
  );
  const snowDepthMatch = plain.match(/積雪\s*([0-9]+|-)\s*cm/);
  const snow24Match = plain.match(/降雪\(24H\)\s*([0-9]+|-)\s*cm/);

  const liftNames = [
    '第1リフト',
    '第2クワッドリフト',
    '第3リフト',
    '第5リフト',
    'スーパークワッドリフト',
    '第11リフト',
    '第12リフト',
    '第13リフト',
    '第15リフト',
  ];

  const liftSectionIdx = plain.lastIndexOf('リフト運行予定');
  const liftSection =
    liftSectionIdx >= 0 ? plain.slice(liftSectionIdx, liftSectionIdx + 900) : plain;

  const lifts: LiveLiftRow[] = [];
  for (const name of liftNames) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = liftSection.match(new RegExp(`${escaped}\\s+([^\\s]{2,16})`));
    if (m) {
      lifts.push({
        name,
        status: normalizeLiftStatus(m[1]),
      });
    }
  }

  const openCount = lifts.filter((l) => isLiftRunning(l.status)).length;
  const totalCount = lifts.length;
  const hint = `${noticeMatch?.[1] ?? ''} ${lifts.map((l) => l.status).join(' ')}`;
  const {state, badge} = computeOperationState(openCount, totalCount, hint);

  const depthRaw = snowDepthMatch?.[1];
  const snow24Raw = snow24Match?.[1];
  const officialSnowDepth =
    depthRaw && depthRaw !== '-'
      ? `積雪 ${depthRaw} cm${snow24Raw && snow24Raw !== '-' ? `（24H +${snow24Raw} cm）` : ''}`
      : '官網暫無實測積雪（非雪季或未更新）';

  const advisoryParts: string[] = [];
  if (noticeMatch?.[1]) advisoryParts.push(`官方公告：${noticeMatch[1]}`);
  if (updatedMatch?.[1]) advisoryParts.push(`官網發表時間：${updatedMatch[1]} JST`);
  if (advisoryParts.length === 0) {
    advisoryParts.push('資料直接同步自斑尾高原官方雪況頁面。');
  }

  return {
    resortId: 'madarao',
    operationState: state,
    statusBadgeText: badge,
    openLiftsSummary:
      totalCount > 0
        ? `運行中 ${openCount} / ${totalCount} 條主要吊椅`
        : '請見官網運行清單',
    operatingHours:
      state === 'offseason'
        ? '雪季常規 08:30 – 16:00（高處吊椅約 15:45 停運）'
        : '08:30 – 16:00（依當日天候調整）',
    nightSkiStatus: '僅指定週末及節假日開放夜滑（一般為 16:30 – 21:00）',
    officialSnowDepth,
    advisory: advisoryParts.join(' · '),
    lifts,
    sources: [{title: '斑尾高原スキー場 公式コンディション', uri: url}],
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchTangramLive(): Promise<LiveLiftPayload> {
  const url = 'https://www.tangram.jp/ski/ski/lift.php';
  const html = await fetchHtml(url);
  const plain = stripHtmlToPlain(html);

  const periodMatch = plain.match(
    /(20\d{2}年\d{1,2}月\d{1,2}日[^※]{0,36})/,
  );

  const lifts: LiveLiftRow[] = [];
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const match of rowMatches) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (c) => stripHtmlToPlain(c[1]),
    );
    if (cells.length >= 2 && /第\d+(?:ペア|クワッド)/.test(cells[0])) {
      const name = cells[0];
      const status = normalizeLiftStatus(cells[1]);
      const remark = cells[2] ?? '';
      const timeMatch = remark.match(/\d{1,2}:\d{2}[～〜\-–]\d{1,2}:\d{2}/);
      lifts.push({
        name,
        status,
        hours: timeMatch ? timeMatch[0].replace(/[～〜]/g, '–') : undefined,
        note:
          remark
            .replace(/\d{1,2}:\d{2}[～〜\-–]\d{1,2}:\d{2}/, '')
            .replace(/\d+m/, '')
            .trim() || undefined,
      });
    }
  }

  // Fallback for div/dl markup used by Tangram's live lift status page
  if (lifts.length === 0) {
    const liftStart = plain.indexOf('リフト名 状態');
    const courseStart = plain.indexOf('コース コース名');
    const section =
      liftStart >= 0
        ? plain.slice(
            liftStart,
            courseStart > liftStart ? courseStart : liftStart + 900,
          )
        : plain;

    const tangramDefs = [
      {label: '第1ペア', pattern: /第1ペア\s+([^\s]+)\s+([\s\S]*?)(?=第2ペア|$)/},
      {label: '第2ペア', pattern: /第2ペア\s+([^\s]+)\s+([\s\S]*?)(?=第3クワッド|$)/},
      {
        label: '第3クワッド',
        pattern: /第3クワッド\s+([^\s]+)\s+([\s\S]*?)(?=第5クワッド|$)/,
      },
      {
        label: '第5クワッド（野尻湖テラス）',
        pattern:
          /第5クワッド(?:（[^）]*）)?\s+([^\s]+)\s+([\s\S]*?)(?=第6ペア|$)/,
      },
      {label: '第6ペア', pattern: /第6ペア\s+([^\s]+)\s+([\s\S]*?)$/},
    ];

    for (const def of tangramDefs) {
      const m = section.match(def.pattern);
      if (m) {
        const remark = (m[2] ?? '').trim();
        const timeMatch = remark.match(/\d{1,2}:\d{2}[～〜\-–]\d{1,2}:\d{2}/);
        lifts.push({
          name: def.label,
          status: normalizeLiftStatus(m[1]),
          hours: timeMatch ? timeMatch[0].replace(/[～〜]/g, '–') : undefined,
          note:
            remark
              .replace(/\d{1,2}:\d{2}[～〜\-–]\d{1,2}:\d{2}/, '')
              .replace(/\d+m/, '')
              .trim() || undefined,
        });
      }
    }
  }

  const openCount = lifts.filter((l) => isLiftRunning(l.status)).length;
  const totalCount = lifts.length;
  const hint = `${periodMatch?.[1] ?? ''} ${lifts.map((l) => `${l.status} ${l.note ?? ''}`).join(' ')}`;
  const {state, badge} = computeOperationState(openCount, totalCount, hint);

  return {
    resortId: 'tangram',
    operationState: state,
    statusBadgeText: badge,
    openLiftsSummary:
      totalCount > 0
        ? `運行中 ${openCount} / ${totalCount} 條吊椅`
        : '請見官網運行狀況',
    operatingHours: '08:30 – 16:30（第 1 雙人 09:00–16:00・第 6 雙人 08:45–16:00）',
    nightSkiStatus: '特定假期及指定週末開放夜滑，平日日間營運為主',
    officialSnowDepth:
      state === 'offseason'
        ? '雪季準備中（暫無實測積雪）'
        : '請參閱官網實時積雪更新',
    advisory: periodMatch?.[1]
      ? `官方雪季營業期間：${periodMatch[1].trim()}`
      : '資料直接同步自 Tangram Ski Circus 官方運行狀況頁。',
    lifts,
    sources: [{title: 'タングラムスキーサーカス 公式運行状況', uri: url}],
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchRomanceLive(): Promise<LiveLiftPayload> {
  const homeUrl = 'https://kijimadaira-ski.com/';
  const html = await fetchHtml(homeUrl);
  const plain = stripHtmlToPlain(html);

  const openMatch = plain.match(/本日の営業\s*([A-Z]+|営業中|運休|休業|終了)/i);
  const snowMatch = plain.match(/積雪量\s*([0-9]+|-)\s*cm/);
  const updatedMatch = plain.match(/更新日時[：:]\s*([^\s]{6,22}\s*[0-9:]{0,5})/);

  const rawOp = (openMatch?.[1] ?? '').trim();
  const isCurrentlyOpen =
    rawOp.toUpperCase() === 'OPEN' || rawOp.includes('営業中');

  const lifts: LiveLiftRow[] = [];
  try {
    const gelandeHtml = await fetchHtml('https://kijimadaira-ski.com/gelande');
    const rowMatches = gelandeHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
    for (const match of rowMatches) {
      const cells = [
        ...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi),
      ].map((c) => stripHtmlToPlain(c[1]));
      if (
        cells.length >= 2 &&
        /(リフト|クワッド|ペア|スカイフォー)/.test(cells[0])
      ) {
        lifts.push({
          name: cells[0],
          status: normalizeLiftStatus(cells[1]),
          hours: cells[2]?.match(/\d{1,2}:\d{2}/) ? cells[2] : undefined,
        });
      }
    }
  } catch {
    // Subpage optional
  }

  const openCount = lifts.filter((l) => isLiftRunning(l.status)).length;
  let state: LiveLiftPayload['operationState'] = isCurrentlyOpen
    ? 'open'
    : 'closed';
  let badge = isCurrentlyOpen ? '今日營業中（OPEN）' : `今日狀態：${rawOp || 'CLOSE'}`;
  if (!isCurrentlyOpen && updatedMatch?.[1]?.includes('03月')) {
    state = 'offseason';
    badge = '非雪季休止（CLOSE）';
  }

  const depthRaw = snowMatch?.[1];
  const officialSnowDepth =
    state === 'offseason'
      ? `非雪季（上次雪季末紀錄：${depthRaw ?? '-'} cm）`
      : depthRaw && depthRaw !== '-'
        ? `官方實測積雪 ${depthRaw} cm`
        : '請對照官網最新實測';

  return {
    resortId: 'romance',
    operationState: state,
    statusBadgeText: badge,
    openLiftsSummary:
      lifts.length > 0
        ? `運行中 ${openCount} / ${lifts.length} 條吊椅`
        : isCurrentlyOpen
          ? '雪場營業中（詳見官網吊椅表）'
          : '目前關閉／非雪季休止',
    operatingHours: '雪季常規 08:45 – 16:30（上段吊椅約 15:45 停運）',
    nightSkiStatus: '無常設夜滑（日間營運為主）',
    officialSnowDepth,
    advisory: updatedMatch?.[1]
      ? `官網即時欄更新時間：${updatedMatch[1].trim()}`
      : '資料直接同步自 スノーリゾート ロマンスの神様 官方網站。',
    lifts: lifts.slice(0, 8),
    sources: [{title: 'スノーリゾート ロマンスの神様 公式', uri: homeUrl}],
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchNozawaLive(): Promise<LiveLiftPayload> {
  const liftUrl = 'https://nozawaski.com/winter/lift_price/lift_time/';
  const courseUrl = 'https://nozawaski.com/winter/course/';

  const [liftHtml, courseHtml] = await Promise.all([
    fetchHtml(liftUrl),
    fetchHtml(courseUrl).catch(() => ''),
  ]);

  const coursePlain = courseHtml ? stripHtmlToPlain(courseHtml) : '';
  const noticeMatch = coursePlain.match(
    /(ウィンターシーズンの営業は[^。]+。)/,
  );

  // Extract official multi-elevation snow depths if present
  const depthParts: string[] = [];
  const zones = [
    {key: 'やまびこエリア', label: '山彥(1,407m)'},
    {key: '上ノ平エリア', label: '上ノ平(1,230m)'},
    {key: '日影エリア', label: '日影(660m)'},
  ];
  for (const z of zones) {
    const idx = coursePlain.indexOf(z.key);
    if (idx >= 0) {
      const slice = coursePlain.slice(idx, idx + 160);
      const m = slice.match(/積雪量\s*([0-9]+)\s*cm/);
      if (m?.[1]) {
        depthParts.push(`${z.label} ${m[1]}cm`);
      }
    }
  }

  // Parse live gondola & lift rows from official lift_time table
  const priorityKeywords = [
    '長坂ゴンドラ',
    '日影ゴンドラ',
    'やまびこフォー',
    'やまびこ第2フォー',
    '上ノ平フォー',
    'パラダイスフォー',
    'スカイライン連絡ペア',
    'チャレンジペア',
  ];

  const allLifts: LiveLiftRow[] = [];
  const seenNames = new Set<string>();
  const rowMatches = liftHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  for (const match of rowMatches) {
    const cells = [...match[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(
      (c) => stripHtmlToPlain(c[1]),
    );
    if (cells.length >= 3) {
      const name = cells[1];
      if (
        !name ||
        seenNames.has(name) ||
        !/(ゴンドラ|フォー|ペア|トリプル|遊ロード)/.test(name)
      ) {
        continue;
      }
      seenNames.add(name);
      const statusText = cells[2] || cells[3] || '';
      const timeCell = cells.find((c) => /\d{1,2}:\d{2}/.test(c));
      allLifts.push({
        name,
        status: normalizeLiftStatus(statusText),
        hours: timeCell,
      });
    }
  }

  const openCount = allLifts.filter((l) => isLiftRunning(l.status)).length;
  const totalCount = allLifts.length;

  // Show priority gondolas/quads first (up to 8 rows for clean readability)
  const prioritized = [
    ...allLifts.filter((l) =>
      priorityKeywords.some((kw) => l.name.includes(kw)),
    ),
    ...allLifts.filter(
      (l) => !priorityKeywords.some((kw) => l.name.includes(kw)),
    ),
  ].slice(0, 8);

  const hint = `${noticeMatch?.[1] ?? ''} ${allLifts.map((l) => l.status).join(' ')}`;
  const {state, badge} = computeOperationState(openCount, totalCount, hint);

  return {
    resortId: 'nozawa',
    operationState: state,
    statusBadgeText: badge,
    openLiftsSummary:
      totalCount > 0
        ? `運行中 ${openCount} / ${totalCount} 條纜車＆吊椅`
        : '請見官網運行狀況',
    operatingHours: '08:30 – 16:30（長坂・日影箱型纜車至 16:00，山頂約 15:30 停運）',
    nightSkiStatus: '指定星期六及特別節日於長坂／日影開放夜滑（16:30 – 20:00）',
    officialSnowDepth:
      depthParts.length > 0
        ? depthParts.join(' · ')
        : '官網暫無實測積雪（非雪季或未更新）',
    advisory:
      noticeMatch?.[1] ??
      '資料直接同步自野澤溫泉スキー場官方纜車運行時間表。',
    lifts: prioritized,
    sources: [
      {title: '野沢温泉スキー場 公式リフト運行状況', uri: liftUrl},
      {title: '野沢温泉 ゲレンデ積雪情報', uri: courseUrl},
    ],
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchOfficialResortLifts(
  resortId: SkiResortId,
): Promise<LiveLiftPayload> {
  switch (resortId) {
    case 'madarao':
      return fetchMadaraoLive();
    case 'tangram':
      return fetchTangramLive();
    case 'romance':
      return fetchRomanceLive();
    case 'nozawa':
      return fetchNozawaLive();
  }
}
