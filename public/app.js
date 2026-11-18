'use strict';
/* TokenSpeed · 前端（扁平矢量版） */
(() => {
  const locale = window.TokenSpeedLocale;
  const { t: translate, localizeError } = locale;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const now = () => performance.now();
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CS = getComputedStyle(document.documentElement);
  const sans = CS.getPropertyValue('--sans').trim();
  const COL = {};
  ['ink', 'muted', 'tint', 'soft', 'card', 'bg', 'c1', 'z1', 'z2', 'z3'].forEach((k) => (COL[k] = CS.getPropertyValue('--' + k).trim()));
  const LANE_KEYS = ['c1', 'z1', 'z2', 'z3'];
  const laneVar = (i) => `var(--${LANE_KEYS[i % 4]})`;
  const laneCol = (i) => COL[LANE_KEYS[i % 4]];

  const PROVIDERS = [
    { id: 'custom', name: '自定义 / 自部署', base: '', model: '' },
    { id: 'deepseek', name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', key: 'https://platform.deepseek.com/api_keys' },
    { id: 'kimi', name: 'Kimi', base: 'https://api.moonshot.cn/v1', model: 'kimi-k2-0905-preview', key: 'https://platform.moonshot.cn/console/api-keys' },
    { id: 'qwen', name: '通义千问', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', key: 'https://bailian.console.aliyun.com/?apiKey=1' },
    { id: 'glm', name: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4.6', key: 'https://open.bigmodel.cn/usercenter/apikeys' },
    { id: 'sf', name: '硅基流动', base: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/DeepSeek-V3', key: 'https://cloud.siliconflow.cn/account/ak' },
    { id: 'ark', name: '火山方舟', base: 'https://ark.cn-beijing.volces.com/api/v3', model: '', key: 'https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey' },
    { id: 'openai', name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', key: 'https://platform.openai.com/api-keys' },
    { id: 'claude', name: 'Claude', base: 'https://api.anthropic.com', format: 'anthropic', model: 'claude-sonnet-5-5', key: 'https://console.anthropic.com/settings/keys' },
    { id: 'openrouter', name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: '', key: 'https://openrouter.ai/keys' },
  ];

  // ---------------- 工具
  const fmt = (v, d) => {
    if (v == null || !Number.isFinite(v)) return '—';
    if (d != null) return v.toLocaleString(locale.language, { maximumFractionDigits: d, minimumFractionDigits: d });
    if (Math.abs(v) >= 100) return Math.round(v).toLocaleString(locale.language);
    if (Math.abs(v) >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };
  const fmtK = (v) => (v == null ? '—' : v >= 1000 ? +(v / 1000).toFixed(v >= 10000 ? 0 : 1) + 'K' : String(Math.round(v)));
  const fmtTok = (v) => (v == null ? '—' : v >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : v >= 1000 ? +(v / 1000).toFixed(1) + 'K' : String(Math.round(v || 0)));
  const fmtMeasured = (value, estimate) => value == null && estimate != null ? '≈' + fmt(estimate, 1) : fmt(value, 1);
  const fmtRate = (value, estimate) => value == null && estimate == null
    ? translate('不可用') : `${fmtMeasured(value, estimate)} tok/s`;
  let fmtUsage = new Intl.NumberFormat(locale.language, { notation: 'compact', maximumFractionDigits: 1 });
  const fmtS = (ms) => (ms == null ? '—' : ms >= 1000 ? (ms / 1000).toFixed(2) + translate(' 秒') : Math.round(ms) + translate(' 毫秒'));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const host = (u) => {
    if (u === 'demo') return translate('演示服务（模拟数据）');
    try {
      return new URL(u).host;
    } catch (_) {
      return u;
    }
  };
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : JSON.parse(v);
      } catch (_) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
      } catch (_) {}
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch (_) {}
    },
  };
  const html = (el, h) => {
    if (el._h !== h) {
      el._h = h;
      el.innerHTML = h;
    }
  };
  const anim = (el, kf, o) => (still || !el || !el.animate ? null : el.animate(kf, o));

  let toastT;
  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'toast show' + (err ? ' err' : '');
    clearTimeout(toastT);
    toastT = setTimeout(() => (t.className = 'toast' + (err ? ' err' : '')), err ? 6000 : 2400);
  }

  // ---------------- 音效（需要用户点击后才能播放）
  let ac = null;
  let soundOn = store.get('ts3.sound', false);
  const ensureAudio = () => {
    if (!soundOn || ac) return;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch (_) {
      ac = null;
    }
  };
  const beep = (f, d = 0.08, type = 'square', vol = 0.05, delay = 0) => {
    if (!ac || !soundOn) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t);
    o.stop(t + d + 0.02);
  };
  const SFX = {
    tick: () => beep(1200, 0.03, 'square', 0.02),
    up: () => (beep(523, 0.09, 'square', 0.05), beep(784, 0.14, 'square', 0.05, 0.08)),
    boom: () => (beep(90, 0.3, 'sawtooth', 0.08), beep(660, 0.12, 'square', 0.04, 0.05), beep(990, 0.18, 'square', 0.04, 0.13)),
    stamp: () => (beep(70, 0.25, 'sawtooth', 0.1), beep(140, 0.12, 'square', 0.05)),
  };
  const syncSoundBtn = () => {
    $('#btnSound').classList.toggle('on', soundOn);
    $('#btnSound span').textContent = soundOn ? translate('音效开') : translate('音效');
  };
  $('#btnSound').addEventListener('click', () => {
    soundOn = !soundOn;
    store.set('ts3.sound', soundOn);
    ensureAudio();
    syncSoundBtn();
    if (soundOn) SFX.up();
  });
  syncSoundBtn();

  // ---------------- 仪表：20 块分段半圆 + 弹簧指针 + 拖影
  const G = (() => {
    const cx = 160, cy = 166, RO = 150, RI = 108, N = 20, A0 = 180, SW = 180;
    const pt = (deg, r) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
    const f1 = (n) => n.toFixed(1);
    const sector = (a0, a1) => {
      const [x0, y0] = pt(a0, RO), [x1, y1] = pt(a1, RO), [x2, y2] = pt(a1, RI), [x3, y3] = pt(a0, RI);
      return `M${f1(x0)} ${f1(y0)}A${RO} ${RO} 0 0 1 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${RI} ${RI} 0 0 0 ${f1(x3)} ${f1(y3)}Z`;
    };
    const needle = `${cx},${cy - 7} ${cx + RI - 6},${cy} ${cx},${cy + 7}`;
    let h = '';
    for (let i = 0; i < N; i++) h += `<path class="seg-a ${i < 8 ? 'z1' : i < 14 ? 'z2' : 'z3'}" d="${sector(A0 + (SW * i) / N + 2, A0 + (SW * (i + 1)) / N - 2)}"/>`;
    h += `<g id="dLbls"></g>${'<polygon class="needle ghost" points="' + needle + '"/>'.repeat(3)}<polygon class="needle" id="needle" points="${needle}"/><circle class="hub" cx="${cx}" cy="${cy}" r="14"/><circle class="hub-dot" cx="${cx}" cy="${cy}" r="5"/>`;
    $('#dial').innerHTML = h;
    const segs = $$('.seg-a'), nd = $('#needle'), ghosts = $$('.needle.ghost'), gHist = [];
    [nd, ...ghosts].forEach((n) => (n.style.transformOrigin = `${cx}px ${cy}px`));
    let scale = [0, 1], lbl = String, ang = 0, vel = 0, target = 0, lit = 0, scanning = false, scanI = 0, scanT = 0;
    const frac = (v) => {
      if (v <= 0) return 0;
      for (let i = 1; i < scale.length; i++) if (v <= scale[i]) return (i - 1 + (v - scale[i - 1]) / (scale[i] - scale[i - 1])) / (scale.length - 1);
      return 1;
    };
    const labels = () =>
      ($('#dLbls').innerHTML = scale
        .map((v, i) => {
          const [x, y] = pt(A0 + (SW * i) / (scale.length - 1), RI - 18);
          return `<text class="d-lbl" x="${f1(x)}" y="${f1(y + 4)}">${lbl(v)}</text>`;
        })
        .join(''));
    return {
      setScale(s, l) {
        scale = s.slice();
        lbl = l;
        ang = vel = target = 0;
        labels();
      },
      /** 设置目标值；超出刻度时整体升档（×2），返回是否升档 */
      target(v) {
        let up = false;
        while (v > scale[scale.length - 1] * 1.02) {
          scale = scale.map((x) => x * 2);
          up = true;
        }
        if (up) labels();
        target = frac(v);
        return up;
      },
      scan(on) {
        scanning = on;
        if (!on) segs.forEach((s) => s.classList.remove('scan'));
      },
      step(dt) {
        if (still) ang = target;
        else {
          // 刚性大、阻尼适中：指针几乎瞬间甩到位，再带一次短促回弹
          for (let s = 0; s < 4; s++) {
            const hh = dt / 4;
            const acc = 900 * (target - ang) - 38 * vel;
            vel += acc * hh;
            ang += vel * hh;
          }
          ang = Math.max(-0.015, Math.min(1.04, ang));
        }
        nd.style.transform = `rotate(${(A0 + SW * ang).toFixed(2)}deg)`;
        const sp = Math.min(1, Math.abs(vel) / 6);
        ghosts.forEach((g, k) => {
          gHist[k] = gHist[k] == null ? ang : gHist[k] + (ang - gHist[k]) * (0.55 - k * 0.12);
          g.style.transform = `rotate(${(A0 + SW * gHist[k]).toFixed(2)}deg)`;
          g.style.opacity = (sp * (0.45 - k * 0.12)).toFixed(2);
        });
        const n = Math.max(0, Math.min(N, Math.round(ang * N)));
        if (n !== lit) {
          segs.forEach((s, i) => {
            const on = i < n;
            if (on !== s.classList.contains('on')) {
              s.classList.toggle('on', on);
              if (on && n > lit) anim(s, [{ transform: 'scale(1.28)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
            }
          });
          if (n > lit) SFX.tick();
          lit = n;
        }
        if (scanning && !still) {
          scanT += dt;
          if (scanT > 0.06) {
            scanT = 0;
            segs[scanI % N].classList.remove('scan');
            scanI = (scanI + 1) % (N * 2);
            const k = scanI < N ? scanI : 2 * N - 1 - scanI;
            segs.forEach((s) => s.classList.remove('scan'));
            segs[k].classList.add('scan');
          }
        }
      },
      get ang() {
        return ang;
      },
    };
  })();

  // ---------------- 背景速度线
  const LINES = (() => {
    const cv = $('#lines');
    const items = [];
    let acc = 0;
    return (dt, f) => {
      const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
      if (!w) return;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const c = cv.getContext('2d');
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      if (still) return;
      acc += dt * (1 + f * 46);
      while (acc >= 1) {
        acc -= 1;
        items.push({ x: w + 40, y: Math.random() * h, len: 30 + Math.random() * 120 * (0.4 + f), th: 3 + Math.random() * 5, col: laneCol(Math.floor(Math.random() * 4)), k: 0.6 + Math.random() * 0.8 });
      }
      c.globalAlpha = 0.2;
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.x -= (120 + f * 1500) * it.k * dt;
        if (it.x + it.len < -10) {
          items.splice(i, 1);
          continue;
        }
        c.fillStyle = it.col;
        c.beginPath();
        if (c.roundRect) c.roundRect(it.x, it.y, it.len, it.th, it.th / 2);
        else c.rect(it.x, it.y, it.len, it.th);
        c.fill();
      }
      c.globalAlpha = 1;
    };
  })();

  // ---------------- 特效
  const confetti = (n = 22, power = 1) => {
    if (still) return;
    const fx = $('#fx');
    const shapes = ['c', '', 't', 'l'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('i');
      el.className = shapes[i % 4];
      el.style.background = laneCol(Math.floor(Math.random() * 4));
      fx.appendChild(el);
      const a = Math.random() * Math.PI * 2, d = (90 + Math.random() * 190) * power;
      el.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(0) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d * 0.7}px)) rotate(${(Math.random() - 0.5) * 720}deg) scale(.4)`, opacity: 0 },
        ],
        { duration: 650 + Math.random() * 400, easing: 'cubic-bezier(.15,.8,.3,1)' }
      ).onfinish = () => el.remove();
    }
  };
  const shake = (el, k = 1) => anim(el, [{ transform: 'none' }, { transform: `translate(${-2 * k}px, ${k}px)` }, { transform: `translate(${1.5 * k}px, ${-k}px)` }, { transform: 'none' }], { duration: 180, easing: 'ease-out' });
  const punch = (el, s = 1.25) => anim(el, [{ transform: `scale(${s})` }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.7,.5,1)' });
  (() => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const r = i % 2 ? 62 : 96, a = (i / 24) * Math.PI * 2;
      pts.push(`${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`);
    }
    $('#burstP').setAttribute('points', pts.join(' '));
  })();
  const burst = () => anim($('#burst'), [{ transform: 'scale(.2) rotate(0)', opacity: 1 }, { transform: 'scale(1.05) rotate(20deg)', opacity: 1, offset: 0.35 }, { transform: 'scale(1.15) rotate(30deg)', opacity: 0 }], { duration: 700, easing: 'ease-out' });

  // ---------------- 示波器
  const SC = (() => {
    const cv = $('#scCv');
    let buf = [], max = 100;
    const nice = (v) => {
      const p = Math.pow(10, Math.floor(Math.log10(v)));
      for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
      return 10 * p;
    };
    return {
      reset(m) {
        buf = [];
        max = nice(m);
      },
      push(v, b) {
        if (v > max * 0.95) max = nice(v * 1.4);
        buf.push([v, b]);
        while (buf.length > 300) buf.shift();
      },
      get max() {
        return max;
      },
      draw() {
        const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
        if (!w) return;
        if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
          cv.width = Math.round(w * dpr);
          cv.height = Math.round(h * dpr);
        }
        const c = cv.getContext('2d');
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.clearRect(0, 0, w, h);
        const left = 40, top = 12, bot = h - 30, step = (w - left - 10) / 300;
        c.font = `700 10px ${sans}`;
        c.textBaseline = 'middle';
        for (let k = 0; k <= 4; k++) {
          const v = (max * k) / 4, y = Math.round(bot - (v / max) * (bot - top)) + 0.5;
          c.strokeStyle = COL.tint;
          c.lineWidth = 2;
          c.setLineDash(k ? [6, 6] : []);
          c.beginPath();
          c.moveTo(left, y);
          c.lineTo(w - 10, y);
          c.stroke();
          c.fillStyle = COL.muted;
          c.fillText(fmtK(v), 8, y);
        }
        c.setLineDash([]);
        if (buf.length < 2) return;
        const x = (i) => w - 10 - (buf.length - 1 - i) * step, y = (v) => bot - (Math.min(v, max) / max) * (bot - top);
        const path = () => buf.forEach(([v], i) => (i ? c.lineTo(x(i), y(v)) : c.moveTo(x(i), y(v))));
        c.beginPath();
        path();
        c.lineTo(x(buf.length - 1), bot);
        c.lineTo(x(0), bot);
        c.closePath();
        c.fillStyle = COL.z1;
        c.globalAlpha = 0.5;
        c.fill();
        c.globalAlpha = 1;
        c.beginPath();
        path();
        c.strokeStyle = COL.ink;
        c.lineWidth = 3;
        c.lineJoin = 'round';
        c.stroke();
        c.fillStyle = COL.z3;
        buf.forEach(([, b], i) => {
          if (b) c.fillRect(Math.round(x(i)) - 1, h - 6 - b * 6, 3, b * 6);
        });
        const lx = x(buf.length - 1), ly = y(buf[buf.length - 1][0]);
        c.fillStyle = COL.z2;
        c.strokeStyle = COL.ink;
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(lx - 2, ly, 6, 0, Math.PI * 2);
        c.fill();
        c.stroke();
      },
    };
  })();

  // ---------------- 配置
  const F = {
    base: $('#fBase'), key: $('#fKey'), model: $('#fModel'), extra: $('#fExtra'),
    runPrefill: $('#fRunPrefill'), runSingle: $('#fRunSingle'), runDecode: $('#fRunDecode'), ignoreEos: $('#fIgnoreEos'),
  };
  let provider = 'custom';
  const providerSettings = {};
  const apiKeys = new Map(); // API Key 仅保留在当前页面内存中
  const thinkingLabels = { default: '跟随接口', on: '请求开启', off: '请求关闭' };
  const supportsThinking = () => provider === 'qwen' || provider === 'deepseek' || (provider === 'custom' && segVal('fFormat') === 'openai');
  const segVal = (id) => ($(`#${id} button.on`) || {}).dataset?.v;
  const setSeg = (id, v) => $$(`#${id} button`).forEach((b) => {
    const selected = b.dataset.v === String(v);
    b.classList.toggle('on', selected);
    if (b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', String(selected));
  });
  function syncThinking() {
    $('#thinkingField').hidden = !supportsThinking();
    $('#thinkingHint').textContent = provider === 'custom'
      ? translate('适用于支持思考开关的 vLLM / SGLang 兼容接口。')
      : translate('需上游模型支持思考开关。');
  }
  $$('.seg').forEach((s) =>
    s.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      setSeg(s.id, b.dataset.v);
      persist();
    })
  );

  $('#chips').innerHTML = PROVIDERS.map((p) => `<button class="chip" type="button" data-id="${p.id}">${translate(p.name)}</button>`).join('');
  $('#chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (b) selectProvider(b.dataset.id, true);
  });

  function syncModelPlaceholder(p) {
    F.model.placeholder = p.model ? translate`例如 ${p.model}` : translate('填写模型名称，或点「获取列表」');
  }

  function selectProvider(id, user) {
    if (user) stash();
    provider = id;
    const p = PROVIDERS.find((x) => x.id === id) || PROVIDERS[0];
    provider = p.id;
    $$('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === id));
    const saved = providerSettings[provider] || {};
    $('#baseField').hidden = id !== 'custom';
    if (id === 'custom') {
      F.base.value = saved.base || '';
      setSeg('fFormat', saved.format || 'openai');
    }
    F.key.value = apiKeys.get(provider) || '';
    F.model.value = saved.model != null ? saved.model : p.model;
    syncModelPlaceholder(p);
    setSeg('fThinking', Object.hasOwn(thinkingLabels, saved.thinkingMode) ? saved.thinkingMode : 'default');
    syncThinking();
    const kl = $('#keyLink');
    kl.hidden = !p.key;
    if (p.key) kl.href = p.key;
    $('#modelList').innerHTML = '';
    modelCount = null;
    syncModelHint();
    if (user) persist();
  }

  function stash() {
    apiKeys.set(provider, F.key.value.trim());
    providerSettings[provider] = {
      model: F.model.value.trim(), base: F.base.value.trim(), format: segVal('fFormat'),
      thinkingMode: segVal('fThinking'),
    };
  }

  function readCfg() {
    const p = PROVIDERS.find((x) => x.id === provider);
    return {
      baseUrl: provider === 'custom' ? F.base.value.trim() : p.base,
      format: provider === 'custom' ? segVal('fFormat') : p.format || 'openai',
      apiKey: F.key.value.trim(),
      model: F.model.value.trim(),
      thinkingMode: supportsThinking() ? segVal('fThinking') || 'default' : 'default',
      contextTokens: Number(segVal('fCtx')) || 16000,
      maxTokens: Number(segVal('fMax')) || 2048,
      singleMaxTokens: 2048,
      concurrency: Number(segVal('fConc')) || 8,
      runPrefill: F.runPrefill.checked,
      runSingle: F.runSingle.checked,
      runDecode: F.runDecode.checked,
      ignoreEos: F.ignoreEos.checked,
      extraBody: F.extra.value.trim(),
    };
  }

  function isLoopback(name) {
    name = name.toLowerCase().replace(/\.$/, '');
    return name === '[::1]' || name === 'localhost' || name.endsWith('.localhost') || /^127(?:\.\d{1,3}){3}$/.test(name);
  }

  function needsBrowserDirect(baseUrl) {
    if (isLoopback(location.hostname)) return false;
    try {
      const url = new URL(baseUrl);
      return ['http:', 'https:'].includes(url.protocol) && isLoopback(url.hostname);
    } catch (_) {
      return false;
    }
  }

  let directClient;
  function loadDirectClient() {
    if (!window.isSecureContext) throw new Error(translate('浏览器要求通过 HTTPS 打开 TokenSpeed 才能访问你的本机接口'));
    directClient ??= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './direct-bench.js';
      script.onload = () => {
        if (window.TokenSpeedDirect) resolve(window.TokenSpeedDirect);
        else reject(new Error(translate('本机直连组件加载失败')));
      };
      script.onerror = () => reject(new Error(translate('本机直连组件加载失败')));
      document.head.appendChild(script);
    }).catch((error) => {
      directClient = null;
      throw error;
    });
    return directClient;
  }

  function persist() {
    stash();
    syncThinking();
    const c = readCfg();
    store.set('ts3.cfg', {
      v: 2,
      provider, providers: providerSettings, ctx: c.contextTokens, max: c.maxTokens, conc: c.concurrency,
      runPrefill: c.runPrefill, runSingle: c.runSingle, runDecode: c.runDecode, ignoreEos: c.ignoreEos, extra: c.extraBody,
    });
    updateCost();
    renderExplain();
  }

  function restore() {
    const current = store.get('ts3.cfg', null);
    const legacy = store.get('ts2.cfg', null);
    const s = current || legacy || {};
    const savedProviders = s.providers || s.keys || {};
    for (const { id } of PROVIDERS) {
      if (!savedProviders[id]) continue;
      const { model, base, format, thinkingMode } = savedProviders[id];
      providerSettings[id] = { model, base, format, thinkingMode };
    }
    if (s.ctx && current) setSeg('fCtx', s.ctx);
    if (s.max && s.v >= 2) setSeg('fMax', s.max); // 旧版本默认 4K，升级后统一回到 2K
    if (s.conc) setSeg('fConc', s.conc);
    if (s.runPrefill === false) F.runPrefill.checked = false;
    if (s.runSingle === false) F.runSingle.checked = false;
    if (s.runDecode === false) F.runDecode.checked = false;
    F.ignoreEos.checked = !!s.ignoreEos;
    F.extra.value = s.extra || '';
    selectProvider(s.provider || 'custom', false);
    if (s.keys || legacy) {
      // 重写旧配置，清除此前保存在浏览器中的 Key。
      store.del('ts3.cfg');
      store.del('ts2.cfg');
      persist();
      return;
    }
    updateCost();
    renderExplain();
  }

  function updateCost() {
    const c = readCfg();
    const n = c.concurrency;
    const inTok = 6000 + (c.runPrefill ? n * c.contextTokens : 0) + (c.runSingle ? 200 : 0) + (c.runDecode ? n * (c.contextTokens + 300) : 0);
    const cached = c.runDecode && c.runPrefill ? n * c.contextTokens : 0;
    const out = (c.runSingle ? c.singleMaxTokens : 0) + (c.runDecode ? n * c.maxTokens : 0);
    $('#cost').innerHTML =
      translate`本次大约消耗：输入 <b>${fmtUsage.format(inTok)}</b> tokens` +
      (cached ? translate`（其中约 <b>${fmtUsage.format(cached)}</b> 可命中缓存，通常更便宜）` : '') +
      translate`，输出最多 <b>${fmtUsage.format(out)}</b> tokens。`;
  }

  function renderExplain() {
    const c = readCfg();
    const direct = needsBrowserDirect(c.baseUrl);
    const hint = $('#directHint');
    hint.hidden = !direct;
    hint.textContent = direct ? (window.isSecureContext
      ? translate('浏览器直连你的本机接口。请允许本站访问本机，模型服务也需允许本站跨域访问。')
      : translate('浏览器要求通过 HTTPS 打开 TokenSpeed 才能访问你的本机接口。')) : '';
    const ctx = fmtTok(c.contextTokens);
    $('#explain').innerHTML = [
      ['z1', translate('响应延迟'), translate('发一句话，多久开始回复')],
      ['z2', translate('读取速度'), translate`并发发送 ${c.concurrency} 份目标约 ${ctx} tokens 的资料，计时至各路首包`],
      ['z3', translate('峰值速度'), translate('单独写一段代码，按逐块用量计算最快 2 秒')],
      ['c1', translate('并发速度'), translate`${c.concurrency} 路同时写不同领域的长文`],
    ]
      .map(([col, k, v]) => `<li><b><i style="background:var(--${col})"></i>${k}</b>${v}</li>`)
      .join('');
  }

  $('.setup').addEventListener('input', persist);
  $('.setup').addEventListener('change', persist);
  $('#btnEye').addEventListener('click', () => (F.key.type = F.key.type === 'password' ? 'text' : 'password'));
  $('#btnAdv').addEventListener('click', () => {
    const a = $('#adv');
    a.hidden = !a.hidden;
    $('#btnAdv').textContent = a.hidden ? translate('高级设置') : translate('收起高级设置');
  });

  let modelCount;
  function syncModelHint() {
    $('#modelHint').textContent = modelCount == null ? '' : translate`· 可选 ${modelCount} 个`;
  }

  async function fetchModels() {
    const c = readCfg();
    const direct = needsBrowserDirect(c.baseUrl);
    if (!c.baseUrl || (!c.apiKey && provider !== 'custom')) {
      toast(c.baseUrl ? translate('请先填写 API Key') : translate('请先填写接口地址'), true);
      return;
    }
    const btn = $('#btnModels');
    btn.classList.add('loading');
    btn.textContent = translate('获取中');
    try {
      const r = direct ? { models: await (await loadDirectClient()).listModels(c) }
        : await fetch('./api/models', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c) }).then((r) => r.json());
      if (r.error) throw new Error(r.error);
      $('#modelList').innerHTML = r.models.map((m) => `<option value="${esc(m)}">`).join('');
      modelCount = r.models.length;
      syncModelHint();
      if (!F.model.value && r.models[0]) F.model.value = r.models[0];
      toast(translate`获取到 ${r.models.length} 个模型，点模型输入框即可选择`);
      F.model.focus();
      persist();
    } catch (e) {
      modelCount = null;
      syncModelHint();
      toast(translate('获取模型列表失败：') + localizeError(e.message), true);
    } finally {
      btn.classList.remove('loading');
      btn.textContent = translate('获取列表');
    }
  }
  $('#btnModels').addEventListener('click', fetchModels);

  // ---------------- 阶段定义
  const STAGE = {
    ping: { name: '延迟', label: '响应延迟', scale: () => [0, 200, 400, 800, 1600, 3200], lbl: (v) => (v >= 1000 ? v / 1000 + 's' : v), tiers: [] },
    // 读取速度是整个服务的吞吐：已读完的 token 总数 ÷ 用时
    prefill: { name: '读取', label: '读取速度 · 整体吞吐', scale: () => [0, 5000, 10000, 20000, 40000, 80000], lbl: fmtK, tiers: [[5000, '能用'], [10000, '流畅'], [25000, '飞快'], [50000, '起飞']] },
    single: { name: '峰值', label: '单发峰值速度', scale: () => [0, 25, 50, 80, 120, 200], lbl: fmtK, tiers: [[25, '能用'], [50, '流畅'], [80, '飞快'], [120, '起飞']] },
    // 并发阶段仪表显示合计吞吐，档位按单路平均速度判断
    decode: { name: '并发', label: '实时并发输出速度', scale: (n) => [0, 10, 25, 50, 80, 125].map((x) => x * n), lbl: fmtK, tiers: [[20, '能用'], [40, '流畅'], [60, '强劲'], [90, '爆表']] },
  };
  const tierOf = (k, v) => {
    const t = STAGE[k].tiers;
    let idx = 0;
    t.forEach(([th], i) => {
      if (v >= th) idx = i + 1;
    });
    return [idx, translate(idx ? t[idx - 1][1] : '偏慢')];
  };
  const pingRate = (ms) => (ms < 400 ? [1, translate('极快')] : ms < 1000 ? [2, translate('良好')] : ms < 2500 ? [3, translate('一般')] : [4, translate('偏慢')]);

  // ---------------- 测速流程
  const S = {}; // 本次测速的数据
  const V = {}; // 当前阶段的显示状态

  function showView(v) {
    $('#viewSetup').hidden = v !== 'setup';
    $('#viewTest').hidden = v !== 'test';
    window.scrollTo({ top: 0, behavior: still ? 'auto' : 'smooth' });
  }

  const setStep = (k, state, val, unit) => {
    const li = $(`.step[data-s="${k}"]`);
    if (!li) return;
    if (state) li.className = 'step ' + state;
    if (val !== undefined) html($('b', li), val);
    if (unit !== undefined) $('small', li).textContent = unit;
    if (state === 'done') punch(li, 1.2);
  };

  function setTier(idx, name) {
    const t = $('#tier');
    t.textContent = name;
    t.className = 'tier' + (idx ? ' t' + idx : '');
  }

  function checkTier(v) {
    const [idx, name] = tierOf(V.stage, v);
    if (idx > V.tier) {
      V.tier = idx;
      setTier(idx, name);
      punch($('#tier'), 1.4);
      punch($('#gNum'), 1.12);
      confetti(14 + idx * 5, 0.8 + idx * 0.15);
      shake($('#gCard'), 0.6 + idx * 0.15);
      if (idx >= 3) burst();
      SFX.up();
    }
  }

  function setGauge(v) {
    V.value = v;
    if (G.target(v ?? 0)) punch($('.dial'), 1.04);
  }

  function enterStage(k, n) {
    Object.assign(V, { stage: k, tier: 0, value: 0, peak: 0, samples: [], rate: 0, tickAt: 0, final: false, numMode: 'value', burstTok: 0, burstC: 0, lanes: [], pf: null, t0: now(), fmt: fmt });
    const st = STAGE[k];
    G.setScale(st.scale(n), st.lbl);
    G.scan(false);
    setTier(0, k === 'ping' ? translate('测量中') : translate('起步'));
    $('#gK').textContent = translate(st.label);
    $('#gUnit').textContent = k === 'ping' ? translate('毫秒') : 'tok/s';
    $('#gNum').textContent = '—';
    html($('#gSub'), '&nbsp;');
    $('#scope').hidden = !(k === 'single' || k === 'decode');
    $('#live').hidden = k === 'ping';
    $('#banner').hidden = true;
    $('#btnEndDecode').hidden = !(k === 'single' || k === 'decode');
    if (k === 'single' || k === 'decode') SC.reset(k === 'single' ? 100 : 100 * (n || 8));
    setStep(k, 'active');
  }

  async function runViaServer(cfg, signal) {
    const res = await fetch('./api/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(cfg), signal });
    if (!res.ok || !res.body) throw new Error(translate('测速服务异常 HTTP ') + res.status);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) on(JSON.parse(line));
      }
    }
  }

  function stepLabel(stage) {
    if (stage === 'single' && S.single) return singleMetric(S.single).step;
    if (stage === 'decode' && S.decode) return decodeMetric(S.decode).step;
    return translate(STAGE[stage].name);
  }

  function syncTestHeading() {
    const { cfg, direct } = S;
    if (!cfg) return;
    $('#tHost').textContent = translate`${host(cfg.baseUrl)} · ${direct ? translate('浏览器直连 · ') : ''}${fmtTok(cfg.contextTokens)} 资料 · ${cfg.concurrency} 并发`;
    for (const step of $$('#steps [data-s]')) {
      $('span', step).textContent = stepLabel(step.dataset.s);
    }
  }

  async function start(demo) {
    if (S.running) return;
    const cfg = readCfg();
    if (demo) Object.assign(cfg, { baseUrl: 'demo', model: 'demo-coder', apiKey: 'demo', format: 'openai', thinkingMode: 'default', extraBody: '', ignoreEos: false, maxTokens: 1024, singleMaxTokens: 600 });
    if (!demo) {
      if (!cfg.baseUrl) return toast(translate('请填写接口地址'), true), F.base.focus();
      if (!cfg.apiKey && provider !== 'custom') return toast(translate('请先粘贴 API Key'), true), F.key.focus();
      if (!cfg.model) return toast(translate('请填写模型名称'), true), F.model.focus();
      if (cfg.extraBody) {
        try {
          JSON.parse(cfg.extraBody);
        } catch (_) {
          return toast(translate('额外请求参数不是合法的 JSON'), true);
        }
      }
    }
    if (!cfg.runPrefill && !cfg.runSingle && !cfg.runDecode) return toast(translate('请至少开启一个测试项目'), true);
    const direct = needsBrowserDirect(cfg.baseUrl);
    if (direct && !window.isSecureContext) return toast(translate('请通过 HTTPS 打开 TokenSpeed，再测速你的本机接口'), true);
    ensureAudio();

    for (const k in S) delete S[k];
    Object.assign(S, { running: true, cfg, demo, direct, runId: null, ping: null, prefill: null, single: null, decode: null, summary: null, error: null });
    $('#tModel').textContent = cfg.model;
    syncTestHeading();
    syncLanguageButton();
    const order = ['ping', cfg.runPrefill && 'prefill', cfg.runSingle && 'single', cfg.runDecode && 'decode'].filter(Boolean);
    $('#steps').innerHTML = order.map((k) => `<li class="step wait" data-s="${k}"><span>${translate(STAGE[k].name)}</span><b>—</b><small></small></li>`).join('');
    $('#result').hidden = true;
    $('#gCard').hidden = false;
    $('#scope').hidden = true;
    $('#live').hidden = true;
    $('#grid').innerHTML = '';
    $('#btnStop').hidden = false;
    $('#gStats').innerHTML = '';
    V.stage = null;
    showView('test');
    startLoop();

    S.ctrl = new AbortController();
    try {
      if (direct) {
        const client = await loadDirectClient();
        S.ctrl.signal.throwIfAborted();
        S.directCtl = { id: crypto.randomUUID(), master: S.ctrl, stopDecode: null };
        await client.runBenchmark(cfg, on, S.directCtl);
      } else await runViaServer(cfg, S.ctrl.signal);
    } catch (e) {
      if (e.name !== 'AbortError') S.error = /fetch/i.test(e.message) ? '无法连接测速服务，请确认 npm start 正在运行' : e.message;
      else S.error = S.error || '已停止';
    }
    finish();
  }

  function finish() {
    S.running = false;
    syncLanguageButton();
    G.scan(false);
    $('#btnStop').hidden = true;
    $('#btnEndDecode').hidden = true;
    $$('.step.active').forEach((li) => (li.className = 'step skip'));
    $$('.lane.live').forEach((l) => l.classList.remove('live'));
    if (S.error && S.error !== '已停止') toast(localizeError(S.error), true);
    if (S.ping || S.prefill || S.single || S.decode) {
      S.previousBest = bestOf(S.cfg);
      renderResult();
      if (S.summary && !S.demo) saveHistory();
    } else {
      stopLoop();
      showView('setup');
    }
  }

  function on(ev) {
    switch (ev.type) {
      case 'run':
        S.runId = ev.id;
        break;
      case 'phase':
        if (ev.phase === 'ping') {
          enterStage('ping');
          V.fmt = (v) => fmt(v, 0);
          html($('#gSub'), translate('正在连接…'));
          V.pings = [];
        } else if (ev.phase === 'calibrate') {
          G.scan(true);
          html($('#gSub'), translate('正在准备测试资料…'));
        }
        break;
      case 'ping_sample':
        if (ev.warm) html($('#gSub'), translate`已连接 · 首次握手 ${fmtS(ev.ms)}（不计入）`);
        else {
          V.pings.push(ev.ms);
          html($('#gSub'), translate`第 ${V.pings.length} / 3 次`);
        }
        setGauge(ev.ms);
        punch($('#gNum'), 1.15);
        SFX.tick();
        break;
      case 'ping_result': {
        S.ping = ev;
        setGauge(ev.min);
        const [i, name] = pingRate(ev.min);
        setTier(i, name);
        punch($('#tier'), 1.4);
        html($('#gSub'), translate`最快 ${fmt(ev.min, 0)} · 平均 ${fmt(ev.avg, 0)} · 抖动 ${fmt(ev.jitter, 0)} 毫秒`);
        setStep('ping', 'done', fmt(ev.min, 0), 'ms');
        break;
      }
      case 'prefill_start':
        return onPrefillStart(ev);
      case 'prefill_lane':
        return onPrefillLane(ev);
      case 'prefill_result':
        return onPrefillResult(ev);
      case 'single_start':
        return onSingleStart(ev);
      case 'single_result':
        return onSingleResult(ev);
      case 'decode_start':
        return onDecodeStart(ev);
      case 'tick':
        return onTick(ev);
      case 'decode_lane':
        return onDecodeLane(ev);
      case 'decode_result':
        return onDecodeResult(ev);
      case 'done':
        S.summary = ev.summary;
        break;
      case 'error':
        S.error = ev.message;
        break;
    }
  }

  // ---------- 读取速度
  function onPrefillStart(ev) {
    enterStage('prefill');
    G.scan(true);
    V.numMode = 'elapsed';
    V.fmt = fmtK;
    V.pf = { n: ev.n, done: 0, fail: 0, tokens: 0, est: ev.estSeconds, target: ev.targetTokens };
    $('#gUnit').textContent = translate('秒');
    html($('#gSub'), translate`${ev.n} 路请求已发出，等第一份读完…`);
    $('#liveT').textContent = translate`正在读取 ${ev.n} 份资料`;
    $('#liveS').textContent = translate`每份约 ${fmtTok(ev.targetTokens)} tokens，来自不同领域`;
    const grid = $('#grid');
    grid.className = 'grid';
    grid.innerHTML = ev.lanes
      .map(
        (l) => `<div class="doc" style="--lc:${laneVar(l.i)}"><div class="d-fill"></div><div class="d-h"><i></i>${esc(translate(l.doc))}</div>
        <div class="d-lines">${[92, 70, 84, 56, 76].map((w) => `<i style="width:${w - Math.random() * 14}%"></i>`).join('')}</div>
        <div class="d-st"><span>${translate('读取中')}</span><b>0.0s</b></div><div class="stamp">✓</div></div>`
      )
      .join('');
    V.docs = $$('.doc', grid).map((el) => ({ el, st: $('.d-st span', el), t: $('.d-st b', el), fill: $('.d-fill', el), stamp: $('.stamp', el), done: false }));
  }

  function onPrefillLane(ev) {
    const P = V.pf;
    const d = V.docs && V.docs[ev.i];
    if (!P || !d) return;
    d.done = true;
    anim(d.stamp, [{ transform: 'scale(2.4) rotate(-40deg)', opacity: 0 }, { transform: 'scale(1) rotate(-14deg)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.5,0,.75,0)' });
    if (!ev.ok) {
      P.fail++;
      d.el.classList.add('err');
      d.stamp.textContent = '✗';
      d.st.textContent = translate('失败');
      d.el.title = localizeError(ev.error) || '';
      return;
    }
    d.el.classList.add('done');
    d.st.textContent = ev.promptTokens == null ? translate('无输入用量') : `${fmt(ev.promptTokens, 0)} tokens`;
    d.t.textContent = (ev.ttft / 1000).toFixed(1) + 's';
    shake(d.el, 0.5);
    P.done++;
    if (ev.promptTokens == null) P.missingUsage = true;
    P.tokens += ev.promptTokens ?? 0;
    P.at = Math.max(P.at || 0, ev.at);
    P.agg = P.missingUsage || !P.at ? null : P.tokens / P.at;
    if (P.done === 1) {
      G.scan(false);
      V.numMode = 'value';
      $('#gUnit').textContent = 'tok/s';
    }
    setGauge(P.agg);
    checkTier(V.value);
    punch($('#gNum'), 1.22);
    SFX.tick();
    html($('#gSub'), translate`已读完 ${P.done} / ${P.n} 份`);
    if (P.done + P.fail === P.n && !P.fail) {
      burst();
      confetti(34, 1.2);
      shake($('#gCard'), 1);
      SFX.boom();
      P.boomed = true;
    }
  }

  function onPrefillResult(ev) {
    S.prefill = ev;
    V.final = true;
    V.numMode = 'value';
    G.scan(false);
    setGauge(ev.throughput);
    if (ev.throughput != null) setTier(...tierOf('prefill', ev.throughput));
    else setTier(0, translate('不可用'));
    html($('#gSub'), ev.totalTokens == null ? translate('整轮输入用量不完整') : translate`${ev.ok} 路共 ${fmt(ev.totalTokens, 0)} tokens，${fmtS(ev.wallMs)}收到全部首包`);
    setStep('prefill', 'done', fmt(ev.throughput, 1), 'tok/s');
  }

  // ---------- 生成（单发 / 并发共用）
  function buildLanes(list, single) {
    const grid = $('#grid');
    grid.className = 'grid' + (single ? ' one' : '');
    grid.innerHTML = list
      .map(
        (l) => `<div class="lane" style="--lc:${laneVar(l.i + (single ? 2 : 0))}">
          <div class="ln-h"><span><i></i>#${l.i + 1} <span>${esc(translate(l.domain))}</span></span><em>${translate('等待中')}</em></div>
          <div class="ln-sub">${esc(l.sub)}</div>
          <div class="ln-bar"><b></b></div>
          <div class="ln-body"><pre><span class="wait">${translate('› 请求已发出，等待第一个字…')}</span><span class="cur"></span></pre></div></div>`
      )
      .join('');
    V.lanes = $$('.lane', grid).map((el, k) => ({
      el, em: $('em', el), bar: $('.ln-bar b', el), body: $('.ln-body', el), pre: $('pre', el), cur: $('.cur', el),
      domain: list[k].domain, tok: 0, tFirst: null, kind: null, node: null, final: null, speed: 0,
    }));
  }

  function append(L, text, kind) {
    if (L.kind !== kind || !L.node) {
      const w = $('.wait', L.pre);
      if (w) w.remove();
      const span = document.createElement('span');
      if (kind === 'reasoning') span.className = 'rs';
      span.appendChild(document.createTextNode(''));
      L.pre.insertBefore(span, L.cur);
      L.node = span.firstChild;
      L.kind = kind;
    }
    const stick = L.body.scrollHeight - L.body.scrollTop - L.body.clientHeight < 60;
    L.node.appendData(text);
    if (stick) L.body.scrollTop = L.body.scrollHeight;
  }

  function onSingleStart(ev) {
    enterStage('single');
    V.max = ev.maxTokens;
    $('#scT').textContent = translate('单路实时估算');
    $('#liveT').textContent = translate('实时输出');
    $('#liveS').textContent = translate`1 路 · 写代码 · 最多 ${fmt(ev.maxTokens, 0)} tokens`;
    buildLanes([{ i: 0, domain: ev.domain, sub: translate('短提示词 · 测速度上限') }], true);
    html($('#gSub'), translate('等待第一个字…'));
  }

  function onDecodeStart(ev) {
    enterStage('decode', ev.n);
    V.max = ev.maxTokens;
    V.n = ev.n;
    $('#scT').textContent = translate('多路实时估算');
    $('#liveT').textContent = translate('实时输出');
    $('#liveS').textContent = translate`${ev.n} 路 · 不同领域 · 每路最多 ${fmt(ev.maxTokens, 0)} tokens，全部写完出结果`;
    buildLanes(
      ev.lanes.map((l) => ({ i: l.i, domain: l.domain, sub: l.reuse ? translate`前缀复用「${translate(l.doc)}」` : translate`资料「${translate(l.doc)}」` })),
      false
    );
    html($('#gSub'), translate`${ev.n} 路请求已发出…`);
  }

  function onTick(ev) {
    if (V.stage !== ev.phase) return;
    const t = now();
    ev.lanes.forEach((x) => {
      const L = V.lanes[x.i];
      if (!L || L.final) return;
      if ((x.d || x.r) && L.tFirst == null) {
        L.tFirst = t;
        L.firstCount = x.tok;
        L.el.classList.add('live');
      }
      if (x.r) append(L, x.r, 'reasoning');
      if (x.d) append(L, x.d, 'content');
      V.burstTok += Math.max(0, x.tok - L.tok);
      V.burstC += x.c || 0;
      L.tok = x.tok;
    });
    // 实时速度：定时推送之间的 token 增量，缺少用量时使用文本估算
    const ts = ev.t * 1000;
    const total = V.lanes.reduce((s, L) => s + (L.final ? L.final.tokens || L.tok : L.tok), 0);
    V.samples.push([ts, total]);
    while (V.samples.length > 2 && ts - V.samples[1][0] >= 1000) V.samples.shift();
    const [t0, v0] = V.samples[0];
    const span = ts - t0;
    if (span > 150 && total > v0) {
      V.rate = ((total - v0) * 1000) / span;
      if (span >= 900) V.peak = Math.max(V.peak, V.rate);
    }
    V.total = total;
    V.tickAt = t;
  }

  function laneSpeed(L, t) {
    if (L.final) return L.final.speed ?? L.final.speedEstimate ?? 0;
    if (L.tFirst == null) return 0;
    const dt = (t - L.tFirst) / 1000;
    return dt > 0.4 ? Math.max(0, L.tok - L.firstCount) / dt : 0;
  }

  /** 每帧：实时速度在 onTick 里按服务端时间算好，这里只负责驱动仪表；超过半秒没有新数据就让读数回落 */
  function liveCompute(t) {
    if (V.final) return;
    if (V.tickAt && t - V.tickAt > 500) V.rate *= 0.92;
    setGauge(V.rate);
    const speeds = V.lanes.map((L) => laneSpeed(L, t)).filter((x) => x > 0);
    V.avg = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    checkTier(V.stage === 'decode' ? V.avg : V.rate);
  }

  function laneRender(t) {
    V.lanes.forEach((L) => {
      if (L.final) return;
      const sp = laneSpeed(L, t);
      if (L.tFirst == null) html(L.em, translate('等待中'));
      else html(L.em, `≈${fmt(sp, 1)}<small>tok/s</small>`);
      L.bar.style.width = Math.min(100, (L.tok / V.max) * 100).toFixed(1) + '%';
    });
  }

  function renderLaneRate(L) {
    const ev = L.final;
    html(L.em, ev.speed == null && ev.speedEstimate == null && ev.e2eSpeed != null
      ? `${fmt(ev.e2eSpeed, 1)}<small>${translate('端到端 tok/s')}</small>`
      : fmtRate(ev.speed, ev.speedEstimate));
  }

  function finalizeLane(L, ev) {
    L.final = ev;
    L.el.classList.remove('live');
    if (ev.ok) {
      renderLaneRate(L);
      if (ev.tokens != null) L.bar.style.width = Math.min(100, (ev.tokens / V.max) * 100).toFixed(1) + '%';
    } else if (ev.stopped) {
      html(L.em, translate('已停止'));
    } else {
      L.el.classList.add('err');
      html(L.em, translate('失败'));
      append(L, `\n✗ ${localizeError(ev.error)}`, 'reasoning');
    }
  }

  function onSingleResult(ev) {
    S.single = ev;
    const L = V.lanes[0];
    if (L) finalizeLane(L, ev);
    V.final = true;
    V.rate = ev.peak;
    setGauge(ev.peak);
    if (ev.peak != null) setTier(...tierOf('single', ev.peak));
    else setTier(0, translate('不可用'));
    punch($('#gNum'), 1.2);
    SFX.stamp();
    $('#gK').textContent = translate('单发峰值速度 · 最快 2 秒');
    html($('#gSub'), translate`解码平均 ${fmtRate(ev.speed, ev.speedEstimate)}${ev.byUser ? translate('（提前结束）') : ''}`);
    const metric = singleMetric(ev);
    $('.step[data-s="single"] span').textContent = stepLabel('single');
    setStep('single', 'done', fmtMeasured(metric.value, metric.estimate), 'tok/s');
    $('#btnEndDecode').hidden = true;
  }

  function onDecodeLane(ev) {
    const L = V.lanes[ev.i];
    if (!L) return;
    finalizeLane(L, ev);
    if (ev.stopped) L.el.classList.add('stopped');
  }

  function onDecodeResult(ev) {
    S.decode = ev;
    V.final = true;
    V.rate = ev.overlap?.throughput ?? null;
    V.avg = ev.avgSpeed;
    setGauge(V.rate);
    if (ev.overlap) setTier(...tierOf('decode', V.rate / ev.n));
    else setTier(0, translate('不可用'));
    punch($('#gNum'), 1.2);
    confetti(26, 1);
    SFX.boom();
    $('#btnEndDecode').hidden = true;
    $('#gK').textContent = translate`${ev.n} 路同时解码`;
    const metric = decodeMetric(ev);
    html($('#gSub'), metric.note);
    $('.step[data-s="decode"] span').textContent = stepLabel('decode');
    setStep('decode', 'done', fmtMeasured(metric.value, metric.estimate), 'tok/s');
    const best = decodeBars(ev).sort((a, b) => b.speed - a.speed)[0];
    if (best && V.lanes[best.i]) {
      const W = V.lanes[best.i].el;
      W.classList.add('win');
      W.insertAdjacentHTML('afterbegin', `<span class="ribbon">${translate('最快！')}</span>`);
      anim(W, [{ transform: 'scale(1.06)' }, { transform: 'translateY(-4px)' }], { duration: 400, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    }
    const b = $('#banner');
    b.hidden = false;
    b.innerHTML = `<span class="flag"></span><span>${
      ev.byUser ? translate('已提前结束，并发吞吐成绩不可用。') : translate`${ev.ok} / ${ev.n} 路完成，整轮用时 ${fmtS(ev.windowMs)}。`
    }${best ? translate` 最快的是 <b>#${best.i + 1} ${esc(translate(best.domain))}</b>，${barSpeed(best)} tok/s。` : ''}</span>`;
    anim(b, [{ transform: 'translateY(-14px) scale(.95)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  }

  // ---------- 动画循环
  let rafId = 0, lastT = 0, numAt = 0, statAt = 0, scAt = 0;
  function startLoop() {
    if (rafId) return;
    lastT = now();
    rafId = requestAnimationFrame(loop);
  }
  function stopLoop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }
  function loop(t) {
    const dt = Math.min(0.05, Math.max(0, (t - lastT) / 1000));
    lastT = t;
    const gen = V.stage === 'single' || V.stage === 'decode';
    if (gen) liveCompute(t);
    if (V.stage === 'prefill' && V.docs && !V.final) {
      const el = (t - V.t0) / 1000;
      const p = Math.min(0.9, 1 - Math.exp((-1.3 * el) / Math.max(1, V.pf.est)));
      V.docs.forEach((d) => {
        if (d.done) return;
        d.t.textContent = el.toFixed(1) + 's';
        d.fill.style.height = (p * 100).toFixed(1) + '%';
      });
    }
    if (!$('#gCard').hidden) {
      G.step(dt);
      LINES(dt, Math.max(0, Math.min(1, G.ang)));
    }
    if (gen && !$('#scope').hidden) {
      if (t - scAt > 50) {
        scAt = t;
        const b = V.burstC ? Math.max(1, Math.min(3, Math.round(V.burstTok / V.burstC))) : 0;
        V.burstTok = V.burstC = 0;
        SC.push(V.final ? 0 : V.rate, b);
        $('#scRun').textContent = V.final ? 'STOP' : 'RUN';
        $('#scRun').classList.toggle('stop', V.final);
        $('#scY').textContent = translate`满格 ${fmtK(SC.max)} tok/s`;
      }
      SC.draw();
    }
    if (t - numAt > 110) {
      numAt = t;
      if (V.stage) {
        const txt = V.numMode === 'elapsed' ? ((t - V.t0) / 1000).toFixed(1) : V.value != null && (V.value || V.final) ? V.fmt(V.value) : '—';
        $('#gNum').textContent = txt;
        if (gen && !V.final && V.lanes.some((L) => L.tFirst != null)) html($('#gSub'), translate('实时估算 · 最终成绩使用上游用量'));
      }
    }
    if (t - statAt > 250) {
      statAt = t;
      if (gen) laneRender(t);
      renderStats(t);
    }
    rafId = requestAnimationFrame(loop);
  }

  const kv = (k, v, u) => `<div class="kv"><span>${k}</span><b>${v}${u ? `<small>${u}</small>` : ''}</b></div>`;
  function renderStats(t) {
    const el = $('#gStats');
    if (V.stage === 'ping') {
      const p = V.pings || [];
      const P = S.ping;
      html(el, kv(translate('最快'), p.length ? fmt(Math.min(...p), 0) : '—', 'ms') + kv(translate('平均'), P ? fmt(P.avg, 0) : '—', 'ms') + kv(translate('抖动'), P ? fmt(P.jitter, 0) : '—', 'ms') + kv(translate('样本'), `${p.length} / 3`));
    } else if (V.stage === 'prefill' && V.pf) {
      const P = V.pf, R = S.prefill;
      html(el, kv(translate('已读完'), `${P.done} / ${P.n}`, translate('份')) + kv(translate('用时'), R ? (R.wallMs / 1000).toFixed(1) : ((t - V.t0) / 1000).toFixed(1), 's') + kv(translate('已读 tokens'), fmtTok(R ? R.totalTokens : P.missingUsage ? null : P.tokens), '') + kv(translate('单份'), fmtTok(P.target), 'tokens'));
    } else if (V.stage === 'single') {
      const L = V.lanes[0], R = S.single;
      const ttft = R ? R.ttft : L && L.tFirst != null ? L.tFirst - V.t0 : null;
      html(el, kv(translate('首包时间'), ttft != null ? (R ? '' : '≈') + (ttft / 1000).toFixed(2) : '—', 's') + kv(R ? translate('解码平均') : translate('实时峰值估算'), R ? fmtMeasured(R.speed, R.speedEstimate) : V.peak ? fmt(V.peak, 1) : '—', 'tok/s') + kv(translate('已生成'), R ? fmt(R.tokens, 0) : '≈' + fmtTok(V.total || 0), 'tokens') + kv(translate('用时'), ((R ? R.wallMs : t - V.t0) / 1000).toFixed(1), 's'));
    } else if (V.stage === 'decode') {
      const R = S.decode;
      html(
        el,
        kv(translate('单路平均'), V.avg ? fmt(V.avg, 1) : '—', 'tok/s') +
          kv(translate('缓存命中'), R && R.cacheHitRate != null ? (R.cacheHitRate * 100).toFixed(1) : '—', '%') +
          kv(translate('已生成'), R ? fmt(R.totalTokens, 0) : '≈' + fmtTok(V.total || 0), 'tokens') +
          kv(translate('用时'), R ? (R.windowMs / 1000).toFixed(1) : ((t - V.t0) / 1000).toFixed(1), 's')
      );
    }
  }

  // ---------------- 结果
  const loadHist = () => store.get('ts3.hist', []);
  const bestOf = (cfg) => {
    const h = loadHist().filter((x) => x.model === cfg.model && x.host === host(cfg.baseUrl) &&
      (x.thinkingMode || 'default') === cfg.thinkingMode && x.metricsVersion === 2 && x.single != null);
    return h.length ? Math.max(...h.map((x) => x.single)) : null;
  };

  function mainRating() {
    const { single: s, decode: d, prefill: p, ping } = S;
    if (s?.peak != null) return tierOf('single', s.peak);
    if (d?.overlap) return tierOf('decode', d.overlap.throughput / d.n);
    if (p?.throughput != null) return tierOf('prefill', p.throughput);
    return ping ? pingRate(ping.min) : [0, '—'];
  }

  function singleMetric(s) {
    if (s.peak != null || s.peakEstimate != null) {
      return { title: translate('单发峰值'), step: translate('峰值'), value: s.peak, estimate: s.peakEstimate,
        note: s.peak == null ? translate('估算 · 固定 2 秒窗口') : translate('tok/s · 固定 2 秒窗口') };
    }
    if (s.speed != null || s.speedEstimate != null) {
      return { title: translate('单发解码平均'), step: translate('单发均速'), value: s.speed, estimate: s.speedEstimate,
        note: s.speed == null ? translate('估算 · 无完整 2 秒窗口') : translate('tok/s · 无完整 2 秒窗口') };
    }
    if (s.e2eSpeed != null) {
      return { title: translate('单发端到端吞吐'), step: translate('单发端到端'), value: s.e2eSpeed, note: translate('tok/s · 含首包等待') };
    }
    return { title: translate('单发峰值'), step: translate('峰值'), note: translate('需逐块用量与完整 2 秒窗口') };
  }

  function decodeMetric(d) {
    const window = d.overlap ?? d.overlapEstimate;
    if (window) {
      return { title: translate`${d.n} 路同时解码`, step: translate('并发'), value: d.overlap?.throughput,
        estimate: d.overlapEstimate?.throughput,
        note: d.overlap ? translate`tok/s · 共同窗口 ${fmtS(window.windowMs)}` : translate`估算 · 共同窗口 ${fmtS(window.windowMs)}` };
    }
    if (d.throughput != null) {
      return { title: translate`${d.n} 路端到端吞吐`, step: translate('并发端到端'), value: d.throughput, note: translate('tok/s · 整轮用时') };
    }
    return { title: translate`${d.n} 路同时解码`, step: translate('并发'), note: translate('需要共同窗口和逐块用量') };
  }

  function decodeBars(d) {
    return (d?.lanes ?? []).filter(lane => lane.ok && (lane.speed ?? lane.speedEstimate) > 0)
      .map(lane => ({ ...lane, speed: lane.speed ?? lane.speedEstimate, estimated: lane.speed == null }));
  }

  const barSpeed = lane => (lane.estimated ? '≈' : '') + fmt(lane.speed, 1);

  function renderResult() {
    const { ping, prefill: p, single: s, decode: d, cfg } = S;
    $('#gCard').hidden = true;
    $('#scope').hidden = true;
    V.stage = null;
    stopLoop();
    const tiles = [];
    if (ping) tiles.push([translate('响应延迟'), fmt(ping.min, 0), 'ms', 'z1', '']);
    if (p) tiles.push([translate('读取速度'), fmt(p.throughput, 1), p.throughput == null ? translate('整轮输入用量不完整') : translate('tok/s · 首包前有效输入吞吐'), 'z2', '']);
    const single = s && singleMetric(s);
    const decode = d && decodeMetric(d);
    if (single) tiles.push([single.title, fmtMeasured(single.value, single.estimate), single.note, 'z3', 'light']);
    if (decode) tiles.push([decode.title, fmtMeasured(decode.value, decode.estimate), decode.note, 'c1', 'light']);
    const [ri, rname] = mainRating();
    const best = S.previousBest;
    let sub = '';
    if (S.demo) sub = translate('演示数据');
    else if (s?.peak != null && best == null) sub = translate('首次测试');
    else if (s?.peak != null && s.peak > best) sub = translate('本机新纪录');
    else if (s?.peak != null) sub = translate`本机最佳 ${fmt(best, 1)}`;
    $('#rTop').innerHTML = tiles.map(([k, v, u, c, cls]) => `<div class="r-tile ${cls}" style="--rc:var(--${c})"><span>${k}</span><b>${v}</b><small>${u}</small></div>`).join('');
    $('#rStampSlot').innerHTML = ri ? `<div class="r-stamp" id="rStamp"><div><b>${rname}</b><span>${sub}</span></div></div>` : '';

    const parts = [];
    if (s?.byUser || d?.byUser) parts.push(translate('生成阶段提前结束'));
    if (d?.overlap) parts.push(translate`${d.n} 路共同解码期间共输出 <b>${fmt(d.overlap.tokens, 0)}</b> tokens`);
    if (p) parts.push(translate`读取测试平均首包 <b>${fmtS(p.ttft.avg)}</b>`);
    if (d && d.cacheHitRate != null) parts.push(translate`前缀缓存命中 ${(d.cacheHitRate * 100).toFixed(0)}%`);
    if (single?.estimate != null || decode?.estimate != null) parts.push(translate('≈ 表示按输出文本和到达时间估算'));
    if (S.error && S.error !== '已停止') parts.push(`<span class="err">${translate`测试未全部完成：${esc(localizeError(S.error))}`}</span>`);
    else if (S.error) parts.push(translate('测试已手动停止'));
    $('#verdict').innerHTML = parts.join('；') + (parts.length ? '。' : '');
    syncRankingAction();

    const bars = decodeBars(d);
    $('#rBarsCard').hidden = bars.length < 2;
    if (bars.length >= 2) {
      const mx = Math.max(...bars.map((l) => l.speed));
      $('#rBars').innerHTML = bars
        .map((l) => `<div class="rb${l.speed === mx ? ' win' : ''}" style="--lc:${laneVar(l.i)}"><span>${esc(translate(l.domain))}</span><i><b data-w="${((l.speed / mx) * 100).toFixed(1)}"></b></i><em>${barSpeed(l)}</em></div>`)
        .join('');
    }

    const rows = [];
    const r = (k, v, cls) => rows.push(`<div class="d-row ${cls || ''}"><span>${k}</span><b>${v}</b></div>`);
    r(translate('模型'), esc(cfg.model));
    r(translate('服务'), esc(host(cfg.baseUrl)));
    if (S.direct) r(translate('请求路径'), translate('浏览器直连本机'));
    if (cfg.thinkingMode !== 'default') r(translate('思考模式'), translate(thinkingLabels[cfg.thinkingMode]));
    if (ping) {
      r(translate('延迟 最快 / 平均'), translate`${fmt(ping.min, 0)} / ${fmt(ping.avg, 0)} 毫秒`);
      r(translate('延迟抖动'), translate`${fmt(ping.jitter, 0)} 毫秒`);
    }
    if (p) {
      r(translate('读取 完成路数'), `${p.ok} / ${p.ok + p.failed}`);
      r(translate('每路输入用量范围'), p.minPromptTokens == null ? translate('不可用') : `${fmt(p.minPromptTokens, 0)}–${fmt(p.maxPromptTokens, 0)} tokens`);
      r(translate('读取 有效输入吞吐（含缓存）'), fmtRate(p.throughput));
      r(translate('读取 已命中缓存'), p.cachedTokens == null ? translate('不可用') : `${fmt(p.cachedTokens, 0)} tokens`);
      r(translate('读取 单路平均（含排队）'), fmtRate(p.avgSpeed));
      r(translate('读取 首包平均 / 最慢'), `${fmtS(p.ttft.avg)} / ${fmtS(p.ttft.max)}`);
      if (p.failed) r(translate('读取失败'), translate`${p.failed} 路`, 'err');
    }
    if (s) {
      r(translate('单发 峰值（固定 2 秒）'), fmtRate(s.peak, s.peakEstimate));
      r(translate('单发 解码平均'), fmtRate(s.speed, s.speedEstimate));
      r(translate('单发 端到端输出吞吐'), fmtRate(s.e2eSpeed));
      r(translate('单发 首包 / 输出用量'), `${fmtS(s.ttft)} / ${fmt(s.tokens, 0)} tokens`);
      if (s.chunkGap) r(translate('单发 输出块间隔 P50 / P99'), translate`${fmt(s.chunkGap.p50, 1)} / ${fmt(s.chunkGap.p99, 1)} 毫秒`);
    }
    if (d) {
      r(translate`${d.n} 路同时解码吞吐`, fmtRate(d.overlap?.throughput, d.overlapEstimate?.throughput));
      const window = d.overlap ?? d.overlapEstimate;
      if (window) r(translate('共同解码窗口 / 输出量'), `${fmtS(window.windowMs)} / ${d.overlap ? '' : '≈'}${fmt(window.tokens, 0)} tokens`);
      r(translate('并发 端到端输出吞吐'), fmtRate(d.throughput));
      const estimate = d.estimatedStats;
      const mean = fmtRate(d.avgSpeed, estimate?.avg);
      const range = d.avgSpeed ?? estimate?.avg;
      r(translate('各路解码速率平均（最慢~最快）'), range == null ? mean
        : `${mean}（${fmt(d.minSpeed ?? estimate?.min, 1)}–${fmt(d.maxSpeed ?? estimate?.max, 1)}）`);
      r(translate('并发 平均首包'), fmtS(d.ttft && d.ttft.avg));
      r(translate('缓存命中率'), d.cacheHitRate != null ? `${(d.cacheHitRate * 100).toFixed(1)}%` : translate('服务未返回'));
      if (d.chunkGap) r(translate('并发 输出块间隔 P50 / P99'), translate`${fmt(d.chunkGap.p50, 1)} / ${fmt(d.chunkGap.p99, 1)} 毫秒`);
      r(translate('并发用时 / 总生成'), translate`${(d.windowMs / 1000).toFixed(1)} 秒 / ${fmt(d.totalTokens, 0)} tokens`);
      if (d.failed) r(translate('并发失败'), translate`${d.failed} 路`, 'err');
    }
    const errs = [].concat((p && p.errors) || [], (d && d.errors) || []);
    if (errs.length) r(translate('错误信息'), esc(localizeError(errs[0])), 'err');
    $('#dTable').innerHTML = rows.join('');
    $('#result').hidden = false;

    // 出场动画：成绩依次弹出 → 速度条展开 → 盖章
    const tl = $$('.r-tile');
    tl.forEach((el, i) => anim(el, [{ transform: 'translateY(30px) scale(.7)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: i * 140, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' }));
    setTimeout(() => $$('.rb i b').forEach((b) => (b.style.width = b.dataset.w + '%')), still ? 0 : 400);
    const stamp = $('#rStamp');
    if (stamp) {
      if (still) stamp.style.opacity = 1;
      else
        setTimeout(() => {
          stamp.style.opacity = 1;
          anim(stamp, [{ transform: 'scale(1.15) rotate(-22deg)', opacity: 0 }, { transform: 'scale(.92) rotate(-12deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1) rotate(-12deg)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.5,0,.75,0)' });
          setTimeout(() => {
            shake($('#result'), 1);
            SFX.stamp();
          }, 300);
        }, tl.length * 140 + 300);
    }
  }

  // ---------------- 分享 / 复制
  function resultText() {
    const { ping, prefill: p, single: s, decode: d, cfg } = S;
    const L = [translate`【TokenSpeed 大模型 API 测速】`, translate`模型：${cfg.model}（${host(cfg.baseUrl)}）`];
    if (ping) L.push(translate`响应延迟：${fmt(ping.min, 0)} 毫秒`);
    if (p) L.push(translate`首包前有效输入吞吐：${fmtRate(p.throughput)}`);
    if (s) L.push(translate`单发 2 秒峰值：${fmtRate(s.peak, s.peakEstimate)}，解码平均 ${fmtRate(s.speed, s.speedEstimate)}，端到端吞吐 ${fmtRate(s.e2eSpeed)}${s.byUser ? translate('（提前结束）') : ''}`);
    if (d) {
      const window = d.overlap ?? d.overlapEstimate;
      L.push(translate`${d.n} 路同时解码：${fmtRate(d.overlap?.throughput, d.overlapEstimate?.throughput)}${window ? translate`（共同窗口 ${fmtS(window.windowMs)}）` : ''}`);
      L.push(translate`整轮端到端输出吞吐：${fmtRate(d.throughput)}${d.byUser ? translate('（提前结束）') : ''}`);
    }
    return L.join('\n');
  }

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  // 扁平卡片：先画硬投影，再画带描边的色块
  function flatBox(c, x, y, w, h, r, fill, sh = 8) {
    rr(c, x + sh, y + sh, w, h, r);
    c.fillStyle = COL.ink;
    c.fill();
    rr(c, x, y, w, h, r);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = COL.ink;
    c.stroke();
  }

  function shareImage() {
    const { ping, prefill: p, single: s, decode: d, cfg } = S;
    const items = [];
    if (ping) items.push([translate('响应延迟'), fmt(ping.min, 0), 'ms', COL.z1, COL.ink]);
    if (p) items.push([translate('有效输入吞吐'), fmt(p.throughput, 1), p.throughput == null ? translate('不可用') : 'tok/s', COL.z2, COL.ink]);
    if (s) {
      const metric = singleMetric(s);
      const title = s.byUser && (s.peak ?? s.peakEstimate) != null ? translate('单发峰值（提前结束）') : metric.title;
      items.push([title, fmtMeasured(metric.value, metric.estimate), metric.value == null && metric.estimate == null ? translate('不可用') : 'tok/s', COL.z3, '#fff']);
    }
    if (d) {
      const metric = decodeMetric(d);
      items.push([metric.title, fmtMeasured(metric.value, metric.estimate), metric.value == null && metric.estimate == null ? translate('不可用') : 'tok/s', COL.c1, '#fff']);
    }
    const bars = decodeBars(d);
    const tw = (1080 - 160 - 30) / 2, th = 200, rowH = 50;
    // 先排版再定画布高度，行数多时整张图变长，元素不挤在一起
    const y0 = 400 + Math.ceil(items.length / 2) * (th + 34) + 20;
    const barsEnd = bars.length >= 2 ? y0 + 60 + bars.length * rowH : y0;
    const W = 1080, H = Math.max(1350, barsEnd + 110);
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const c = cv.getContext('2d');
    const font = (w, sz) => `${w} ${sz}px ${sans}`;
    c.fillStyle = COL.bg;
    c.fillRect(0, 0, W, H);
    const [ri, rname] = mainRating();
    // 装饰色块：只放在右上角留白处；有评级章时让位给章
    if (!ri) {
      c.fillStyle = COL.z1;
      c.strokeStyle = COL.ink;
      c.lineWidth = 5;
      c.beginPath();
      c.arc(940, 120, 36, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.fillStyle = COL.ink;
    c.font = font(900, 46);
    c.fillText('TokenSpeed', 80, 130);
    c.font = font(700, 28);
    c.fillStyle = COL.muted;
    c.fillText(translate('大模型 API 测速报告'), 80, 176);
    c.fillStyle = COL.ink;
    c.font = font(900, 60);
    let model = cfg.model;
    while (c.measureText(model).width > W - 160 && model.length > 4) model = model.slice(0, -2);
    c.fillText(model === cfg.model ? model : model + '…', 80, 290);
    c.font = font(600, 28);
    c.fillStyle = COL.muted;
    c.fillText(`${host(cfg.baseUrl)} · ${new Date().toLocaleString(locale.language)}`, 80, 338);

    items.forEach((it, i) => {
      const x = 80 + (i % 2) * (tw + 30), y = 400 + Math.floor(i / 2) * (th + 34);
      flatBox(c, x, y, tw, th, 28, it[3]);
      c.fillStyle = it[4];
      c.font = font(800, 30);
      c.fillText(it[0], x + 30, y + 56, tw - 60);
      c.font = font(900, 84);
      const maxValueWidth = tw - 180;
      const valueWidth = c.measureText(it[1]).width;
      if (valueWidth > maxValueWidth) c.font = font(900, Math.floor(84 * maxValueWidth / valueWidth));
      c.fillText(it[1], x + 30, y + 150);
      const vw = c.measureText(it[1]).width;
      c.font = font(700, 28);
      c.fillText(it[2], x + 40 + vw, y + 150);
    });
    // 评级章
    if (ri) {
      c.save();
      c.translate(W - 165, 130);
      c.rotate(-0.21);
      c.beginPath();
      c.arc(8, 8, 82, 0, Math.PI * 2);
      c.fillStyle = COL.ink;
      c.fill();
      c.beginPath();
      c.arc(0, 0, 82, 0, Math.PI * 2);
      c.fillStyle = COL.z3;
      c.fill();
      c.lineWidth = 6;
      c.strokeStyle = COL.ink;
      c.stroke();
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.font = font(900, rname.length > 2 ? 36 : 46);
      c.fillText(rname, 0, rname.length > 2 ? 13 : 16, 108);
      c.restore();
      c.textAlign = 'left';
    }
    // 各领域速度
    if (bars.length >= 2) {
      c.fillStyle = COL.ink;
      c.font = font(800, 30);
      c.fillText(translate('各领域单路速度（tok/s）'), 80, y0 + 20);
      const mx = Math.max(...bars.map((l) => l.speed));
      bars.forEach((l, i) => {
        const y = y0 + 50 + i * rowH;
        c.font = font(700, 24);
        c.fillStyle = COL.ink;
        c.fillText(translate(l.domain), 80, y + 26);
        const bx = 270, bw = W - 80 - bx - 110;
        rr(c, bx, y + 6, bw, 26, 8);
        c.fillStyle = COL.tint;
        c.fill();
        rr(c, bx, y + 6, Math.max(14, (bw * l.speed) / mx), 26, 8);
        c.fillStyle = laneCol(l.i);
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = COL.ink;
        c.stroke();
        c.font = font(900, 26);
        c.fillStyle = COL.ink;
        c.textAlign = 'right';
        c.fillText(barSpeed(l), W - 80, y + 28);
        c.textAlign = 'left';
      });
    }
    c.fillStyle = COL.muted;
    c.font = font(600, 22);
    c.fillText(translate`测试方法：${d ? d.n : cfg.concurrency} 路 × ${fmtTok(cfg.contextTokens)} 领域资料，读取后复用前缀并发生成`, 80, H - 60, 920);
    cv.toBlob((b) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `TokenSpeed-${cfg.model.replace(/[^\w.-]+/g, '_')}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      toast(translate('分享图已保存'));
    });
  }

  // ---------------- 历史
  function saveHistory() {
    const { ping, prefill: p, single: s, decode: d, cfg } = S;
    const h = loadHist();
    h.unshift({
      metricsVersion: 2, t: Date.now(), model: cfg.model, host: host(cfg.baseUrl), thinkingMode: cfg.thinkingMode,
      ping: ping && ping.min, prefill: p && p.throughput, single: s && !s.byUser ? s.peak : null,
      singleEstimate: s && !s.byUser ? s.peakEstimate : null,
      singleE2E: s?.e2eSpeed ?? null, decode: d && d.throughput, decodeOverlap: d ? d.overlap?.throughput ?? null : undefined,
      decodeEstimate: d?.overlapEstimate?.throughput, n: d && d.n,
    });
    store.set('ts3.hist', h.slice(0, 50));
  }
  function renderHist() {
    const h = loadHist();
    $('#hist').innerHTML = h.length
      ? h
          .map(
            (x) => `<div class="h-item"><div class="h-top"><b>${esc(x.model)}</b><span>${new Date(x.t).toLocaleString(locale.language)}</span></div>
            <div class="h-host">${esc(x.host)}${thinkingLabels[x.thinkingMode] && x.thinkingMode !== 'default' ? translate(' · 思考') + translate(thinkingLabels[x.thinkingMode]) : ''}${x.metricsVersion === 2 ? '' : translate(' · 旧版统计口径')}</div>
            <div class="h-vals"><div>${translate('延迟')}<b>${x.ping != null ? fmt(x.ping, 0) : '—'}</b></div>
            <div>${translate('读取')}<b>${fmt(x.prefill, 1)}</b></div>
            <div>${translate(x.single == null && x.singleEstimate == null && x.singleE2E != null ? '单发端到端' : '峰值')}<b>${fmtMeasured(x.single ?? (x.singleEstimate == null ? x.singleE2E : null), x.singleEstimate)}</b></div>
            <div>${translate(x.decodeOverlap != null || x.decodeEstimate != null || x.decode == null ? '同时解码' : '并发端到端')}<b>${fmtMeasured(x.decodeOverlap ?? (x.decodeEstimate == null ? x.decode : null), x.decodeEstimate)}</b></div></div></div>`
          )
          .join('')
      : `<div class="h-empty">${translate('还没有测速记录')}</div>`;
  }

  const board = $('#rankings');
  const publishDialog = $('#publishRanking');
  let rankingsEnabled = false;
  let rankingsLoad;

  function rankingScores() {
    const { summary, demo, error, prefill, single, decode } = S;
    if (!summary || demo || error || single?.byUser || decode?.byUser) return null;
    const scores = { prefill: prefill?.throughput, peak: single?.peak, decode: decode?.overlap?.throughput };
    return Object.values(scores).every((value) => Number.isFinite(value) && value >= 0.1) ? scores : null;
  }

  function syncRankingAction() {
    const canPublish = Boolean(rankingScores());
    $('#btnPublishRanking').hidden = !rankingsEnabled || !canPublish || Boolean(S.rankingSubmitted);
    $('#rankUnavailable').hidden = !rankingsEnabled || !S.summary || S.demo || canPublish;
  }

  async function loadRankings() {
    rankingsLoad?.abort();
    const request = new AbortController();
    rankingsLoad = request;
    const status = $('#rankingsStatus');
    const table = $('#rankingsTable');
    table.hidden = true;
    status.textContent = translate('正在读取榜单…');
    try {
      const response = await fetch('./api/rankings?sort=' + encodeURIComponent($('#rankingSort').value), { signal: request.signal });
      if (!response.ok) throw new Error();
      const { entries } = await response.json();
      if (request.signal.aborted) return;
      $('#rankingsRows').innerHTML = entries.map((entry, i) => `<tr>
        <td>${i + 1}</td>
        <th scope="row"><strong>${esc(entry.model)}</strong><small>${esc(entry.device)}</small><small>${esc(entry.framework)}</small></th>
        <td><strong>${fmt(entry.score, 0)}</strong></td>
        <td>${fmt(entry.prefill, 1)}</td><td>${fmt(entry.peak, 1)}</td><td>${fmt(entry.decode, 1)}</td>
      </tr>`).join('');
      table.hidden = !entries.length;
      status.textContent = entries.length ? '' : translate('还没有公开成绩。');
    } catch (_) {
      if (!request.signal.aborted) status.textContent = translate('榜单暂时无法读取，请稍后重试。');
    }
  }

  function showRankings() {
    if (!rankingsEnabled) return;
    if (!board.open) board.showModal();
    history.replaceState(null, '', '#rankings');
    loadRankings();
  }

  $('#btnRankings').addEventListener('click', showRankings);
  $('#rankingSort').addEventListener('change', loadRankings);
  board.addEventListener('close', () => {
    rankingsLoad?.abort();
    if (location.hash === '#rankings') history.replaceState(null, '', location.pathname + location.search);
  });
  window.addEventListener('hashchange', () => {
    if (location.hash === '#rankings') showRankings();
    else if (board.open) board.close();
  });

  $('#btnPublishRanking').addEventListener('click', () => {
    const scores = rankingScores();
    if (!scores) return;
    $('#rankModel').textContent = S.cfg.model;
    $('#rankPrefill').textContent = fmtRate(scores.prefill);
    $('#rankPeak').textContent = fmtRate(scores.peak);
    $('#rankDecode').textContent = fmtRate(scores.decode);
    $('#rankForm').reset();
    $('#rankSubmitStatus').textContent = '';
    publishDialog.showModal();
  });
  $('#btnCancelRanking').addEventListener('click', () => publishDialog.close());
  publishDialog.addEventListener('cancel', (event) => {
    if ($('#btnConfirmRanking').disabled) event.preventDefault();
  });
  $('#rankForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const scores = rankingScores();
    const confirm = $('#btnConfirmRanking');
    if (!scores || confirm.disabled) return;
    const cancel = $('#btnCancelRanking');
    const status = $('#rankSubmitStatus');
    confirm.disabled = cancel.disabled = true;
    status.textContent = translate('正在提交…');
    try {
      const response = await fetch('./api/rankings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: S.cfg.model, device: $('#rankDevice').value, framework: $('#rankFramework').value, scores }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || translate('提交失败'));
      if (result.status === 'below_limit') {
        status.textContent = translate('本次综合分未进入榜单。');
        return;
      }
      S.rankingSubmitted = true;
      syncRankingAction();
      publishDialog.close();
      toast(result.status === 'kept' ? translate('榜单保留该组合的更高成绩') : translate('成绩已公开'));
      showRankings();
    } catch (error) {
      status.textContent = localizeError(error.message) || translate('提交失败，请稍后重试。');
    } finally {
      confirm.disabled = cancel.disabled = false;
    }
  });

  // ---------------- 按钮
  $('#btnStart').addEventListener('click', () => start(false));
  $('#btnDemo').addEventListener('click', () => start(true));
  $('#btnAgain').addEventListener('click', () => start(S.demo));
  $('#btnBack').addEventListener('click', () => showView('setup'));
  $('#btnShare').addEventListener('click', shareImage);
  $('#btnCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resultText());
      toast(translate('已复制，可以直接粘贴分享'));
    } catch (_) {
      toast(translate('复制失败，请手动选择文字'), true);
    }
  });
  $('#btnStop').addEventListener('click', () => {
    if (S.runId) fetch('./api/stop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S.runId }) }).catch(() => {});
    S.error = '已停止';
    S.ctrl && S.ctrl.abort();
  });
  $('#btnEndDecode').addEventListener('click', () => {
    $('#btnEndDecode').hidden = true;
    if (S.directCtl) S.directCtl.stopDecode?.();
    else if (S.runId) fetch('./api/stop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: S.runId, scope: 'decode' }) }).catch(() => {});
  });
  $('#btnHistory').addEventListener('click', () => {
    renderHist();
    $('#sheet').classList.add('open');
  });
  $$('#sheet [data-close]').forEach((e) => e.addEventListener('click', () => $('#sheet').classList.remove('open')));
  $('#btnClearHist').addEventListener('click', () => {
    store.del('ts3.hist');
    renderHist();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $('#sheet').classList.remove('open');
  });

  const languageButton = $('#btnLanguage');
  function syncLanguageButton() {
    const chinese = locale.language === 'zh-CN';
    languageButton.disabled = Boolean(S.running);
    languageButton.textContent = chinese ? 'EN' : '中文';
    const label = chinese ? '切换为英文' : 'Switch to Chinese';
    languageButton.setAttribute('aria-label', label);
    languageButton.title = S.running
      ? (chinese ? '测速完成后可切换语言' : 'Language can be changed after the benchmark')
      : label;
  }

  languageButton.addEventListener('click', () => {
    if (S.running) return;
    locale.setLanguage(locale.language === 'zh-CN' ? 'en' : 'zh-CN');
    fmtUsage = new Intl.NumberFormat(locale.language, { notation: 'compact', maximumFractionDigits: 1 });
    syncLanguageButton();
    syncSoundBtn();
    $$('#chips .chip').forEach((button, i) => { button.textContent = translate(PROVIDERS[i].name); });
    syncModelPlaceholder(PROVIDERS.find((item) => item.id === provider));
    syncModelHint();
    syncThinking();
    const advanced = $('#adv');
    $('#btnAdv').textContent = translate(advanced.hidden ? '高级设置' : '收起高级设置');
    if ($('#btnModels').classList.contains('loading')) $('#btnModels').textContent = translate('获取中');
    updateCost();
    renderExplain();
    syncTestHeading();
    if (!$('#viewTest').hidden && !$('#result').hidden) {
      for (const lane of V.lanes) {
        if (lane.final?.ok) renderLaneRate(lane);
      }
      renderResult();
    }
  });

  restore();
  syncLanguageButton();
  fetch('./api/info').then((response) => response.json()).then((info) => {
    rankingsEnabled = info.rankings === true;
    $('#btnRankings').hidden = !rankingsEnabled;
    syncRankingAction();
    if (location.hash === '#rankings') showRankings();
  }).catch(() => {});
})();
