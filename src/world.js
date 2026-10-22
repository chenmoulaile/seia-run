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

const COLORS = ['#eef3fa', '#e2eaf6', '#d5e3f4', '#f6efdf', '#e9e2f2', '#dbeef0', '#f2e6ea'];
const WINDOW_COLORS = [0x7fe8ff, 0xa8d8ff, 0xffe9a8];
const LAMP = 0x6fe9ff;

export class World {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'world';
    scene.add(this.group);
    this.time = 0;
    this.rangeMin = -150;
    this.rangeMax = 26;

    scene.fog = new THREE.Fog(0xdcebff, 42, 155);
    this.group.add(new THREE.HemisphereLight(0xffffff, 0x94a6bd, 1.28));
    const sun = new THREE.DirectionalLight(0xfff6e8, 1.65);
    sun.position.set(9, 18, 8);
    this.group.add(sun);
    const rim = new THREE.DirectionalLight(0xbfe0ff, 0.55);
    rim.position.set(-8, 6, -12);
    this.group.add(rim);

    this.buildSky();
    this.buildGround();
    this.buildRoad();
    this.buildCity();
    this.buildSkyline();
    this.buildClouds();
  }

  buildSky() {
    const tex = canvasTexture(64, 256, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#5f9dfb');
      g.addColorStop(0.45, '#9cc6ff');
      g.addColorStop(0.72, '#dcebff');
      g.addColorStop(1, '#f4f9ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(340, 24, 16),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    sky.rotation.y = Math.PI;
    this.group.add(sky);

    const sunTex = canvasTexture(128, 128, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,240,1)');
      g.addColorStop(0.25, 'rgba(255,248,214,0.9)');
      g.addColorStop(0.6, 'rgba(255,240,190,0.25)');
      g.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, toneMapped: false }));
    sunSprite.position.set(70, 88, -240);
    sunSprite.scale.setScalar(110);
    this.group.add(sunSprite);
  }

  buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(420, 420),
      new THREE.MeshLambertMaterial({ color: 0xc9d8ea })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.08, -80);
    this.group.add(ground);
  }

  buildRoad() {
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(7.4, 0.1, 200),
      new THREE.MeshLambertMaterial({ color: 0x39404f })
    );
    road.position.set(0, -0.05, -70);
    this.group.add(road);

    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.16, 200),
        new THREE.MeshLambertMaterial({ color: 0xd7e0ec })
      );
      walk.position.set(side * 4.9, 0.0, -70);
      this.group.add(walk);
      const curb = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.2, 200),
        new THREE.MeshLambertMaterial({ color: 0xeef4fb })
      );
      curb.position.set(side * 3.78, 0.0, -70);
      this.group.add(curb);
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.55, 200),
        new THREE.MeshLambertMaterial({ color: 0xf4f8ff })
      );
      rail.position.set(side * 5.9, 0.45, -70);
      this.group.add(rail);
      const railTop = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.06, 200),
        new THREE.MeshLambertMaterial({ color: 0x8fd8ff })
      );
      railTop.position.set(side * 5.9, 0.74, -70);
      this.group.add(railTop);
    }

    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.01, 200),
        new THREE.MeshBasicMaterial({ color: 0xf3f7ff })
      );
      edge.position.set(side * 3.62, 0.005, -70);
      this.group.add(edge);
    }

    const dashGeo = new THREE.BoxGeometry(0.13, 0.012, 1.5);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xe8f1ff });
    this.dashes = [];
    for (let i = 0; i < 76; i++) {
      const mesh = new THREE.Mesh(dashGeo, dashMat);
      const side = i % 2 === 0 ? -1 : 1;
      mesh.position.set(side * 1.12, 0.006, this.rangeMin + i * 2.4);
      this.group.add(mesh);
      this.dashes.push(mesh);
    }

    const lampGeo = new THREE.CylinderGeometry(0.055, 0.075, 3.1, 6);
    const lampMat = new THREE.MeshLambertMaterial({ color: 0x8f9db4 });
    const armGeo = new THREE.BoxGeometry(0.9, 0.07, 0.07);
    const headGeo = new THREE.BoxGeometry(0.5, 0.1, 0.24);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x7ff0ff, toneMapped: false });
    this.lamps = [];
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const g = new THREE.Group();
      const pole = new THREE.Mesh(lampGeo, lampMat);
      pole.position.y = 1.55;
      g.add(pole);
      const arm = new THREE.Mesh(armGeo, lampMat);
      arm.position.set(side * -0.42, 3.02, 0);
      g.add(arm);
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.set(side * -0.86, 2.96, 0);
      g.add(head);
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: this.lampGlowTexture(), color: 0x9df2ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })
      );
      glow.position.set(side * -0.86, 2.9, 0);
      glow.scale.setScalar(1.1);
      g.add(glow);
      g.position.set(side * 5.7, 0, this.rangeMin + i * 9);
      this.group.add(g);
      this.lamps.push(g);
    }
  }

  lampGlowTexture() {
    if (!this._lampGlowTex) {
      this._lampGlowTex = canvasTexture(64, 64, (ctx, w, h) => {
        const g = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
        g.addColorStop(0, 'rgba(190,250,255,1)');
        g.addColorStop(0.4, 'rgba(150,240,255,0.4)');
        g.addColorStop(1, 'rgba(150,240,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });
    }
    return this._lampGlowTex;
  }

  buildCity() {
    this.buildings = [];
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const b = this.makeBuilding(side);
      const z = this.rangeMin - 20 + Math.floor(i / 2) * 12 + Math.random() * 6;
      b.position.z = z;
      this.group.add(b);
      this.buildings.push(b);
    }
  }

  makeBuilding(side) {
    const g = new THREE.Group();
    const w = 4 + Math.random() * 4.5;
    const h = 7 + Math.random() * 17;
    const d = 6 + Math.random() * 5;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = h / 2;
    g.add(body);

    const roofColor = new THREE.Color(color).offsetHSL(0, 0, -0.06);
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.7, 0.5, d * 0.7),
      new THREE.MeshLambertMaterial({ color: roofColor })
    );
    roof.position.y = h + 0.25;
    g.add(roof);

    const faceX = side * -1;
    const glassMat = new THREE.MeshBasicMaterial({ color: WINDOW_COLORS[Math.floor(Math.random() * WINDOW_COLORS.length)], toneMapped: false, transparent: true, opacity: 0.85 });
    const rows = 2 + Math.floor(Math.random() * 3);
    for (let r = 0; r < rows; r++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, d * (0.4 + Math.random() * 0.4)), glassMat);
      strip.position.set(faceX * (w / 2 + 0.02), 1.6 + r * (h / (rows + 1)), 0);
      g.add(strip);
    }

    if (Math.random() < 0.55) {
      const signMat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xffd6a1 : 0x9df4ff, toneMapped: false });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9 + Math.random() * 1.4, 0.32), signMat);
      sign.position.set(faceX * (w / 2 + 0.08), 2.4 + Math.random() * (h - 5), d * 0.18);
      g.add(sign);
    }

    g.position.set(side * (8.6 + Math.random() * 9), 0, 0);
    g.userData.side = side;
    return g;
  }

  buildSkyline() {
    const mat = new THREE.MeshLambertMaterial({ color: 0xaec8e6 });
    for (let i = 0; i < 14; i++) {
      const h = 18 + Math.random() * 40;
      const w = 6 + Math.random() * 9;
      const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 6), mat);
      box.position.set(-70 + i * 11, h / 2, -175 - Math.random() * 25);
      this.group.add(box);
    }
  }

  buildClouds() {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.92 });
    this.clouds = [];
    for (let i = 0; i < 9; i++) {
      const g = new THREE.Group();
      const n = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < n; j++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3.4, 8, 6), mat);
        puff.position.set(j * 4.4 - n * 2, Math.random() * 1.6, Math.random() * 1.6);
        puff.scale.y = 0.55;
        g.add(puff);
      }
      g.position.set(-70 + Math.random() * 140, 30 + Math.random() * 16, -120 - Math.random() * 90);
      this.group.add(g);
      this.clouds.push(g);
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }

  update(dt, speed) {
    this.time += dt;
    const dz = speed * dt;

    for (const dash of this.dashes) {
      dash.position.z += dz;
      if (dash.position.z > this.rangeMax) dash.position.z -= 76 * 2.4;
    }
    for (const lamp of this.lamps) {
      lamp.position.z += dz;
      if (lamp.position.z > this.rangeMax + 4) lamp.position.z -= 20 * 9;
    }
    for (const b of this.buildings) {
      b.position.z += dz;
      if (b.position.z > this.rangeMax + 12) {
        b.position.z -= 180 + Math.random() * 40;
        const side = b.userData.side;
        b.position.x = side * (8.6 + Math.random() * 9);
      }
    }

    for (const cloud of this.clouds) {
      cloud.position.z += dz * 0.12;
      if (cloud.position.z > 10) cloud.position.z = -220 - Math.random() * 40;
    }
  }
}

