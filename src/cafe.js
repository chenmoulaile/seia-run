import * as THREE from 'three';

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

function woodTexture() {
  const tex = canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#a97b55';
    ctx.fillRect(0, 0, w, h);
    const plank = 64;
    for (let row = 0; row < h / plank; row++) {
      const y = row * plank;
      const offset = (row % 2) * 96;
      for (let x = -96; x < w; x += 192) {
        const light = 0.82 + Math.random() * 0.26;
        ctx.fillStyle = `rgba(${Math.round(180 * light)}, ${Math.round(132 * light)}, ${Math.round(88 * light)}, 1)`;
        ctx.fillRect(x + offset, y, 190, plank - 3);
        ctx.strokeStyle = 'rgba(78, 47, 28, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + offset, y, 190, plank - 3);
        for (let i = 0; i < 7; i++) {
          const gy = y + 8 + Math.random() * (plank - 18);
          ctx.strokeStyle = `rgba(92, 55, 31, ${0.08 + Math.random() * 0.08})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + offset + 8, gy);
          ctx.bezierCurveTo(x + offset + 60, gy + 4, x + offset + 120, gy - 3, x + offset + 178, gy + 2);
          ctx.stroke();
        }
      }
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

function rugTexture() {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#9e4f4a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e5b78f';
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, w - 32, h - 32);
    ctx.strokeStyle = 'rgba(255, 232, 197, 0.55)';
    ctx.lineWidth = 4;
    ctx.strokeRect(38, 38, w - 76, h - 76);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    for (let i = 0; i < 5; i++) {
      ctx.rotate(Math.PI / 5);
      ctx.fillStyle = i % 2 ? 'rgba(247, 204, 149, 0.2)' : 'rgba(80, 33, 42, 0.16)';
      ctx.beginPath();
      ctx.moveTo(0, -92);
      ctx.lineTo(62, 0);
      ctx.lineTo(0, 92);
      ctx.lineTo(-62, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 226, 178, 0.8)';
    for (let x = 54; x < w - 40; x += 58) {
      for (let y = 54; y < h - 40; y += 58) {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function windowTexture() {
  return canvasTexture(512, 384, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#6aa9ff');
    sky.addColorStop(0.5, '#b8dcff');
    sky.addColorStop(1, '#f6e6c9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 246, 219, 0.9)';
    ctx.beginPath();
    ctx.arc(w * 0.72, h * 0.25, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (const [x, y, s] of [[90, 94, 32], [138, 82, 44], [190, 98, 28], [388, 122, 30], [430, 108, 40]]) {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.arc(x + s * 0.8, y + 4, s * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(112, 137, 175, 0.45)';
    for (let i = 0; i < 9; i++) {
      const bw = 34 + Math.random() * 46;
      const bh = 70 + Math.random() * 120;
      const x = i * 62 - 10;
      ctx.fillRect(x, h - bh, bw, bh);
      ctx.fillStyle = 'rgba(255, 245, 208, 0.5)';
      for (let yy = h - bh + 16; yy < h - 12; yy += 22) ctx.fillRect(x + 8, yy, 8, 8);
      ctx.fillStyle = 'rgba(112, 137, 175, 0.45)';
    }
    ctx.fillStyle = 'rgba(104, 143, 102, 0.65)';
    ctx.beginPath();
    ctx.arc(70, h - 30, 76, 0, Math.PI * 2);
    ctx.arc(150, h - 18, 58, 0, Math.PI * 2);
    ctx.fill();
  });
}

function signTexture() {
  return canvasTexture(640, 160, (ctx, w, h) => {
    ctx.fillStyle = '#22304a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#e7c37a';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#f4d99a';
    ctx.font = '900 58px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KIVOTOS CAFE', w / 2, h * 0.43);
    ctx.fillStyle = 'rgba(255, 244, 218, 0.72)';
    ctx.font = '700 21px "Segoe UI", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('TEA  ·  PASTRY  ·  TEA PARTY', w / 2, h * 0.72);
  });
}

function chalkTexture() {
  return canvasTexture(512, 340, (ctx, w, h) => {
    ctx.fillStyle = '#263f36';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(244, 230, 196, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#f4e6c4';
    ctx.textAlign = 'center';
    ctx.font = '700 24px "Segoe UI", sans-serif';
    ctx.fillText("TODAY'S TEA", w / 2, 68);
    ctx.font = '900 42px "Microsoft YaHei", sans-serif';
    ctx.fillText('青辉石特调', w / 2, 132);
    ctx.font = '600 24px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = 'rgba(244, 230, 196, 0.82)';
    ctx.fillText('草莓蛋糕  ·  司康  ·  红茶', w / 2, 190);
    ctx.strokeStyle = 'rgba(143, 238, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w / 2, 228);
    ctx.lineTo(w / 2 + 22, 258);
    ctx.lineTo(w / 2, 290);
    ctx.lineTo(w / 2 - 22, 258);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'rgba(244, 230, 196, 0.55)';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillText('今日限定', w / 2, 318);
  });
}

function artTexture() {
  return canvasTexture(320, 240, (ctx, w, h) => {
    ctx.fillStyle = '#dfeaf7';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8db7e9';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.32, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f6d38c';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.63);
    ctx.quadraticCurveTo(w * 0.36, h * 0.38, w * 0.7, h * 0.68);
    ctx.lineTo(w, h * 0.57);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3d6f9f';
    ctx.fillRect(w * 0.18, h * 0.58, 52, 80);
    ctx.fillStyle = '#fff6df';
    ctx.fillRect(w * 0.22, h * 0.63, 12, 16);
    ctx.fillRect(w * 0.43, h * 0.63, 12, 16);
  });
}

function softDotTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(255,240,210,0.4)');
    g.addColorStop(1, 'rgba(255,240,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

export class CafeScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'cafe';
    scene.add(this.group);
    this.time = 0;
    this.dust = null;
    this.pendant = null;
    this.build();
  }

  add(mesh) {
    this.group.add(mesh);
    return mesh;
  }

  box(w, h, d, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    return this.add(mesh);
  }

  build() {
    const wall = new THREE.MeshLambertMaterial({ color: 0xefe2cf });
    const wallDeep = new THREE.MeshLambertMaterial({ color: 0xd9bfa0 });
    const trim = new THREE.MeshLambertMaterial({ color: 0xfbf2e2 });
    const wood = new THREE.MeshLambertMaterial({ color: 0x7b5138 });
    const woodLight = new THREE.MeshLambertMaterial({ color: 0xb47a50 });
    const darkWood = new THREE.MeshLambertMaterial({ color: 0x4f382c });
    const brass = new THREE.MeshPhongMaterial({ color: 0xd6b16c, shininess: 90, specular: 0xfff2ce });
    const marble = new THREE.MeshLambertMaterial({ color: 0xf0e7da });
    const green = new THREE.MeshLambertMaterial({ color: 0x527f5b });
    const greenLight = new THREE.MeshLambertMaterial({ color: 0x72a272 });
    const terracotta = new THREE.MeshLambertMaterial({ color: 0xb7654f });
    const cream = new THREE.MeshLambertMaterial({ color: 0xf5ead8 });
    const glass = new THREE.MeshPhongMaterial({
      color: 0xcfefff,
      transparent: true,
      opacity: 0.22,
      shininess: 120,
      specular: 0xffffff,
      depthWrite: false,
    });

    this.add(new THREE.HemisphereLight(0xfff3df, 0x87624b, 1.15));
    const key = new THREE.DirectionalLight(0xffe1b8, 1.55);
    key.position.set(3.5, 6.5, -2.4);
    this.add(key);
    const rim = new THREE.DirectionalLight(0xbfe5ff, 0.75);
    rim.position.set(-4.5, 5.2, 5.2);
    this.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12.4, 11.8),
      new THREE.MeshLambertMaterial({ map: woodTexture() })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0.008, -0.8);
    this.add(floor);

    this.box(12.4, 3.6, 0.22, wall, 0, 1.8, 4.42);
    this.box(0.22, 3.6, 11.9, wall, 5.95, 1.8, -0.8);
    this.box(0.22, 3.6, 11.9, wall, -5.95, 1.8, -0.8);
    this.box(12.4, 0.18, 11.9, cream, 0, 3.55, -0.8);

    this.box(12.4, 0.95, 0.1, wallDeep, 0, 0.53, 4.28);
    this.box(12.4, 0.08, 0.14, trim, 0, 1.02, 4.26);
    this.box(12.4, 0.12, 0.12, trim, 0, 0.08, 4.25);
    for (let x = -5.7; x <= 5.7; x += 0.95) {
      this.box(0.06, 0.78, 0.06, trim, x, 0.54, 4.2);
    }
    this.box(0.18, 0.18, 11.7, darkWood, -3.9, 3.43, -0.8);
    this.box(0.18, 0.18, 11.7, darkWood, 3.9, 3.43, -0.8);
    for (const z of [-2.7, 0.4, 3.5]) {
      this.box(11.7, 0.16, 0.18, darkWood, 0, 3.44, z);
    }

    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(4.9, 2.95),
      new THREE.MeshLambertMaterial({ map: rugTexture() })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.9, 0.014, 0.35);
    this.add(rug);

    this.buildWindow(trim, cream, brass);
    this.buildCounter({ wood, woodLight, marble, brass, glass, green, greenLight, cream, darkWood, terracotta });
    this.buildTables({ wood, woodLight, marble, cream, brass });
    this.buildPlants({ terracotta, green, greenLight });
    this.buildWall({ wall, trim, darkWood, brass });
    this.buildLamps({ darkWood, brass });
    this.buildDust();
  }

  buildWindow(trim, cream, brass) {
    const tex = windowTexture();
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 2.05),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    glass.position.set(-2.05, 2.1, 4.24);
    glass.rotation.y = Math.PI;
    this.add(glass);

    this.box(2.82, 0.16, 0.2, trim, -2.05, 3.16, 4.16);
    this.box(2.82, 0.16, 0.2, trim, -2.05, 1.04, 4.16);
    this.box(0.16, 2.28, 0.2, trim, -3.38, 2.1, 4.16);
    this.box(0.16, 2.28, 0.2, trim, -0.72, 2.1, 4.16);
    this.box(0.09, 2.05, 0.12, trim, -2.05, 2.1, 4.12);
    this.box(2.5, 0.09, 0.12, trim, -2.05, 2.1, 4.12);
    this.box(2.98, 0.1, 0.42, cream, -2.05, 0.98, 3.98);

    for (const x of [-3.28, -0.82]) {
      const curtain = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.3, 0.09), cream);
      curtain.position.set(x, 2.12, 4.05);
      this.add(curtain);
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 12), brass);
      tie.position.set(x, 1.62, 4.0);
      tie.rotation.x = Math.PI / 2;
      this.add(tie);
    }
  }

  buildCounter({ wood, woodLight, marble, brass, glass, green, greenLight, cream, darkWood, terracotta }) {
    this.box(3.0, 1.0, 0.82, woodLight, -4.25, 0.5, 3.72);
    this.box(3.18, 0.09, 0.96, marble, -4.25, 1.06, 3.72);
    this.box(3.16, 0.08, 0.1, darkWood, -4.25, 1.12, 3.26);
    for (let x = -5.4; x <= -3.1; x += 0.46) {
      this.box(0.06, 0.72, 0.06, darkWood, x, 0.45, 3.29);
    }

    this.box(2.2, 0.09, 0.36, wood, -4.25, 1.98, 4.13);
    this.box(2.2, 0.09, 0.36, wood, -4.25, 2.56, 4.13);
    for (let i = 0; i < 7; i++) {
      const x = -5.05 + (i % 4) * 0.42;
      const y = i < 4 ? 2.12 : 2.7;
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.11, 10), i % 2 ? cream : greenLight);
      mug.position.set(x, y, 4.05);
      this.add(mug);
    }
    this.box(0.7, 0.05, 0.22, marble, -5.0, 2.05, 4.08);

    this.box(0.62, 0.44, 0.5, darkWood, -4.75, 1.34, 3.72);
    this.box(0.8, 0.09, 0.58, brass, -4.75, 1.57, 3.72);
    const machine = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.46, 12), brass);
    machine.position.set(-4.75, 1.83, 3.72);
    this.add(machine);
    for (const x of [-4.58, -4.92]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 10), cream);
      cup.position.set(x, 1.66, 3.48);
      this.add(cup);
    }

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      glass
    );
    dome.position.set(-3.5, 1.17, 3.72);
    this.add(dome);
    const cake = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.17, 16), cream);
    cake.position.set(-3.5, 1.13, 3.72);
    this.add(cake);
    this.box(0.4, 0.035, 0.4, marble, -3.5, 1.11, 3.72);

    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.68, 1.12),
      new THREE.MeshBasicMaterial({ map: chalkTexture() })
    );
    board.position.set(-4.25, 2.28, 4.3);
    board.rotation.y = Math.PI;
    this.add(board);
    this.box(1.78, 0.06, 0.1, darkWood, -4.25, 2.87, 4.28);
    this.box(1.78, 0.06, 0.1, darkWood, -4.25, 1.7, 4.28);
    this.box(0.06, 1.2, 0.1, darkWood, -5.12, 2.28, 4.28);
    this.box(0.06, 1.2, 0.1, darkWood, -3.38, 2.28, 4.28);

    for (const [x, y] of [[-5.3, 3.2], [-3.2, 3.2]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.13, 0.3, 10), terracotta);
      pot.position.set(x, y, 4.05);
      this.add(pot);
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), green);
        leaf.position.set(x + (i - 1.5) * 0.11, y + 0.25 + (i % 2) * 0.1, 4.05 + (i % 2 ? -0.08 : 0.08));
        this.add(leaf);
      }
    }
  }

  buildTables({ wood, woodLight, marble, cream, brass }) {
    for (const [x, z, rot] of [[-3.75, 1.2, 0.2], [1.65, 2.2, -0.3]]) {
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 20), marble);
      top.position.set(x, 0.78, z);
      this.add(top);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.7, 10), woodLight);
      stem.position.set(x, 0.4, z);
      this.add(stem);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.07, 16), wood);
      base.position.set(x, 0.07, z);
      this.add(base);
      for (const a of [rot, rot + Math.PI * 0.72]) {
        const cx = x + Math.cos(a) * 0.9;
        const cz = z + Math.sin(a) * 0.9;
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.44), woodLight);
        seat.position.set(cx, 0.46, cz);
        seat.rotation.y = -a;
        this.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.5, 0.07), wood);
        back.position.set(cx + Math.cos(a) * 0.2, 0.69, cz + Math.sin(a) * 0.2);
        back.rotation.y = -a;
        this.add(back);
        for (const side of [-0.16, 0.16]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.05), wood);
          post.position.set(
            cx + Math.cos(a) * 0.2 + Math.cos(a + Math.PI / 2) * side,
            0.58,
            cz + Math.sin(a) * 0.2 + Math.sin(a + Math.PI / 2) * side
          );
          post.rotation.y = -a;
          this.add(post);
        }
        for (let i = 0; i < 4; i++) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.44, 0.05), wood);
          leg.position.set(cx + (i % 2 ? 0.16 : -0.16), 0.22, cz + (i < 2 ? 0.16 : -0.16));
          this.add(leg);
        }
      }
    }

    const teapot = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), cream);
    teapot.scale.y = 0.8;
    teapot.position.set(-3.62, 0.9, 1.16);
    this.add(teapot);
    for (const [dx, dz] of [[0.25, 0.1], [0.15, -0.2]]) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.09, 10), cream);
      cup.position.set(-3.62 + dx, 0.87, 1.16 + dz);
      this.add(cup);
    }
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16), brass);
    plate.position.set(1.65, 0.83, 2.2);
    this.add(plate);
  }

  buildPlants({ terracotta, green, greenLight }) {
    for (const [x, z, s] of [[-5.25, 1.7, 0.85], [4.9, 3.4, 1.05], [4.7, -2.9, 0.7]]) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.26 * s, 0.18 * s, 0.42 * s, 12), terracotta);
      pot.position.set(x, 0.21 * s, z);
      this.add(pot);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.9 * s, 8), green);
      stem.position.set(x, 0.8 * s, z);
      this.add(stem);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((0.18 + (i % 3) * 0.04) * s, 0), i % 2 ? green : greenLight);
        leaf.position.set(x + Math.cos(a) * 0.3 * s, 1.05 * s + Math.sin(i * 1.7) * 0.2 * s, z + Math.sin(a) * 0.3 * s);
        leaf.rotation.set(i * 0.4, a, i * 0.6);
        this.add(leaf);
      }
    }
  }

  buildWall({ wall, trim, darkWood, brass }) {
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(2.3, 0.58),
      new THREE.MeshBasicMaterial({ map: signTexture() })
    );
    sign.position.set(1.9, 3.1, 4.29);
    sign.rotation.y = Math.PI;
    this.add(sign);
    this.box(2.42, 0.06, 0.08, brass, 1.9, 3.4, 4.26);
    this.box(2.42, 0.06, 0.08, brass, 1.9, 2.8, 4.26);
    this.box(0.06, 0.66, 0.08, brass, 0.68, 3.1, 4.26);
    this.box(0.06, 0.66, 0.08, brass, 3.12, 3.1, 4.26);

    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.75),
      new THREE.MeshBasicMaterial({ map: artTexture() })
    );
    art.position.set(1.9, 2.25, 4.29);
    art.rotation.y = Math.PI;
    this.add(art);
    this.box(1.12, 0.07, 0.09, darkWood, 1.9, 2.66, 4.26);
    this.box(1.12, 0.07, 0.09, darkWood, 1.9, 1.84, 4.26);
    this.box(0.07, 0.9, 0.09, darkWood, 1.34, 2.25, 4.26);
    this.box(0.07, 0.9, 0.09, darkWood, 2.46, 2.25, 4.26);

    const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), trim);
    clock.rotation.x = Math.PI / 2;
    clock.position.set(0.45, 2.55, 4.24);
    this.add(clock);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.02), darkWood);
    hand.position.set(0.45, 2.6, 4.2);
    hand.rotation.z = 0.45;
    this.add(hand);
  }

  buildLamps({ darkWood, brass }) {
    for (const [x, z] of [[-1.35, 0.95], [-4.2, 1.65]]) {
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.78, 6), darkWood);
      cord.position.set(x, 3.12, z);
      this.add(cord);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.24, 16, 1, true), brass);
      shade.position.set(x, 2.72, z);
      this.add(shade);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe0a5, toneMapped: false })
      );
      bulb.position.set(x, 2.65, z);
      this.add(bulb);
    }
    this.pendant = new THREE.PointLight(0xffc782, 16, 9, 2);
    this.pendant.position.set(-1.35, 2.56, 0.95);
    this.add(this.pendant);
    const fill = new THREE.PointLight(0xffd7ad, 7, 7, 2);
    fill.position.set(-4.2, 2.4, 1.65);
    this.add(fill);
  }

  buildDust() {
    const count = 26;
    const positions = new Float32Array(count * 3);
    this.dustBase = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const x = -5.2 + Math.random() * 10.4;
      const y = 0.5 + Math.random() * 2.6;
      const z = -3.6 + Math.random() * 7.4;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.dustBase[i * 3] = x;
      this.dustBase[i * 3 + 1] = y;
      this.dustBase[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: softDotTexture(),
      color: 0xffe5b8,
      size: 0.06,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(geo, mat);
    this.add(this.dust);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  update(dt, time) {
    if (!this.group.visible) return;
    this.time += dt;
    if (this.pendant) {
      this.pendant.intensity = 16 + Math.sin(time * 2.4) * 0.7 + Math.sin(time * 6.1) * 0.22;
    }
    if (this.dust) {
      const arr = this.dust.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = this.dustBase[i] + Math.sin(time * 0.18 + i) * 0.08;
        arr[i + 1] = this.dustBase[i + 1] + Math.sin(time * 0.35 + i * 0.7) * 0.12;
        arr[i + 2] = this.dustBase[i + 2] + Math.cos(time * 0.21 + i) * 0.06;
      }
      this.dust.geometry.attributes.position.needsUpdate = true;
    }
  }
}
