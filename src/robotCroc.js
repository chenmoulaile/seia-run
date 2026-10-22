import * as THREE from 'three';

const clamp = THREE.MathUtils.clamp;

function part(geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.frustumCulled = false;
  return mesh;
}

function box(w, h, d, material, x = 0, y = 0, z = 0) {
  return part(new THREE.BoxGeometry(w, h, d), material, x, y, z);
}

export class RobotCroc {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'RobotCroc';
    this.root = new THREE.Group();
    this.group.add(this.root);
    this.height = 1.06;
    this.length = 3.1;
    this.mode = 'idle';
    this.danger = 0;
    this.t = 0;
    this.phase = 0;
    this.biteT = 0;
    this.biteDone = null;
    this.jawOpen = 0;
    this.legs = [];

    this.mats = {
      steel: new THREE.MeshStandardMaterial({
        color: 0x456066,
        metalness: 0.78,
        roughness: 0.36,
        flatShading: true,
      }),
      olive: new THREE.MeshStandardMaterial({
        color: 0x7f9464,
        emissive: 0x0b1209,
        emissiveIntensity: 0.45,
        metalness: 0.55,
        roughness: 0.5,
        flatShading: true,
      }),
      oliveDark: new THREE.MeshStandardMaterial({
        color: 0x526747,
        emissive: 0x080e07,
        emissiveIntensity: 0.35,
        metalness: 0.6,
        roughness: 0.48,
        flatShading: true,
      }),
      edge: new THREE.MeshStandardMaterial({
        color: 0xbdc8c4,
        metalness: 0.82,
        roughness: 0.32,
        flatShading: true,
      }),
      black: new THREE.MeshStandardMaterial({
        color: 0x1b262b,
        metalness: 0.4,
        roughness: 0.72,
        flatShading: true,
      }),
      tooth: new THREE.MeshStandardMaterial({
        color: 0xf2e7cf,
        metalness: 0.2,
        roughness: 0.5,
        flatShading: true,
      }),
      mouth: new THREE.MeshStandardMaterial({
        color: 0x76150f,
        emissive: 0x4a0600,
        emissiveIntensity: 1.1,
        metalness: 0.1,
        roughness: 0.8,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: 0x350301,
        emissive: 0xff2b16,
        emissiveIntensity: 3,
        metalness: 0.1,
        roughness: 0.22,
      }),
      beacon: new THREE.MeshStandardMaterial({
        color: 0x420403,
        emissive: 0xff2414,
        emissiveIntensity: 3,
        metalness: 0.1,
        roughness: 0.25,
      }),
      hazard: new THREE.MeshStandardMaterial({
        color: 0xd6a93c,
        metalness: 0.45,
        roughness: 0.52,
        flatShading: true,
      }),
    };
    this.eyeMat = this.mats.eye;
    this.beaconMat = this.mats.beacon;

    this.buildBody();
    this.buildHead();
    this.buildTail();
    this.buildLegs();

    this.anchor = new THREE.Object3D();
    this.anchor.position.set(0, 1.26, -1.05);
    this.group.add(this.anchor);
  }

  buildBody() {
    const m = this.mats;
    const body = part(new THREE.CapsuleGeometry(0.37, 1.02, 5, 10), m.olive, 0, 0.51, 0.12);
    body.rotation.x = Math.PI / 2;
    body.scale.set(1.05, 1, 0.9);
    this.root.add(body);

    this.root.add(box(0.5, 0.1, 1.22, m.steel, 0, 0.3, 0.12));
    this.root.add(box(0.44, 0.06, 0.86, m.oliveDark, 0, 0.34, 0.18));

    const plates = [
      [-0.54, 0.75, 0.31, 0.58],
      [-0.1, 0.81, 0.32, 0.62],
      [0.35, 0.81, 0.32, 0.6],
      [0.78, 0.73, 0.28, 0.5],
    ];
    for (const [z, y, h, w] of plates) {
      this.root.add(box(w, h, 0.32, m.steel, 0, y, z));
      this.root.add(box(w * 0.82, 0.04, 0.24, m.edge, 0, y + h * 0.48, z));
    }

    for (const side of [-1, 1]) {
      this.root.add(box(0.08, 0.28, 0.58, m.steel, side * 0.39, 0.48, -0.24));
      this.root.add(box(0.08, 0.24, 0.5, m.oliveDark, side * 0.4, 0.47, 0.38));
      for (let i = 0; i < 3; i++) {
        const rivet = part(new THREE.CylinderGeometry(0.025, 0.025, 0.035, 6), m.edge, side * 0.445, 0.58, -0.5 + i * 0.38);
        rivet.rotation.z = Math.PI / 2;
        this.root.add(rivet);
      }
      this.root.add(box(0.16, 0.06, 0.46, m.hazard, side * 0.34, 0.68, 0.52));
    }

    const neck = part(new THREE.CylinderGeometry(0.24, 0.3, 0.48, 9), m.steel, 0, 0.66, -0.83);
    neck.rotation.x = Math.PI / 2;
    this.root.add(neck);
    const collar = part(new THREE.TorusGeometry(0.27, 0.055, 6, 12), m.edge, 0, 0.67, -0.9);
    this.root.add(collar);
    const collar2 = part(new THREE.TorusGeometry(0.24, 0.035, 6, 12), m.steel, 0, 0.67, -0.72);
    this.root.add(collar2);

    const beaconBase = part(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 8), m.steel, 0, 0.91, -0.19);
    this.root.add(beaconBase);
    const beacon = part(new THREE.SphereGeometry(0.06, 10, 8), m.beacon, 0, 1.0, -0.19);
    beacon.scale.y = 0.8;
    this.root.add(beacon);

    const antenna = part(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 5), m.edge, 0, 1.12, 0.18);
    this.root.add(antenna);
    const antennaTip = part(new THREE.SphereGeometry(0.035, 8, 6), m.beacon, 0, 1.27, 0.18);
    this.root.add(antennaTip);

    for (const side of [-1, 1]) {
      this.root.add(box(0.16, 0.18, 0.2, m.steel, side * 0.34, 0.56, 0.73));
      this.root.add(box(0.09, 0.12, 0.14, m.hazard, side * 0.405, 0.56, 0.73));
    }
  }

  buildHead() {
    const m = this.mats;
    this.head = new THREE.Group();
    this.head.position.set(0, 0.82, -1.14);
    this.root.add(this.head);

    this.head.add(box(0.43, 0.26, 0.44, m.steel, 0, 0, 0));
    this.head.add(box(0.36, 0.07, 0.34, m.edge, 0, 0.16, 0));
    this.head.add(box(0.3, 0.16, 0.66, m.olive, 0, -0.05, -0.46));
    this.head.add(box(0.27, 0.055, 0.56, m.oliveDark, 0, 0.05, -0.44));
    this.head.add(box(0.34, 0.06, 0.58, m.steel, 0, -0.145, -0.47));
    this.head.add(box(0.31, 0.1, 0.09, m.edge, 0, -0.06, -0.8));
    this.head.add(box(0.17, 0.05, 0.2, m.olive, -0.2, 0.145, -0.1));
    this.head.add(box(0.17, 0.05, 0.2, m.olive, 0.2, 0.145, -0.1));
    this.head.add(box(0.24, 0.045, 0.12, m.hazard, 0, 0.075, -0.64));

    for (const side of [-1, 1]) {
      this.head.add(box(0.12, 0.1, 0.06, m.black, side * 0.19, 0.105, -0.02));
      const eye = part(new THREE.SphereGeometry(0.052, 12, 8), m.eye, side * 0.19, 0.11, -0.06);
      eye.scale.z = 0.62;
      this.head.add(eye);
      this.head.add(box(0.15, 0.05, 0.2, m.steel, side * 0.205, 0.17, -0.03));
      this.head.add(box(0.06, 0.11, 0.38, m.oliveDark, side * 0.165, -0.05, -0.44));

      const hinge = part(new THREE.CylinderGeometry(0.055, 0.055, 0.065, 8), m.edge, side * 0.215, -0.085, -0.09);
      hinge.rotation.z = Math.PI / 2;
      this.head.add(hinge);

      const vent = part(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 8), m.black, side * 0.085, 0.04, -0.805);
      vent.rotation.x = Math.PI / 2;
      this.head.add(vent);
    }

    this.jaw = new THREE.Group();
    this.jaw.position.set(0, -0.105, -0.12);
    this.head.add(this.jaw);
    this.jaw.add(box(0.28, 0.085, 0.62, m.steel, 0, -0.04, -0.34));
    this.jaw.add(box(0.21, 0.028, 0.5, m.mouth, 0, 0.012, -0.36));
    this.jaw.add(box(0.29, 0.035, 0.1, m.edge, 0, -0.05, -0.64));

    for (const side of [-1, 1]) {
      this.jaw.add(box(0.055, 0.075, 0.42, m.oliveDark, side * 0.155, -0.04, -0.35));
      for (let i = 0; i < 3; i++) {
        const z = -0.2 - i * 0.14;
        const upper = part(new THREE.ConeGeometry(0.025, 0.1, 4), m.tooth, side * 0.12, -0.135, z);
        upper.rotation.x = Math.PI;
        this.head.add(upper);
        const lower = part(new THREE.ConeGeometry(0.023, 0.09, 4), m.tooth, side * 0.11, 0.04, z);
        this.jaw.add(lower);
      }
    }
  }

  buildTail() {
    const m = this.mats;
    this.tail = new THREE.Group();
    this.tail.position.set(0, 0.53, 0.88);
    this.root.add(this.tail);

    const segments = [
      [0.37, 0.24, 0.46, 0.2],
      [0.29, 0.19, 0.4, 0.56],
      [0.21, 0.14, 0.34, 0.88],
    ];
    for (const [w, h, d, z] of segments) {
      this.tail.add(box(w, h, d, m.oliveDark, 0, 0, z));
      this.tail.add(box(w * 0.86, 0.045, d * 0.55, m.edge, 0, h * 0.5, z));
    }
    this.tail.add(box(0.4, 0.055, 0.12, m.hazard, 0, 0.09, 0.49));
    this.tail.add(box(0.28, 0.045, 0.1, m.hazard, 0, 0.065, 0.82));

    const tip = part(new THREE.ConeGeometry(0.13, 0.52, 5), m.steel, 0, 0, 1.18);
    tip.rotation.x = Math.PI / 2;
    this.tail.add(tip);

    for (const side of [-1, 1]) {
      const fin = part(new THREE.ConeGeometry(0.08, 0.22, 4), m.edge, side * 0.18, 0.08, 0.63);
      fin.rotation.z = side * 0.6;
      this.tail.add(fin);
    }
  }

  buildLegs() {
    const m = this.mats;
    const layout = [
      [-0.41, -0.54, 0],
      [0.41, -0.54, Math.PI],
      [-0.43, 0.6, Math.PI],
      [0.43, 0.6, 0],
    ];
    for (const [x, z, phase] of layout) {
      const leg = new THREE.Group();
      leg.position.set(x, 0.53, z);
      this.root.add(leg);

      const hip = part(new THREE.CylinderGeometry(0.11, 0.11, 0.19, 9), m.steel, 0, 0, 0);
      hip.rotation.z = Math.PI / 2;
      leg.add(hip);
      const upper = box(0.18, 0.34, 0.2, m.olive, 0, -0.16, 0);
      upper.rotation.z = x < 0 ? -0.08 : 0.08;
      leg.add(upper);
      const knee = part(new THREE.SphereGeometry(0.095, 8, 6), m.edge, 0, -0.32, 0);
      leg.add(knee);
      const lower = box(0.16, 0.28, 0.18, m.steel, 0, -0.36, -0.01);
      leg.add(lower);
      const foot = box(0.24, 0.11, 0.4, m.black, 0, -0.475, -0.08);
      leg.add(foot);
      const toe = box(0.2, 0.05, 0.12, m.edge, 0, -0.485, -0.3);
      leg.add(toe);

      this.legs.push({ pivot: leg, phase });
    }
  }

  setMode(mode) {
    this.mode = mode;
    if (mode !== 'catch') this.jawOpen = Math.min(this.jawOpen, 0.12);
  }

  setDanger(value) {
    this.danger = clamp(value, 0, 1);
  }

  snap(duration = 0.7, onDone = null) {
    this.biteT = duration;
    this.biteDone = onDone;
  }

  resetPose() {
    this.mode = 'idle';
    this.danger = 0;
    this.biteT = 0;
    this.biteDone = null;
    this.jawOpen = 0;
    this.jaw.rotation.x = 0;
    this.head.rotation.set(0, 0, 0);
    this.tail.rotation.set(0, 0, 0);
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    for (const leg of this.legs) leg.pivot.rotation.set(0, 0, 0);
  }

  update(dt) {
    if (!this.group.visible) return;
    this.t += dt;
    const running = this.mode === 'run';
    const catching = this.mode === 'catch';
    const rate = running ? 11.5 : catching ? 2.8 : 1.4;
    this.phase += dt * rate * (running ? 1 + this.danger * 0.35 : 1);

    const swing = running ? 0.55 : catching ? 0.1 : 0.025;
    for (const leg of this.legs) {
      leg.pivot.rotation.x = Math.sin(this.phase + leg.phase) * swing;
    }

    this.root.position.y = running
      ? Math.abs(Math.sin(this.phase)) * 0.045
      : catching
        ? Math.sin(this.phase) * 0.018
        : Math.sin(this.t * 1.7) * 0.012;
    this.root.rotation.z = running ? Math.sin(this.phase) * 0.028 : 0;
    this.tail.rotation.y = Math.sin(this.phase * 0.55 + 1.2) * (running ? 0.28 : 0.09);
    this.tail.rotation.x = running ? Math.sin(this.phase * 0.9) * 0.045 : 0;
    this.head.rotation.y = Math.sin(this.t * 1.7) * (running ? 0.045 : 0.025);
    this.head.rotation.x = running ? Math.sin(this.phase * 2) * 0.018 : 0;
    const targetHeadY = catching ? 0.76 : running ? 1.02 : 0.9;
    this.head.position.y += (targetHeadY - this.head.position.y) * Math.min(1, dt * 5);

    const biting = this.biteT > 0;
    const targetJaw = catching ? 0.52 : running ? 0.06 + this.danger * 0.3 : biting ? 0.64 : 0.015;
    this.jawOpen += (targetJaw - this.jawOpen) * Math.min(1, dt * 15);
    this.jaw.rotation.x = -this.jawOpen;

    this.eyeMat.emissiveIntensity =
      running || catching ? 3 + this.danger * 3 : 1.1 + Math.max(0, Math.sin(this.t * 2.2)) * 0.3;
    this.beaconMat.emissiveIntensity = 1.2 + Math.max(0, Math.sin(this.t * 8.5)) * 2.4;

    if (biting) {
      this.biteT -= dt;
      if (this.biteT <= 0) {
        this.biteT = 0;
        const done = this.biteDone;
        this.biteDone = null;
        if (done) done();
      }
    }
  }

  getAnchor(camera) {
    this.group.updateMatrixWorld(true);
    const point = this.anchor.getWorldPosition(new THREE.Vector3()).project(camera);
    return {
      x: (point.x * 0.5 + 0.5) * window.innerWidth,
      y: (-point.y * 0.5 + 0.5) * window.innerHeight,
      scale: this.group.scale.y,
    };
  }

  getScreenRect(camera) {
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.root);
    if (box.isEmpty()) return null;
    const points = [];
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          points.push(new THREE.Vector3(x, y, z).project(camera));
        }
      }
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      const x = (p.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-p.y * 0.5 + 0.5) * window.innerHeight;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    return {
      left: minX,
      right: maxX,
      top: minY,
      bottom: maxY,
      cx: (minX + maxX) * 0.5,
      cy: (minY + maxY) * 0.5,
      scale: this.group.scale.y,
    };
  }
}
