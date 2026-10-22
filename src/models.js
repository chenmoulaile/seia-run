import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const loader = new GLTFLoader();
const gltfCache = new Map();
const rigCache = new Map();

export const CHARACTERS = [
  {
    id: 'seia',
    name: '圣娅',
    tag: '三一 · 茶会',
    icon: '/assets/avatars/seia.webp',
    model: '/models/seia.glb',
    voice: 'seia',
    pursuer: 'croc',
    accent: '#e8b52f',
    blurb: '茶会领袖，今天也想安静地逛完博览会。',
  },
  {
    id: 'hina',
    name: '日奈',
    tag: '格黑娜 · 风纪',
    icon: '/assets/avatars/hina.webp',
    model: '/models/hina.glb',
    voice: 'hina',
    pursuer: 'croc',
    accent: '#b05ee0',
    blurb: '风纪委员长难得放假，却被卷进了博览会追逐赛。',
  },
  {
    id: 'hina-swimsuit',
    name: '日奈',
    tag: '格黑娜 · 风纪',
    variant: '泳装',
    icon: '/assets/avatars/hina-swimsuit.webp',
    model: '/models/hina-swimsuit.glb',
    voice: 'hina-swimsuit',
    pursuer: 'croc',
    accent: '#43b7e8',
    blurb: '海边休假限定，跑起来也带着夏日的风。',
  },
  {
    id: 'hina-dress',
    name: '日奈',
    tag: '格黑娜 · 风纪',
    variant: '礼服',
    icon: '/assets/avatars/hina-dress.webp',
    model: '/models/hina-dress.glb',
    voice: 'hina-dress',
    pursuer: 'croc',
    accent: '#df8ba8',
    blurb: '礼服版风纪委员长，优雅地与机械鳄鱼保持距离。',
  },
  {
    id: 'kisaki',
    name: '妃咲',
    tag: '山海经 · 玄龙门',
    icon: '/assets/avatars/kisaki.webp',
    model: '/models/kisaki.glb',
    voice: 'kisaki',
    pursuer: 'croc',
    accent: '#e85f7a',
    blurb: '门主大人迈着优雅的步伐，视察千年博览会。',
  },
  {
    id: 'kisaki-swimsuit',
    name: '妃咲',
    tag: '山海经 · 玄龙门',
    variant: '泳装',
    icon: '/assets/avatars/kisaki-swimsuit.webp',
    model: '/models/kisaki-swimsuit.glb',
    voice: 'kisaki-swimsuit',
    pursuer: 'croc',
    accent: '#f08a68',
    blurb: '泳装门主亲临海边展区，顺便躲一下机械鳄鱼。',
  },
  {
    id: 'shun',
    name: '瞬',
    tag: '山海经 · 百夜堂',
    icon: '/assets/avatars/shun.webp',
    model: '/models/shun.glb',
    voice: 'shun',
    pursuer: 'croc',
    accent: '#ff9d5c',
    blurb: '百夜堂老板娘亲自出马，把追逐赛跑成了散步。',
  },
  {
    id: 'shun-kid',
    name: '瞬',
    tag: '山海经 · 百夜堂',
    variant: '幼女',
    icon: '/assets/avatars/shun-kid.webp',
    model: '/models/shun-kid.glb',
    voice: 'shun-kid',
    pursuer: 'croc',
    accent: '#ffbf73',
    blurb: '小小只的百夜堂老板娘，跑得比谁都快。',
  },
  {
    id: 'shun-swimsuit-1',
    name: '瞬',
    tag: '山海经 · 百夜堂',
    variant: '泳装',
    icon: '/assets/avatars/shun-swimsuit-1.webp',
    model: '/models/shun-swimsuit-1.glb',
    voice: 'shun-swimsuit-1',
    pursuer: 'croc',
    accent: '#f8a86a',
    blurb: '海边限定的大姐姐，连逃跑都从容不迫。',
  },
  {
    id: 'shun-swimsuit-2',
    name: '瞬',
    tag: '山海经 · 百夜堂',
    variant: '泳装Ⅱ',
    icon: '/assets/avatars/shun-swimsuit-2.webp',
    model: '/models/shun-swimsuit-2.glb',
    voice: 'shun-swimsuit-2',
    pursuer: 'croc',
    accent: '#f0b07a',
    blurb: '另一套海边装扮，笑容里藏着百夜堂的底气。',
  },
  {
    id: 'momoi',
    name: '桃井',
    tag: '千年 · 游戏开发部',
    icon: '/assets/avatars/momoi.webp',
    model: '/models/momoi.glb',
    voice: 'momoi',
    pursuer: 'yuuka',
    accent: '#ff6f9c',
    blurb: '游戏开发部王牌，把逃跑当成新作试玩。',
  },
  {
    id: 'midori',
    name: '绿',
    tag: '千年 · 游戏开发部',
    icon: '/assets/avatars/midori.webp',
    model: '/models/midori.glb',
    voice: 'midori',
    pursuer: 'yuuka',
    accent: '#6bd3a8',
    blurb: '游戏开发部原画师，边跑边观察博览会街景。',
  },
  {
    id: 'aris',
    name: '爱丽丝',
    tag: '千年 · 游戏开发部',
    icon: '/assets/avatars/aris.webp',
    model: '/models/aris.glb',
    voice: 'aris',
    pursuer: 'yuuka',
    accent: '#7aa8ff',
    blurb: '勇者爱丽丝接受委托：在优香抓住她之前跑到终点。',
  },
  {
    id: 'kei',
    name: '凯伊',
    tag: '千年科学学园',
    icon: '/assets/avatars/kei.webp',
    model: '/models/kei.glb',
    voice: 'kei',
    pursuer: 'yuuka',
    accent: '#b98cff',
    blurb: '第一次以自己的身份参加博览会，还不太习惯被追。',
  },
];

export const YUUKA_DEF = {
  id: 'yuuka-pursuer',
  name: '优香',
  icon: '/assets/avatars/yuuka.webp',
  model: '/models/yuuka.glb',
  accent: '#5b8def',
};

const CLIP_ALIASES = {
  idle: ['Cafe_Idle', 'Formation_Idle', 'Normal_Idle', 'Stand_Idle'],
  reaction: ['Cafe_Reaction', 'Formation_Pickup', 'Normal_Callsign'],
  run: ['Move_Ing', 'Cafe_Walk'],
  jump: ['Move_Jump', 'Move_End_Normal'],
  panic: ['Vital_Panic', 'Cafe_Reaction', 'Exs_Cutin'],
  death: ['Vital_Death', 'Vital_Panic', 'Cafe_Reaction'],
  catch: ['Normal_Attack_Start', 'Normal_Callsign', 'Exs_Cutin', 'Exs', 'Cafe_Reaction'],
};

function pickClip(actions, keys) {
  for (const name of keys) if (actions.has(name)) return name;
  return null;
}

function fixMaterial(material) {
  if (!material) return material;
  if (/Halo/i.test(material.name || '')) {
    return new THREE.MeshBasicMaterial({
      map: material.map || null,
      color: 0xffffff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }
  material.side = THREE.DoubleSide;
  return material;
}

function prepareModel(scene) {
  scene.traverse((o) => {
    const name = o.name || '';
    if (/Cutin_(chair|table)|Prop_Mahjong/i.test(name)) {
      o.visible = false;
      return;
    }
    if (!o.isMesh) return;
    o.frustumCulled = false;
    if (/^Mouth_\d/i.test(name)) o.visible = false;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every((m) => m && /Mouth_\d/i.test(m.name || ''))) o.visible = false;
    o.material = Array.isArray(o.material) ? o.material.map(fixMaterial) : fixMaterial(o.material);
  });
}

function measureBox(model) {
  const box = new THREE.Box3();
  model.updateMatrixWorld(true);
  model.traverse((o) => {
    if (!o.isMesh || !o.visible) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (mats.every((m) => m && /Mouth_\d/i.test(m.name || ''))) return;
    if (/halo/i.test(o.name || '')) return;
    if (mats.some((m) => m && /halo/i.test(m.name || ''))) return;
    if (o.isSkinnedMesh) o.computeBoundingBox();
    else if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const bb = (o.boundingBox || o.geometry.boundingBox)?.clone();
    if (bb && !bb.isEmpty()) box.union(bb.applyMatrix4(o.matrixWorld));
  });
  return box;
}

export function loadGLTF(url, onProgress) {
  if (gltfCache.has(url)) return gltfCache.get(url);
  const promise = new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (ev) => {
        if (onProgress && ev.total) onProgress(Math.min(1, ev.loaded / ev.total));
      },
      (err) => {
        gltfCache.delete(url);
        reject(err);
      }
    );
  });
  gltfCache.set(url, promise);
  return promise;
}

export async function loadRig(def, height, onProgress) {
  const cacheKey = def.id;
  if (rigCache.has(cacheKey)) return rigCache.get(cacheKey);
  const gltf = await loadGLTF(def.model, onProgress);
  const rig = buildRig(gltf, def, height);
  rigCache.set(cacheKey, rig);
  return rig;
}

export function getRig(def) {
  return rigCache.get(def.id) || null;
}

function buildRig(gltf, def, height) {
  const model = skeletonClone(gltf.scene);
  prepareModel(model);

  const group = new THREE.Group();
  group.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map();
  for (const clip of gltf.animations) {
    const action = mixer.clipAction(clip);
    actions.set(clip.name, action);
  }

  const clips = {
    idle: pickClip(actions, CLIP_ALIASES.idle),
    reaction: pickClip(actions, CLIP_ALIASES.reaction),
    run: pickClip(actions, CLIP_ALIASES.run),
    jump: pickClip(actions, CLIP_ALIASES.jump),
    panic: pickClip(actions, CLIP_ALIASES.panic),
    death: pickClip(actions, CLIP_ALIASES.death),
    catch: pickClip(actions, CLIP_ALIASES.catch),
  };

  const runAction = clips.run ? actions.get(clips.run) : null;
  if (runAction) {
    runAction.reset();
    runAction.setLoop(THREE.LoopRepeat, Infinity);
    runAction.setEffectiveWeight(1);
    runAction.play();
    mixer.setTime((runAction.getClip().duration || 1) * 0.35);
  }
  const posed = measureBox(model);
  const posedHeight = Math.max(0.001, posed.max.y - posed.min.y);
  const scale = height / posedHeight;
  model.scale.setScalar(scale);
  model.position.y = 0;
  const scaled = measureBox(model);
  const baseY = 0.02 - scaled.min.y;
  model.position.y = baseY;
  mixer.stopAllAction();
  mixer.setTime(0);

  group.rotation.y = Math.PI;
  group.traverse((o) => {
    if (o.isMesh) o.frustumCulled = false;
  });

  let current = null;
  let finishHandler = null;

  const playLoop = (name, fade = 0.2) => {
    if (!name) return;
    const next = actions.get(name);
    if (!next || next === current) return;
    next.reset();
    next.setLoop(THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = false;
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    if (current) next.crossFadeFrom(current, fade, false);
    next.play();
    current = next;
  };

  const playOnce = (name, { fade = 0.15, onDone = null, timeScale = 1 } = {}) => {
    const next = actions.get(name);
    if (!next) {
      if (onDone) onDone();
      return null;
    }
    if (finishHandler) mixer.removeEventListener('finished', finishHandler);
    next.reset();
    next.setLoop(THREE.LoopOnce, 1);
    next.clampWhenFinished = true;
    next.enabled = true;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    if (current) next.crossFadeFrom(current, fade, false);
    next.play();
    current = next;
    finishHandler = (e) => {
      if (e.action !== next) return;
      mixer.removeEventListener('finished', finishHandler);
      finishHandler = null;
      if (onDone) onDone();
    };
    mixer.addEventListener('finished', finishHandler);
    return next;
  };

  const stopAll = () => {
    mixer.stopAllAction();
    current = null;
  };

  return {
    def,
    group,
    model,
    mixer,
    actions,
    clips,
    baseY,
    height,
    playLoop,
    playOnce,
    stopAll,
    setTilt(x) {
      model.rotation.x = x;
    },
    setOffsetY(dy) {
      model.position.y = baseY + dy;
    },
    update(dt) {
      mixer.update(dt);
    },
    resetPose() {
      model.rotation.x = 0;
      model.position.y = baseY;
    },
  };
}

export function makeBlobShadow(radius = 0.55, opacity = 0.34) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(10, 20, 40, ${opacity})`);
  grad.addColorStop(0.65, `rgba(10, 20, 40, ${opacity * 0.55})`);
  grad.addColorStop(1, 'rgba(10, 20, 40, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2.6, radius * 2.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.02;
  return mesh;
}
