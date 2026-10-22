import * as THREE from 'three';
import { LANES, CFG } from './config.js';

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export const OBSTACLE_DEFS = {
  low: { yMin: 0, yMax: 0.9, halfW: 1.02, halfD: 0.42 },
  high: { yMin: 1.12, yMax: 2.35, halfW: 1.02, halfD: 0.34 },
  block: { yMin: 0, yMax: 2.45, halfW: 1.0, halfD: 0.52 },
};

let stripeTex;
function getStripeTex() {
  if (!stripeTex) {
    stripeTex = canvasTexture(256, 64, (ctx, w, h) => {
      ctx.fillStyle = '#ffcf3d';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#232a3d';
      for (let x = -h; x < w + h; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 19, 0);
        ctx.lineTo(x + 19 + h, h);
        ctx.lineTo(x + h, h);
        ctx.closePath();
        ctx.fill();
      }
    });
    stripeTex.wrapS = THREE.RepeatWrapping;
    stripeTex.wrapT = THREE.RepeatWrapping;
  }
  return stripeTex;
}

let signTex;
function getSignTex() {
  if (!signTex) {
    signTex = canvasTexture(256, 320, (ctx, w, h) => {
      ctx.fillStyle = '#f7fbff';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#2f6fe4';
      ctx.lineWidth = 14;
      ctx.strokeRect(9, 9, w - 18, h - 18);
      ctx.fillStyle = '#2f6fe4';
      ctx.font = '900 74px "Microsoft YaHei", "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('工事中', w / 2, h * 0.38);
      ctx.fillStyle = '#5b7098';
      ctx.font = '700 22px "Segoe UI", sans-serif';
      ctx.fillText('KIVOTOS WORKS', w / 2, h * 0.56);
      ctx.fillStyle = '#ffce3a';
      ctx.fillRect(0, h - 62, w, 62);
      ctx.fillStyle = '#232a3d';
      for (let x = -60; x < w + 60; x += 42) {
        ctx.beginPath();
        ctx.moveTo(x, h - 62);
        ctx.lineTo(x + 21, h - 62);
        ctx.lineTo(x + 21 + 42, h);
        ctx.lineTo(x + 42, h);
        ctx.closePath();
        ctx.fill();
      }
    });
  }
  return signTex;
}

let glowTex;
function getGlowTex() {
  if (!glowTex) {
    glowTex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(225, 242, 255, 0.95)');
      g.addColorStop(0.32, 'rgba(120, 190, 255, 0.5)');
      g.addColorStop(1, 'rgba(80, 150, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }
  return glowTex;
}

const darkMat = new THREE.MeshLambertMaterial({ color: 0x303a4e });
const postMat = new THREE.MeshLambertMaterial({ color: 0xdfe8f4 });
const stripeMat = new THREE.MeshLambertMaterial({ map: getStripeTex() });
const signMat = new THREE.MeshLambertMaterial({ map: getSignTex() });
const lampMat = new THREE.MeshBasicMaterial({ color: 0xff5a5a, toneMapped: false });
const gemCoreMat = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  vertexColors: true,
  emissive: 0x2b63c8,
  emissiveIntensity: 0.38,
  shininess: 180,
  specular: 0xffffff,
  flatShading: true,
  transparent: true,
  opacity: 0.92,
});
const gemCoreMatBig = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  vertexColors: true,
  emissive: 0x3a75e0,
  emissiveIntensity: 0.46,
  shininess: 200,
  specular: 0xffffff,
  flatShading: true,
  transparent: true,
  opacity: 0.94,
});
const gemInnerMat = new THREE.MeshBasicMaterial({
  color: 0xdff2ff,
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const glowMat = new THREE.SpriteMaterial({
  map: getGlowTex(),
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const gemSparkMat = new THREE.SpriteMaterial({
  map: getGlowTex(),
  color: 0xffffff,
  transparent: true,
  opacity: 0.62,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});

function makeLamp() {
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lampMat);
  lamp.position.set(0.72, 0.96, 0);
  return lamp;
}

let crateTex;
function getCrateTex() {
  if (!crateTex) {
    crateTex = canvasTexture(256, 128, (ctx, w, h) => {
      ctx.fillStyle = '#d9b382';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#a9814f';
      ctx.lineWidth = 9;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      ctx.beginPath();
      ctx.moveTo(8, 8);
      ctx.lineTo(w - 8, h - 8);
      ctx.moveTo(w - 8, 8);
      ctx.lineTo(8, h - 8);
      ctx.stroke();
      ctx.fillStyle = '#7c5a33';
      ctx.font = '900 26px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('EXPO 物资', w / 2, h / 2);
    });
  }
  return crateTex;
}

let vendTex;
function getVendTex() {
  if (!vendTex) {
    vendTex = canvasTexture(256, 384, (ctx, w, h) => {
      ctx.fillStyle = '#eaf4ff';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f6fe4';
      ctx.fillRect(0, 0, w, 52);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 26px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('千年饮料', w / 2, 27);
      const cols = 4;
      const rows = 5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = 18 + c * 56;
          const y = 70 + r * 48;
          ctx.fillStyle = 'rgba(120, 170, 235, 0.24)';
          ctx.fillRect(x, y, 44, 38);
          ctx.fillStyle = ['#ff7a8a', '#59c6ff', '#ffd24d', '#7ee3c0'][(r + c) % 4];
          ctx.fillRect(x + 14, y + 8, 16, 24);
        }
      }
      ctx.fillStyle = '#c9d8ee';
      ctx.fillRect(0, h - 92, w, 92);
      ctx.fillStyle = '#5b7098';
      ctx.fillRect(30, h - 62, 78, 20);
      ctx.fillStyle = '#ffce3a';
      ctx.fillRect(w - 74, h - 66, 44, 28);
    });
  }
  return vendTex;
}

function createLow() {
  // 同一碰撞体的两种外观：路障 / 博览会物资箱
  if (Math.random() < 0.5) return createLowCrates();
  return createLowBarrier();
}

function createLowBarrier() {
  const g = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.1, 0.55), darkMat);
  foot.position.y = 0.05;
  g.add(foot);
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.1), postMat);
    post.position.set(s * 0.92, 0.3, 0);
    g.add(post);
  }
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.5, 0.12), stripeMat);
  panel.position.y = 0.62;
  g.add(panel);
  g.add(makeLamp());
  return g;
}

function createLowCrates() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ map: getCrateTex() });
  const big = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.62, 0.62), mat);
  big.position.y = 0.31;
  g.add(big);
  const small = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.52, 0.56), mat);
  small.position.set(-0.55, 0.88, 0.02);
  small.rotation.y = 0.12;
  g.add(small);
  const small2 = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.42, 0.52), mat);
  small2.position.set(0.6, 0.83, -0.02);
  small2.rotation.y = -0.18;
  g.add(small2);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.42, 8),
    new THREE.MeshLambertMaterial({ color: 0xff7a4d })
  );
  cone.position.set(1.02, 0.21, 0.2);
  g.add(cone);
  return g;
}

function createHigh() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 2.2, 0.11), postMat);
    post.position.set(s * 0.94, 1.1, 0);
    g.add(post);
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.4), darkMat);
    base.position.set(s * 0.94, 0.05, 0);
    g.add(base);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.46, 0.16), stripeMat);
  beam.position.y = 1.62;
  g.add(beam);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), lampMat);
  lamp.position.set(0.8, 1.9, 0);
  g.add(lamp);
  return g;
}

function createBlock() {
  // 同一碰撞体的两种外观：工事告示板 / 自动贩卖机
  if (Math.random() < 0.45) return createBlockVending();
  return createBlockSign();
}

function createBlockSign() {
  const g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(1.94, 2.1, 0.5), signMat);
  board.position.y = 1.12;
  g.add(board);
  for (const s of [-1, 1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.8), darkMat);
    foot.position.set(s * 0.7, 0.07, 0);
    g.add(foot);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.12, 0.56), darkMat);
  top.position.y = 2.22;
  g.add(top);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), lampMat);
  lamp.position.set(0, 2.34, 0.1);
  g.add(lamp);
  return g;
}

function createBlockVending() {
  const g = new THREE.Group();
  const side = new THREE.MeshLambertMaterial({ color: 0xdce7f6 });
  const front = new THREE.MeshLambertMaterial({ map: getVendTex() });
  const mats = [side, side, side, side, front, side];
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 2.1, 0.62), mats);
  body.position.y = 1.07;
  g.add(body);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.1, 0.68), darkMat);
  top.position.y = 2.16;
  g.add(top);
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.16),
    new THREE.MeshBasicMaterial({ color: 0xbfe9ff, toneMapped: false })
  );
  glow.position.set(0, 1.98, 0.33);
  g.add(glow);
  return g;
}

function crystalGeometry() {
  const positions = [];
  const colors = [];
  const topPalette = [0xffffff, 0xdff4ff, 0xffffff, 0xeaf6ff, 0xffe7fb, 0xcfeaff];
  const upperPalette = [0x9fd8ff, 0xeaf9ff, 0x65b7ff, 0xb9b7ff, 0xffffff, 0x8fd0ff, 0xffd9f3, 0x5aa8ff];
  const lowerPalette = [0x8fcbff, 0xd9f2ff, 0xc4c2ff, 0xc6ecff, 0xffe0f6, 0x9fcfff, 0xf0f8ff, 0x6fa9ff];

  const ring = (radius, y, rotation) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = rotation + (i / 6) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius);
    });

  const top = new THREE.Vector3(0, 0.31, 0);
  const bottom = new THREE.Vector3(0, -0.31, 0);
  const crown = ring(0.16, 0.18, Math.PI / 6);
  const girdle = ring(0.23, 0.07, 0);
  const pavilion = ring(0.18, -0.09, Math.PI / 6);

  const tri = (a, b, c, color) => {
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const center = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3);
    if (normal.dot(center) < 0) [b, c] = [c, b];
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    const col = new THREE.Color(color);
    for (let i = 0; i < 3; i++) colors.push(col.r, col.g, col.b);
  };

  for (let i = 0; i < 6; i++) {
    tri(top, crown[i], crown[(i + 1) % 6], topPalette[i]);
  }
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    tri(crown[i], girdle[i], crown[j], upperPalette[(i * 2) % upperPalette.length]);
    tri(crown[j], girdle[i], girdle[j], upperPalette[(i * 2 + 1) % upperPalette.length]);
  }
  for (let i = 0; i < 6; i++) {
    const j = (i + 1) % 6;
    tri(girdle[i], pavilion[i], girdle[j], lowerPalette[(i * 2) % lowerPalette.length]);
    tri(girdle[j], pavilion[i], pavilion[j], lowerPalette[(i * 2 + 1) % lowerPalette.length]);
  }
  for (let i = 0; i < 6; i++) {
    tri(pavilion[i], bottom, pavilion[(i + 1) % 6], lowerPalette[(i * 2 + 3) % lowerPalette.length]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function createGem(big) {
  const g = new THREE.Group();
  const core = new THREE.Mesh(crystalGeometry(), big ? gemCoreMatBig : gemCoreMat);
  g.add(core);
  const inner = new THREE.Mesh(crystalGeometry(), gemInnerMat);
  inner.scale.setScalar(0.52);
  g.add(inner);
  const glow = new THREE.Sprite(glowMat);
  glow.scale.setScalar(big ? 1.18 : 0.95);
  g.add(glow);
  const sparkle = new THREE.Sprite(gemSparkMat);
  sparkle.scale.setScalar(big ? 0.46 : 0.28);
  sparkle.position.set(-0.03, 0.04, 0.3);
  sparkle.renderOrder = 5;
  g.add(sparkle);
  if (big) {
    const pink = new THREE.Sprite(gemSparkMat.clone());
    pink.material.color.setHex(0xffb7e8);
    pink.material.opacity = 0.22;
    pink.scale.setScalar(0.3);
    pink.position.set(0.14, 0.12, 0.24);
    pink.renderOrder = 5;
    g.add(pink);
  }
  g.userData.spin = big ? 1.15 : 1.55;
  g.userData.ring = null;
  return g;
}

export class Props {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.gems = [];
    this.pools = { low: [], high: [], block: [], gem: [], bigGem: [] };
    this.takenGems = [];
  }

  acquire(type) {
    const pool = this.pools[type];
    if (pool && pool.length) {
      const m = pool.pop();
      m.visible = true;
      return m;
    }
    let mesh;
    if (type === 'low') mesh = createLow();
    else if (type === 'high') mesh = createHigh();
    else if (type === 'block') mesh = createBlock();
    else if (type === 'bigGem') mesh = createGem(true);
    else mesh = createGem(false);
    this.scene.add(mesh);
    return mesh;
  }

  release(type, mesh) {
    mesh.visible = false;
    const pool = this.pools[type];
    if (pool) pool.push(mesh);
  }

  spawnObstacle(type, lane, z) {
    const def = OBSTACLE_DEFS[type];
    const mesh = this.acquire(type);
    const x = LANES[lane];
    mesh.position.set(x, 0, z);
    const entry = {
      type,
      lane,
      x,
      z,
      yMin: def.yMin,
      yMax: def.yMax,
      halfW: def.halfW,
      halfD: def.halfD,
      mesh,
    };
    this.obstacles.push(entry);
    return entry;
  }

  spawnGem(x, y, z, big = false) {
    const type = big ? 'bigGem' : 'gem';
    const mesh = this.acquire(type);
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(big ? 1.4 : 1);
    const entry = {
      type,
      big,
      x,
      y,
      z,
      baseY: y,
      phase: Math.random() * Math.PI * 2,
      taken: false,
      mesh,
    };
    this.gems.push(entry);
    return entry;
  }

  update(dt, speed, t) {
    const dz = speed * dt;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.z += dz;
      o.mesh.position.z = o.z;
      if (o.z > CFG.cullZ) {
        this.release(o.type, o.mesh);
        this.obstacles.splice(i, 1);
      }
    }
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const g = this.gems[i];
      g.z += dz;
      g.mesh.position.z = g.z;
      if (!g.taken) {
        g.mesh.position.y = g.baseY + Math.sin(t * 2.4 + g.phase) * 0.08;
        g.mesh.rotation.y += dt * g.mesh.userData.spin;
        const ring = g.mesh.userData.ring;
        if (ring) ring.rotation.z += dt * 2.4;
      }
      if (g.z > CFG.cullZ) {
        this.release(g.type, g.mesh);
        this.gems.splice(i, 1);
      }
    }
    if (lampMat) {
      lampMat.color.setHex(Math.sin(t * 9) > 0 ? 0xff5a5a : 0x6e2020);
    }
  }

  burstGem(gem) {
    gem.taken = true;
    gem.mesh.visible = false;
    this.release(gem.type, gem.mesh);
    const idx = this.gems.indexOf(gem);
    if (idx >= 0) this.gems.splice(idx, 1);
  }

  reset() {
    for (const o of this.obstacles) this.release(o.type, o.mesh);
    for (const g of this.gems) this.release(g.type, g.mesh);
    this.obstacles.length = 0;
    this.gems.length = 0;
  }
}
