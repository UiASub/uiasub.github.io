class ElectricBorder {
  constructor(canvasEl, options = {}) {
    // canvasEl is a DOM element
    this.canvas = canvasEl;
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Options (CSS pixel sizes)
    this.width = options.width || 360;
    this.height = options.height || 480;
    this.octaves = options.octaves || 10;
    this.lacunarity = options.lacunarity || 1.6;
    this.gain = options.gain || 0.6;
    this.amplitude = options.amplitude || 0.075;
    this.frequency = options.frequency || 10;
    this.baseFlatness = options.baseFlatness || 0;
    this.displacement = options.displacement || Math.round(Math.min(this.width, this.height) * 0.12);
    this.speed = options.speed || 1.2;
    this.borderOffset = options.borderOffset || Math.round(Math.min(this.width, this.height) * 0.12);
    this.borderRadius = options.borderRadius || Math.round(Math.min(this.width, this.height) * 0.06);
    this.lineWidth = options.lineWidth || 1.5;
    this.color = options.color || '#00ff88';

    this.animationId = null;
    this.time = 0;
    this.lastFrameTime = 0;

    this._setupCanvas();
    this.start();
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    // Measure the actual displayed (CSS) size of the canvas so we don't force CSS pixels
    const crect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(crect.width)) || this.width;
    const cssH = Math.max(1, Math.round(crect.height)) || this.height;
    // update logical sizes (CSS pixels) used for geometry
    this.width = cssW;
    this.height = cssH;
    // backing buffer size in device pixels (do NOT set style.width/height — let CSS handle layout)
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    // reset transform then scale
    this.ctx.setTransform(1,0,0,1,0,0);
    this.ctx.scale(dpr, dpr);
    // ensure crisp stroke alignment
    this.ctx.lineJoin = 'round';
    this.ctx.lineCap = 'round';
  }

  stop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
  }

  start() {
    if (this.animationId) return;
    this.lastFrameTime = 0; // reset to avoid big first delta
    this.animationId = requestAnimationFrame(this.drawElectricBorder.bind(this));
  }

  random(x) { return (Math.sin(x * 12.9898) * 43758.5453) % 1; }

  noise2D(x,y) {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const a = this.random(i + j*57);
    const b = this.random(i+1 + j*57);
    const c = this.random(i + (j+1)*57);
    const d = this.random(i+1 + (j+1)*57);
    const ux = fx*fx*(3 - 2*fx);
    const uy = fy*fy*(3 - 2*fy);
    return a*(1-ux)*(1-uy) + b*ux*(1-uy) + c*(1-ux)*uy + d*ux*uy;
  }

  octavedNoise(x, octaves, lacunarity, gain, amp, freq, time=0, seed=0, baseFlatness=1) {
    let y = 0, amplitude = amp, frequency = freq;
    for (let i=0;i<octaves;i++) {
      let octaveAmp = amplitude;
      if (i===0) octaveAmp *= baseFlatness;
      y += octaveAmp * this.noise2D(frequency * x + seed*100, time * frequency * 0.3);
      frequency *= lacunarity; amplitude *= gain;
    }
    return y;
  }

  getRoundedRectPoint(t, left, top, width, height, radius) {
    const straightWidth = width - 2*radius;
    const straightHeight = height - 2*radius;
    const cornerArc = (Math.PI*radius)/2;
    const total = 2*straightWidth + 2*straightHeight + 4*cornerArc;
    const distance = t * total;
    let acc = 0;
    if (distance <= acc + straightWidth) { const p = (distance-acc)/straightWidth; return {x:left+radius + p*straightWidth, y: top}; }
    acc += straightWidth;
    if (distance <= acc + cornerArc) { const p=(distance-acc)/cornerArc; return this._cornerPoint(left+width-radius, top+radius, radius, -Math.PI/2, Math.PI/2, p); }
    acc += cornerArc;
    if (distance <= acc + straightHeight) { const p=(distance-acc)/straightHeight; return {x:left+width, y: top+radius + p*straightHeight}; }
    acc += straightHeight;
    if (distance <= acc + cornerArc) { const p=(distance-acc)/cornerArc; return this._cornerPoint(left+width-radius, top+height-radius, radius, 0, Math.PI/2, p); }
    acc += cornerArc;
    if (distance <= acc + straightWidth) { const p=(distance-acc)/straightWidth; return {x:left+width-radius - p*straightWidth, y: top+height}; }
    acc += straightWidth;
    if (distance <= acc + cornerArc) { const p=(distance-acc)/cornerArc; return this._cornerPoint(left+radius, top+height-radius, radius, Math.PI/2, Math.PI/2, p); }
    acc += cornerArc;
    if (distance <= acc + straightHeight) { const p=(distance-acc)/straightHeight; return {x:left, y: top+height-radius - p*straightHeight}; }
    const p=(distance-acc)/cornerArc; return this._cornerPoint(left+radius, top+radius, radius, Math.PI, Math.PI/2, p);
  }

  _cornerPoint(cx, cy, r, start, arc, progress) { const a = start + progress*arc; return {x: cx + r*Math.cos(a), y: cy + r*Math.sin(a)}; }

  drawElectricBorder(now=0) {
    if (!this.canvas || !this.ctx) return;
    if (this.lastFrameTime === 0) this.lastFrameTime = now;
    const delta = (now - this.lastFrameTime)/1000; this.time += delta * this.speed; this.lastFrameTime = now;

    // CSS pixels used for geometry (context is scaled to DPR)
    const W = this.width, H = this.height;
    this.ctx.clearRect(0,0,W,H);
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round';

    const left = this.borderOffset, top = this.borderOffset;
    const borderW = Math.max(40, W - 2*this.borderOffset);
    const borderH = Math.max(40, H - 2*this.borderOffset);
    const maxR = Math.min(borderW, borderH)/2;
    const radius = Math.min(this.borderRadius, maxR);
    const approxPerim = 2*(borderW+borderH) + 2*Math.PI*radius;
    const samples = Math.max(64, Math.floor(approxPerim/2));

    this.ctx.beginPath();
    for (let i=0;i<=samples;i++) {
      const progress = i/samples;
      const pt = this.getRoundedRectPoint(progress, left, top, borderW, borderH, radius);
      const xn = this.octavedNoise(progress*8, this.octaves, this.lacunarity, this.gain, this.amplitude, this.frequency, this.time, 0, this.baseFlatness);
      const yn = this.octavedNoise(progress*8, this.octaves, this.lacunarity, this.gain, this.amplitude, this.frequency, this.time, 1, this.baseFlatness);
      const dx = pt.x + xn * this.displacement;
      const dy = pt.y + yn * this.displacement;
      if (i===0) this.ctx.moveTo(dx,dy); else this.ctx.lineTo(dx,dy);
    }
    this.ctx.closePath();
    this.ctx.stroke();

    this.animationId = requestAnimationFrame(this.drawElectricBorder.bind(this));
  }
}

// ---- initialization logic for multiple sponsor cards ----
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.sponsor-card');
  const instances = new Map();

  // color mapping by rank text (case-insensitive)
  const rankColors = {
    bronze: '#b87333', // coppery bronze
    silver: '#c0c0c0',
    gold: '#ffd700'
  };

  function initCard(card, idx) {
    const canvas = card.querySelector('.electric-border-canvas');
    if (!canvas) return;
  // measure the actual canvas displayed size (CSS pixels) so drawing matches edges
  const crect = canvas.getBoundingClientRect();
  const width = Math.max(40, Math.round(crect.width || canvas.clientWidth || parseInt(canvas.getAttribute('width')) || 360));
  const height = Math.max(40, Math.round(crect.height || canvas.clientHeight || parseInt(canvas.getAttribute('height')) || 480));

    // determine rank from .button-glass text (fallback: data-rank attr)
    const rankEl = card.querySelector('.button-glass');
    const rankText = (rankEl && rankEl.textContent || card.dataset.rank || '').trim().toLowerCase();
    const color = rankColors[rankText] || '#00ff88';

    // expose the chosen color to CSS so overlays and derived vars match the canvas border
    try {
      card.style.setProperty('--electric-border-color', color);
    } catch (e) {
      // ignore if setting CSS vars fails in older browsers
    }

    // stop previous
    const prev = instances.get(card);
    if (prev && typeof prev.stop === 'function') prev.stop();

    const minSide = Math.min(width, height);
    const opts = {
      width, height,
      octaves: 10, lacunarity:1.6, gain:0.7, amplitude:0.075, frequency:10,
      baseFlatness:0,
      displacement: Math.round(minSide * 0.06),
      speed: 1.2 + (idx%3)*0.15,
      // make the border offset small so the stroke hugs the container edge
      borderOffset: Math.max(8, Math.round(minSide * 0.04)),
      borderRadius: Math.round(minSide * 0.05),
      lineWidth: Math.max(1, Math.round(minSide * 0.003)),
      color
    };

    const inst = new ElectricBorder(canvas, opts);
    instances.set(card, inst);
  }

  // initialize all
  cards.forEach((card, i) => setTimeout(()=> initCard(card,i), i*100));

  // ResizeObserver to re-init on card size change
  const ro = new ResizeObserver(entries => {
    for (const e of entries) {
      const card = e.target;
      // debounce per-card
      clearTimeout(card.__rbTimer);
      card.__rbTimer = setTimeout(()=> initCard(card, Array.prototype.indexOf.call(cards, card)), 90);
    }
  });
  cards.forEach(c=> ro.observe(c));

  // window resize fallback
  let wtimer = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(wtimer);
    wtimer = setTimeout(()=> cards.forEach((c,i)=> initCard(c,i)), 140);
  });
});
