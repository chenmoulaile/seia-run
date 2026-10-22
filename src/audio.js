const MUTE_KEY = 'seia-run-mute-v1';

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfx = null;
    this.music = null;
    this.muted = this.readMuted();
    this.musicOn = false;
    this.musicPaused = false;
    this.musicTimer = null;
    this.step = 0;
    this.nextTime = 0;
    this.voiceEl = null;
    this.voiceOnEnd = null;
  }

  readMuted() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  saveMuted() {
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.gain.value = 0.5;
    this.sfx.connect(this.master);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.13;
    this.music.connect(this.master);
    this.startMusic();
  }

  toggleMute() {
    this.muted = !this.muted;
    this.saveMuted();
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.02);
    }
    if (this.muted) this.stopVoice();
    return this.muted;
  }

  playVoice(url, { volume = 0.92, onEnd = null } = {}) {
    if (!url) return null;
    this.stopVoice();
    const el = new Audio(url);
    el.preload = 'auto';
    el.volume = this.muted ? 0 : volume;
    this.voiceEl = el;
    this.voiceOnEnd = onEnd;
    const finish = () => {
      if (this.voiceEl !== el) return;
      this.voiceEl = null;
      this.voiceOnEnd = null;
      if (onEnd) onEnd();
    };
    el.addEventListener('ended', finish, { once: true });
    el.play().catch(() => {
      if (this.voiceEl === el) finish();
    });
    return el;
  }

  stopVoice() {
    const el = this.voiceEl;
    this.voiceEl = null;
    this.voiceOnEnd = null;
    if (!el) return;
    el.pause();
    try {
      el.src = '';
    } catch {
      /* ignore */
    }
  }

  now() {
    return this.ctx ? this.ctx.currentTime + 0.001 : 0;
  }

  midi(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  sched(freq, t, dur, type, vol, dest = null, glideTo = null) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(dest || this.sfx);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  schedNoise(t, dur, vol, cutoff, dest = null, type = 'highpass') {
    if (!this.ctx) return;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = cutoff;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest || this.sfx);
    src.start(t);
  }

  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.15;
    this.musicTimer = setInterval(() => this.tickMusic(), 40);
  }

  tickMusic() {
    if (!this.ctx || !this.musicOn || this.musicPaused) return;
    const dur = 60 / 124 / 4;
    if (this.nextTime < this.ctx.currentTime - 0.5) this.nextTime = this.ctx.currentTime + 0.05;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      this.scheduleStep(this.step, this.nextTime, dur);
      this.step = (this.step + 1) % 64;
      this.nextTime += dur;
    }
  }

  scheduleStep(step, t, dur) {
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const roots = [45, 41, 48, 43];
    const root = roots[bar];
    if (s % 4 === 0) this.sched(150, t, 0.13, 'sine', 0.5, this.music, 52);
    if (s % 2 === 0) this.schedNoise(t, 0.03, s % 4 === 0 ? 0.11 : 0.06, 7000, this.music, 'highpass');
    if ([0, 3, 6, 8, 11, 14].includes(s)) this.sched(this.midi(root), t, 0.16, 'square', 0.14, this.music);
    if (s % 2 === 0) {
      const arp = [0, 7, 12, 15, 19, 15, 12, 7];
      const idx = (s / 2) % arp.length;
      this.sched(this.midi(root + 12 + arp[idx]), t, 0.1, 'triangle', 0.09, this.music);
    }
    // 追击强度：追兵越近，鼓点越密、高频越亮
    const intensity = this.intensity || 0;
    if (intensity > 0.05) {
      if (s % 4 === 2) this.schedNoise(t, 0.04, 0.05 * intensity, 9500, this.music, 'highpass');
      if (s % 2 === 1 && intensity > 0.55) {
        this.sched(this.midi(root + 24), t, 0.05, 'square', 0.055 * intensity, this.music);
      }
      if (s === 0 && intensity > 0.7) {
        this.sched(this.midi(root - 12), t, 0.2, 'sawtooth', 0.05 * intensity, this.music, 60);
      }
    }
  }

  setIntensity(v) {
    this.intensity = Math.max(0, Math.min(1, v));
  }

  milestone() {
    if (!this.ctx) return;
    const t = this.now();
    [0, 4, 7, 11].forEach((semi, i) => {
      this.sched(784 * Math.pow(2, semi / 12), t + i * 0.06, 0.12, 'triangle', 0.14);
    });
  }

  setMusicPaused(paused) {
    this.musicPaused = paused;
    if (!this.ctx) return;
    this.music.gain.setTargetAtTime(paused ? 0.0001 : 0.13, this.ctx.currentTime, 0.08);
    if (!paused) {
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    }
  }

  pickup(big = false) {
    if (!this.ctx) return;
    const t = this.now();
    if (big) {
      [0, 4, 7, 12].forEach((semi, i) => {
        this.sched(880 * Math.pow(2, semi / 12), t + i * 0.055, 0.14, 'triangle', 0.2);
      });
    } else {
      this.sched(1046, t, 0.07, 'triangle', 0.22);
      this.sched(1568, t + 0.04, 0.09, 'sine', 0.13);
    }
  }

  jump() {
    if (!this.ctx) return;
    this.sched(360, this.now(), 0.16, 'triangle', 0.26, null, 720);
  }

  slide() {
    if (!this.ctx) return;
    this.schedNoise(this.now(), 0.24, 0.16, 900, null, 'lowpass');
  }

  hit() {
    if (!this.ctx) return;
    const t = this.now();
    this.sched(180, t, 0.26, 'sawtooth', 0.32, null, 60);
    this.schedNoise(t, 0.16, 0.28, 1200, null, 'lowpass');
  }

  caught() {
    if (!this.ctx) return;
    const t = this.now();
    [660, 523, 392, 262].forEach((f, i) => this.sched(f, t + i * 0.13, 0.2, 'square', 0.22));
    this.schedNoise(t + 0.42, 0.4, 0.18, 600, null, 'lowpass');
  }

  beep(final = false) {
    if (!this.ctx) return;
    this.sched(final ? 1046 : 660, this.now(), final ? 0.32 : 0.1, 'square', 0.18);
  }

  click() {
    if (!this.ctx) return;
    this.sched(520, this.now(), 0.06, 'square', 0.1);
  }
}
