export class Input {
  constructor() {
    this.handlers = new Map();
    this.pointer = null;
    this.bind();
  }

  on(name, fn) {
    if (!this.handlers.has(name)) this.handlers.set(name, []);
    this.handlers.get(name).push(fn);
    return this;
  }

  emit(name, payload) {
    const list = this.handlers.get(name);
    if (!list) return;
    for (const fn of list) fn(payload);
  }

  isUiTarget(target) {
    return !!(target && target.closest && target.closest('button, a, input, select, .char-card'));
  }

  bind() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const k = e.key;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
      switch (k) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.emit('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.emit('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ':
          this.emit('jump');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.emit('slide');
          break;
        case 'Escape':
        case 'p':
        case 'P':
          this.emit('pause');
          break;
        case 'm':
        case 'M':
          this.emit('mute');
          break;
        case 'Enter':
          this.emit('start');
          break;
        default:
          break;
      }
    });

    window.addEventListener(
      'pointerdown',
      (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (this.isUiTarget(e.target)) return;
        this.pointer = {
          x: e.clientX,
          y: e.clientY,
          t: performance.now(),
          id: e.pointerId,
        };
      },
      { passive: true }
    );

    window.addEventListener('pointerup', (e) => {
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      this.pointer = null;
      if (this.isUiTarget(e.target)) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      // 阈值放宽到 28px，避免手指轻微滑动被误判成跳跃
      if (ax < 28 && ay < 28) {
        this.emit('tap', { x: e.clientX, y: e.clientY });
        return;
      }
      if (ax > ay * 1.15) this.emit(dx > 0 ? 'right' : 'left');
      else if (ay > ax * 1.15) this.emit(dy > 0 ? 'slide' : 'jump');
    });

    window.addEventListener('pointercancel', () => {
      this.pointer = null;
    });

    window.addEventListener(
      'touchmove',
      (e) => {
        if (this.pointer) e.preventDefault();
      },
      { passive: false }
    );
  }
}
