import React from 'react';
import type {BannerWeatherTheme} from '../lib/weather';

interface BannerBackdropProps {
  theme: BannerWeatherTheme;
  isDay: boolean;
}

export function getBannerGradientClass(
  theme: BannerWeatherTheme,
  isDay: boolean,
): string {
  switch (theme) {
    case 'sunny':
      return isDay
        ? 'from-[#0c4a6e] via-[#0369a1] to-[#0ea5e9]'
        : 'from-[#051024] via-[#0c2344] to-[#1d3b66]';
    case 'cloudy':
      return isDay
        ? 'from-[#334155] via-[#475569] to-[#64748b]'
        : 'from-[#0f172a] via-[#1e293b] to-[#334155]';
    case 'heavy-snow':
      return isDay
        ? 'from-[#0c2342] via-[#1a3a68] to-[#34649c]'
        : 'from-[#050f20] via-[#0d203d] to-[#1a355c]';
    case 'rain':
      return isDay
        ? 'from-[#1e3a4c] via-[#2b4d61] to-[#436778]'
        : 'from-[#0a1620] via-[#152837] to-[#233b4c]';
    case 'snow':
    default:
      return isDay
        ? 'from-snow-900 via-[#153e75] to-sky-700'
        : 'from-[#071830] via-[#0f294a] to-[#1a3e6b]';
  }
}

export const BANNER_THEME_LABELS: Record<BannerWeatherTheme, string> = {
  sunny: '晴天',
  cloudy: '陰天',
  snow: '降雪',
  'heavy-snow': '降大雪',
  rain: '降雨',
};

const GENTLE_FLAKES = [
  {left: '8%', dur: '7s', delay: '0s', char: '❄', size: 11},
  {left: '23%', dur: '9s', delay: '2s', char: '•', size: 8},
  {left: '40%', dur: '6.8s', delay: '1s', char: '❄', size: 10},
  {left: '58%', dur: '8.5s', delay: '3s', char: '•', size: 9},
  {left: '74%', dur: '7.5s', delay: '0.6s', char: '❄', size: 11},
  {left: '90%', dur: '9.2s', delay: '1.6s', char: '•', size: 8},
];

const HEAVY_FLAKES = [
  {left: '4%', dur: '3.2s', delay: '0s', char: '❄', size: 12},
  {left: '11%', dur: '2.7s', delay: '0.9s', char: '•', size: 9},
  {left: '18%', dur: '3.6s', delay: '1.8s', char: '❄', size: 11},
  {left: '26%', dur: '2.9s', delay: '0.4s', char: '•', size: 10},
  {left: '34%', dur: '3.4s', delay: '2.1s', char: '❄', size: 13},
  {left: '42%', dur: '2.6s', delay: '1.1s', char: '•', size: 9},
  {left: '50%', dur: '3.1s', delay: '0.2s', char: '❄', size: 12},
  {left: '58%', dur: '2.8s', delay: '1.5s', char: '•', size: 8},
  {left: '66%', dur: '3.5s', delay: '0.7s', char: '❄', size: 11},
  {left: '74%', dur: '2.5s', delay: '2.3s', char: '•', size: 10},
  {left: '82%', dur: '3.3s', delay: '1.3s', char: '❄', size: 12},
  {left: '90%', dur: '2.9s', delay: '0.5s', char: '•', size: 9},
  {left: '96%', dur: '3.7s', delay: '1.9s', char: '❄', size: 10},
];

const RAIN_DROPS = [
  {left: '9%', dur: '1.05s', delay: '0s'},
  {left: '18%', dur: '0.9s', delay: '0.35s'},
  {left: '28%', dur: '1.15s', delay: '0.7s'},
  {left: '38%', dur: '0.95s', delay: '0.15s'},
  {left: '49%', dur: '1.1s', delay: '0.55s'},
  {left: '60%', dur: '0.88s', delay: '0.25s'},
  {left: '70%', dur: '1.05s', delay: '0.8s'},
  {left: '80%', dur: '0.92s', delay: '0.45s'},
  {left: '91%', dur: '1.12s', delay: '0.1s'},
];

const NIGHT_STARS = [
  {left: '12%', top: '18%', dur: '3.2s', delay: '0s'},
  {left: '26%', top: '12%', dur: '4.1s', delay: '1.1s'},
  {left: '44%', top: '20%', dur: '2.9s', delay: '0.5s'},
  {left: '63%', top: '14%', dur: '3.8s', delay: '1.8s'},
  {left: '76%', top: '28%', dur: '3.4s', delay: '0.8s'},
  {left: '88%', top: '16%', dur: '4.4s', delay: '1.4s'},
];

export const BannerBackdrop: React.FC<BannerBackdropProps> = ({
  theme,
  isDay,
}) => {
  return (
    <>
      <div
        aria-hidden="true"
        className="inset-0 absolute overflow-hidden pointer-events-none"
      >
        {/* 晴天：日間暖陽微光 / 夜間清澈冬夜星空 */}
        {theme === 'sunny' && isDay && (
          <div
            className="absolute -top-12 -right-10 w-48 h-48 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(254, 240, 138, 0.45) 0%, rgba(186, 230, 253, 0.18) 45%, transparent 72%)',
            }}
          />
        )}

        {theme === 'sunny' && !isDay && (
          <>
            <div
              className="absolute -top-8 right-6 w-28 h-28 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(224, 242, 254, 0.25) 0%, transparent 70%)',
              }}
            />
            {NIGHT_STARS.map((star, idx) => (
              <span
                key={idx}
                className="star-dot"
                style={{
                  left: star.left,
                  top: star.top,
                  animationDuration: star.dur,
                  animationDelay: star.delay,
                }}
              />
            ))}
          </>
        )}

        {/* 陰天／山霧：柔和漂浮薄霧 */}
        {theme === 'cloudy' && <div className="cloud-mist" />}

        {/* 降雪（輕～中雪） */}
        {theme === 'snow' &&
          GENTLE_FLAKES.map((flake, idx) => (
            <span
              key={idx}
              className="snowflake"
              style={{
                left: flake.left,
                animationDuration: flake.dur,
                animationDelay: flake.delay,
                fontSize: `${flake.size}px`,
              }}
            >
              {flake.char}
            </span>
          ))}

        {/* 降大雪（Madapow 暴雪斜吹） */}
        {theme === 'heavy-snow' && (
          <>
            <div className="cloud-mist opacity-55" />
            {HEAVY_FLAKES.map((flake, idx) => (
              <span
                key={idx}
                className="snowflake-heavy"
                style={{
                  left: flake.left,
                  animationDuration: flake.dur,
                  animationDelay: flake.delay,
                  fontSize: `${flake.size}px`,
                }}
              >
                {flake.char}
              </span>
            ))}
          </>
        )}

        {/* 降雨／濕雪 */}
        {theme === 'rain' && (
          <>
            <div className="cloud-mist opacity-45" />
            {RAIN_DROPS.map((drop, idx) => (
              <span
                key={idx}
                className="raindrop"
                style={{
                  left: drop.left,
                  animationDuration: drop.dur,
                  animationDelay: drop.delay,
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* 底部雪山遠景剪影 */}
      <svg
        className="absolute bottom-0 left-0 w-full h-14 pointer-events-none"
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill={
            theme === 'sunny' && isDay
              ? 'rgba(224, 242, 254, 0.24)'
              : 'rgba(186, 230, 253, 0.16)'
          }
          d="M0,160 L180,75 L340,145 L560,45 L790,155 L1020,55 L1240,135 L1440,65 L1440,220 L0,220 Z"
        />
        <path
          fill={
            theme === 'cloudy'
              ? 'rgba(226, 232, 240, 0.24)'
              : 'rgba(224, 242, 254, 0.25)'
          }
          d="M0,185 L240,105 L460,175 L690,85 L940,165 L1180,95 L1440,160 L1440,220 L0,220 Z"
        />
        <path
          fill="#eff6ff"
          d="M0,200 L140,168 L290,192 L490,152 L680,196 L910,158 L1130,190 L1320,162 L1440,185 L1440,220 L0,220 Z"
        />
      </svg>
    </>
  );
};
