import * as THREE from 'three';
import { YUUKA_DEF, loadRig } from './models.js';

export class YuukaPursuer {
  constructor() {
    this.kind = 'yuuka';
    this.group = new THREE.Group();
    this.group.name = 'YuukaPursuer';
    this.rig = null;
    this.mode = 'idle';
    this.danger = 0;
    this.t = 0;
    this.snapT = 0;
    this.current = null;
  }

  async load(onProgress) {
    if (this.rig) return this.rig;
    const rig = await loadRig(YUUKA_DEF, 1.72, onProgress);
    rig.group.position.set(0, 0, 0);
    rig.group.visible = true;
    this.group.add(rig.group);
    this.rig = rig;
    this.applyMode('idle', 0.1);
    return rig;
  }

  applyMode(mode, fade = 0.18) {
    if (!this.rig) return;
    const rig = this.rig;
    if (mode === 'run') {
      rig.playLoop(rig.clips.run || rig.clips.idle, fade);
    } else if (mode === 'catch') {
      rig.playOnce(rig.clips.catch || rig.clips.panic || rig.clips.idle, {
        fade,
        timeScale: 0.9,
      });
    } else {
      rig.playLoop(rig.clips.idle, fade);
    }
  }

  setMode(mode) {
    if (mode === this.mode) return;
    this.mode = mode;
    this.applyMode(mode);
  }

  setDanger(value) {
    this.danger = Math.max(0, Math.min(1, value));
    if (this.rig && this.mode === 'run') {
      const action = this.rig.actions.get(this.rig.clips.run);
      if (action) action.setEffectiveTimeScale(1 + this.danger * 0.22);
    }
  }

  snap(duration = 0.7) {
    this.snapT = duration;
    if (!this.rig) return;
    const clip = this.rig.clips.panic || this.rig.clips.reaction || this.rig.clips.catch;
    if (!clip) return;
    this.rig.playOnce(clip, {
      fade: 0.08,
      timeScale: 1.35,
      onDone: () => {
        if (this.group.visible) this.applyMode(this.mode === 'idle' ? 'run' : this.mode, 0.16);
      },
    });
  }

  resetPose() {
    this.mode = 'idle';
    this.danger = 0;
    this.snapT = 0;
    this.group.rotation.set(0, 0, 0);
    this.group.position.set(0, 0, 0);
    if (!this.rig) return;
    this.rig.resetPose();
    this.rig.group.position.set(0, 0, 0);
    this.rig.stopAll();
    this.applyMode('idle', 0.1);
  }

  update(dt) {
    if (!this.group.visible || !this.rig) return;
    this.t += dt;
    if (this.snapT > 0) this.snapT = Math.max(0, this.snapT - dt);
    const run = this.mode === 'run';
    const bob = run ? Math.abs(Math.sin(this.t * 9.5)) * 0.035 * (1 + this.danger * 0.3) : 0;
    this.rig.group.position.y = bob;
    this.rig.setTilt(run ? -0.04 - this.danger * 0.035 : 0);
    this.rig.update(dt);
  }

  getAnchor(camera) {
    if (!this.rig) return null;
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.rig.model);
    if (box.isEmpty()) return null;
    const point = new THREE.Vector3(
      (box.min.x + box.max.x) * 0.5,
      box.max.y + 0.12,
      (box.min.z + box.max.z) * 0.5
    ).project(camera);
    return {
      x: (point.x * 0.5 + 0.5) * window.innerWidth,
      y: (-point.y * 0.5 + 0.5) * window.innerHeight,
      scale: this.group.scale.y,
    };
  }

  getScreenRect(camera) {
    if (!this.rig) return null;
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.rig.model);
    if (box.isEmpty()) return null;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const p = new THREE.Vector3(x, y, z).project(camera);
          const sx = (p.x * 0.5 + 0.5) * window.innerWidth;
          const sy = (-p.y * 0.5 + 0.5) * window.innerHeight;
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
      }
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
