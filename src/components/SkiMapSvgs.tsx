import React from 'react';
import type {ResortKey} from '../types/trip';

export const HighwayRouteSvg: React.FC = () => (
  <svg viewBox="0 0 360 280" className="w-full h-auto select-none">
    <defs>
      <linearGradient id="roadGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0f294a" />
      </linearGradient>
      <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow
          dx="0"
          dy="2"
          stdDeviation="2"
          floodColor="#0f294a"
          floodOpacity="0.18"
        />
      </filter>
    </defs>

    <path
      d="M-10,235 Q95,215 180,245 T370,225"
      fill="none"
      stroke="#bae6fd"
      strokeWidth="1"
      strokeDasharray="3 3"
      opacity="0.7"
    />
    <path
      d="M-10,165 Q110,145 210,175 T370,150"
      fill="none"
      stroke="#bae6fd"
      strokeWidth="1"
      strokeDasharray="3 3"
      opacity="0.6"
    />
    <path
      d="M235,68 L268,26 L298,64 L322,36 L348,68 Z"
      fill="#dbeafe"
      opacity="0.8"
    />
    <path d="M268,26 L258,39 L268,35 L278,39 Z" fill="#ffffff" />
    <path d="M322,36 L314,46 L322,43 L330,46 Z" fill="#ffffff" />

    <g transform="translate(322, 232)" opacity="0.55">
      <circle cx="0" cy="0" r="14" fill="none" stroke="#64748b" strokeWidth="1" />
      <polygon points="0,-10 3,0 0,-3 -3,0" fill="#dc2626" />
      <polygon points="0,10 3,0 0,3 -3,0" fill="#64748b" />
      <text
        x="0"
        y="-16"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="#475569"
      >
        N
      </text>
    </g>

    <path
      d="M 48 232 C 100 232, 125 202, 175 192 C 235 180, 275 162, 265 130 C 255 100, 175 105, 135 76 C 118 56, 152 49, 186 44 C 206 41, 224 34, 242 30"
      fill="none"
      stroke="#bae6fd"
      strokeWidth="11"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M 48 232 C 100 232, 125 202, 175 192 C 235 180, 275 162, 265 130 C 255 100, 175 105, 135 76 C 118 56, 152 49, 186 44 C 206 41, 224 34, 242 30"
      fill="none"
      stroke="url(#roadGrad)"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeDasharray="7 4"
    />

    <rect
      x="64"
      y="192"
      width="76"
      height="16"
      rx="8"
      fill="#ffffff"
      stroke="#bae6fd"
      strokeWidth="1"
    />
    <text
      x="102"
      y="203"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0369a1"
    >
      114km · 1h23m
    </text>

    <rect
      x="248"
      y="164"
      width="78"
      height="16"
      rx="8"
      fill="#ffffff"
      stroke="#bae6fd"
      strokeWidth="1"
    />
    <text
      x="287"
      y="175"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0369a1"
    >
      82.9km · 1h06m
    </text>

    <rect
      x="148"
      y="96"
      width="76"
      height="16"
      rx="8"
      fill="#ffffff"
      stroke="#bae6fd"
      strokeWidth="1"
    />
    <text
      x="186"
      y="107"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0369a1"
    >
      141km · 1h41m
    </text>

    <rect
      x="72"
      y="20"
      width="72"
      height="16"
      rx="8"
      fill="#ffffff"
      stroke="#bae6fd"
      strokeWidth="1"
    />
    <text
      x="108"
      y="31"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0f294a"
    >
      41km · 35m
    </text>

    <g filter="url(#nodeShadow)">
      <circle cx="48" cy="232" r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="48"
        y="253"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fill="#0f172a"
      >
        成田機場 T3
      </text>
      <text x="48" y="264" textAnchor="middle" fontSize="8.5" fill="#475569">
        09:30 出發
      </text>
    </g>

    <g filter="url(#nodeShadow)">
      <circle cx="175" cy="192" r="8" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="182"
        y="216"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fill="#0369a1"
      >
        ① 三芳 PA (下り)
      </text>
      <text x="182" y="227" textAnchor="middle" fontSize="8.5" fill="#475569">
        10:55 – 11:25
      </text>
    </g>

    <g filter="url(#nodeShadow)">
      <circle cx="265" cy="130" r="10.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="265"
        y="133.5"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="bold"
        fill="#ffffff"
      >
        ★
      </text>
      <text
        x="292"
        y="99"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fill="#b45309"
      >
        ② AEON MALL 高崎
      </text>
      <text
        x="292"
        y="110"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="bold"
        fill="#92400e"
      >
        12:30 – 14:15 (大補貨)
      </text>
    </g>

    <g filter="url(#nodeShadow)">
      <circle cx="135" cy="76" r="8" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="68"
        y="72"
        textAnchor="middle"
        fontSize="10.5"
        fontWeight="bold"
        fill="#0369a1"
      >
        ③ 松代 PA (下り)
      </text>
      <text x="68" y="83" textAnchor="middle" fontSize="8.5" fill="#475569">
        15:55 – 16:25
      </text>
    </g>

    <g filter="url(#nodeShadow)">
      <circle cx="186" cy="44" r="8" fill="#e11d48" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="194"
        y="66"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="bold"
        fill="#be123c"
      >
        ④ Maple House
      </text>
      <text
        x="194"
        y="77"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#e11d48"
      >
        拯救金金大行洞
      </text>
    </g>

    <g filter="url(#nodeShadow)">
      <circle cx="242" cy="30" r="9.5" fill="#0f294a" stroke="#ffffff" strokeWidth="2.5" />
      <text
        x="301"
        y="28"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#0f294a"
      >
        ホテルシルクイン斑尾
      </text>
      <text
        x="301"
        y="40"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="bold"
        fill="#0284c7"
      >
        17:15 – 17:25 抵達
      </text>
    </g>
  </svg>
);

export const LocalDriveSvg: React.FC = () => (
  <svg viewBox="0 0 360 165" className="w-full h-auto select-none">
    <line
      x1="78"
      y1="85"
      x2="185"
      y2="85"
      stroke="#0284C7"
      strokeWidth="3"
      strokeDasharray="5 3"
    />
    <line
      x1="185"
      y1="85"
      x2="295"
      y2="38"
      stroke="#E11D48"
      strokeWidth="2.5"
      strokeDasharray="5 3"
    />
    <line
      x1="185"
      y1="85"
      x2="295"
      y2="132"
      stroke="#0F294A"
      strokeWidth="2.5"
      strokeDasharray="5 3"
    />

    <rect
      x="106"
      y="64"
      width="54"
      height="16"
      rx="8"
      fill="#FFFFFF"
      stroke="#BAE6FD"
      strokeWidth="1"
    />
    <text
      x="133"
      y="75"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0369A1"
    >
      約 22 分
    </text>

    <rect
      x="212"
      y="42"
      width="54"
      height="16"
      rx="8"
      fill="#FFFFFF"
      stroke="#FECDD3"
      strokeWidth="1"
    />
    <text
      x="239"
      y="53"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#BE123C"
    >
      約 35 分
    </text>

    <rect
      x="212"
      y="112"
      width="54"
      height="16"
      rx="8"
      fill="#FFFFFF"
      stroke="#CBD5E1"
      strokeWidth="1"
    />
    <text
      x="239"
      y="123"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="bold"
      fill="#0F294A"
    >
      約 42 分
    </text>

    <circle cx="78" cy="85" r="9" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2.5" />
    <text
      x="78"
      y="106"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="bold"
      fill="#0F172A"
    >
      斑尾高原酒店
    </text>
    <text x="78" y="117" textAnchor="middle" fontSize="7.5" fill="#64748B">
      海拔約 1,000m
    </text>

    <circle cx="185" cy="85" r="8.5" fill="#0EA5E9" stroke="#FFFFFF" strokeWidth="2.5" />
    <text
      x="185"
      y="106"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="bold"
      fill="#0369A1"
    >
      ① 飯山市區
    </text>
    <text x="185" y="117" textAnchor="middle" fontSize="7.5" fill="#64748B">
      落山必經 · 超市/晚飯
    </text>

    <circle cx="295" cy="38" r="8" fill="#E11D48" stroke="#FFFFFF" strokeWidth="2.5" />
    <text
      x="295"
      y="23"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="bold"
      fill="#BE123C"
    >
      ② ロマンスの神様
    </text>
    <text x="295" y="57" textAnchor="middle" fontSize="7.5" fill="#64748B">
      經飯山市區往木島平
    </text>

    <circle cx="295" cy="132" r="8" fill="#0F294A" stroke="#FFFFFF" strokeWidth="2.5" />
    <text
      x="295"
      y="151"
      textAnchor="middle"
      fontSize="9.5"
      fontWeight="bold"
      fill="#0F294A"
    >
      ③ 野沢温泉スキー場
    </text>
    <text x="295" y="161" textAnchor="middle" fontSize="7.5" fill="#64748B">
      沿千曲川國道 117 號北上
    </text>
  </svg>
);

export const ResortOverviewSvg: React.FC<{
  resort: ResortKey;
  className?: string;
}> = ({resort, className = 'w-full h-auto select-none'}) => {
  if (resort === 'madarao') {
    return (
      <svg viewBox="0 0 360 230" className={className}>
        <polygon
          points="8,205 135,26 238,60 352,205"
          fill="#E0F2FE"
          stroke="#BAE6FD"
          strokeWidth="1.5"
        />
        <polygon points="135,26 112,60 135,50 158,60" fill="#FFFFFF" />
        <text
          x="135"
          y="17"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#0F294A"
        >
          斑尾山 1,381m (Mt. Madarao)
        </text>

        <line
          x1="205"
          y1="50"
          x2="232"
          y2="200"
          stroke="#7C3AED"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <rect
          x="168"
          y="106"
          width="88"
          height="16"
          rx="8"
          fill="#F3E8FF"
          stroke="#C084FC"
          strokeWidth="1"
        />
        <text
          x="212"
          y="117"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="bold"
          fill="#6B21A8"
        >
          タングラム境界線
        </text>

        <rect x="36" y="64" width="144" height="26" rx="6" fill="#0F294A" />
        <text
          x="108"
          y="75"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          21 Powder Theater · 23 Wave 2
        </text>
        <text x="108" y="85" textAnchor="middle" fontSize="7" fill="#BAE6FD">
          29 NINJA · 30-32 SAWA I-III 天然半管
        </text>

        <rect
          x="18"
          y="132"
          width="88"
          height="26"
          rx="6"
          fill="#E0F2FE"
          stroke="#38BDF8"
          strokeWidth="1"
        />
        <text
          x="62"
          y="143"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#0369A1"
        >
          27 Crystal Bowl
        </text>
        <text x="62" y="153" textAnchor="middle" fontSize="7" fill="#0284C7">
          第13 Lift · 13號/14號非壓雪
        </text>

        <rect
          x="112"
          y="132"
          width="84"
          height="26"
          rx="6"
          fill="#FEF3C7"
          stroke="#FBBF24"
          strokeWidth="1"
        />
        <text
          x="154"
          y="143"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#92400E"
        >
          17 Free Ride Park
        </text>
        <text x="154" y="153" textAnchor="middle" fontSize="7" fill="#B45309">
          8 Carving · 9 Giant 紅黑線
        </text>

        <rect
          x="246"
          y="84"
          width="96"
          height="24"
          rx="6"
          fill="#F3E8FF"
          stroke="#C084FC"
          strokeWidth="1"
        />
        <text
          x="294"
          y="94"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#6B21A8"
        >
          野尻湖テラス・ラウンジ
        </text>
        <text x="294" y="104" textAnchor="middle" fontSize="7" fill="#7E22CE">
          Tangram 第1 &amp; 第2 Lift
        </text>

        <rect
          x="244"
          y="138"
          width="96"
          height="24"
          rx="6"
          fill="#E0F2FE"
          stroke="#38BDF8"
          strokeWidth="1"
        />
        <text
          x="292"
          y="148"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#0369A1"
        >
          タングラム斑尾側
        </text>
        <text x="292" y="158" textAnchor="middle" fontSize="7" fill="#0284C7">
          第3/第5 Quad · 樹林區
        </text>

        <rect x="16" y="186" width="186" height="26" rx="8" fill="#0F294A" />
        <text
          x="109"
          y="197"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          白樺租借 · 餐廳 Heidi (第1 Lift 下部)
        </text>
        <text x="109" y="207" textAnchor="middle" fontSize="7" fill="#93C5FD">
          Aki&apos;s Pub &amp; Cafe · 總合案內所
        </text>

        <rect x="238" y="186" width="108" height="26" rx="8" fill="#4C1D95" />
        <text
          x="292"
          y="202"
          textAnchor="middle"
          fontSize="8.5"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          Hotel Tangram 基地
        </text>
      </svg>
    );
  }

  if (resort === 'romance') {
    return (
      <svg viewBox="0 0 360 210" className={className}>
        <polygon
          points="26,192 155,20 334,192"
          fill="#E0F2FE"
          stroke="#BAE6FD"
          strokeWidth="1.5"
        />
        <polygon points="155,20 135,50 155,42 175,50" fill="#FFFFFF" />
        <text
          x="155"
          y="14"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#0F294A"
        >
          高社山 1,351m
        </text>

        <rect x="86" y="46" width="138" height="24" rx="6" fill="#0F172A" />
        <text
          x="155"
          y="57"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          A パイオニア(全非圧雪) · B ウエッスン
        </text>
        <text x="155" y="66" textAnchor="middle" fontSize="7" fill="#FCA5A5">
          パイオニアリフト (870m) 上級黑線區
        </text>

        <rect
          x="34"
          y="92"
          width="110"
          height="26"
          rx="6"
          fill="#FFE4E6"
          stroke="#FB7185"
          strokeWidth="1"
        />
        <text
          x="89"
          y="103"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#BE123C"
        >
          G シルクコース (594m)
        </text>
        <text x="89" y="113" textAnchor="middle" fontSize="7" fill="#9F1239">
          約350m Banked Slalom＋波浪地形
        </text>

        <rect
          x="166"
          y="92"
          width="128"
          height="26"
          rx="6"
          fill="#FEF2F2"
          stroke="#F87171"
          strokeWidth="1"
        />
        <text
          x="230"
          y="103"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#B91C1C"
        >
          D R40陡坡 · E パッション · F スカイ
        </text>
        <text x="230" y="113" textAnchor="middle" fontSize="7" fill="#991B1B">
          降雪時全非壓雪・中上級高速巡航
        </text>

        <rect
          x="70"
          y="146"
          width="220"
          height="24"
          rx="6"
          fill="#E0F2FE"
          stroke="#38BDF8"
          strokeWidth="1"
        />
        <text
          x="180"
          y="156"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#0369A1"
        >
          C ヤマビコ連絡路 · スカイリフト (1,203m)
        </text>
        <text x="180" y="166" textAnchor="middle" fontSize="7" fill="#0284C7">
          ロマンスリフト (645m) · 中央 / 山麓 P 停車場
        </text>

        <rect x="95" y="180" width="170" height="20" rx="8" fill="#0F294A" />
        <text
          x="180"
          y="193"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#FFFFFF"
        >
          山麓基地 · 免費大型停車場
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 360 225" className={className}>
      <polygon
        points="10,205 195,20 350,205"
        fill="#E0F2FE"
        stroke="#BAE6FD"
        strokeWidth="1.5"
      />
      <polygon points="195,20 170,52 195,43 220,52" fill="#FFFFFF" />
      <text
        x="195"
        y="14"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#0F294A"
      >
        毛無山山頂 1,650m (YAMABIKO)
      </text>

      <rect x="130" y="44" width="130" height="24" rx="6" fill="#0F294A" />
      <text
        x="195"
        y="54"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        1–5 YAMABIKO A–E 粉雪樹林
      </text>
      <text x="195" y="64" textAnchor="middle" fontSize="7" fill="#BAE6FD">
        山彥站 1,417m (高海拔乾粉雪區)
      </text>

      <rect x="52" y="84" width="138" height="24" rx="6" fill="#1E293B" />
      <text
        x="121"
        y="94"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        16 SCHNEIDER · 18 39度陡壁
      </text>
      <text x="121" y="104" textAnchor="middle" fontSize="7" fill="#FCA5A5">
        24–25 KANDAHAR 國際賽道黑線
      </text>

      <rect
        x="218"
        y="88"
        width="118"
        height="24"
        rx="6"
        fill="#FFE4E6"
        stroke="#FB7185"
        strokeWidth="1"
      />
      <text
        x="277"
        y="98"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#BE123C"
      >
        26 SKYLINE (3,500m)
      </text>
      <text x="277" y="108" textAnchor="middle" fontSize="7" fill="#9F1239">
        超爽高速山脊全景紅線
      </text>

      <rect
        x="42"
        y="138"
        width="115"
        height="24"
        rx="6"
        fill="#FEF3C7"
        stroke="#FBBF24"
        strokeWidth="1"
      />
      <text
        x="99"
        y="148"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#92400E"
      >
        27 GRAND PRIX 黑線
      </text>
      <text x="99" y="158" textAnchor="middle" fontSize="7" fill="#B45309">
        日影站 660m · 陡坡大回轉
      </text>

      <rect
        x="172"
        y="138"
        width="130"
        height="24"
        rx="6"
        fill="#E0F2FE"
        stroke="#38BDF8"
        strokeWidth="1"
      />
      <text
        x="237"
        y="148"
        textAnchor="middle"
        fontSize="8"
        fontWeight="bold"
        fill="#0369A1"
      >
        NAGASAKA 長坂站 627m
      </text>
      <text x="237" y="158" textAnchor="middle" fontSize="7" fill="#0284C7">
        長坂高速箱纜 (直達山頂 1,417m)
      </text>

      <rect x="55" y="182" width="250" height="24" rx="8" fill="#1E293B" />
      <text
        x="180"
        y="197"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        野澤溫泉街 · 13 個免費外湯 · 村內免費接駁巴士
      </text>
    </svg>
  );
};
