import { PALETTES, type Palette } from './palettes';

type Cell = { x: number; y: number; seed: number; edge: boolean };
type Star = Omit<Cell, 'edge'>;
type Particle = {
  angle: number;
  speed: number;
  radius: number;
  brightness: number;
  character: string;
};
type Hole = {
  x: number;
  y: number;
  radius: number;
  tilt: number;
  particles: readonly Particle[];
};
type Ink = (opacity: number) => string;
type UniverseOptions = { paused: boolean; palette: Palette; showTitle: boolean };

const BACKGROUND = '#111210';
const MOBILE_BREAKPOINT = 650;
const FRAME_INTERVAL_MS = 32;
const DESKTOP_PARTICLE_COUNT = 1900;
const MOBILE_PARTICLE_COUNT = 1100;
const NAME_CHARACTERS = '.:+*x%#@';
const DISK_CHARACTERS = '.:+*x%#';

// Deterministic noise keeps the composition stable across resizes and palette changes.
function hash(value: number): number {
  const seed = Math.sin(value * 127.1 + 311.7) * 43758.5453;
  return seed - Math.floor(seed);
}

function createParticles(phase: number): Particle[] {
  return Array.from({ length: DESKTOP_PARTICLE_COUNT }, (_, index) => ({
    angle: hash(index + phase * 111) * Math.PI * 2 + phase,
    speed: 0.13 + hash(index + 600) * 0.12,
    radius: 0.9 + Math.pow(hash(index + 900), 1.7) * 1.25,
    brightness: 0.18 + 0.62 * hash(index + 1200),
    character: DISK_CHARACTERS.charAt(
      Math.floor(hash(index + 1500) * DISK_CHARACTERS.length),
    ),
  }));
}

const PRIMARY_PARTICLES = createParticles(0);
const SECONDARY_PARTICLES = createParticles(2);

/** Canvas-only ASCII scene. React owns the controls; this class owns drawing and its lifecycle. */
export class Universe {
  private width = 0;
  private height = 0;
  private cell = 7;
  private titleCenter = 0;
  private letters: Cell[] = [];
  private stars: Star[] = [];
  private frameId = 0;
  private time = 0;
  private lastFrame: number | null = null;
  private paused: boolean;
  private palette: Palette;
  private showTitle: boolean;
  private pointer = { x: -9999, y: -9999 };
  private pulse = -10;
  private destroyed = false;
  private readonly observer: ResizeObserver;

  static create(canvas: HTMLCanvasElement, options: UniverseOptions): Universe | null {
    const context = canvas.getContext('2d', { alpha: false });
    return context ? new Universe(canvas, context, options) : null;
  }

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: CanvasRenderingContext2D,
    options: UniverseOptions,
  ) {
    this.paused = options.paused;
    this.palette = options.palette;
    this.showTitle = options.showTitle;
    this.observer = new ResizeObserver(this.resize);
    this.observer.observe(canvas);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerleave', this.leave);
    canvas.addEventListener('pointerdown', this.click);
    document.addEventListener('visibilitychange', this.visibility);
    this.resize();
  }

  setPaused(value: boolean): void {
    if (this.paused === value || this.destroyed) return;
    this.paused = value;
    this.stopFrame();
    this.render();
    this.wake();
  }

  setPalette(value: Palette): void {
    if (this.palette === value || this.destroyed) return;
    this.palette = value;
    this.render();
  }

  setShowTitle(value: boolean): void {
    if (this.showTitle === value || this.destroyed) return;
    this.showTitle = value;
    this.render();
  }

  private resize = (): void => {
    if (this.destroyed) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.cell = width < MOBILE_BREAKPOINT ? 4 : width < 1000 ? 5 : 6;
    const pixelRatio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (width <= 0 || height <= 0) {
      this.letters = [];
      this.stars = [];
      this.stopFrame();
      return;
    }
    this.buildType();
    this.stars = Array.from(
      { length: Math.min(480, Math.floor((width * height) / 2200)) },
      (_, index) => ({
        x: hash(index + 10) * width,
        y: 100 + hash(index + 500) * (height - 270),
        seed: hash(index + 100),
      }),
    );
    this.render();
    this.wake();
  };

  private buildType(): void {
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(this.width);
    mask.height = Math.ceil(this.height);
    const context = mask.getContext('2d');
    this.letters = [];
    if (!context) return;

    const mobile = this.width < MOBILE_BREAKPOINT;
    const fontSize = Math.min(this.width * (mobile ? 0.17 : 0.135), this.height * 0.18);
    const targetWidth = this.width * (mobile ? 0.76 : 0.7);
    this.titleCenter = this.height * (mobile ? 0.345 : 0.43);
    context.font = `900 ${fontSize}px Arial, sans-serif`;
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    const textWidth = context.measureText('ABDULLAH').width;
    if (textWidth === 0) return;
    context.translate((this.width - targetWidth) / 2, this.titleCenter);
    context.scale(targetWidth / textWidth, 1);
    context.fillText('ABDULLAH', 0, 0);

    const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
    const alphaAt = (x: number, y: number) => pixels[(y * mask.width + x) * 4 + 3] ?? 0;
    for (let y = 0; y < this.height; y += this.cell) {
      for (let x = 0; x < this.width; x += this.cell) {
        if (alphaAt(x, y) <= 150) continue;
        this.letters.push({
          x,
          y,
          seed: hash(x * 1.2 + y * 4),
          edge: alphaAt(Math.min(mask.width - 1, x + this.cell), y) < 150,
        });
      }
    }
  }

  private move = (event: PointerEvent): void => {
    if (this.paused) return;
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  private leave = (): void => {
    this.pointer = { x: -9999, y: -9999 };
  };
  private click = (): void => {
    if (!this.paused) this.pulse = this.time;
  };

  private visibility = (): void => {
    this.stopFrame();
    this.wake();
  };

  private stopFrame(): void {
    cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.lastFrame = null;
  }

  private wake(): void {
    if (
      !this.frameId &&
      !this.destroyed &&
      !this.paused &&
      !document.hidden &&
      this.width > 0 &&
      this.height > 0
    ) {
      this.frameId = requestAnimationFrame(this.frame);
    }
  }

  private frame = (now: number): void => {
    this.frameId = 0;
    if (
      this.destroyed ||
      this.paused ||
      document.hidden ||
      this.width <= 0 ||
      this.height <= 0
    ) {
      this.lastFrame = null;
      return;
    }
    if (this.lastFrame !== null && now - this.lastFrame < FRAME_INTERVAL_MS) {
      this.wake();
      return;
    }
    this.time +=
      this.lastFrame === null ? 0 : Math.min((now - this.lastFrame) / 1000, 0.08);
    this.lastFrame = now;
    this.render();
    this.wake();
  };

  private createHoles(): Hole[] {
    const mobile = this.width < MOBILE_BREAKPOINT;
    return [
      {
        x: this.width * (0.75 + 0.035 * Math.sin(this.time * 0.13)),
        y: this.height * ((mobile ? 0.46 : 0.65) + 0.015 * Math.cos(this.time * 0.17)),
        radius: Math.min(this.width * 0.14, this.height * 0.17),
        tilt: -0.33,
        particles: PRIMARY_PARTICLES,
      },
      {
        x: this.width * (0.2 + 0.045 * Math.cos(this.time * 0.12)),
        y: this.height * (0.235 + 0.02 * Math.sin(this.time * 0.16)),
        radius: Math.min(this.width * 0.067, this.height * 0.087),
        tilt: 0.35,
        particles: SECONDARY_PARTICLES,
      },
    ];
  }

  private render(): void {
    if (!this.width || !this.height || this.destroyed) return;
    const rgb = PALETTES[this.palette].rgb.join(',');
    const ink: Ink = (opacity) => `rgba(${rgb},${opacity})`;
    this.drawBackdrop(ink);
    const holes = this.createHoles();
    if (this.showTitle) this.drawName(holes, ink);
    for (const hole of holes) this.drawHole(hole, ink);
  }

  private drawBackdrop(ink: Ink): void {
    const context = this.context;
    context.fillStyle = BACKGROUND;
    context.fillRect(0, 0, this.width, this.height);
    context.fillStyle = '#b7c9990c';
    for (let y = 112; y < this.height - 170; y += 24) {
      for (let x = 40; x < this.width - 25; x += 24) context.fillRect(x, y, 1, 1);
    }
    context.font = `${this.cell + 1}px 'Courier New',monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (const star of this.stars) {
      context.fillStyle = ink(0.1 + star.seed * 0.23);
      context.fillText(star.seed > 0.94 ? '+' : '.', star.x, star.y);
    }
  }

  private drawName(holes: readonly Hole[], ink: Ink): void {
    for (const letter of this.letters) {
      let { x, y } = letter;
      let brightness = 0.49 + letter.seed * 0.43;
      if (!this.paused) {
        const dx = x - this.pointer.x;
        const dy = y - this.pointer.y;
        const distance = Math.hypot(dx, dy);
        const strength = Math.exp((-distance * distance) / 9000) * 15;
        x += (dx / (distance + 1)) * strength;
        y += (dy / (distance + 1)) * strength;
        const age = this.time - this.pulse;
        const ring =
          Math.hypot(letter.x - this.width * 0.5, letter.y - this.titleCenter) -
          age * 240;
        if (age < 3) x += Math.sin(ring * 0.035) * Math.exp((-ring * ring) / 1800) * 7;
      }
      for (const hole of holes) {
        const dx = x - hole.x;
        const dy = y - hole.y;
        const distance = Math.hypot(dx, dy);
        if (distance < hole.radius * 0.7) brightness *= 0.12;
        else if (distance < hole.radius * 2) {
          x += (dy / (distance + 1)) * 3;
          y -= (dx / (distance + 1)) * 3;
        }
      }
      brightness *= 0.88 + 0.12 * Math.sin(letter.x * 0.007 + this.time * 0.45);
      this.context.fillStyle = ink(brightness);
      const index = Math.floor(
        ((letter.seed + Math.floor(this.time * 2 + letter.seed * 4) * 0.07) % 1) *
          NAME_CHARACTERS.length,
      );
      this.context.fillText(letter.edge ? '+' : NAME_CHARACTERS.charAt(index), x, y);
    }
  }

  private drawHole(hole: Hole, ink: Ink): void {
    const context = this.context;
    // Draw the rear disk, occluding core, photon ring, then foreground disk.
    this.drawDisk(hole, false, ink);
    context.beginPath();
    context.arc(hole.x, hole.y, hole.radius * 0.61, 0, Math.PI * 2);
    context.fillStyle = BACKGROUND;
    context.fill();
    for (let index = 0; index < 180; index++) {
      const angle = (index / 180) * Math.PI * 2;
      const radius = hole.radius * (0.64 + 0.025 * Math.sin(angle * 4 + this.time * 0.2));
      context.fillStyle = ink(0.18 + 0.34 * (1 + Math.sin(angle)) * 0.5);
      context.fillText(
        index % 3 === 0 ? ':' : '.',
        Math.round((hole.x + Math.cos(angle) * radius) / this.cell) * this.cell,
        Math.round((hole.y + Math.sin(angle) * radius) / this.cell) * this.cell,
      );
    }
    this.drawDisk(hole, true, ink);
  }

  private drawDisk(hole: Hole, front: boolean, ink: Ink): void {
    const cosine = Math.cos(hole.tilt);
    const sine = Math.sin(hole.tilt);
    const count =
      this.width < MOBILE_BREAKPOINT ? MOBILE_PARTICLE_COUNT : DESKTOP_PARTICLE_COUNT;
    for (const [index, particle] of hole.particles.entries()) {
      if (index >= count) break;
      const angle = particle.angle + this.time * particle.speed;
      if (Math.sin(angle) > 0 !== front) continue;
      const radius = hole.radius * particle.radius;
      const orbitX = Math.cos(angle) * radius;
      const orbitY = Math.sin(angle) * radius * 0.28;
      let x = hole.x + orbitX * cosine - orbitY * sine;
      let y = hole.y + orbitX * sine + orbitY * cosine;
      if (!this.paused) {
        const dx = x - this.pointer.x;
        const dy = y - this.pointer.y;
        const distance = Math.hypot(dx, dy);
        const strength = Math.exp((-distance * distance) / 10000) * 9;
        x += (dx / (distance + 1)) * strength;
        y += (dy / (distance + 1)) * strength;
      }
      this.context.fillStyle = ink(
        particle.brightness * (1 - (particle.radius - 0.9) / 2),
      );
      this.context.fillText(
        particle.character,
        Math.round(x / this.cell) * this.cell,
        Math.round(y / this.cell) * this.cell,
      );
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.stopFrame();
    this.observer.disconnect();
    this.canvas.removeEventListener('pointermove', this.move);
    this.canvas.removeEventListener('pointerleave', this.leave);
    this.canvas.removeEventListener('pointerdown', this.click);
    document.removeEventListener('visibilitychange', this.visibility);
  }
}
