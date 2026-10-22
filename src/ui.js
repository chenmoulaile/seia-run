import { CHARACTERS } from './models.js';

const PURSUER_COPY = {
  croc: {
    name: '机器鳄鱼',
    sub: '千年博览会 · 安保终端',
    tagline: '博览会限定追逐赛，现在开跑。',
    quote: '“目标锁定：博览会逃逸者。青辉石回收程序启动。”',
    story:
      '博览会开幕当天，展台的机械鳄鱼突然暴走，见人就追。你抱着刚领到的青辉石纪念品冲上大街——别回头，别停下，跑！',
    stage: '点击学生或机器鳄鱼互动 · 它正在待机…',
    overTag: '被 咬 住 了',
    overTitle: '博览会，下次再来吧。',
    overIcon: '/assets/robot_croc_icon.svg',
    overQuotes: [
      '“青辉石回收完成。请返回展台领取纪念品。”',
      '“本机已记录你的逃跑路线。下次请走人行道。”',
      '“检测到悔改意愿：0%。请继续跑。”',
      '“展览时间已结束。你的成绩单已上传。”',
      '“本机不是宠物。本机是博览会安保终端。”',
    ],
    record: 'NEW RECORD · 机器鳄鱼记住你了',
  },
  yuuka: {
    name: '早濑优香',
    sub: '千年 · 研讨会',
    tagline: '优香的说教，追在身后。',
    quote: '“老师！逃跑解决不了任何问题！”',
    story:
      '你偷偷报名了千年博览会的街头逃跑大赛，还瞒着所有人。优香发现后气冲冲地追来，要把你带回研讨会——被抓到的话，肯定要听很久的说教。',
    stage: '点击学生或优香互动 · 她正在等一个解释…',
    overTag: '被 抓 住 了',
    overTitle: '优香，正在说教中。',
    overIcon: '/assets/avatars/yuuka.webp',
    overQuotes: [
      '“老师，逃跑解决不了任何问题。”',
      '“请解释一下，为什么你会出现在赛道上。”',
      '“这次的说教，至少三十四句。”',
      '“计算完毕。你的逃跑效率，不合格。”',
      '“下次再偷偷报名，我可不会只追这么短。”',
    ],
    record: 'NEW RECORD · 优香记住你了',
  },
};

const byId = (id) => document.getElementById(id);

const isPortrait = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 620px) and (orientation: portrait)').matches;

export class UI {
  constructor() {
    this.el = {
      start: byId('screen-start'),
      pause: byId('screen-pause'),
      over: byId('screen-over'),
      hud: byId('hud'),
      countdown: byId('countdown'),
      countdownText: byId('countdown-text'),
      startBtn: byId('btn-start'),
      charRow: byId('char-row'),
      bestStart: byId('best-start'),
      pauseBtn: byId('btn-pause'),
      threat: byId('threat'),
      threatText: byId('threat-text'),
      hudGems: byId('hud-gems'),
      hudDist: byId('hud-dist'),
      hudScore: byId('hud-score'),
      swipeHint: byId('swipe-hint'),
      toast: byId('toast'),
      hudBar: document.querySelector('.hud-bar'),
      overQuote: byId('over-quote'),
      statGems: byId('stat-gems'),
      statDist: byId('stat-dist'),
      statScore: byId('stat-score'),
      newRecord: byId('new-record'),
      bestOver: byId('best-over'),
      soundBtn: byId('btn-sound'),
      speech: byId('speech'),
      speechName: byId('speech-name'),
      speechText: byId('speech-text'),
      pursuerImg: byId('pursuer-img'),
      pursuerName: byId('pursuer-name'),
      pursuerSub: byId('pursuer-sub'),
      pursuerState: byId('pursuer-state'),
      storyQuote: byId('story-quote'),
      storySub: byId('story-sub'),
      tagline: byId('tagline'),
      stageHint: byId('stage-hint'),
      overAvatar: byId('over-avatar'),
      overTag: byId('over-tag'),
      overTitle: byId('over-title'),
    };
    this.handlers = {};
    this.cards = new Map();
    this.toastTimer = null;
    this.speechTimer = null;
    this.threatLevel = -1;
    this.threatKind = 'croc';
    this.pursuerKind = 'croc';
    this.buildRoster();
    this.bind();
    this.setPursuer('croc');
  }

  on(name, fn) {
    this.handlers[name] = fn;
    return this;
  }

  fire(name, ...args) {
    const fn = this.handlers[name];
    if (fn) fn(...args);
  }

  buildRoster() {
    const frag = document.createDocumentFragment();
    for (const def of CHARACTERS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-card';
      btn.style.setProperty('--accent', def.accent);
      btn.title = def.blurb;
      btn.dataset.id = def.id;
      btn.setAttribute('aria-label', `${def.name}${def.variant ? ` ${def.variant}` : ''}`);
      const pick = document.createElement('span');
      pick.className = 'char-pick';
      const img = document.createElement('img');
      img.src = def.icon;
      img.alt = def.name;
      img.draggable = false;
      const name = document.createElement('b');
      name.textContent = def.name;
      const tag = document.createElement('span');
      tag.className = 'char-tag';
      // 同一角色的多个版本优先显示「泳装 / 礼服」，否则显示学校，避免列表里出现 4 个一样的「日奈」
      tag.textContent = def.variant || def.tag;
      btn.append(pick, img, name, tag);
      if (def.variant) {
        const variant = document.createElement('span');
        variant.className = 'char-variant';
        variant.textContent = def.variant;
        btn.appendChild(variant);
      }
      btn.addEventListener('click', () => {
        this.fire('select', def.id);
      });
      this.cards.set(def.id, btn);
      frag.appendChild(btn);
    }
    this.el.charRow.appendChild(frag);
  }

  bind() {
    this.el.startBtn.addEventListener('click', () => this.fire('start'));
    this.el.pauseBtn.addEventListener('click', () => this.fire('pause'));
    byId('btn-resume').addEventListener('click', () => this.fire('resume'));
    byId('btn-restart').addEventListener('click', () => this.fire('restart'));
    byId('btn-home').addEventListener('click', () => this.fire('home'));
    byId('btn-sound').addEventListener('click', () => this.fire('mute'));
    byId('btn-again').addEventListener('click', () => this.fire('start'));
    byId('btn-back').addEventListener('click', () => this.fire('home'));
  }

  setCharacter(id) {
    for (const [cid, card] of this.cards) card.classList.toggle('selected', cid === id);
    const card = this.cards.get(id);
    if (card && this.el.charRow) {
      const row = this.el.charRow;
      const left = card.offsetLeft - (row.clientWidth - card.offsetWidth) * 0.5;
      row.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }
  }

  setPursuer(kind) {
    const copy = PURSUER_COPY[kind] || PURSUER_COPY.croc;
    this.pursuerKind = kind === 'yuuka' ? 'yuuka' : 'croc';
    this.threatLevel = -1;
    document.body.dataset.pursuer = this.pursuerKind;
    if (this.el.pursuerImg) this.el.pursuerImg.src = copy.overIcon;
    if (this.el.pursuerName) this.el.pursuerName.textContent = copy.name;
    if (this.el.pursuerSub) this.el.pursuerSub.textContent = copy.sub;
    if (this.el.pursuerState) this.el.pursuerState.textContent = '追击中';
    if (this.el.storyQuote) this.el.storyQuote.textContent = copy.quote;
    if (this.el.storySub) this.el.storySub.textContent = copy.story;
    if (this.el.tagline) this.el.tagline.textContent = copy.tagline;
    if (this.el.stageHint) {
      this.el.stageHint.textContent = isPortrait()
        ? '点击角色可互动 · 听她说句话'
        : copy.stage;
    }
    if (this.el.overAvatar) this.el.overAvatar.src = copy.overIcon;
    if (this.el.overTag) this.el.overTag.textContent = copy.overTag;
    if (this.el.overTitle) this.el.overTitle.textContent = copy.overTitle;
    if (this.el.newRecord) this.el.newRecord.textContent = copy.record;
  }

  setStartProgress(p) {
    const pct = Math.round(Math.max(0, Math.min(1, p)) * 100);
    this.el.startBtn.textContent = `正在加载模型 ${pct}%`;
  }

  setReady(ready, label = '开始逃跑') {
    this.el.startBtn.disabled = !ready;
    this.el.startBtn.textContent = ready ? label : '正在加载模型…';
  }

  setBusy(label) {
    this.el.startBtn.disabled = true;
    this.el.startBtn.textContent = label;
  }

  setBest(score) {
    const text = score > 0 ? score.toLocaleString('zh-CN') : '—';
    this.el.bestStart.textContent = text;
  }

  setMuted(muted) {
    this.el.soundBtn.textContent = `音效：${muted ? '关' : '开'}`;
  }

  showSpeech(name, text, accent, durationMs = 0) {
    if (!this.el.speech) return;
    this.el.speechName.textContent = name;
    this.el.speechText.textContent = text;
    this.el.speech.style.setProperty('--speech-accent', accent || '#3d7bfd');
    this.el.speech.setAttribute('aria-hidden', 'false');
    this.el.speech.classList.add('show');
    clearTimeout(this.speechTimer);
    const fallback = Math.max(3600, Math.min(11000, 2200 + text.length * 110));
    const duration = durationMs > 0 ? durationMs : fallback;
    this.speechTimer = setTimeout(() => this.hideSpeech(), duration);
  }

  hideSpeech() {
    if (!this.el.speech) return;
    clearTimeout(this.speechTimer);
    this.speechTimer = null;
    this.el.speech.classList.remove('show');
    this.el.speech.setAttribute('aria-hidden', 'true');
  }

  positionSpeech(x, y) {
    if (!this.el.speech) return;
    const width = this.el.speech.offsetWidth || 280;
    const height = this.el.speech.offsetHeight || 90;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panel = this.el.start && this.el.start.querySelector('.panel');
    const panelOpen = panel && !this.el.start.classList.contains('hidden');
    const panelRight = panelOpen ? panel.getBoundingClientRect().right : 0;
    const minX = panelOpen ? panelRight + width / 2 + 10 : width / 2 + 12;
    const maxX = vw - width / 2 - 12;
    const center = Math.min(maxX, Math.max(minX, x));
    const left = center - width / 2;
    const top = Math.max(height + 14, Math.min(vh - 14, y));
    const tail = Math.max(16, Math.min(width - 16, x - left));
    this.el.speech.style.left = `${center}px`;
    this.el.speech.style.top = `${top}px`;
    this.el.speech.style.setProperty('--tail-x', `${tail}px`);
  }

  showMenu() {
    this.el.start.classList.remove('hidden');
    this.el.pause.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.hud.classList.add('hidden');
    this.hideCountdown();
    this.el.toast.classList.remove('show');
    document.body.classList.remove('caught');
  }

  showGame() {
    this.el.start.classList.add('hidden');
    this.el.pause.classList.add('hidden');
    this.el.over.classList.add('hidden');
    this.el.hud.classList.remove('hidden');
    this.setThreat(0, this.pursuerKind);
  }

  showPause() {
    this.el.pause.classList.remove('hidden');
  }

  hidePause() {
    this.el.pause.classList.add('hidden');
  }

  showOver(stats, best, isNew, kind = 'croc') {
    const copy = PURSUER_COPY[kind] || PURSUER_COPY.croc;
    this.el.overQuote.textContent = copy.overQuotes[Math.floor(Math.random() * copy.overQuotes.length)];
    this.el.overAvatar.src = copy.overIcon;
    this.el.overTag.textContent = copy.overTag;
    this.el.overTitle.textContent = copy.overTitle;
    this.el.newRecord.textContent = copy.record;
    this.el.statGems.textContent = stats.gems.toLocaleString('zh-CN');
    this.el.statDist.textContent = `${Math.floor(stats.dist).toLocaleString('zh-CN')}m`;
    this.el.statScore.textContent = stats.score.toLocaleString('zh-CN');
    this.el.bestOver.textContent = Math.max(best, stats.score).toLocaleString('zh-CN');
    this.el.newRecord.classList.toggle('hidden', !isNew);
    this.el.over.classList.remove('hidden');
    this.el.hud.classList.add('hidden');
    this.hideCountdown();
    this.setCatch(false);
  }

  updateHUD(gems, dist, score = 0) {
    this.el.hudGems.textContent = gems.toLocaleString('zh-CN');
    this.el.hudDist.textContent = Math.floor(dist).toLocaleString('zh-CN');
    if (this.el.hudScore) this.el.hudScore.textContent = Math.floor(score).toLocaleString('zh-CN');
  }

  showSwipeHint(ms = 4200) {
    const el = this.el.swipeHint;
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.add('show');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.classList.add('hidden'), 320);
    }, ms);
  }

  hideSwipeHint() {
    const el = this.el.swipeHint;
    if (!el) return;
    clearTimeout(this.hintTimer);
    el.classList.add('hidden');
    el.classList.remove('show');
  }

  setThreat(level, kind = this.pursuerKind) {
    if (level === this.threatLevel && kind === this.threatKind) return;
    this.threatLevel = level;
    this.threatKind = kind;
    if (level <= 0) {
      this.el.threat.classList.add('hidden');
      return;
    }
    const name = kind === 'yuuka' ? '优香' : '机器鳄鱼';
    this.el.threat.classList.remove('hidden');
    this.el.threat.classList.toggle('danger', level >= 2);
    this.el.threatText.textContent = level >= 2 ? `快跑！${name}就在身后！` : `${name}正在逼近…`;
  }

  toast(msg, ms = 1700) {
    const el = this.el.toast;
    el.textContent = msg;
    el.classList.add('show');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      el.classList.remove('show');
      this.toastTimer = null;
    }, ms);
  }

  countdown(label) {
    const el = this.el.countdown;
    el.classList.remove('hidden');
    const text = this.el.countdownText;
    text.textContent = String(label);
    text.style.animation = 'none';
    void text.offsetHeight;
    text.style.animation = '';
  }

  hideCountdown() {
    this.el.countdown.classList.add('hidden');
  }

  shake() {
    const bar = this.el.hudBar;
    if (!bar) return;
    bar.classList.remove('shake');
    void bar.offsetWidth;
    bar.classList.add('shake');
    setTimeout(() => bar.classList.remove('shake'), 380);
  }

  setCatch(on) {
    document.body.classList.toggle('caught', on);
  }
}
