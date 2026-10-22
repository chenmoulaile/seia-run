import './style.css';
import * as THREE from 'three';
import { World } from './world.js';
import { StreetScene } from './street.js';
import { Game } from './game.js';
import { UI } from './ui.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { CursorFX } from './cursor.js';
import { CHARACTERS } from './models.js';
import { CFG } from './config.js';

const params = new URLSearchParams(window.location.search);
const initialChar = params.get('char') || 'seia';
const autoPlay = params.get('play') === '1';
const touchDevice = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 420);

const world = new World(scene);
const street = new StreetScene(scene);
const audio = new AudioEngine();
const input = new Input();
const ui = new UI();
const cursor = new CursorFX();
const game = new Game({ scene, camera, world, cafe: street, ui, audio, input });

ui.setMuted(audio.muted);
ui.setBest(game.best.score);

const startGame = () => {
  if (!game.ready) return;
  if (game.state !== 'menu' && game.state !== 'over') return;
  audio.init();
  audio.click();
  game.startRun();
};

game.onStartRequest = startGame;

// 首次在触屏设备上开跑时给一次滑动操作提示
game.onRunStart = () => {
  if (!touchDevice) return;
  let seen = false;
  try {
    seen = localStorage.getItem(CFG.seenKey) === '1';
  } catch {
    seen = false;
  }
  if (seen) return;
  ui.showSwipeHint(4600);
  try {
    localStorage.setItem(CFG.seenKey, '1');
  } catch {
    /* ignore */
  }
};

ui.on('start', startGame);
ui.on('pause', () => game.togglePause());
ui.on('resume', () => game.resume());
ui.on('restart', () => {
  audio.init();
  audio.click();
  game.startRun();
});
ui.on('home', () => {
  audio.init();
  audio.click();
  game.enterMenu();
});
ui.on('mute', () => {
  audio.init();
  const muted = audio.toggleMute();
  ui.setMuted(muted);
});
input.on('mute', () => {
  audio.init();
  const muted = audio.toggleMute();
  ui.setMuted(muted);
});
ui.on('select', async (id) => {
  if (!game.ready || game.state !== 'menu') return;
  if (game.characterId === id) {
    audio.init();
    game.talk(id);
    return;
  }
  const def = CHARACTERS.find((c) => c.id === id);
  const name = def ? def.name : '角色';
  ui.setBusy(`正在召唤${name}… 0%`);
  audio.init();
  audio.click();
  try {
    await game.selectCharacter(id, (f) => {
      ui.setBusy(`正在召唤${name}… ${Math.round(f * 100)}%`);
    });
    ui.setReady(true);
    ui.toast(`已选择 ${name}`, 1100);
    game.speakPickup();
  } catch (err) {
    console.error('character load failed', err);
    ui.setReady(true);
    ui.toast('模型加载失败，请重试', 2200);
  }
});

canvas.addEventListener('pointerdown', () => audio.init(), { once: true });
window.addEventListener('keydown', () => audio.init(), { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.pauseForVisibility();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  game.updateCamera(dt);
  cursor.setActive(game.state === 'menu' || game.state === 'loading' || game.state === 'over');
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

window.__seia = { game, ui, audio, cursor, street, renderer, scene, camera, startGame };

(async () => {
  try {
    await game.init(initialChar, (p) => ui.setStartProgress(p));
    ui.setReady(true);
    ui.setBest(game.best.score);
    game.enterMenu();
    if (autoPlay) setTimeout(startGame, 250);
  } catch (err) {
    console.error('init failed', err);
    ui.setReady(false);
    ui.el.startBtn.textContent = '模型加载失败 · 请刷新页面';
  }
})();
