// Original proportion study, rendered entirely as points rather than a filled avatar.
const TORSO =
  'M189 102 L188 112 Q172 112 165 121 Q169 144 178 164 Q181 179 175 198 Q172 209 181 221 L194 226 L200 217 L206 226 L219 221 Q228 209 225 198 Q219 179 222 164 Q231 144 235 121 Q228 112 212 112 L211 102';
const ARM =
  'M166 118 Q151 115 134 119 L104 121 L76 121 L59 119 L46 123 L47 128 L60 130 L77 132 L104 133 L137 134 Q153 137 171 134';
const LEG =
  'M180 215 Q172 241 177 268 Q181 279 182 293 L185 331 L183 342 L179 347 Q178 351 186 352 L199 351 L198 345 L196 332 L198 296 Q201 278 196 263 L199 233';
const RAISED_ARM =
  'M165 120 Q148 111 132 101 L105 86 L83 70 L74 60 L66 56 L61 61 L68 71 L79 81 L99 96 L126 113 Q147 129 168 134';
const SPREAD_LEG =
  'M179 211 Q163 231 152 252 L132 283 L111 320 L100 325 L95 332 Q97 339 105 337 L120 330 L139 300 L162 274 Q179 254 190 233';
const ANATOMY =
  'M173 132 Q182 141 196 138 M180 151 Q187 147 197 151 M183 165 L195 165 M184 177 L195 178 M182 193 Q187 199 195 201 M188 225 Q182 246 188 263 M185 275 L191 277 M190 290 L189 320 M147 125 L120 127 M104 125 L81 127';

function noise(value: number): number {
  const n = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Tapered limb volumes give the points an anatomical shape rather than a flat outline.
const LIMBS = [
  [168, 126, 111, 127, 10, 6, 1],
  [111, 127, 73, 127, 6, 4, 1],
  [73, 127, 49, 126, 4, 3, 1],
  [182, 224, 188, 269, 12, 7, 1],
  [188, 269, 191, 337, 7, 4, 1],
  [191, 337, 187, 348, 4, 7, 1],
  [167, 125, 119, 101, 9, 6, 0.32],
  [119, 101, 78, 73, 6, 4, 0.32],
  [78, 73, 66, 61, 4, 3, 0.32],
  [182, 222, 158, 266, 11, 7, 0.32],
  [158, 266, 114, 325, 7, 4, 0.32],
] as const;

function limbDensity(x: number, y: number): number {
  let density = 0;
  for (const [ax, ay, bx, by, ra, rb, weight] of LIMBS) {
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(
      0,
      Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)),
    );
    const distance = Math.hypot(x - ax - dx * t, y - ay - dy * t) / (ra + (rb - ra) * t);
    if (distance < 1) density = Math.max(density, (0.14 + distance * 0.38) * weight);
  }
  return density;
}

function stipple(): string {
  const dots: string[] = [];
  for (let i = 0; i < 65000; i++) {
    const x = 45 + noise(i * 3) * 310;
    const y = 56 + noise(i * 3 + 1) * 296;
    const head = Math.hypot((x - 200) / 17, (y - 80) / 23);
    const torsoWidth =
      y < 140 ? 31 : y < 175 ? 24 - (y - 140) * 0.16 : 19 + (y - 175) * 0.12;
    const torso = y > 115 && y < 217 && Math.abs(x - 200) < torsoWidth;
    let density = head < 1 ? 0.18 + head * 0.22 : 0;
    if (torso) density = 0.12 + (Math.abs(x - 200) / torsoWidth) * 0.3;
    density = Math.max(density, limbDensity(x, y), limbDensity(400 - x, y));
    if (noise(i * 3 + 2) < density) dots.push(`M${x.toFixed(2)} ${y.toFixed(2)}h.01`);
  }
  return dots.join('');
}
const GRAIN = stipple();

export function Anomaly({ paused }: { paused: boolean }) {
  return (
    <div className={`anomaly${paused ? ' anomaly-paused' : ''}`} aria-hidden="true">
      <svg
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <g className="proportion-guides" strokeWidth=".7" strokeDasharray=".01 3.6">
          <circle cx="200" cy="200" r="158" />
          <path d="M45 59H355V352H45Z M200 44V357 M40 200H360" />
        </g>
        <g className="proportion-study" strokeWidth="1.25" strokeDasharray=".01 2.05">
          <g className="proportion-echo">
            <path d={RAISED_ARM} />
            <path d={RAISED_ARM} transform="translate(400 0) scale(-1 1)" />
            <path d={SPREAD_LEG} />
            <path d={SPREAD_LEG} transform="translate(400 0) scale(-1 1)" />
          </g>
          <ellipse cx="200" cy="80" rx="17" ry="23" />
          <path d={TORSO} />
          <path d={ARM} />
          <path d={ARM} transform="translate(400 0) scale(-1 1)" />
          <path d={LEG} />
          <path d={LEG} transform="translate(400 0) scale(-1 1)" />
          <g className="proportion-anatomy" strokeWidth=".95" strokeDasharray=".01 2.6">
            <path d={ANATOMY} />
            <path d={ANATOMY} transform="translate(400 0) scale(-1 1)" />
            <path d="M200 143V164 M200 180V193 M193 91Q200 95 207 91 M189 77H195 M205 77H211" />
          </g>
          <path
            className="proportion-grain"
            d={GRAIN}
            strokeWidth="1.5"
            strokeDasharray="none"
          />
        </g>
      </svg>
    </div>
  );
}
