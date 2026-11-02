import { useId } from 'react';

// A continuous silhouette avoids overlapping limb outlines at small screen sizes.
const FIGURE =
  'M166 141 C160 131 158 116 160 99 C159 72 172 58 194 57 C219 55 235 70 235 96 L234 119 C238 117 241 122 239 131 C237 139 233 143 229 144 L226 155 C240 160 250 173 255 195 L269 241 C274 258 270 274 263 285 C285 296 305 308 306 322 C307 338 285 343 262 341 L230 339 C222 343 219 355 208 361 C199 366 186 363 185 354 C184 342 192 332 195 324 L178 321 C175 334 174 348 165 355 C154 365 139 370 129 364 C122 360 126 351 134 344 L142 330 C144 316 140 303 135 285 L120 246 C102 240 96 231 100 219 C106 201 119 183 135 173 C142 164 154 161 168 159 Z';

// Fixed noise and a handful of ellipses make a repeatable, body-shaped stipple field.
// Thousands of dots share two paths, so there are no per-particle DOM nodes or timers.
function noise(value: number): number {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}
const ENVELOPE = [
  [198, 111, 55, 72],
  [192, 219, 77, 96],
  [132, 220, 43, 45],
  [159, 292, 45, 68],
  [246, 315, 80, 42],
  [180, 348, 61, 27],
] as const;

function auraDots(): { black: string; white: string } {
  const black: string[] = [];
  const white: string[] = [];
  for (let index = 0; index < 42000; index++) {
    const x = 48 + noise(index * 3) * 308;
    const y = 16 + noise(index * 3 + 1) * 372;
    const distance = Math.min(
      ...ENVELOPE.map(([cx, cy, rx, ry]) => Math.hypot((x - cx) / rx, (y - cy) / ry)),
    );
    const density = Math.exp(-Math.pow(Math.max(0, distance - 0.76) / 0.31, 2));
    if (noise(index * 3 + 2) > density * 0.86) continue;
    // Round caps turn each short mark into a dot; vary length slightly for organic grain.
    const length = (noise(index + 60000) * 0.35 + 0.01).toFixed(2);
    const dot = `M${x.toFixed(2)} ${y.toFixed(2)}h${length}`;
    (noise(index + 90000) < 0.19 ? white : black).push(dot);
  }
  return { black: black.join(''), white: white.join('') };
}
const DOTS = auraDots();

export function Anomaly({ paused }: { paused: boolean }) {
  const gradient = useId();
  return (
    <div className={`anomaly${paused ? ' anomaly-paused' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 400 400" fill="none">
        <defs>
          <radialGradient id={gradient} cx=".42" cy=".3" r=".85">
            <stop stopColor="#fff" />
            <stop offset=".72" stopColor="#f9f9f7" />
            <stop offset="1" stopColor="#dededb" />
          </radialGradient>
        </defs>
        <g className="anomaly-aura" strokeLinecap="round" strokeWidth="1.5">
          <path d={DOTS.black} stroke="#101111" />
          <path d={DOTS.white} stroke="#fff" opacity=".62" />
        </g>
        <g className="anomaly-figure">
          <ellipse cx="211" cy="339" rx="103" ry="18" fill="#101111" />
          <path d={FIGURE} fill={`url(#${gradient})`} stroke="#181919" strokeWidth=".8" />
          {/* Only the negative spaces describe the arms; no overlapping construction lines. */}
          <path
            d="M144 192 Q133 200 130 211 L149 218 Q153 202 144 192Z M245 224 Q248 244 252 254 L244 278 L236 274 L238 250Z"
            fill="#101111"
          />
          <path
            d="M120 246 Q143 243 155 258 M195 324 Q202 311 211 309 M168 159 Q183 173 202 171"
            stroke="#91918d"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
