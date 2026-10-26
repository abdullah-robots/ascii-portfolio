// All geometry is sampled into a fixed character grid: no image/video assets,
// per-frame DOM mutations, or heavyweight 3D runtime.
type Cell = { x: number; y: number; seed: number; edge: boolean };
type Hole = { x: number; y: number; radius: number; tilt: number; phase: number };
const palettes = [[215,255,139],[255,183,104],[152,218,243]];
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class Universe {
  private ctx: CanvasRenderingContext2D;
  private width = 0; private height = 0; private cell = 7;
  private letters: Cell[] = []; private stars: Cell[] = [];
  private raf = 0; private time = 0; private last = 0; private paused = false;
  private mode = 0; private pointer = { x: -9999, y: -9999 }; private pulse = -10;
  private showTitle = true;
  private observer: ResizeObserver;
  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.observer = new ResizeObserver(this.resize); this.observer.observe(canvas);
    canvas.addEventListener('pointermove', this.move);
    canvas.addEventListener('pointerleave', this.leave);
    canvas.addEventListener('pointerdown', this.click);
    document.addEventListener('visibilitychange', this.visibility);
    this.resize(); this.raf = requestAnimationFrame(this.frame);
  }
  setPaused(value: boolean) { this.paused = value; this.last = 0; this.render(); this.wake(); }
  setMode(value: number) { this.mode = value; this.render(); }
  setShowTitle(value: boolean) { this.showTitle = value; this.render(); }
  private resize = () => {
    const { width, height } = this.canvas.getBoundingClientRect();
    this.width = width; this.height = height; this.cell = width < 650 ? 4 : width < 1000 ? 5 : 6;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr); this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0); this.buildType();
    this.stars = Array.from({length:Math.min(480,Math.floor(width * height / 2200))}, (_, i) => ({x:hash(i+10)*width,y:100+hash(i+500)*(height-270),seed:hash(i+100),edge:false}));
    this.render();
  };
  private buildType() {
    const off = document.createElement('canvas'); off.width = Math.ceil(this.width); off.height = Math.ceil(this.height);
    const c = off.getContext('2d')!;
    const mobile = this.width < 650;
    const font = Math.min(this.width * (mobile ? .191 : .157), this.height * .21);
    c.font = `900 ${font}px Arial, sans-serif`; c.textBaseline = 'middle';
    c.fillStyle = 'white';
    // Keep the name in the visual gap between the upper and lower orbits.
    const center = this.height * (mobile ? .365 : .465);
    for (const word of ['ABDULLAH']) {
      const textWidth = c.measureText(word).width;
      const target = this.width * (mobile ? .85 : .82);
      c.save(); c.translate((this.width-target)/2,center);
      c.scale(target/textWidth,1); c.fillText(word,0,0); c.restore();
    }
    const pixels = c.getImageData(0,0,off.width,off.height).data;
    this.letters = [];
    for(let y=0;y<this.height;y+=this.cell) for(let x=0;x<this.width;x+=this.cell) {
      if(pixels[(y*off.width+x)*4+3]>150) this.letters.push({x,y,seed:hash(x*1.2+y*4),edge:pixels[(y*off.width+Math.min(off.width-1,x+this.cell))*4+3]<150});
    }
  }
  private move = (e: PointerEvent) => { const r=this.canvas.getBoundingClientRect(); this.pointer={x:e.clientX-r.left,y:e.clientY-r.top}; if(this.paused) return; this.wake(); };
  private leave = () => { this.pointer={x:-9999,y:-9999}; };
  private click = () => { if(!this.paused){this.pulse=this.time;this.wake();} };
  private visibility = () => { this.last=0; this.wake(); };
  private wake() { if(!this.raf && !this.paused && !document.hidden) this.raf=requestAnimationFrame(this.frame); }
  private frame = (now:number) => {
    this.raf=0;
    if(this.paused || document.hidden){this.last=0;return;}
    if(this.last && now-this.last<32){this.raf=requestAnimationFrame(this.frame);return;}
    this.time += this.last ? Math.min((now-this.last)/1000,.08) : 0; this.last=now;
    this.render(); this.raf=requestAnimationFrame(this.frame);
  };
  private render() {
    const c=this.ctx,w=this.width,h=this.height,t=this.time;
    if(!w||!h)return;
    const rgb=palettes[this.mode]; const ink=(a:number) => `rgba(${rgb.join(',')},${a})`;
    c.fillStyle='#111210';c.fillRect(0,0,w,h);
    // A quiet printed grid stays behind the denser character forms.
    c.fillStyle='#b7c9990c';
    for(let y=112;y<h-170;y+=24)for(let x=40;x<w-25;x+=24)c.fillRect(x,y,1,1);
    c.font=`${this.cell+1}px 'Courier New',monospace`; c.textAlign='center'; c.textBaseline='middle';
    for(const s of this.stars){c.fillStyle=ink(.10+s.seed*.23);c.fillText(s.seed>.94?'+':'.',s.x,s.y);}
    const mobile=w<650;
    const holes:Hole[]=[
      {x:w*(.75+.035*Math.sin(t*.13)),y:h*((mobile ? .46 : .65)+.015*Math.cos(t*.17)),radius:Math.min(w*.14,h*.17),tilt:-.33,phase:0},
      {x:w*(.20+.045*Math.cos(t*.12)),y:h*(.235+.02*Math.sin(t*.16)),radius:Math.min(w*.067,h*.087),tilt:.35,phase:2},
    ];
    for(const p of this.showTitle ? this.letters : []){
      let x=p.x,y=p.y; let bright=.49+p.seed*.43;
      if(!this.paused){
        const dx=x-this.pointer.x,dy=y-this.pointer.y,d=Math.hypot(dx,dy);
        const strength=Math.exp(-d*d/9000)*15;
        x+=dx/(d+1)*strength;y+=dy/(d+1)*strength;
        const age=t-this.pulse;const ring=Math.hypot(p.x-w*.5,p.y-h*.46)-age*240;
        if(age<3){x+=Math.sin(ring*.035)*Math.exp(-ring*ring/1800)*7;}
      }
      for(const hole of holes){const dx=x-hole.x,dy=y-hole.y,d=Math.hypot(dx,dy);if(d<hole.radius*.7)bright*=.12;else if(d<hole.radius*2){x+=dy/(d+1)*3;y-=dx/(d+1)*3;}}
      bright*=.88+.12*Math.sin(p.x*.007+t*.45);
      c.fillStyle=ink(bright);
      const chars='.:+*x%#@';const index=Math.floor((p.seed+Math.floor(t*2+p.seed*4)*.07)%1*chars.length);
      c.fillText(p.edge?'+':chars[index],x,y);
    }
    // Accretion particles projected from inclined spiral orbits. Black cores
    // occlude the rear disk; the foreground disk crosses the lower horizon.
    for(const hole of holes){
      const ct=Math.cos(hole.tilt),st=Math.sin(hole.tilt);
      const particles=mobile?1100:1900;
      const drawDisk=(front:boolean)=>{
        for(let i=0;i<particles;i++){
          const seed=hash(i+hole.phase*111), angle=seed*Math.PI*2+t*(.13+hash(i+600)*.12)+hole.phase;
          if((Math.sin(angle)>0)!==front)continue;
          const r=hole.radius*(.9+Math.pow(hash(i+900),1.7)*1.25);
          const px=Math.cos(angle)*r,py=Math.sin(angle)*r*.28;
          let x=hole.x+px*ct-py*st,y=hole.y+px*st+py*ct;
          const dx=x-this.pointer.x,dy=y-this.pointer.y,d=Math.hypot(dx,dy);
          if(!this.paused){x+=dx/(d+1)*Math.exp(-d*d/10000)*9;y+=dy/(d+1)*Math.exp(-d*d/10000)*9;}
          x=Math.round(x/this.cell)*this.cell;y=Math.round(y/this.cell)*this.cell;
          c.fillStyle=ink((.18+.62*hash(i+1200))*(1-(r/hole.radius-.9)/2));
          c.fillText('.:+*x%#'[Math.floor(hash(i+1500)*7)],x,y);
        }
      };
      drawDisk(false);
      c.beginPath();c.arc(hole.x,hole.y,hole.radius*.61,0,Math.PI*2);c.fillStyle='#111210';c.fill();
      // A sampled photon ring gives the empty core its recognizable silhouette.
      for(let i=0;i<180;i++){
        const a=i/180*Math.PI*2,r=hole.radius*(.64+.025*Math.sin(a*4+t*.2));
        c.fillStyle=ink(.18+.34*(1+Math.sin(a))*.5);
        c.fillText(i%3===0?':':'.',Math.round((hole.x+Math.cos(a)*r)/this.cell)*this.cell,Math.round((hole.y+Math.sin(a)*r)/this.cell)*this.cell);
      }
      drawDisk(true);
      c.textAlign='left';c.font="9px 'Courier New',monospace";c.fillStyle=ink(.45);
      c.font=`${this.cell+1}px 'Courier New',monospace`;c.textAlign='center';
    }
  }
  destroy(){cancelAnimationFrame(this.raf);this.observer.disconnect();this.canvas.removeEventListener('pointermove',this.move);this.canvas.removeEventListener('pointerleave',this.leave);this.canvas.removeEventListener('pointerdown',this.click);document.removeEventListener('visibilitychange',this.visibility);}
}
