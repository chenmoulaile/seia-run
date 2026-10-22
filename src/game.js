import * as THREE from 'three';
import { CFG, LANES } from './config.js';
import { CHARACTERS, loadRig, makeBlobShadow } from './models.js';
import { RobotCroc } from './robotCroc.js';
import { YuukaPursuer } from './yuukaPursuer.js';
import { Props } from './props.js';
import { DIALOGUE } from './dialogue.js';
import { VOICE } from './voiceData.js';

const STATE = {
  LOADING: 'loading',
  MENU: 'menu',
  COUNTDOWN: 'countdown',
  RUN: 'run',
  PAUSE: 'pause',
  CATCH: 'catch',
  OVER: 'over',
};

const clamp = THREE.MathUtils.clamp;

export class Game {
  constructor({ scene, camera, world, cafe, ui, audio, input }) {
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.menuScene = cafe;
    this.ui = ui;
    this.audio = audio;
    this.input = input;

    this.props = new Props(scene);
    this.state = STATE.LOADING;
    this.time = 0;
    this.camMode = 'menu';
    this.camPos = new THREE.Vector3(2.5, 2.0, -5.2);
    this.camLook = new THREE.Vector3(-0.2, 1.05, 1.6);

    this.player = null;
    this.robot = null;
    this.yuuka = null;
    this.croc = null;
    this.pursuerKind = 'croc';
    this.crocRevealT = 0;
    this.characterId = null;
    this.angry = null;
    this.ready = false;
    this.lineBags = new Map();
    this.speaker = null;
    this.speechSeq = 0;
    this.talkCooldown = 0;
    this.menuTimer = 0;
    this.menuActionIndex = 0;
    this.menuActions = [];
    this.menuActionClip = null;
    this.selectSeq = 0;

    this.speed = CFG.speedStart;
    this.distance = 0;
    this.gems = 0;
    this.gap = CFG.gapStart;
    this.runTime = 0;
    this.spawnCountdown = 0;
    this.nextMilestone = CFG.milestoneStep;
    this.penaltyT = 0;
    this.countdownT = 0;
    this.countdownStage = -1;
    this.catchT = 0;
    this.shake = 0;
    this.prevState = STATE.RUN;

    this.best = this.loadBest();
    this.shadowPlayer = makeBlobShadow(0.62, 0.36);
    this.shadowCroc = makeBlobShadow(0.95, 0.34);
    this.shadowCroc.visible = false;
    this.scene.add(this.shadowPlayer, this.shadowCroc);

    this.world.setVisible(false);
    this.menuScene.setVisible(true);

    this.onStartRequest = null;
    this.bindInput();
  }

  bindInput() {
    this.input.on('left', () => this.moveLane(-1));
    this.input.on('right', () => this.moveLane(1));
    this.input.on('jump', () => this.handleJump());
    this.input.on('tap', (point) => {
      if (this.state === STATE.MENU) this.handleMenuTap(point);
      else this.handleJump();
    });
    this.input.on('slide', () => this.handleSlide());
    this.input.on('pause', () => this.togglePause());
    this.input.on('start', () => {
      if (this.state === STATE.MENU || this.state === STATE.OVER) {
        if (this.onStartRequest) this.onStartRequest();
      }
    });
  }

  loadBest() {
    try {
      const raw = localStorage.getItem(CFG.bestKey);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          score: Number(data.score) || 0,
          gems: Number(data.gems) || 0,
          dist: Number(data.dist) || 0,
        };
      }
    } catch {
      /* ignore */
    }
    return { score: 0, gems: 0, dist: 0 };
  }

  saveBest(entry) {
    this.best = entry;
    try {
      localStorage.setItem(CFG.bestKey, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }

  async init(initialId = 'seia', onProgress) {
    this.robot = new RobotCroc();
    this.scene.add(this.robot.group);
    this.robot.group.visible = false;
    this.yuuka = new YuukaPursuer();
    this.scene.add(this.yuuka.group);
    this.yuuka.group.visible = false;
    this.croc = this.robot;
    this.setupCroc();

    const id = CHARACTERS.some((c) => c.id === initialId) ? initialId : CHARACTERS[0].id;
    await this.selectCharacter(id, (f) => {
      if (onProgress) onProgress(f);
    });
    this.ready = true;
  }

  setupCroc() {
    this.angry = this.makeAngrySprite();
    this.angry.position.set(0, 1.9, -1.05);
    this.angry.scale.setScalar(0.55);
    this.robot.group.add(this.angry);
    this.angry.visible = false;
    this.robot.setMode('idle');
  }

  setPursuer(kind) {
    const want = kind === 'yuuka' ? 'yuuka' : 'croc';
    this.pursuerKind = want;
    const next = want === 'yuuka' ? this.yuuka : this.robot;
    if (this.croc && this.croc !== next) this.croc.group.visible = false;
    if (this.angry && this.angry.parent) this.angry.parent.remove(this.angry);
    this.croc = next;
    if (!next) return;
    if (this.angry) {
      next.group.add(this.angry);
      if (want === 'yuuka') {
        this.angry.position.set(0, 2.02, 0.15);
        this.angry.scale.setScalar(0.46);
      } else {
        this.angry.position.set(0, 1.9, -1.05);
        this.angry.scale.setScalar(0.55);
      }
      this.angry.visible = false;
    }
    this.ui.setPursuer(want);
    if (this.state === STATE.MENU || this.state === STATE.LOADING) {
      next.group.visible = true;
      this.placeMenuPose();
    } else {
      next.group.visible = false;
    }
  }

  makeAngrySprite() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const r = 26;
    ctx.beginPath();
    ctx.moveTo(14 + r, 12);
    ctx.arcTo(116, 12, 116, 116, r);
    ctx.arcTo(116, 116, 12, 116, r);
    ctx.arcTo(12, 116, 12, 12, r);
    ctx.arcTo(12, 12, 116, 12, r);
    ctx.closePath();
    ctx.fillStyle = '#ff4d6a';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 86px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 64, 68);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })
    );
    sprite.scale.setScalar(0.72);
    sprite.position.set(0, 2.35, -0.35);
    return sprite;
  }

  async selectCharacter(id, onProgress) {
    const def = CHARACTERS.find((c) => c.id === id);
    if (!def) return;
    this.ui.hideSpeech();
    this.speaker = null;
    if (this.player && this.player.def.id === id) {
      this.ui.setCharacter(id);
      this.characterId = id;
      if (def.pursuer !== 'yuuka' || (this.yuuka && this.yuuka.rig)) {
        this.setPursuer(def.pursuer);
      }
      if (this.state === STATE.MENU) this.placeMenuPose();
      return;
    }
    this.audio.stopVoice();
    this.lineBags.delete(def.voice);
    const token = ++this.selectSeq;
    const wantYuuka = def.pursuer === 'yuuka';
    const rig = await loadRig(def, CFG.playerHeight, (f) => {
      if (onProgress) onProgress(wantYuuka ? f * 0.78 : f);
    });
    if (token !== this.selectSeq) {
      rig.group.visible = false;
      return;
    }
    let kind = wantYuuka ? 'yuuka' : 'croc';
    if (wantYuuka) {
      try {
        await this.yuuka.load((f) => {
          if (onProgress) onProgress(0.78 + f * 0.22);
        });
      } catch (err) {
        console.warn('[yuuka] load failed, fallback to croc', err);
        kind = 'croc';
      }
    }
    if (token !== this.selectSeq) {
      rig.group.visible = false;
      return;
    }
    if (this.player) {
      this.player.rig.group.visible = false;
      this.player.rig.stopAll();
      this.player.rig.resetPose();
      this.player.rig.model.visible = true;
    }
    this.scene.add(rig.group);
    rig.group.visible = true;
    rig.resetPose();
    rig.model.visible = true;
    const menu = this.state === STATE.MENU || this.state === STATE.LOADING;
    rig.playLoop(menu ? rig.clips.idle : rig.clips.run, 0.1);

    this.player = {
      def,
      rig,
      lane: 1,
      x: 0,
      y: 0,
      vy: 0,
      grounded: true,
      sliding: 0,
      invuln: 0,
      tilt: 0,
      offY: 0,
      jumpBuffer: 0,
    };
    this.characterId = id;
    this.setPursuer(kind);
    this.ui.setCharacter(id);
    this.shadowPlayer.visible = true;
    if (this.state === STATE.MENU || this.state === STATE.LOADING) this.placeMenuPose();
    else this.placeRunPose();
  }

  isPortrait() {
    return this.camera.aspect < 0.9;
  }

  placeMenuPose() {
    const p = this.player;
    if (!p) return;
    p.lane = 1;
    p.x = 0;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.sliding = 0;
    p.tilt = 0;
    p.offY = 0;
    p.invuln = 0;
    p.rig.resetPose();
    p.rig.playLoop(p.rig.clips.idle, 0.16);
    p.rig.group.position.set(0, 0, 0);
    p.rig.group.visible = true;
    this.shadowPlayer.position.set(0, 0.02, 0);
    this.shadowPlayer.scale.setScalar(1);
    this.shadowPlayer.visible = true;
    if (this.croc) {
      const yuuka = this.pursuerKind === 'yuuka';
      const scale = yuuka ? CFG.yuukaMenuScale : CFG.crocMenuScale;
      this.croc.resetPose();
      this.croc.setMode('idle');
      this.croc.setDanger(0.12);
      // 竖屏视野窄，鳄鱼会跑到画面外，主菜单只留角色
      this.croc.group.visible = !this.isPortrait();
      if (yuuka) {
        this.croc.group.position.set(-2.1, 0, 0.35);
        this.croc.group.rotation.y = 0;
      } else {
        this.croc.group.position.set(-2.15, 0, 0.25);
        this.croc.group.rotation.y = -0.58;
      }
      this.croc.group.scale.setScalar(scale);
      this.placeCrocShadow(scale);
    }
    if (this.angry) this.angry.visible = false;
    this.resetMenuCycle();
  }

  resetMenuCycle() {
    const rig = this.player && this.player.rig;
    if (!rig) return;
    const names = [
      'Cafe_Idle',
      'Cafe_Reaction',
      'Formation_Idle',
      'Formation_Idle_Random',
      'Normal_Idle',
      'Normal_Callsign',
      'Normal_Callsign_Random',
      'Stand_Idle',
    ];
    this.menuActions = names.filter((n) => rig.actions && rig.actions.has(n));
    this.menuActionIndex = 0;
    this.menuActionClip = null;
    this.menuTimer = 5 + Math.random() * 2.5;
  }

  nextMenuAction() {
    const p = this.player;
    if (!p || this.state !== STATE.MENU || !this.menuActions.length) return;
    const rig = p.rig;
    const name = this.menuActions[this.menuActionIndex % this.menuActions.length];
    this.menuActionIndex += 1;
    const loop = new Set(['Cafe_Idle', 'Normal_Idle', 'Formation_Idle', 'Stand_Idle', 'Kneel_Idle']);
    if (loop.has(name)) {
      rig.playLoop(name, 0.35);
      this.menuActionClip = name;
      this.menuTimer = 4.8 + Math.random() * 2.2;
      return;
    }
    rig.playOnce(name, {
      fade: 0.25,
      timeScale: 0.95,
      onDone: () => {
        if (this.state === STATE.MENU && this.player && this.player.rig === rig) {
          rig.playLoop(rig.clips.idle, 0.3);
          this.menuActionClip = null;
        }
      },
    });
    this.menuActionClip = name;
    this.menuTimer = 5.4 + Math.random() * 2;
  }

  placeRunPose() {
    const p = this.player;
    if (!p) return;
    p.rig.group.position.set(p.x, p.y, 0);
    this.shadowPlayer.position.set(p.x, 0.02, 0);
  }

  placeCrocShadow(scale = 1) {
    if (!this.croc) return;
    this.shadowCroc.visible = this.croc.group.visible;
    this.shadowCroc.position.set(this.croc.group.position.x, 0.02, this.croc.group.position.z);
    this.shadowCroc.scale.set(scale * 1.25, scale * 0.78, 1);
  }

  enterMenu() {
    this.state = STATE.MENU;
    this.camMode = 'menu';
    this.props.reset();
    this.speed = CFG.speedStart;
    this.distance = 0;
    this.gems = 0;
    this.gap = CFG.gapStart;
    this.penaltyT = 0;
    this.countdownStage = -1;
    this.shake = 0;
    this.speaker = null;
    this.ui.hideSpeech();
    this.camPos.set(2.5, 2.0, -5.2);
    this.camLook.set(-0.2, 1.05, 1.6);
    this.camera.position.copy(this.camPos);
    this.camera.lookAt(this.camLook);
    this.camera.fov = 46;
    this.camera.updateProjectionMatrix();
    this.world.setVisible(false);
    this.menuScene.setVisible(true);
    this.audio.stopVoice();
    this.ui.showMenu();
    this.ui.setCatch(false);
    this.ui.setPursuer(this.pursuerKind);
    this.ui.setCharacter(this.characterId);
    this.ui.setBest(this.best.score);
    this.ui.updateHUD(0, 0);
    this.audio.setMusicPaused(false);
    this.audio.setIntensity(0);
    if (this.player) {
      this.player.rig.model.visible = true;
      this.player.rig.stopAll();
      this.placeMenuPose();
    }
  }

  startRun() {
    if (!this.ready) return;
    this.audio.init();
    this.state = STATE.COUNTDOWN;
    this.countdownT = 0;
    this.countdownStage = -1;
    this.props.reset();
    this.speed = CFG.speedStart;
    this.distance = 0;
    this.gems = 0;
    this.gap = CFG.gapStart;
    this.penaltyT = 0;
    this.runTime = 0;
    this.catchT = 0;
    this.shake = 0;
    this.spawnCountdown = 34;
    this.nextMilestone = CFG.milestoneStep;
    this.speaker = null;
    this.speechSeq += 1;
    this.audio.stopVoice();
    this.ui.hideSpeech();
    this.world.setVisible(true);
    this.menuScene.setVisible(false);
    this.crocRevealT = 0;

    const p = this.player;
    if (p) {
      p.lane = 1;
      p.x = 0;
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
      p.sliding = 0;
      p.invuln = 0;
      p.tilt = 0;
      p.offY = 0;
      p.jumpBuffer = 0;
      p.rig.resetPose();
      p.rig.model.visible = true;
      p.rig.stopAll();
      p.rig.playLoop(p.rig.clips.run, 0.1);
      p.rig.group.position.set(0, 0, 0);
      p.rig.group.visible = true;
      this.shadowPlayer.position.set(0, 0.02, 0);
      this.shadowPlayer.scale.setScalar(1);
      this.shadowPlayer.visible = true;
    }
    if (this.croc) {
      const countdownScale =
        this.pursuerKind === 'yuuka' ? CFG.yuukaCountdownScale : CFG.crocCountdownScale;
      this.croc.resetPose();
      this.croc.setMode('run');
      this.croc.setDanger(0.25);
      this.croc.group.visible = false;
      this.croc.group.rotation.y = this.pursuerKind === 'yuuka' ? 0 : 0.25;
      this.croc.group.position.set(0.9, 0, 2.8);
      this.croc.group.scale.setScalar(countdownScale);
      this.placeCrocShadow(countdownScale);
    }
    if (this.angry) this.angry.visible = false;

    this.camMode = 'run';
    this.ui.hidePause();
    this.ui.showGame();
    this.ui.hideCountdown();
    this.ui.setCatch(false);
    this.ui.updateHUD(0, 0);
    this.ui.setThreat(0, this.pursuerKind);
    this.audio.setMusicPaused(false);
  }

  startRunning() {
    this.state = STATE.RUN;
    this.ui.hideCountdown();
    this.crocRevealT = 0;
    this.ui.toast(this.pursuerKind === 'yuuka' ? '优香追来了！跑！' : '机器鳄鱼启动了！跑！', 1500);
    const n = 6;
    for (let i = 0; i < n; i++) this.props.spawnGem(0, 0.92, -16 - i * 6);
    if (this.onRunStart) this.onRunStart();
  }

  togglePause() {
    if (this.state === STATE.RUN || this.state === STATE.COUNTDOWN) {
      this.prevState = this.state;
      this.state = STATE.PAUSE;
      this.ui.showPause();
      this.ui.hideCountdown();
      this.audio.stopVoice();
      this.speechSeq += 1;
      this.ui.hideSpeech();
      this.audio.setMusicPaused(true);
      this.audio.click();
    } else if (this.state === STATE.PAUSE) {
      this.resume();
    }
  }

  resume() {
    if (this.state !== STATE.PAUSE) return;
    this.state = this.prevState;
    this.ui.hidePause();
    this.audio.setMusicPaused(false);
    this.audio.click();
    if (this.state === STATE.RUN) this.ui.hideCountdown();
  }

  pauseForVisibility() {
    if (this.state === STATE.RUN || this.state === STATE.COUNTDOWN) this.togglePause();
  }

  moveLane(dir) {
    if (this.state !== STATE.RUN || !this.player) return;
    const p = this.player;
    const next = clamp(p.lane + dir, 0, 2);
    if (next !== p.lane) {
      p.lane = next;
      this.audio.click();
    }
  }

  handleJump() {
    if (this.state !== STATE.RUN || !this.player) return;
    const p = this.player;
    if (!p.grounded) {
      p.jumpBuffer = CFG.jumpBuffer;
      return;
    }
    if (p.sliding > 0) p.sliding = 0;
    this.doJump();
  }

  doJump() {
    const p = this.player;
    if (!p) return;
    p.vy = CFG.jumpV;
    p.grounded = false;
    p.jumpBuffer = 0;
    p.rig.playOnce(p.rig.clips.jump, { fade: 0.1, timeScale: 1.5 });
    this.audio.jump();
  }

  handleSlide() {
    if (this.state !== STATE.RUN || !this.player) return;
    const p = this.player;
    if (!p.grounded) {
      p.vy = Math.min(p.vy, -16);
      return;
    }
    if (p.sliding > 0) {
      // 已经在滑铲：延长而不是取消，避免连按 ↓ 直接撞上横梁
      p.sliding = Math.max(p.sliding, 0.55);
      return;
    }
    p.sliding = CFG.slideDur;
    this.audio.slide();
  }

  update(dt) {
    if (this.state === STATE.PAUSE) return;
    this.time += dt;

    const worldSpeed =
      this.state === STATE.RUN
        ? this.speed
        : this.state === STATE.COUNTDOWN
          ? 6.5
          : this.state === STATE.MENU
            ? 5.2
            : this.state === STATE.CATCH
              ? Math.max(1.4, this.speed * 0.12)
              : this.state === STATE.OVER
                ? 0.8
                : 2;

    if (this.world.group.visible) this.world.update(dt, worldSpeed);
    this.menuScene.update(dt, this.time);

    const animScale = this.state === STATE.CATCH ? 0.55 : 1;
    if (this.player) this.player.rig.update(dt * animScale);
    if (this.croc) this.croc.update(dt * animScale);

    const propSpeed =
      this.state === STATE.RUN
        ? this.speed
        : this.state === STATE.CATCH || this.state === STATE.OVER
          ? worldSpeed
          : 0;
    this.props.update(dt, propSpeed, this.time);

    switch (this.state) {
      case STATE.MENU:
        this.menuUpdate(dt);
        break;
      case STATE.COUNTDOWN:
        this.countdownUpdate(dt);
        break;
      case STATE.RUN:
        this.runUpdate(dt);
        break;
      case STATE.CATCH:
        this.catchUpdate(dt);
        break;
      default:
        break;
    }
  }

  menuUpdate(dt) {
    const t = this.time;
    const p = this.player;
    if (p) {
      p.x = 0;
      p.rig.group.position.set(0, 0, 0);
      this.shadowPlayer.position.set(0, 0.02, 0);
      this.menuTimer -= dt;
      if (this.menuTimer <= 0) this.nextMenuAction();
    }
    if (this.croc) {
      const yuuka = this.pursuerKind === 'yuuka';
      const scale = yuuka ? CFG.yuukaMenuScale : CFG.crocMenuScale;
      this.croc.group.visible = !this.isPortrait();
      this.croc.setMode('idle');
      this.croc.setDanger(0.12);
      this.croc.group.position.x = (yuuka ? -2.1 : -2.15) + Math.sin(t * 0.55 + 1.2) * 0.012;
      this.placeCrocShadow(scale);
    }
    if (this.angry) this.angry.visible = false;
  }

  pickVoice(profile) {
    const data = VOICE[profile];
    if (!data || !data.lines || !data.lines.length) return null;
    let bag = this.lineBags.get(profile);
    if (!bag || !bag.length) {
      bag = data.lines.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      this.lineBags.set(profile, bag);
    }
    return data.lines[bag.pop()];
  }

  playLine(name, text, accent, line, speakerId = 'player') {
    this.audio.init();
    this.audio.click();
    const token = ++this.speechSeq;
    this.speaker = { id: speakerId };
    const duration = line && line.duration ? line.duration * 1000 + 350 : 0;
    this.ui.showSpeech(name, text, accent, duration);
    if (line && line.audio) {
      this.audio.playVoice(line.audio, {
        onEnd: () => {
          if (this.speechSeq === token) this.ui.hideSpeech();
        },
      });
    }
    this.updateSpeechAnchor();
    this.menuTimer = Math.max(this.menuTimer, 7.5);
  }

  speakPickup() {
    const p = this.player;
    if (!p || this.state !== STATE.MENU) return;
    const data = VOICE[p.def.voice];
    if (!data || !data.pickup) return;
    this.talkCooldown = this.time + 0.8;
    this.playLine(p.def.name, data.pickup.text, p.def.accent, data.pickup);
  }

  talk(id) {
    if (this.state !== STATE.MENU || this.time < this.talkCooldown) return;
    this.talkCooldown = this.time + 0.4;
    if (id === 'croc' || id === 'yuuka') {
      this.talkPursuer(id);
      return;
    }
    const p = this.player;
    if (!p) return;
    const line = this.pickVoice(p.def.voice);
    if (!line) return;
    this.playLine(p.def.name, line.text, p.def.accent, line);
    const rig = p.rig;
    if (rig.clips.reaction) {
      this.menuActionClip = 'Reaction';
      rig.playOnce(rig.clips.reaction, {
        fade: 0.14,
        timeScale: 1.35,
        onDone: () => {
          if (this.state === STATE.MENU && this.player && this.player.rig === rig) {
            rig.playLoop(rig.clips.idle, 0.2);
            this.menuActionClip = null;
          }
        },
      });
    }
  }

  talkPursuer(kind) {
    const yuuka = kind === 'yuuka';
    const accent = yuuka ? '#3d7bfd' : '#e2434f';
    if (!yuuka) {
      const data = DIALOGUE.croc;
      if (!data) return;
      const line = data.lines[Math.floor(Math.random() * data.lines.length)];
      this.playLine(data.name, line, data.accent, null, 'pursuer');
      this.croc.snap(0.72);
      return;
    }
    const line = this.pickVoice('yuuka');
    if (!line) return;
    this.playLine('????', line.text, accent, line, 'pursuer');
    if (this.croc && this.croc.rig && this.croc.rig.clips.reaction) {
      const rig = this.croc.rig;
      rig.playOnce(rig.clips.reaction, {
        fade: 0.18,
        timeScale: 1.1,
        onDone: () => {
          if (this.state === STATE.MENU && this.croc && this.croc.rig === rig) {
            rig.playLoop(rig.clips.idle, 0.25);
          }
        },
      });
    }
  }

  handleMenuTap(point) {
    if (!point) return;
    const hit = this.menuHitAt(point.x, point.y);
    if (!hit) {
      this.speechSeq += 1;
      this.audio.stopVoice();
      this.ui.hideSpeech();
      this.speaker = null;
      return;
    }
    this.talk(hit === 'player' ? this.characterId : hit);
  }

  projectPlayer(fraction) {
    const p = this.player;
    if (!p) return null;
    const scale = p.rig.group.scale.y;
    const pos = new THREE.Vector3(
      p.rig.group.position.x,
      p.rig.group.position.y + p.rig.height * scale * fraction,
      p.rig.group.position.z
    );
    this.camera.updateMatrixWorld();
    pos.project(this.camera);
    return {
      x: (pos.x * 0.5 + 0.5) * window.innerWidth,
      y: (-pos.y * 0.5 + 0.5) * window.innerHeight,
      scale,
    };
  }

  menuHitAt(x, y) {
    if (this.state !== STATE.MENU) return null;
    this.camera.updateMatrixWorld();

    const candidates = [];
    const head = this.projectPlayer(0.94);
    const foot = this.projectPlayer(0.04);
    if (head && foot) {
      const top = Math.min(head.y, foot.y) - 14;
      const bottom = Math.max(head.y, foot.y) + 4;
      const halfW = Math.max(38, (bottom - top) * 0.34);
      if (x >= head.x - halfW && x <= head.x + halfW && y >= top && y <= bottom) {
        candidates.push({
          id: 'player',
          distance: Math.abs(x - head.x) + Math.abs(y - (top + bottom) * 0.5) * 0.35,
        });
      }
    }

    if (this.croc) {
      const rect = this.croc.getScreenRect(this.camera);
      if (rect && x >= rect.left - 8 && x <= rect.right + 8 && y >= rect.top - 8 && y <= rect.bottom + 8) {
        candidates.push({
          id: this.pursuerKind,
          distance: Math.abs(x - rect.cx) + Math.abs(y - rect.cy) * 0.35,
        });
      }
    }

    candidates.sort((a, b) => a.distance - b.distance);
    return candidates.length ? candidates[0].id : null;
  }

  updateSpeechAnchor() {
    if (!this.speaker || this.state !== STATE.MENU) return;
    if (this.speaker.id === 'pursuer') {
      if (!this.croc) return;
      const anchor = this.croc.getAnchor(this.camera);
      if (anchor) this.ui.positionSpeech(anchor.x, anchor.y - 10);
      return;
    }
    const anchor = this.projectPlayer(1.03);
    if (anchor) this.ui.positionSpeech(anchor.x, anchor.y - 12);
  }

  countdownUpdate(dt) {
    this.countdownT += dt;
    const labels = [3, 2, 1, 'GO!'];
    const idx = this.countdownT < 0.75 ? 0 : this.countdownT < 1.5 ? 1 : this.countdownT < 2.25 ? 2 : 3;
    if (idx !== this.countdownStage) {
      this.countdownStage = idx;
      this.ui.countdown(labels[idx]);
      this.audio.beep(idx === 3);
    }
    const p = this.player;
    if (p) {
      p.x += (0 - p.x) * Math.min(1, dt * 10);
      p.rig.group.position.set(p.x, 0, 0);
      this.shadowPlayer.position.set(p.x, 0.02, 0);
    }
    if (this.croc) {
      this.croc.group.visible = false;
      this.croc.setMode('run');
      this.croc.setDanger(0.35);
      this.croc.group.position.set(0.9, 0, 2.8);
      const targetScale =
        this.pursuerKind === 'yuuka' ? CFG.yuukaCountdownScale : CFG.crocCountdownScale;
      this.croc.group.scale.setScalar(targetScale);
      this.placeCrocShadow(targetScale);
    }
    if (this.angry) this.angry.visible = false;
    if (this.countdownT >= 2.9) this.startRunning();
  }

  runUpdate(dt) {
    const p = this.player;
    if (!p) return;
    this.runTime += dt;

    const progress = Math.min(1, this.distance / CFG.rampDist);
    let target = CFG.speedStart + (CFG.speedMax - CFG.speedStart) * Math.pow(progress, 0.72);
    if (this.distance > CFG.rampDist) {
      const late = Math.min(1, (this.distance - CFG.rampDist) / CFG.lateRampDist);
      target = CFG.speedMax + (CFG.speedMaxLate - CFG.speedMax) * late;
    }
    if (this.penaltyT > 0) {
      this.penaltyT -= dt;
      target *= CFG.penaltyMul;
    }
    this.speed += (target - this.speed) * Math.min(1, dt * 2.4);
    this.distance += this.speed * dt;
    this.gap = Math.min(CFG.gapMax, this.gap + CFG.gapRecover * dt);

    p.x += (LANES[p.lane] - p.x) * Math.min(1, dt * CFG.laneLerp);

    if (p.jumpBuffer > 0) p.jumpBuffer = Math.max(0, p.jumpBuffer - dt);

    if (!p.grounded) {
      p.vy += CFG.gravity * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.grounded = true;
        if (p.jumpBuffer > 0) this.doJump();
        else p.rig.playLoop(p.rig.clips.run, 0.16);
      }
    }

    if (p.sliding > 0) {
      p.sliding = Math.max(0, p.sliding - dt);
      if (p.sliding === 0 && p.grounded) p.rig.playLoop(p.rig.clips.run, 0.16);
    }

    const targetTilt = p.sliding > 0 ? -0.22 : 0;
    const targetOff = p.sliding > 0 ? -0.14 : 0;
    p.tilt += (targetTilt - p.tilt) * Math.min(1, dt * 16);
    p.offY += (targetOff - p.offY) * Math.min(1, dt * 16);
    p.rig.setTilt(p.tilt);
    p.rig.setOffsetY(p.offY);

    p.rig.group.position.set(p.x, p.y, 0);
    this.shadowPlayer.position.set(p.x, 0.02, 0);
    this.shadowPlayer.scale.setScalar(Math.max(0.5, 1 - p.y * 0.14));

    if (p.invuln > 0) {
      p.invuln -= dt;
      p.rig.model.visible = p.invuln > 0 ? Math.floor(this.time * 18) % 2 === 0 : true;
    }

    this.updateCrocRun(dt);

    this.spawnCountdown -= this.speed * dt;
    if (this.spawnCountdown <= 0) {
      this.spawnRow();
      const diff = Math.min(1, this.distance / 900);
      const base = CFG.rowGapStart + (CFG.rowGapMin - CFG.rowGapStart) * diff;
      // 行距按“时间间隔”兜底：速度越高，米数越大，保证落地后还有时间起跳
      const rampT = Math.min(1, this.distance / 3000);
      const timeGap = CFG.rowGapTimeStart + (CFG.rowGapTimeEnd - CFG.rowGapTimeStart) * rampT;
      this.spawnCountdown = Math.max(base, this.speed * timeGap) * (0.9 + Math.random() * 0.2);
    }

    this.checkCollisions();

    const lvl = this.gap < 8 ? 2 : this.gap < CFG.threatVisibleGap ? 1 : 0;
    this.ui.setThreat(lvl, this.pursuerKind);
    this.ui.updateHUD(this.gems, this.distance, this.score());

    const nearT = clamp((CFG.threatVisibleGap - this.gap) / (CFG.threatVisibleGap - CFG.catchGap), 0, 1);
    this.audio.setIntensity(nearT * 0.75 + this.speedNorm() * 0.25);

    if (this.distance >= this.nextMilestone) {
      this.ui.toast(`${this.nextMilestone} m · 继续跑`, 1300);
      this.audio.milestone();
      this.nextMilestone += CFG.milestoneStep;
    }
  }

  speedNorm() {
    return clamp(
      (this.speed - CFG.speedStart) / (CFG.speedMaxLate - CFG.speedStart),
      0,
      1
    );
  }

  score() {
    return Math.floor(this.distance) + this.gems * CFG.scorePerGem;
  }

  updateCrocRun(dt) {
    const c = this.croc;
    if (!c) return;
    const yuuka = this.pursuerKind === 'yuuka';
    if (this.crocRevealT > 0) this.crocRevealT = Math.max(0, this.crocRevealT - dt);
    const reveal = this.crocRevealT > 0;
    // 0 = 刚脱离追击（远、小），1 = 马上就要被咬到（近、大）
    const showT = clamp(
      (CFG.threatVisibleGap - this.gap) / (CFG.threatVisibleGap - CFG.catchGap),
      0,
      1
    );
    const show = reveal || showT > 0;
    const far = yuuka ? CFG.yuukaChaseFarScale : CFG.crocChaseFarScale;
    const near = yuuka ? CFG.yuukaChaseNearScale : CFG.crocChaseNearScale;
    const targetScale = far + showT * (near - far);
    // 远时贴右边缘探个头，近时压到身边——距离感主要靠缩放和横向位移
    const targetZ = (yuuka ? 2.5 : 2.35) - showT * 1.2;
    const lateralFar = yuuka ? 1.15 : 1.7;
    const lateralNear = yuuka ? 0.85 : 1.0;
    const targetX =
      this.player.x * 0.8 +
      (lateralFar + (lateralNear - lateralFar) * showT) +
      Math.sin(this.time * 2.1) * 0.04;
    c.group.position.x += (targetX - c.group.position.x) * Math.min(1, dt * 5);
    c.group.position.z += (targetZ - c.group.position.z) * Math.min(1, dt * 4);
    const targetYaw = yuuka
      ? 0
      : clamp(0.3 + (c.group.position.x - this.player.x) * 0.08, 0.12, 0.48);
    c.group.rotation.y += (targetYaw - c.group.rotation.y) * Math.min(1, dt * 5);
    const curScale = c.group.scale.x;
    c.group.scale.setScalar(curScale + (targetScale - curScale) * Math.min(1, dt * 3));
    c.group.visible = show;
    c.setMode('run');
    c.setDanger(1 - showT);
    this.placeCrocShadow(c.group.scale.x);
    if (this.angry) {
      this.angry.visible = show && this.gap < 12;
      const s = 1 + Math.sin(this.time * 10) * 0.08;
      this.angry.scale.setScalar((yuuka ? 0.46 : 0.55) * s);
    }
  }

  checkCollisions() {
    const p = this.player;
    if (!p) return;

    for (let i = this.props.obstacles.length - 1; i >= 0; i--) {
      const o = this.props.obstacles[i];
      if (Math.abs(o.z) > o.halfD + 0.45) continue;
      if (Math.abs(o.x - p.x) > o.halfW + 0.38) continue;
      const footY = p.y;
      const headY = p.y + (p.sliding > 0 ? 0.78 : CFG.playerHeight * 0.95);
      if (o.yMin < headY && o.yMax > footY + 0.02) {
        this.stumble(o);
        break;
      }
    }

    for (let i = this.props.gems.length - 1; i >= 0; i--) {
      const g = this.props.gems[i];
      if (g.taken) continue;
      if (Math.abs(g.z) > 0.95) continue;
      const dx = g.x - p.x;
      const dy = g.y - (p.y + 0.75);
      if (dx * dx + dy * dy < 1.15 * 1.15) this.collect(g);
    }
  }

  collect(gem) {
    const value = gem.big ? CFG.bigGemValue : CFG.gemValue;
    this.gems += value;
    this.audio.pickup(gem.big);
    this.props.burstGem(gem);
    this.ui.updateHUD(this.gems, this.distance);
    if (gem.big) this.ui.toast(`青辉石 ×${value}！`, 900);
  }

  stumble(o) {
    const p = this.player;
    if (!p || p.invuln > 0 || this.state !== STATE.RUN) return;
    p.invuln = CFG.invuln;
    p.rig.stopAll();
    p.rig.playOnce(p.rig.clips.panic, {
      fade: 0.08,
      onDone: () => {
        if (this.state === STATE.RUN && this.player) this.player.rig.playLoop(this.player.rig.clips.run, 0.18);
      },
    });
    this.gap = Math.max(CFG.catchGap, this.gap - CFG.gapPerHit);
    this.penaltyT = CFG.penaltyDur;
    this.shake = Math.max(this.shake, 0.3);
    this.audio.hit();
    this.ui.shake();
    this.crocRevealT = 2.8;
    const name = this.pursuerKind === 'yuuka' ? '优香' : '机器鳄鱼';
    this.ui.toast('撞到了！' + name + '追近了！', 1200);
    if (this.croc) {
      this.croc.snap(0.55);
    }
    this.ui.setThreat(this.gap < 8 ? 2 : 1, this.pursuerKind);
    if (this.gap <= CFG.catchGap + 0.05) this.beginCatch();
  }

  beginCatch() {
    if (this.state !== STATE.RUN) return;
    this.state = STATE.CATCH;
    this.catchT = 0;
    this.gap = CFG.catchGap;
    this.camMode = 'catch';
    // 清掉路上的道具，避免被抓住时镜头前飘着栏杆
    this.props.reset();
    this.speechSeq += 1;
    this.audio.stopVoice();
    this.ui.hideSpeech();
    this.audio.caught();
    this.audio.setMusicPaused(true);
    this.ui.setCatch(true);
    this.ui.setThreat(0, this.pursuerKind);
    this.ui.toast(this.pursuerKind === 'yuuka' ? '被优香抓住了！' : '被机器鳄鱼追上了！', 1500);
    const p = this.player;
    if (p) {
      p.rig.model.visible = true;
      p.rig.stopAll();
      p.rig.playOnce(p.rig.clips.death, { timeScale: 0.85 });
    }
    if (this.croc) {
      this.croc.group.visible = true;
      this.croc.setMode('catch');
      this.croc.setDanger(1);
      this.croc.snap(0.8);
    }
    this.shake = 0.5;
  }

  catchUpdate(dt) {
    this.catchT += dt;
    const p = this.player;
    if (p) {
      p.y += (0 - p.y) * Math.min(1, dt * 5);
      p.rig.group.position.y = p.y;
      p.tilt += (0 - p.tilt) * Math.min(1, dt * 8);
      p.rig.setTilt(p.tilt);
    }
    const c = this.croc;
    if (c && p) {
      const k = Math.min(1, dt * 4.2);
      // 鳄鱼停在角色身后，头部顶到背心位置
      c.group.position.x += (p.x + 0.15 - c.group.position.x) * k;
      c.group.position.z += (2.6 - c.group.position.z) * k;
      const targetYaw =
        this.pursuerKind === 'yuuka'
          ? 0
          : clamp(0.14 + (c.group.position.x - p.x) * 0.06, 0.05, 0.3);
      c.group.rotation.y += (targetYaw - c.group.rotation.y) * k;
      const catchScale =
        this.pursuerKind === 'yuuka' ? CFG.yuukaCatchScale : CFG.crocCatchScale;
      const s = c.group.scale.x;
      c.group.scale.setScalar(s + (catchScale - s) * k);
      c.group.visible = true;
      c.setMode('catch');
      c.setDanger(1);
      this.placeCrocShadow(c.group.scale.x);
    }
    if (this.angry) this.angry.visible = false;
    this.ui.setThreat(0, this.pursuerKind);
    this.shake = Math.max(this.shake, 0.1);
    if (this.catchT > 2.0) this.finishRun();
  }

  finishRun() {
    this.state = STATE.OVER;
    this.speechSeq += 1;
    this.audio.stopVoice();
    this.ui.hideSpeech();
    const dist = Math.floor(this.distance);
    const score = this.score();
    const isNew = score > this.best.score;
    if (isNew) this.saveBest({ score, gems: this.gems, dist });
    this.ui.showOver({ gems: this.gems, dist, score }, this.best.score, isNew, this.pursuerKind);
    this.ui.setBest(this.best.score);
    this.ui.setThreat(0, this.pursuerKind);
    this.audio.setIntensity(0);
    if (this.croc) this.croc.setMode('idle');
  }

  updateCamera(dt) {
    const t = this.time;
    let px = 0;
    let py = 0;
    if (this.player) {
      px = this.player.x;
      py = this.player.y;
    }
    let tx;
    let ty;
    let tz;
    let lx;
    let ly;
    let lz;
    let fov;
    const portrait = this.camera.aspect < 0.9;
    if (this.state === STATE.MENU || this.state === STATE.LOADING) {
      tx = 2.5 + Math.sin(t * 0.4) * 0.2;
      ty = 2.0 + Math.sin(t * 0.9) * 0.03;
      tz = -5.2;
      lx = -0.2 + Math.sin(t * 0.4) * 0.1;
      ly = 1.05;
      lz = 1.6;
      fov = 46;
      if (portrait) {
        // 竖屏时面板占了下半屏，把机位压低视线，让角色落在面板上方
        ty = 2.35;
        ly = -0.98;
        lz = 1.9;
        fov = 50;
      }
    } else if (this.state === STATE.CATCH || this.state === STATE.OVER) {
      // 反过来从正面拍：角色在前景，鳄鱼从身后压上来
      tx = px - 2.55;
      ty = 1.5;
      tz = -2.35;
      lx = px + 0.15;
      ly = 0.95;
      lz = 0.75;
      fov = portrait ? 58 : 52;
    } else {
      const speedNorm = this.speedNorm();
      tx = px * 0.3;
      ty = 3.35 + py * 0.15;
      tz = 8.2;
      lx = px * 0.55;
      ly = 1.1 + py * 0.22;
      lz = -8;
      fov = 48 + speedNorm * 8;
      if (portrait) {
        ty = 4.15 + py * 0.15;
        tz = 9.9;
        fov = 57 + speedNorm * 6;
      }
    }

    const kp = 1 - Math.exp(-5.5 * dt);
    const kl = 1 - Math.exp(-8 * dt);
    this.camPos.x += (tx - this.camPos.x) * kp;
    this.camPos.y += (ty - this.camPos.y) * kp;
    this.camPos.z += (tz - this.camPos.z) * kp;
    this.camLook.x += (lx - this.camLook.x) * kl;
    this.camLook.y += (ly - this.camLook.y) * kl;
    this.camLook.z += (lz - this.camLook.z) * kl;

    this.camera.position.copy(this.camPos);
    if (this.shake > 0.001) {
      this.camera.position.x += (Math.random() - 0.5) * this.shake;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.7;
      this.shake *= Math.exp(-2.6 * dt);
    }
    this.camera.lookAt(this.camLook);
    const kf = 1 - Math.exp(-4 * dt);
    this.camera.fov += (fov - this.camera.fov) * kf;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
    this.updateSpeechAnchor();
  }

  spawnRow() {
    const Z = CFG.spawnZ;
    const d = this.distance;
    const rndLane = () => Math.floor(Math.random() * 3);
    const patterns = [];
    const add = (name, w) => {
      if (w > 0) patterns.push({ name, w });
    };

    if (d < 130) {
      add('gems', 26);
      add('low1', 74);
    } else if (d < 280) {
      add('gems', 12);
      add('low1', 34);
      add('low2', 20);
      add('high1', 34);
    } else if (d < 520) {
      add('gems', 8);
      add('low1', 14);
      add('low2', 8);
      add('high1', 16);
      add('block1', 18);
      add('mix1', 18);
      add('block2', 8);
      add('high2', 10);
    } else {
      add('gems', 8);
      add('low2', 8);
      add('high2', 8);
      add('block1', 12);
      add('block2', 12);
      add('mix1', 14);
      add('mix2', 14);
      add('tunnel', 12);
      add('jumpAll', 12);
    }

    const total = patterns.reduce((s, p) => s + p.w, 0);
    let roll = Math.random() * total;
    let name = patterns[0].name;
    for (const p of patterns) {
      roll -= p.w;
      if (roll <= 0) {
        name = p.name;
        break;
      }
    }

    const otherLane = (a, b = -1) => [0, 1, 2].find((l) => l !== a && l !== b);
    const laneGemLine = (lane, count = 4, startOffset = 0, y = 0.9) => {
      for (let i = 0; i < count; i++) {
        this.props.spawnGem(LANES[lane], y, Z - startOffset - i * 2.4);
      }
    };
    const arc = (lane, y = 1.4, count = 3) => {
      for (let i = 0; i < count; i++) {
        const off = (i - (count - 1) / 2) * 1.5;
        this.props.spawnGem(LANES[lane], y, Z + off);
      }
    };

    switch (name) {
      case 'gems': {
        const lane = rndLane();
        const count = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          if (i === 2 && Math.random() < 0.18) this.props.spawnGem(LANES[lane], 1.0, Z - i * 2.4, true);
          else this.props.spawnGem(LANES[lane], 0.9, Z - i * 2.4);
        }
        break;
      }
      case 'low1': {
        const lane = rndLane();
        this.props.spawnObstacle('low', lane, Z);
        arc(lane);
        break;
      }
      case 'low2': {
        const a = rndLane();
        const b = otherLane(a);
        this.props.spawnObstacle('low', a, Z);
        this.props.spawnObstacle('low', b, Z);
        arc(a);
        laneGemLine(otherLane(a, b), 3);
        break;
      }
      case 'high1': {
        const lane = rndLane();
        this.props.spawnObstacle('high', lane, Z);
        this.props.spawnGem(LANES[lane], 0.45, Z - 1.2);
        this.props.spawnGem(LANES[lane], 0.45, Z + 1.2);
        laneGemLine(otherLane(lane), 3);
        break;
      }
      case 'high2': {
        const a = rndLane();
        const b = otherLane(a);
        this.props.spawnObstacle('high', a, Z);
        this.props.spawnObstacle('high', b, Z);
        this.props.spawnGem(LANES[a], 0.45, Z);
        laneGemLine(otherLane(a, b), 4);
        break;
      }
      case 'block1': {
        const lane = rndLane();
        this.props.spawnObstacle('block', lane, Z);
        laneGemLine(otherLane(lane), 4);
        break;
      }
      case 'block2': {
        const a = rndLane();
        const b = otherLane(a);
        this.props.spawnObstacle('block', a, Z);
        this.props.spawnObstacle('block', b, Z);
        laneGemLine(otherLane(a, b), 4);
        break;
      }
      case 'mix1': {
        const a = rndLane();
        const b = otherLane(a);
        this.props.spawnObstacle('low', a, Z);
        this.props.spawnObstacle('high', b, Z);
        arc(a);
        this.props.spawnGem(LANES[b], 0.45, Z);
        laneGemLine(otherLane(a, b), 3);
        break;
      }
      case 'mix2': {
        const a = rndLane();
        const b = otherLane(a);
        this.props.spawnObstacle('block', a, Z);
        this.props.spawnObstacle('low', b, Z);
        arc(b);
        laneGemLine(otherLane(a, b), 3);
        break;
      }
      case 'tunnel': {
        for (let lane = 0; lane < 3; lane++) {
          this.props.spawnObstacle('high', lane, Z);
          this.props.spawnGem(LANES[lane], 0.45, Z);
          this.props.spawnGem(LANES[lane], 0.45, Z - 2.2);
        }
        break;
      }
      case 'jumpAll': {
        for (let lane = 0; lane < 3; lane++) {
          this.props.spawnObstacle('low', lane, Z);
          arc(lane);
        }
        break;
      }
      default:
        break;
    }
  }
}
