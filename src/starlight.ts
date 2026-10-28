type Point = { x: number; y: number };
type Glyph = { x: number; y: number; seed: number; edge: boolean };
type Rgb = readonly [number, number, number];
type Sun = { x: number; y: number; radius: number; phase: number; dust: readonly Mote[] };
type Mote = {
  angle: number;
  drift: number;
  phase: number;
  speed: number;
  brightness: number;
  character: string;
};

/** Everything the starlight scene reads from the shared renderer for one frame. */
export type StarlightFrame = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  cell: number;
  time: number;
  paused: boolean;
  pointer: Point;
  pulse: number;
  titleCenter: number;
  letters: readonly Glyph[] | null;
  stars: readonly Omit<Glyph, 'edge'>[];
  mobile: boolean;
};

// Antique gold for most ink, a burnished gold for highlights, a deep gold for weight,
// and a cool lavender haze borrowed from the shadows of the reference artwork.
const GOLD: Rgb = [158, 114, 38];
const BRIGHT: Rgb = [201, 150, 52];
const DEEP: Rgb = [120, 84, 26];
const HAZE: Rgb = [118, 110, 152];
const NAME_CHARACTERS = '.:+*x%#@';
const CORE_CHARACTERS = '.:+*x%#@';
const DUST_CHARACTERS = ".'`+*";
const DESKTOP_DUST_COUNT = 900;
const MOBILE_DUST_COUNT = 500;

function hash(value: number): number {
  const seed = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return seed - Math.floor(seed);
}

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  return [0, 1, 2].map((channel) =>
    Math.round(from[channel]! + (to[channel]! - from[channel]!) * amount),
  ) as unknown as Rgb;
}

function ink([r, g, b]: Rgb, opacity: number): string {
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, opacity))})`;
}

function createDust(phase: number): Mote[] {
  return Array.from({ length: DESKTOP_DUST_COUNT }, (_, index) => ({
    angle: hash(index + phase * 97) * Math.PI * 2,
    drift: (hash(index + 300) - 0.5) * 0.12,
    phase: hash(index + 700 + phase),
    speed: 0.025 + hash(index + 1100) * 0.05,
    brightness: 0.25 + 0.6 * hash(index + 1400),
    character: DUST_CHARACTERS.charAt(
      Math.floor(hash(index + 1800) * DUST_CHARACTERS.length),
    ),
  }));
}

const PRIMARY_DUST = createDust(0);
const SECONDARY_DUST = createDust(3);

/** A ray's character follows its direction so the burst reads as drawn lines. */
function strokeFor(angle: number): string {
  const octant =
    Math.round((((angle % Math.PI) + Math.PI) % Math.PI) / (Math.PI / 4)) % 4;
  return ['-', '\\', '|', '/'][octant] ?? '-';
}

function repel(
  frame: StarlightFrame,
  x: number,
  y: number,
  falloff: number,
  strength: number,
) {
  if (frame.paused) return { x, y };
  const dx = x - frame.pointer.x;
  const dy = y - frame.pointer.y;
  const distance = Math.hypot(dx, dy);
  const push = Math.exp((-distance * distance) / falloff) * strength;
  return { x: x + (dx / (distance + 1)) * push, y: y + (dy / (distance + 1)) * push };
}

function snap(frame: StarlightFrame, value: number): number {
  return Math.round(value / frame.cell) * frame.cell;
}

// The two stars sit where the black holes drift in the void, so the layout is shared.
function createSuns({ width, height, time, mobile }: StarlightFrame): Sun[] {
  return [
    {
      x: width * (0.75 + 0.035 * Math.sin(time * 0.13)),
      y: height * ((mobile ? 0.46 : 0.65) + 0.015 * Math.cos(time * 0.17)),
      radius: Math.min(width * 0.12, height * 0.15),
      phase: 0.08,
      dust: PRIMARY_DUST,
    },
    {
      x: width * (0.2 + 0.045 * Math.cos(time * 0.12)),
      y: height * (0.235 + 0.02 * Math.sin(time * 0.16)),
      radius: Math.min(width * 0.06, height * 0.078),
      phase: -0.2,
      dust: SECONDARY_DUST,
    },
  ];
}

export function drawStarlight(frame: StarlightFrame): void {
  const context = frame.context;
  // Dark ink on a light ground needs a heavier stroke to carry the same presence.
  context.font = `600 ${frame.cell + 1}px 'Courier New',monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  drawSky(frame);
  const suns = createSuns(frame);
  for (const sun of suns) drawHalo(frame, sun);
  if (frame.letters) drawName(frame, frame.letters, suns);
  for (const sun of suns) drawSun(frame, sun);
}

function drawSky(frame: StarlightFrame): void {
  const { context, width, height, time } = frame;
  // Light falls from above, as from a halo just out of frame.
  const source = { x: width * 0.5, y: -height * 0.18 };
  const glow = context.createRadialGradient(
    source.x,
    source.y,
    0,
    source.x,
    source.y,
    Math.hypot(width, height) * 0.95,
  );
  glow.addColorStop(0, '#fffdf6');
  glow.addColorStop(0.45, '#f7f1e4');
  glow.addColorStop(1, '#ebe0c9');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < 21; index++) {
    const angle = Math.PI / 2 + (index / 20 - 0.5) * 1.6 + Math.sin(time * 0.05) * 0.02;
    const shimmer = 0.6 + 0.4 * Math.sin(time * 0.5 + index * 1.7);
    const length = height * (0.75 + 0.35 * hash(index + 40));
    for (let distance = height * 0.3; distance < length; distance += frame.cell * 3) {
      const fade = 1 - distance / length;
      context.fillStyle = ink(GOLD, 0.12 * fade * shimmer);
      context.fillText(
        '.',
        snap(frame, source.x + Math.cos(angle) * distance),
        snap(frame, source.y + Math.sin(angle) * distance),
      );
    }
  }

  context.fillStyle = '#9e72260f';
  for (let y = 112; y < height - 170; y += 24) {
    for (let x = 40; x < width - 25; x += 24) context.fillRect(x, y, 1, 1);
  }

  for (const star of frame.stars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * (0.8 + star.seed * 2.2) + star.seed * 40);
    const opacity = (0.25 + star.seed * 0.5) * (0.35 + 0.65 * twinkle);
    const color = hash(star.seed * 1000) < 0.28 ? HAZE : GOLD;
    context.fillStyle = ink(color, opacity);
    context.fillText(
      star.seed > 0.93 ? '*' : star.seed > 0.8 ? '+' : '.',
      star.x,
      star.y,
    );
    // The brightest few open into tiny four-point crosses as they twinkle.
    if (star.seed > 0.965 && twinkle > 0.35) {
      context.fillStyle = ink(GOLD, opacity * 0.55 * twinkle);
      const reach = frame.cell * 1.2;
      context.fillText('-', star.x - reach, star.y);
      context.fillText('-', star.x + reach, star.y);
      context.fillText('|', star.x, star.y - reach);
      context.fillText('|', star.x, star.y + reach);
    }
  }
}

/** Engraved astrolabe rings and drifting stardust behind each star. */
function drawHalo(frame: StarlightFrame, sun: Sun): void {
  const { context, time } = frame;
  const bloom = context.createRadialGradient(
    sun.x,
    sun.y,
    0,
    sun.x,
    sun.y,
    sun.radius * 2.4,
  );
  bloom.addColorStop(0, 'rgba(236,190,92,0.32)');
  bloom.addColorStop(0.35, 'rgba(236,196,112,0.12)');
  bloom.addColorStop(1, 'rgba(236,196,112,0)');
  context.fillStyle = bloom;
  context.fillRect(
    sun.x - sun.radius * 2.4,
    sun.y - sun.radius * 2.4,
    sun.radius * 4.8,
    sun.radius * 4.8,
  );
  const rings = [
    { radius: 1.95, count: 170, turn: 0.02, opacity: 0.38, tick: 10 },
    { radius: 1.3, count: 120, turn: -0.035, opacity: 0.32, tick: 3 },
  ];
  for (const ring of rings) {
    for (let index = 0; index < ring.count; index++) {
      const angle = (index / ring.count) * Math.PI * 2 + time * ring.turn + sun.phase;
      const radius = sun.radius * ring.radius;
      const tick = index % ring.tick === 0;
      context.fillStyle = ink(tick ? GOLD : HAZE, ring.opacity * (tick ? 1.3 : 0.9));
      context.fillText(
        tick ? (ring.tick === 10 ? '+' : ':') : '.',
        snap(frame, sun.x + Math.cos(angle) * radius),
        snap(frame, sun.y + Math.sin(angle) * radius),
      );
    }
  }

  const count = frame.mobile ? MOBILE_DUST_COUNT : DESKTOP_DUST_COUNT;
  for (const [index, mote] of sun.dust.entries()) {
    if (index >= count) break;
    // Motes rise out of the star and fade as they spiral away.
    const travel = (mote.phase + time * mote.speed) % 1;
    const angle = mote.angle + travel * mote.drift * 12 + time * 0.03;
    const radius = sun.radius * (0.45 + travel * 2.6);
    const point = repel(
      frame,
      sun.x + Math.cos(angle) * radius,
      sun.y + Math.sin(angle) * radius,
      10000,
      9,
    );
    const twinkle = 0.65 + 0.35 * Math.sin(time * 3 + index);
    context.fillStyle = ink(
      index % 5 === 0 ? HAZE : GOLD,
      mote.brightness * 1.4 * Math.pow(1 - travel, 1.2) * twinkle,
    );
    context.fillText(mote.character, snap(frame, point.x), snap(frame, point.y));
  }
}

/** The radiant core and its eight-point burst, drawn over the name. */
function drawSun(frame: StarlightFrame, sun: Sun): void {
  const { context, time, cell } = frame;

  // Rays stay on exact 0° and 45° lines so they land cleanly on the character grid.
  for (let ray = 0; ray < 8; ray++) {
    const primary = ray % 2 === 0;
    const angle = (ray * Math.PI) / 4;
    const step = primary ? cell : cell * Math.SQRT2;
    const length =
      sun.radius *
      (primary ? 2.9 : 1.55) *
      (0.88 + 0.12 * Math.sin(time * 1.1 + ray * 2.1));
    const stroke = strokeFor(angle);
    const dx = Math.round(Math.cos(angle)) * cell;
    const dy = Math.round(Math.sin(angle)) * cell;
    const normal = { x: -Math.round(Math.sin(angle)), y: Math.round(Math.cos(angle)) };
    // A glint of light travels outward along each ray.
    const glint = ((time * 0.35 + hash(ray + sun.phase * 10)) % 1) * length;
    const origin = { x: snap(frame, sun.x), y: snap(frame, sun.y) };
    for (
      let index = 2, distance = step * 2;
      distance < length;
      index++, distance += step
    ) {
      const fade = Math.pow(1 - distance / length, 1.3);
      const shine = Math.exp(-Math.pow((distance - glint) / (cell * 5), 2));
      const x = origin.x + dx * index;
      const y = origin.y + dy * index;
      context.fillStyle = ink(
        shine > 0.4 || fade > 0.6 ? BRIGHT : GOLD,
        (primary ? 1 : 0.9) * fade + shine * 0.5,
      );
      context.fillText(shine > 0.6 ? '*' : stroke, x, y);
      // Rays taper: a shoulder of strokes either side near the base only.
      const shoulder = 1 - distance / (length * (primary ? 0.38 : 0.26));
      if (shoulder > 0) {
        context.fillStyle = ink(GOLD, 0.7 * shoulder);
        for (const side of [-1, 1]) {
          context.fillText(
            shoulder > 0.5 ? stroke : '.',
            x + normal.x * cell * side,
            y + normal.y * cell * side,
          );
        }
      }
    }
  }

  const reach = sun.radius * 0.8;
  const breathe = 1 + 0.06 * Math.sin(time * 0.9 + sun.phase * 10);
  for (let y = snap(frame, sun.y - reach); y <= sun.y + reach; y += cell) {
    for (let x = snap(frame, sun.x - reach); x <= sun.x + reach; x += cell) {
      const distance = Math.hypot(x - sun.x, y - sun.y) / (reach * breathe);
      const flicker = 0.9 + 0.1 * Math.sin(time * 4 + hash(x * 3.1 + y * 7.7) * 30);
      const intensity = Math.exp(-distance * distance * 4.2) * flicker;
      if (intensity < 0.06) continue;
      const character =
        CORE_CHARACTERS[
          Math.min(
            CORE_CHARACTERS.length - 1,
            Math.floor(intensity * CORE_CHARACTERS.length),
          )
        ] ?? '.';
      context.fillStyle =
        intensity > 0.78
          ? ink(DEEP, 0.95)
          : intensity > 0.45
            ? ink(BRIGHT, 0.6 + 0.4 * intensity)
            : ink(GOLD, 0.15 + 0.9 * intensity);
      context.fillText(character, x, y);
    }
  }
}

function drawName(
  frame: StarlightFrame,
  letters: readonly Glyph[],
  suns: readonly Sun[],
) {
  const { context, time, width } = frame;
  // A slow gleam sweeps across the name, like light catching gilt lettering.
  const sweep = (time * 240) % (width * 1.8);
  for (const letter of letters) {
    let { x, y } = repel(frame, letter.x, letter.y, 9000, 15);
    let brightness = 0.72 + letter.seed * 0.28;
    let radiant = false;
    if (!frame.paused) {
      const age = time - frame.pulse;
      const ring =
        Math.hypot(letter.x - width * 0.5, letter.y - frame.titleCenter) - age * 240;
      if (age < 3) x += Math.sin(ring * 0.035) * Math.exp((-ring * ring) / 1800) * 7;
    }
    for (const sun of suns) {
      const dx = x - sun.x;
      const dy = y - sun.y;
      const distance = Math.hypot(dx, dy);
      if (distance < sun.radius * 0.55) brightness *= 0.2;
      else if (distance < sun.radius * 2.2) {
        // Starlight pushes the letters gently outward instead of swirling them inward.
        const push = 4 * (1 - distance / (sun.radius * 2.2));
        x += (dx / (distance + 1)) * push;
        y += (dy / (distance + 1)) * push;
        radiant = letter.seed > 0.6;
      }
    }
    const offset = letter.x - width * 0.1 + (letter.y - frame.titleCenter) * 0.45 - sweep;
    const gleam = Math.exp((-offset * offset) / 2600);
    brightness *= 0.88 + 0.12 * Math.sin(letter.x * 0.007 + time * 0.45);
    // Gilt: burnished at the top of each letter, deepening towards the base.
    const depth = Math.min(
      1,
      Math.max(0, (letter.y - frame.titleCenter) / (frame.cell * 14) + 0.5),
    );
    const gilt = mix(BRIGHT, DEEP, depth * (1 - gleam));
    context.fillStyle = ink(gilt, brightness + gleam * 0.4);
    const index = Math.floor(
      ((letter.seed + Math.floor(time * 2 + letter.seed * 4) * 0.07) % 1) *
        NAME_CHARACTERS.length,
    );
    context.fillText(
      letter.edge ? '+' : radiant || gleam > 0.6 ? '*' : NAME_CHARACTERS.charAt(index),
      x,
      y,
    );
  }
}
