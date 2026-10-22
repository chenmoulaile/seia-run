const ASSETS = {
  trail: '/assets/cursor/trail.png',
  ring: '/assets/cursor/ring.png',
  circle: '/assets/cursor/circle.png',
  triangle: '/assets/cursor/triangle.png',
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function tinted(image, color) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || 512;
  canvas.height = image.naturalHeight || 512;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export class CursorFX {
  constructor() {
    this.enabled =
      window.matchMedia &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!this.enabled) return;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'cursor-fx';
    this.canvas.setAttribute('aria-hidden', 'true');
    document.getElementById('app').appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.last = null;
    this.lastTrail = 0;
    this.images = {};
    this.tinted = {};
    this.loaded = 0;
    this.resize();

    for (const [key, src] of Object.entries(ASSETS)) {
      const img = loadImage(src);
      this.images[key] = img;
      img.addEventListener('load', () => {
        this.tinted[key] = {
          blue: tinted(img, '#7fd4ff'),
          gold: tinted(img, '#ffe08a'),
          pink: tinted(img, '#ff9dcc'),
        };
        this.loaded += 1;
      });
      img.addEventListener('error', () => {
        this.loaded += 1;
      });
    }

    window.addEventListener('resize', () => this.resize(), { passive: true });
    window.addEventListener('pointermove', (e) => this.onMove(e), { passive: true });
    window.addEventListener('pointerdown', (e) => this.onDown(e), { passive: true });
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.canvas.width = Math.floor(window.innerWidth * dpr);
    this.canvas.height = Math.floor(window.innerHeight * dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  onMove(e) {
    if (this.active === false) return;
    const now = performance.now();
    const x = e.clientX;
    const y = e.clientY;
    if (!this.last) {
      this.last = { x, y, t: now };
      return;
    }
    const dx = x - this.last.x;
    const dy = y - this.last.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return;
    if (now - this.lastTrail > 26 || dist > 22) {
      this.lastTrail = now;
      this.particles.push({
        kind: 'trail',
        x: x - dx * 0.6,
        y: y - dy * 0.6,
        angle: Math.atan2(dy, dx),
        life: 0.36,
        max: 0.36,
        size: 74 + Math.min(46, dist * 2.2),
      });
    }
    this.last = { x, y, t: now };
  }

  onDown(e) {
    const x = e.clientX;
    const y = e.clientY;
    this.particles.push({ kind: 'flash', x, y, life: 0.34, max: 0.34, size: 64 });
    this.particles.push({ kind: 'ring', x, y, life: 0.5, max: 0.5, size: 46 });
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      this.particles.push({
        kind: 'spark',
        x,
        y,
        vx: Math.cos(a) * 240,
        vy: Math.sin(a) * 240,
        angle: a,
        life: 0.52,
        max: 0.52,
        size: 54,
      });
    }
  }

  drawTrail(p, k) {
    const set = this.tinted.trail;
    if (!set) return;
    const img = set.blue;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.globalAlpha = 0.34 * k;
    ctx.globalCompositeOperation = 'lighter';
    const s = p.size * (1.05 - k * 0.16);
    ctx.drawImage(img, -s * 0.58, -s * 0.58, s, s);
    ctx.restore();
  }

  drawRing(p, k) {
    const set = this.tinted.ring;
    const ctx = this.ctx;
    if (set) {
      const s = p.size + (1 - k) * 72;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = Math.min(1, k * 0.9);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(set.blue, -s / 2, -s / 2, s, s * 0.5);
      ctx.restore();
    }
    const circle = this.tinted.circle;
    if (circle) {
      const s = p.size * (0.5 + (1 - k) * 0.8);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = 0.28 * k;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(circle.gold, -s / 2, -s / 2, s, s);
      ctx.restore();
    }
  }

  drawFlash(p, k) {
    const set = this.tinted.circle;
    if (!set) return;
    const ctx = this.ctx;
    const s = p.size * (0.4 + k * 0.7);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = 0.4 * k;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(set.blue, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  drawSpark(p, k) {
    const set = this.tinted.triangle;
    if (!set) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle + Math.PI / 2);
    ctx.globalAlpha = Math.min(1, k * 0.95);
    ctx.globalCompositeOperation = 'lighter';
    const s = p.size * (0.8 + (1 - k) * 0.6);
    ctx.drawImage(set.pink, -s / 2, -s * 0.25, s, s * 0.5);
    ctx.restore();
  }

  update(dt) {
    const list = this.particles;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      if (p.kind === 'spark') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= Math.exp(-3.2 * dt);
        p.vy *= Math.exp(-3.2 * dt);
      }
      const k = Math.max(0, p.life / p.max);
      if (p.kind === 'trail') this.drawTrail(p, k);
      else if (p.kind === 'ring') this.drawRing(p, k);
      else if (p.kind === 'flash') this.drawFlash(p, k);
      else if (p.kind === 'spark') this.drawSpark(p, k);
    }
  }

  setActive(on) {
    if (!this.enabled || !this.canvas) return;
    if (this.active === on) return;
    this.active = on;
    this.canvas.style.display = on ? '' : 'none';
    if (!on) {
      this.particles.length = 0;
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  frame(now) {
    requestAnimationFrame(this.frame);
    if (!this.lastFrame) this.lastFrame = now;
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (this.active === false || !this.loaded) return;
    this.update(dt);
  }
}
