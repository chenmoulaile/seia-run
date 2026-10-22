import * as THREE from 'three';

function canvasTexture(w, h, draw, repeatX = 1, repeatY = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  return tex;
}

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function skyTexture() {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#9fd4ff');
    sky.addColorStop(0.45, '#d7eeff');
    sky.addColorStop(0.76, '#fff3df');
    sky.addColorStop(1, '#ffe6c8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const sun = ctx.createRadialGradient(w * 0.73, h * 0.3, 6, w * 0.73, h * 0.3, 150);
    sun.addColorStop(0, 'rgba(255,255,244,0.98)');
    sun.addColorStop(0.2, 'rgba(255,247,213,0.72)');
    sun.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    const clouds = [
      [120, 120, 46],
      [172, 108, 58],
      [228, 124, 40],
      [380, 88, 34],
      [424, 78, 46],
      [462, 96, 30],
      [650, 158, 38],
      [694, 144, 52],
      [742, 162, 32],
      [880, 96, 30],
      [914, 86, 42],
    ];
    for (const [x, y, r] of clouds) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.9, y + 6, r * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.32)';
    for (let i = 0; i < 12; i++) {
      const x = seeded(i + 3)() * w;
      const y = 40 + seeded(i + 21)() * 190;
      ctx.beginPath();
      ctx.ellipse(x, y, 60 + seeded(i + 4)() * 80, 9 + seeded(i + 8)() * 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function asphaltTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#66717f';
      ctx.fillRect(0, 0, w, h);
      const rnd = seeded(7);
      for (let i = 0; i < 7000; i++) {
        const v = 80 + Math.floor(rnd() * 70);
        ctx.fillStyle = `rgba(${v},${v + 6},${v + 14},${0.18 + rnd() * 0.26})`;
        ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2.4, 1 + rnd() * 2.4);
      }
      ctx.strokeStyle = 'rgba(48,58,70,0.32)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const x = rnd() * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + 18, h * 0.3, x - 20, h * 0.66, x + 8, h);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(42,52,64,0.22)';
      ctx.fillRect(0, 0, w, 7);
      ctx.fillRect(0, h - 7, w, 7);
    },
    2,
    10
  );
}

function pavementTexture() {
  return canvasTexture(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = '#c8c7bf';
      ctx.fillRect(0, 0, w, h);
      const rnd = seeded(11);
      for (let y = 0; y < h; y += 64) {
        for (let x = 0; x < w; x += 64) {
          const v = 188 + Math.floor(rnd() * 22);
          ctx.fillStyle = `rgb(${v},${v - 3},${v - 12})`;
          ctx.fillRect(x + 2, y + 2, 60, 60);
          ctx.strokeStyle = 'rgba(120,120,112,0.24)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, 60, 60);
        }
      }
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(90,90,84,${rnd() * 0.09})`;
        ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
      }
    },
    2,
    16
  );
}

function facadeTexture(base, accent, seed, floors = 4) {
  return canvasTexture(512, 1024, (ctx, w, h) => {
    const rnd = seeded(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = 'rgba(35,45,62,0.18)';
    ctx.fillRect(0, h - 24, w, 24);

    const groundH = 238;
    ctx.fillStyle = '#3c4658';
    ctx.fillRect(22, h - groundH, w - 44, groundH - 26);
    ctx.fillStyle = 'rgba(157,220,255,0.64)';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(44 + i * 150, h - groundH + 30, 118, groundH - 100);
    }
    ctx.fillStyle = accent;
    ctx.fillRect(44, h - 108, w - 88, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.font = '800 26px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(seed % 2 ? 'KIVOTOS MART' : 'EXPO SHOP', w / 2, h - 84);

    const top = 54;
    const usable = h - groundH - top - 32;
    const floorH = usable / floors;
    const cols = 4;
    const cellW = (w - 100) / cols;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const x = 50 + c * cellW + 10;
        const y = top + f * floorH + 16;
        const ww = cellW - 24;
        const wh = floorH - 34;
        ctx.fillStyle = 'rgba(58,74,98,0.42)';
        ctx.fillRect(x - 5, y - 5, ww + 10, wh + 10);
        const lit = rnd() < 0.34;
        const grad = ctx.createLinearGradient(x, y, x, y + wh);
        grad.addColorStop(0, lit ? '#fff1be' : '#b6d9ef');
        grad.addColorStop(0.55, lit ? '#ffe59d' : '#8dbedc');
        grad.addColorStop(1, lit ? '#e8bd64' : '#6d9bbc');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, ww, wh);
        ctx.fillStyle = 'rgba(255,255,255,0.44)';
        ctx.fillRect(x + 4, y + 4, ww * 0.4, wh * 0.2);
        ctx.fillStyle = 'rgba(52,68,90,0.55)';
        ctx.fillRect(x + ww * 0.5 - 2, y, 4, wh);
      }
      ctx.fillStyle = 'rgba(58,70,88,0.18)';
      ctx.fillRect(26, top + (f + 1) * floorH, w - 52, 5);
    }

    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 18, h);
    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    ctx.fillRect(18, 0, 5, h);

    ctx.fillStyle = 'rgba(47,60,80,0.38)';
    ctx.fillRect(w - 58, top + 20, 18, h - groundH - top - 20);
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(w - 66, top + 60 + i * 120, 34, 7);
    }
  });
}

function cafeSignTexture() {
  return canvasTexture(1024, 256, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#314c7d');
    grad.addColorStop(1, '#1d2f53');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f4d68f';
    ctx.lineWidth = 9;
    ctx.strokeRect(12, 12, w - 24, h - 24);
    ctx.fillStyle = '#fff2cf';
    ctx.font = '900 88px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KIVOTOS CAFÉ', w / 2, 96);
    ctx.fillStyle = 'rgba(255,239,204,0.8)';
    ctx.font = '700 34px "Microsoft YaHei", "Segoe UI", sans-serif';
    ctx.fillText('千 年 博 览 会 · 休 息 区', w / 2, 174);
    ctx.fillStyle = '#f4d68f';
    for (const x of [92, w - 92]) {
      ctx.beginPath();
      ctx.arc(x, h / 2, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#243a63';
      ctx.beginPath();
      ctx.arc(x, h / 2, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f4d68f';
    }
  });
}

function bannerTexture(text, sub) {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#ffdf72');
    grad.addColorStop(0.5, '#ffeaa5');
    grad.addColorStop(1, '#ffd45c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#28538f';
    ctx.fillRect(0, 0, 28, h);
    ctx.fillRect(w - 28, 0, 28, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#23477d';
    ctx.font = '900 66px "Segoe UI", sans-serif';
    ctx.fillText(text, w / 2, 62);
    ctx.fillStyle = 'rgba(35,71,125,0.72)';
    ctx.font = '800 28px "Microsoft YaHei", sans-serif';
    ctx.fillText(sub, w / 2, 122);
  });
}

function vendingTexture() {
  return canvasTexture(320, 512, (ctx, w, h) => {
    ctx.fillStyle = '#eef6ff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2f6fd6';
    ctx.fillRect(0, 0, w, 82);
    ctx.fillStyle = '#fff';
    ctx.font = '900 34px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KIVOTOS', w / 2, 52);
    ctx.fillStyle = 'rgba(130,190,240,0.78)';
    ctx.fillRect(20, 102, w - 40, 246);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = ['#ff6d8b', '#ffcf54', '#5ad8c5', '#73a7ff'][(row + col) % 4];
        ctx.fillRect(36 + col * 66, 118 + row * 76, 46, 52);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillRect(42 + col * 66, 124 + row * 76, 12, 22);
      }
    }
    ctx.fillStyle = '#27364c';
    ctx.fillRect(28, 366, w - 56, 48);
    ctx.fillStyle = '#8fe9ff';
    ctx.fillRect(w - 88, 376, 48, 20);
    ctx.fillStyle = '#17243a';
    ctx.fillRect(48, 438, w - 96, 40);
  });
}

function shadowTexture() {
  return canvasTexture(128, 128, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 3, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(22,34,55,0.5)');
    g.addColorStop(0.6, 'rgba(22,34,55,0.22)');
    g.addColorStop(1, 'rgba(22,34,55,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function petalTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.55, 'rgba(255,220,235,0.7)');
    g.addColorStop(1, 'rgba(255,205,225,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w * 0.38, h * 0.24, 0.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function stripeTexture() {
  return canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = '#fbf4e5';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#d9615e';
      for (let x = -h; x < w + h; x += 72) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 36, 0);
        ctx.lineTo(x + 36 + h, h);
        ctx.lineTo(x + h, h);
        ctx.closePath();
        ctx.fill();
      }
    },
    2,
    1
  );
}

export class StreetScene {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'kivotos-street';
    scene.add(this.group);
    this.time = 0;
    this.flags = [];
    this.balloons = null;
    this.petals = null;
    this.petalBase = null;
    this.lampBulbs = [];
    this.buildProps();
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

  plane(w, h, material, x, y, z, rx = 0, ry = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, 0);
    return this.add(mesh);
  }

  contactShadow(x, z, radius, opacity = 0.34) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(radius * 2, radius * 2),
      new THREE.MeshBasicMaterial({
        map: this.shadowTex,
        transparent: true,
        opacity,
        depthWrite: false,
        toneMapped: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.035, z);
    this.add(mesh);
  }

  buildProps() {
    this.shadowTex = shadowTexture();
    this.buildLights();
    this.buildSky();
    this.buildGround();
    this.buildShop();
    this.buildSideBuildings();
    this.buildStreetFurniture();
    this.buildBanners();
    this.buildPetals();
  }

  buildLights() {
    this.add(new THREE.HemisphereLight(0xf1f8ff, 0x88765d, 1.42));
    const key = new THREE.DirectionalLight(0xffe7bd, 1.85);
    key.position.set(8, 14, 6);
    this.add(key);
    const fill = new THREE.DirectionalLight(0xbcdfff, 0.55);
    fill.position.set(-10, 6, -4);
    this.add(fill);
  }

  buildSky() {
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(110, 58),
      new THREE.MeshBasicMaterial({ map: skyTexture(), fog: false, toneMapped: false })
    );
    sky.position.set(0, 19, 64);
    this.add(sky);

    const rnd = seeded(29);
    const colors = [0x9fb4cf, 0xaabfd8, 0x8fa6c2, 0xb5c7db];
    for (let i = 0; i < 16; i++) {
      const w = 4 + rnd() * 8;
      const h = 7 + rnd() * 20;
      const x = -30 + i * 4 + rnd() * 3;
      const z = 42 + rnd() * 10;
      const mat = new THREE.MeshLambertMaterial({ color: colors[i % colors.length] });
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 5), mat);
      b.position.set(x, h / 2, z);
      this.add(b);
      const windows = new THREE.Mesh(
        new THREE.PlaneGeometry(w * 0.72, h * 0.66),
        new THREE.MeshBasicMaterial({
          map: facadeTexture('#b7c7d9', '#7797bf', 120 + i, 5),
          transparent: true,
          opacity: 0.58,
          toneMapped: false,
        })
      );
      windows.position.set(x, h * 0.58, z - 2.51);
      windows.rotation.y = Math.PI;
      this.add(windows);
    }
  }

  buildGround() {
    const base = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 120),
      new THREE.MeshLambertMaterial({ color: 0xb9c4cf })
    );
    base.rotation.x = -Math.PI / 2;
    base.position.set(0, -0.04, 18);
    this.add(base);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(8.4, 100),
      new THREE.MeshLambertMaterial({ map: asphaltTexture() })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 30);
    this.add(road);

    const sideMat = new THREE.MeshLambertMaterial({ map: pavementTexture() });
    for (const x of [-5.85, 5.85]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 96), sideMat);
      side.rotation.x = -Math.PI / 2;
      side.position.set(x, 0.055, 29);
      this.add(side);
    }

    const curbMat = new THREE.MeshLambertMaterial({ color: 0xe5e3d9 });
    for (const x of [-4.28, 4.28]) {
      this.box(0.18, 0.16, 94, curbMat, x, 0.08, 28);
    }

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf5f1e2, toneMapped: false });
    for (const x of [-3.72, 3.72]) {
      this.box(0.13, 0.012, 92, lineMat, x, 0.022, 28);
    }
    for (const x of [-1.15, 1.15]) {
      for (let z = -8; z < 42; z += 7.6) {
        this.box(0.12, 0.012, 3.1, lineMat, x, 0.023, z);
      }
    }
    for (let i = 0; i < 9; i++) {
      this.box(0.55, 0.014, 2.5, lineMat, -3.5 + i * 0.88, 0.025, 4.9);
    }

    const drainMat = new THREE.MeshLambertMaterial({ color: 0x3d4856 });
    for (const [x, z] of [[-2.8, -4], [3.4, 12], [-3.2, 22]]) {
      const drain = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.74), drainMat);
      drain.rotation.x = -Math.PI / 2;
      drain.position.set(x, 0.024, z);
      this.add(drain);
    }
    const manhole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.016, 24),
      new THREE.MeshLambertMaterial({ color: 0x59636f })
    );
    manhole.position.set(1.7, 0.024, 0.6);
    this.add(manhole);
  }

  buildShop() {
    const wall = new THREE.MeshLambertMaterial({ color: 0xf3e7d0 });
    const wallDeep = new THREE.MeshLambertMaterial({ color: 0xdac29f });
    const trim = new THREE.MeshLambertMaterial({ color: 0xfff9ec });
    const roof = new THREE.MeshLambertMaterial({ color: 0x3d5f8f });
    const wood = new THREE.MeshLambertMaterial({ color: 0x7d5139 });
    const brass = new THREE.MeshPhongMaterial({ color: 0xd7b26b, shininess: 80, specular: 0xfff0c8 });
    const glass = new THREE.MeshPhongMaterial({
      color: 0xbfe6ff,
      transparent: true,
      opacity: 0.34,
      shininess: 120,
      specular: 0xffffff,
      depthWrite: false,
    });

    this.box(12.4, 7.4, 5.2, wall, 1.6, 3.7, 16.1);
    this.box(13, 0.5, 5.8, roof, 1.6, 7.55, 16.1);
    this.box(12.8, 0.3, 5.6, trim, 1.6, 7.25, 16.1);
    this.box(12.4, 0.9, 0.34, wallDeep, 1.6, 0.45, 13.45);
    this.box(12.6, 0.14, 0.5, trim, 1.6, 0.94, 13.4);

    this.plane(
      12.2,
      6.5,
      new THREE.MeshLambertMaterial({ map: facadeTexture('#f4e3c8', '#d6a25d', 71, 3) }),
      1.6,
      3.9,
      13.48,
      0,
      Math.PI
    );

    const sign = this.plane(
      8.4,
      2.1,
      new THREE.MeshBasicMaterial({ map: cafeSignTexture(), toneMapped: false }),
      1.6,
      5.85,
      13.37,
      0,
      Math.PI
    );
    sign.renderOrder = 1;
    this.box(8.8, 2.38, 0.12, wood, 1.6, 5.85, 13.47);

    this.box(8.6, 0.18, 1.55, new THREE.MeshLambertMaterial({ map: stripeTexture() }), 1.6, 3.38, 12.9);
    this.box(8.8, 0.16, 0.16, trim, 1.6, 3.36, 13.68);
    for (const x of [-2.55, 5.75]) {
      this.box(0.14, 3.0, 0.14, wood, x, 1.62, 12.7);
    }

    for (const x of [-1.6, 1.6, 4.8]) {
      this.box(2.4, 2.0, 0.08, glass, x, 1.95, 13.25);
      this.box(2.6, 0.12, 0.16, trim, x, 2.98, 13.2);
      this.box(2.6, 0.12, 0.16, trim, x, 0.94, 13.2);
      this.box(0.1, 2.1, 0.14, trim, x - 1.24, 1.95, 13.2);
      this.box(0.1, 2.1, 0.14, trim, x + 1.24, 1.95, 13.2);
    }

    const door = this.box(1.5, 2.5, 0.16, new THREE.MeshLambertMaterial({ color: 0x405b82 }), 1.6, 1.34, 13.1);
    door.geometry.translate(0, 0, 0);
    this.box(0.1, 2.5, 0.18, brass, 0.92, 1.34, 13.0);
    this.box(0.1, 2.5, 0.18, brass, 2.28, 1.34, 13.0);
    this.box(1.5, 0.1, 0.18, brass, 1.6, 2.62, 13.0);
    this.box(0.06, 0.34, 0.08, brass, 2.18, 1.3, 12.99);

    for (const x of [-1.3, 2.0, 4.9]) {
      this.box(1.5, 1.4, 0.1, glass, x, 4.75, 13.28);
      this.box(1.62, 0.1, 0.18, trim, x, 5.5, 13.23);
      this.box(1.62, 0.1, 0.18, trim, x, 4.02, 13.23);
      this.box(0.1, 1.5, 0.18, trim, x - 0.78, 4.75, 13.23);
      this.box(0.1, 1.5, 0.18, trim, x + 0.78, 4.75, 13.23);
    }

    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe4a8, toneMapped: false });
    for (const x of [-2.65, -1.85, -1.05, -0.25, 0.55]) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), bulbMat);
      bulb.position.set(x, 3.22, 12.6);
      this.add(bulb);
      this.lampBulbs.push(bulb);
    }

    this.contactShadow(1.6, 11.8, 6.7, 0.18);
    this.buildCafePatio(wood, brass, trim);
  }

  buildCafePatio(wood, brass, trim) {
    const tableTop = new THREE.MeshLambertMaterial({ color: 0xf6ead8 });
    for (const [x, z] of [[4.8, 11.4], [-1.9, 11.7]]) {
      this.box(1.2, 0.09, 0.72, tableTop, x, 0.78, z);
      this.box(0.1, 0.75, 0.1, wood, x - 0.42, 0.39, z);
      this.box(0.1, 0.75, 0.1, wood, x + 0.42, 0.39, z);
      for (const side of [-1, 1]) {
        this.box(0.42, 0.08, 0.42, wood, x + side * 0.9, 0.48, z);
        this.box(0.06, 0.48, 0.06, wood, x + side * 0.9, 0.24, z);
      }
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 10), brass);
      pot.position.set(x, 0.89, z);
      this.add(pot);
      this.contactShadow(x, z, 1.2, 0.18);
    }
    for (const x of [-4.2, 6.9]) {
      this.box(1.3, 0.85, 0.72, new THREE.MeshLambertMaterial({ color: 0xb56f53 }), x, 0.44, 12.5);
      const bush = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.62, 0),
        new THREE.MeshLambertMaterial({ color: 0x5c8c58 })
      );
      bush.position.set(x, 1.15, 12.5);
      this.add(bush);
      this.contactShadow(x, 12.5, 1.1, 0.2);
    }

    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 1.2),
      new THREE.MeshLambertMaterial({ color: 0xbf4f53 })
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(1.6, 0.028, 12.4);
    this.add(carpet);
  }

  buildSideBuildings() {
    const left = [
      { z: 3.5, h: 10.5, w: 6.2, d: 6.4, color: '#eadfd0', accent: '#4875b8', seed: 21 },
      { z: 11.5, h: 8.2, w: 6.2, d: 6.2, color: '#dfe6ef', accent: '#e06a74', seed: 22 },
      { z: 20, h: 12.4, w: 6.2, d: 6.6, color: '#e8dfe7', accent: '#3c8f8a', seed: 23 },
      { z: 29.5, h: 9.4, w: 6.2, d: 6.2, color: '#e5e2d8', accent: '#ca8d45', seed: 24 },
    ];
    const right = [
      { z: 1.5, h: 9.2, w: 6.2, d: 6.2, color: '#e8e0d2', accent: '#3f81c9', seed: 31 },
      { z: 10, h: 12.2, w: 6.2, d: 6.5, color: '#dde8ee', accent: '#d45b73', seed: 32 },
      { z: 19, h: 8.6, w: 6.2, d: 6.2, color: '#eee2d8', accent: '#578c5c', seed: 33 },
      { z: 28, h: 15.5, w: 6.2, d: 6.4, color: '#e1e6ef', accent: '#b2793e', seed: 34 },
    ];
    for (const b of left) this.addBuilding(b, -10.6, 1);
    for (const b of right) this.addBuilding(b, 10.6, -1);

    const towerX = 10.6;
    const towerZ = 28;
    this.box(5.4, 15.5, 5.4, new THREE.MeshLambertMaterial({ color: 0xdfe6ef }), towerX, 7.75, towerZ);
    this.box(6.1, 0.4, 6.1, new THREE.MeshLambertMaterial({ color: 0x415f8b }), towerX, 15.4, towerZ);
    this.box(3.5, 2.0, 3.5, new THREE.MeshLambertMaterial({ color: 0xf1eadb }), towerX, 16.4, towerZ);
    const towerRoof = new THREE.Mesh(
      new THREE.ConeGeometry(2.85, 2.4, 4),
      new THREE.MeshLambertMaterial({ color: 0x35547e })
    );
    towerRoof.position.set(towerX, 18.6, towerZ);
    towerRoof.rotation.y = Math.PI / 4;
    this.add(towerRoof);

    const clock = new THREE.Mesh(
      new THREE.CircleGeometry(1.25, 32),
      new THREE.MeshBasicMaterial({ color: 0xfff4d6, toneMapped: false })
    );
    clock.position.set(7.48, 13.4, towerZ);
    clock.rotation.y = -Math.PI / 2;
    this.add(clock);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.09, 8, 36),
      new THREE.MeshLambertMaterial({ color: 0xd6ac56 })
    );
    rim.position.set(7.43, 13.4, towerZ);
    rim.rotation.y = -Math.PI / 2;
    this.add(rim);
    const handMat = new THREE.MeshBasicMaterial({ color: 0x334b72, toneMapped: false });
    const hour = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.78), handMat);
    hour.position.set(7.4, 13.72, towerZ);
    hour.rotation.y = -Math.PI / 2;
    this.add(hour);
    const minute = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 1.02), handMat);
    minute.position.set(7.39, 13.76, towerZ + 0.16);
    minute.rotation.y = -Math.PI / 2;
    minute.rotation.z = -1.2;
    this.add(minute);
  }

  addBuilding(b, x, facing) {
    const body = new THREE.MeshLambertMaterial({ color: b.color });
    this.box(b.w, b.h, b.d, body, x, b.h / 2, b.z);
    this.box(b.w + 0.24, 0.3, b.d + 0.24, new THREE.MeshLambertMaterial({ color: 0x4b6284 }), x, b.h + 0.1, b.z);
    const frontX = x + facing * (b.w / 2 + 0.012);
    const facade = this.plane(
      b.d,
      b.h,
      new THREE.MeshLambertMaterial({ map: facadeTexture(b.color, b.accent, b.seed, 4) }),
      frontX,
      b.h / 2,
      b.z,
      0,
      facing > 0 ? Math.PI / 2 : -Math.PI / 2
    );
    facade.renderOrder = 0;

    const awning = this.box(
      1.0,
      0.16,
      b.d * 0.64,
      new THREE.MeshLambertMaterial({ map: stripeTexture() }),
      x - facing * (b.w / 2 + 0.5),
      3.05,
      b.z
    );
    awning.rotation.z = facing * 0.12;

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(b.d * 0.62, 0.72),
      new THREE.MeshBasicMaterial({
        map: bannerTexture(b.seed % 2 ? 'KIVOTOS' : 'EXPO', b.seed % 2 ? '\u5e02\u6c11\u5e7f\u573a' : '\u5c55\u533a\u5165\u53e3'),
        toneMapped: false,
      })
    );
    sign.position.set(x - facing * (b.w / 2 + 0.1), 3.9, b.z);
    sign.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    this.add(sign);

    for (const zz of [b.z - b.d * 0.28, b.z + b.d * 0.28]) {
      const ac = this.box(0.4, 0.5, 0.7, new THREE.MeshLambertMaterial({ color: 0xc7ced8 }), x - facing * (b.w / 2 + 0.18), 5.6, zz);
      ac.rotation.y = Math.PI / 2;
    }
    this.contactShadow(x - facing * b.w * 0.3, b.z, 2.6, 0.2);
  }

  buildStreetFurniture() {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x394652 });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xffe2a1, toneMapped: false });
    const glowMat = new THREE.SpriteMaterial({
      map: this.glowTex(),
      color: 0xffd98d,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    for (const [x, z, side] of [
      [-4.85, -1.5, 1],
      [4.85, 6.5, -1],
      [-4.85, 14.5, 1],
      [4.85, 23, -1],
      [-4.85, 31.5, 1],
    ]) {
      this.box(0.2, 4.6, 0.2, poleMat, x, 2.3, z);
      this.box(0.52, 0.16, 0.52, poleMat, x, 0.08, z);
      this.box(1.4, 0.11, 0.11, poleMat, x - side * 0.66, 4.5, z);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), lampMat);
      lamp.position.set(x - side * 1.3, 4.38, z);
      this.add(lamp);
      this.lampBulbs.push(lamp);
      const glow = new THREE.Sprite(glowMat.clone());
      glow.scale.setScalar(1.6);
      glow.position.copy(lamp.position);
      this.add(glow);
      this.contactShadow(x, z, 0.72, 0.24);
    }

    const benchMat = new THREE.MeshLambertMaterial({ color: 0x986544 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x3f4b58 });
    this.box(2.1, 0.14, 0.62, benchMat, 6.4, 0.56, 2.2);
    this.box(2.1, 0.12, 0.58, benchMat, 6.88, 0.92, 2.2);
    this.box(2.1, 0.62, 0.1, benchMat, 7.2, 0.78, 2.2);
    for (const dx of [-0.82, 0.82]) {
      this.box(0.09, 0.54, 0.5, metal, 6.4 + dx, 0.28, 2.2);
    }
    this.contactShadow(6.45, 2.2, 1.25, 0.24);

    const vend = this.box(
      1.15,
      2.05,
      0.85,
      new THREE.MeshLambertMaterial({ map: vendingTexture() }),
      6.45,
      1.03,
      8.3
    );
    vend.rotation.y = -Math.PI / 2;
    this.box(1.3, 0.14, 0.95, metal, 6.45, 2.12, 8.3);
    this.contactShadow(6.45, 8.3, 1.1, 0.22);

    const signMat = new THREE.MeshBasicMaterial({ color: 0x2f6fd6, toneMapped: false });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.72), signMat);
    sign.position.set(6.7, 1.45, 12.5);
    sign.rotation.y = -Math.PI / 2;
    this.add(sign);
    this.box(0.1, 1.5, 0.1, poleMat, 6.7, 0.75, 12.5);

    for (const [x, z, s] of [
      [-6.3, 6.3, 1.1],
      [6.4, 16.5, 1.3],
      [-6.3, 24.5, 1.0],
      [6.4, 32.5, 1.15],
    ]) {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16 * s, 0.22 * s, 2.0 * s, 8),
        new THREE.MeshLambertMaterial({ color: 0x6f5138 })
      );
      trunk.position.set(x, 1.0 * s, z);
      this.add(trunk);
      const leafMat = new THREE.MeshLambertMaterial({ color: 0x4f8b59 });
      const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x6aa566 });
      for (let i = 0; i < 4; i++) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry((0.78 + (i % 2) * 0.18) * s, 0), i % 2 ? leafMat : leafMat2);
        leaf.position.set(x + (i - 1.5) * 0.35 * s, 2.25 * s + (i % 2) * 0.34 * s, z + ((i * 0.7) % 0.5) * s);
        this.add(leaf);
      }
      this.contactShadow(x, z, 1.45 * s, 0.24);
    }

    const tl = new THREE.MeshLambertMaterial({ color: 0x2d3946 });
    this.box(0.13, 4.2, 0.13, tl, 4.6, 2.1, 4.3);
    this.box(1.8, 0.12, 0.12, tl, 3.9, 4.12, 4.3);
    this.box(0.52, 1.35, 0.42, tl, 3.15, 3.55, 4.3);
    for (let i = 0; i < 3; i++) {
      const color = [0xff5d58, 0xffcf4d, 0x59d68d][i];
      const light = new THREE.Mesh(
        new THREE.CircleGeometry(0.13, 16),
        new THREE.MeshBasicMaterial({ color, toneMapped: false })
      );
      light.position.set(3.15, 4.0 - i * 0.34, 4.08);
      light.rotation.y = Math.PI;
      this.add(light);
    }

    for (const [x, z, text] of [
      [5.1, 0.7, '\u2192 EXPO'],
      [-5.1, 10.2, '\u2192 CAF\u00c9'],
    ]) {
      const board = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 0.7),
        new THREE.MeshBasicMaterial({
          map: bannerTexture(text, '\u5e74\u5ea6\u5c55\u89c8'),
          toneMapped: false,
        })
      );
      board.position.set(x, 0.95, z);
      board.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.add(board);
      this.box(0.08, 0.6, 0.08, poleMat, x, 0.32, z);
    }

    this.buildBalloons();
  }

  buildBalloons() {
    const group = new THREE.Group();
    group.position.set(6.9, 0, 10.4);
    const colors = [0x5b9cff, 0xffd45c, 0xff7e9d, 0x71d9c7];
    for (let i = 0; i < 5; i++) {
      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 14, 10),
        new THREE.MeshPhongMaterial({ color: colors[i % colors.length], shininess: 70 })
      );
      balloon.position.set((i - 2) * 0.18, 3.15 + Math.sin(i * 1.7) * 0.5, Math.sin(i * 2.4) * 0.18);
      balloon.scale.y = 1.16;
      group.add(balloon);
      const stringGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(balloon.position.x, balloon.position.y - 0.22, balloon.position.z),
        new THREE.Vector3(balloon.position.x * 0.3, 0.55, 0),
      ]);
      group.add(new THREE.Line(stringGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 })));
    }
    this.balloons = group;
    this.add(group);
  }

  buildBanners() {
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x3c566f });
    for (const x of [-5.45, 5.45]) {
      this.box(0.18, 6.6, 0.18, poleMat, x, 3.3, 10.6);
      this.box(0.5, 0.14, 0.5, poleMat, x, 0.09, 10.6);
    }
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(10.5, 1.62),
      new THREE.MeshBasicMaterial({
        map: bannerTexture('MILLENNIUM EXPO', '\u5343 \u5e74 \u535a \u89c8 \u4f1a \u00b7 \u6b22 \u8fce \u5149 \u4e34'),
        side: THREE.FrontSide,
        toneMapped: false,
      })
    );
    banner.position.set(0, 5.85, 10.6);
    banner.rotation.y = Math.PI;
    this.add(banner);
    this.box(10.9, 0.12, 0.12, poleMat, 0, 6.7, 10.6);

    const flagColors = [0x5b9cff, 0xffd45c, 0xff7e9d, 0x71d9c7, 0xffffff];
    const stringY = 5.1;
    for (let i = 0; i < 17; i++) {
      const t = i / 16;
      const x = -5.0 + t * 10;
      const sag = Math.sin(t * Math.PI) * 0.35;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute([x - 0.16, stringY - sag, 6.4, x + 0.16, stringY - sag, 6.4, x, stringY - sag - 0.42, 6.4], 3)
      );
      geo.computeVertexNormals();
      const flag = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          color: flagColors[i % flagColors.length],
          side: THREE.DoubleSide,
          toneMapped: false,
        })
      );
      this.add(flag);
      this.flags.push(flag);
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5.6, stringY, 6.4),
      new THREE.Vector3(0, stringY - 0.35, 6.4),
      new THREE.Vector3(5.6, stringY, 6.4),
    ]);
    this.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf8f4e8 })));
  }

  buildPetals() {
    const count = 90;
    const positions = new Float32Array(count * 3);
    this.petalBase = new Float32Array(count * 3);
    const rnd = seeded(83);
    for (let i = 0; i < count; i++) {
      const x = -9 + rnd() * 18;
      const y = 0.4 + rnd() * 5.6;
      const z = -6 + rnd() * 26;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      this.petalBase[i * 3] = x;
      this.petalBase[i * 3 + 1] = y;
      this.petalBase[i * 3 + 2] = z;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      map: petalTexture(),
      color: 0xffd7e8,
      size: 0.12,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.petals = new THREE.Points(geo, mat);
    this.add(this.petals);
  }

  glowTex() {
    if (!this._glowTex) {
      this._glowTex = canvasTexture(128, 128, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(255,244,206,0.95)');
        g.addColorStop(0.35, 'rgba(255,216,140,0.45)');
        g.addColorStop(1, 'rgba(255,205,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    }
    return this._glowTex;
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  update(dt, time) {
    if (!this.group.visible) return;
    this.time += dt;
    if (this.balloons) {
      this.balloons.position.y = Math.sin(time * 1.15) * 0.1;
      this.balloons.rotation.y = Math.sin(time * 0.35) * 0.08;
    }
    for (let i = 0; i < this.flags.length; i++) {
      this.flags[i].rotation.y = Math.sin(time * 2.1 + i * 0.7) * 0.16;
    }
    if (this.petals) {
      const arr = this.petals.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i] = this.petalBase[i] + Math.sin(time * 0.45 + i) * 0.45;
        arr[i + 1] = this.petalBase[i + 1] - ((time * 0.22 + i * 0.03) % 4.8);
        if (arr[i + 1] < 0.15) arr[i + 1] += 4.8;
        arr[i + 2] = this.petalBase[i + 2] + Math.cos(time * 0.33 + i) * 0.3;
      }
      this.petals.geometry.attributes.position.needsUpdate = true;
    }
    const pulse = 0.78 + Math.sin(time * 2.2) * 0.12;
    for (const bulb of this.lampBulbs) bulb.scale.setScalar(pulse);
  }
}
