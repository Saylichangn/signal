/* ============================================================
   SIGNAL — interaction layer
   Everything runs locally. Text you write is saved in this browser.
   ============================================================ */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('signal_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('signal_' + k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  /* ---------- backgrounds from data-bg ---------- */
  $$('[data-bg]').forEach(el => el.style.setProperty('--bg-img', `url("${el.dataset.bg}")`));

  /* ---------- navigation ---------- */
  const nav = $('#mainNav');
  const menuToggle = $('#menuToggle');
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => {
    document.getElementById(b.dataset.goto)?.scrollIntoView({ behavior: 'smooth' });
  }));
  const navLinks = $$('#mainNav a');
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = '#' + e.target.id;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => io.observe(s));

  /* ---------- console modal ---------- */
  const modal = $('#consoleModal');
  const journal = $('#journal');
  journal.value = store.get('journal', '');
  function openModal() { modal.classList.add('open'); document.body.style.overflow = 'hidden'; setTimeout(() => journal.focus(), 60); }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  $$('[data-open-console]').forEach(b => b.addEventListener('click', openModal));
  $$('[data-close-modal]').forEach(b => b.addEventListener('click', closeModal));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  function wordCount() { const n = journal.value.trim() ? journal.value.trim().split(/\s+/).length : 0; $('#wordCount').textContent = n + ' WORD' + (n === 1 ? '' : 'S'); }
  journal.addEventListener('input', () => { store.set('journal', journal.value); wordCount(); $('#journalStatus').textContent = 'SAVED LOCALLY · JUST NOW'; });
  wordCount();
  $$('[data-prompt]').forEach(b => b.addEventListener('click', () => {
    const prompt = b.dataset.prompt;
    if (journal.value && !journal.value.endsWith('\n')) journal.value += '\n\n';
    journal.value += prompt + '\n';
    journal.dispatchEvent(new Event('input'));
    journal.focus();
  }));
  $('#clearJournal').addEventListener('click', () => {
    if (!journal.value || confirm('Clear the open channel? This cannot be undone.')) {
      journal.value = ''; journal.dispatchEvent(new Event('input')); toast('CHANNEL CLEARED');
    }
  });
  function renderSaved() {
    const saved = store.get('entries', []);
    $('#savedList').innerHTML = saved.slice(-5).reverse().map(e =>
      `<div class="saved-entry"><span>${e.date}</span><div>${escapeHtml(e.text).slice(0, 180)}</div></div>`).join('');
  }
  function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function saveEntry(text) {
    const entries = store.get('entries', []);
    entries.push({ date: new Date().toLocaleString(), text });
    store.set('entries', entries);
    renderSaved();
  }
  renderSaved();
  $('[data-saved-records]').addEventListener('click', e => { e.preventDefault(); openModal(); renderSaved(); });
  $('#findLine').addEventListener('click', () => toast('IF YOU ARE IN DANGER, CALL YOUR LOCAL EMERGENCY NUMBER NOW.'));
  $('#printCard').addEventListener('click', () => window.print());

  /* ---------- rotating field-note quote ---------- */
  const quoteBlock = $('#quoteBlock');
  const quotes = [
    {
      text: "I don't need to be fixed. I need a hand on the dial until I can reach it myself.",
      source: '— FIELD NOTE 212 · TRANSCRIBED WITH PERMISSION'
    },
    {
      text: 'Not everything needs an answer, not every feeling needs an action, and not every moment needs to be understood.',
      source: '— FIELD NOTE 213 · TRANSCRIBED WITH PERMISSION'
    },
    {
      text: 'I am allowed to feel deeply without letting my emotions control me.',
      source: '— FIELD NOTE 214 · TRANSCRIBED WITH PERMISSION'
    }
  ];
  let quoteIndex = 0, quoteBusy = false;
  function swapQuote() {
    if (quoteBusy) return;
    quoteBusy = true;
    quoteBlock.classList.add('swapping');
    setTimeout(() => {
      quoteIndex = (quoteIndex + 1) % quotes.length;
      $('#quoteText').textContent = quotes[quoteIndex].text;
      $('#quoteSource').textContent = quotes[quoteIndex].source;
      quoteBlock.classList.remove('swapping');
      quoteBusy = false;
    }, 180);
  }
  quoteBlock.addEventListener('click', swapQuote);
  quoteBlock.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); swapQuote(); }
  });

  /* ---------- canvas helpers ---------- */
  function fitCanvas(cv) {
    const r = cv.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: r.width, h: r.height };
  }

  /* ---------- monitor ---------- */
  const monitor = $('#monitorCanvas');
  let scrub = 0, dragging = false, startX = 0, startScrub = 0;
  monitor.addEventListener('pointerdown', e => { dragging = true; startX = e.clientX; startScrub = scrub; monitor.setPointerCapture(e.pointerId); });
  monitor.addEventListener('pointermove', e => { if (dragging) { scrub = clamp(startScrub + (startX - e.clientX) / 6, 0, 7200); updateWaveTime(); } });
  monitor.addEventListener('pointerup', () => { dragging = false; });
  monitor.addEventListener('pointercancel', () => { dragging = false; });
  function updateWaveTime() {
    const s = Math.floor(scrub);
    $('#waveTime').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function drawMonitor(t) {
    const { ctx, w, h } = fitCanvas(monitor);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(214,190,145,.07)'; ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 44) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const emo = +$('[data-fader="anxiety"] input').value / 100;
    const rea = +$('[data-fader="rumination"] input').value / 100;
    const ten = +$('[data-fader="tension"] input').value / 100;
    // Both channels are clean sinusoids: y = A·sin(2πft + φ).
    // Same amplitude and frequency; only the phase offset differs.
    const wave = (color, phase, amp) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.8;
      for (let x = 0; x <= w; x += 2) {
        const p = (x / w) * 5 * Math.PI * 2 + phase;
        const y = h / 2 + Math.sin(p) * amp * (h * .30);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    const phase = t * .0012 + scrub * .02;
    const amp = .25 + (emo + rea + ten) / 3 * .45;
    wave('rgba(217,154,108,.9)', phase, amp);
    wave('rgba(217,232,165,.9)', phase + Math.PI / 2, amp);
  }

  /* ---------- faders ---------- */
  $$('.fader').forEach(f => {
    const input = $('input', f), out = $('output', f);
    const sync = () => { out.textContent = input.value; updateFaderReadout(); };
    input.addEventListener('input', sync); sync();
  });
  function updateFaderReadout() {
    const a = +$('[data-fader="anxiety"] input').value;
    const r = +$('[data-fader="rumination"] input').value;
    $('#signalStrength').textContent = 'SIGNAL ' + Math.round((a + r) / 2 + 15) + '%';
    store.set('faders', { a, r, t: +$('[data-fader="tension"] input').value });
  }
  const savedFaders = store.get('faders', null);
  if (savedFaders) {
    $('[data-fader="anxiety"] input').value = savedFaders.a;
    $('[data-fader="rumination"] input').value = savedFaders.r;
    $('[data-fader="tension"] input').value = savedFaders.t;
    $$('.fader').forEach(f => { $('output', f).textContent = $('input', f).value; });
    updateFaderReadout();
  }

  /* ---------- wise mind ---------- */
  const wiseSlider = $('#wiseSlider');
  const wiseInput = $('#wiseInput');
  wiseInput.textContent = store.get('wise', wiseInput.textContent);
  wiseInput.addEventListener('input', () => {
    store.set('wise', wiseInput.textContent);
    $('#wiseCount').textContent = String(Math.min(99, wiseInput.textContent.split(/\s+/).length)).padStart(2, '0') + ' / 30';
  });
  function lightBars() {
    const v = +wiseSlider.value / 100;
    $$('.bar-col').forEach((col, ci) => {
      $$('span', col).forEach((s, i) => {
        const level = (i + 1) / 8;
        const on = ci === 0 ? level < 1 - v + .25 : level < v + .25;
        s.classList.toggle('on', on);
      });
    });
  }
  wiseSlider.addEventListener('input', lightBars); lightBars();
  $('#holdBtn').addEventListener('click', e => { e.currentTarget.classList.toggle('on'); toast(e.currentTarget.classList.contains('on') ? 'HOLDING — NOT ACTING YET' : 'RELEASED'); });
  $('#turnBtn').addEventListener('click', e => { e.currentTarget.classList.toggle('on'); toast(e.currentTarget.classList.contains('on') ? 'TURNING TOWARD — ONE SMALL MOVE' : 'BACK TO CENTER'); });

  /* ---------- STOP dial ---------- */
  const stopBtn = $('#stopBtn'), stopProgress = $('#stopProgress'), stopLabel = $('#stopLabel'), stopSub = $('#stopSub');
  const phases = ['STOP', 'STEP BACK', 'OBSERVE', 'PROCEED'];
  let stopTimer = null, stopElapsed = 0;
  const CIRC = 2 * Math.PI * 92;
  function renderStop() {
    stopProgress.style.strokeDashoffset = String(CIRC * (1 - stopElapsed / 20));
    const idx = Math.min(3, Math.floor(stopElapsed / 5));
    stopLabel.textContent = phases[idx];
    stopSub.textContent = stopTimer ? `${Math.ceil(20 - stopElapsed)} SEC` : 'TAP TO BEGIN';
    $$('#stopPhases i').forEach((el, i) => el.classList.toggle('on', stopTimer && i <= idx));
  }
  stopBtn.addEventListener('click', () => {
    if (stopTimer) { clearInterval(stopTimer); stopTimer = null; stopElapsed = 0; renderStop(); toast('STOPPED — YOU CAN RESTART ANYTIME'); return; }
    stopTimer = setInterval(() => {
      stopElapsed += .1;
      if (stopElapsed >= 20) { clearInterval(stopTimer); stopTimer = null; stopElapsed = 20; renderStop(); toast('WAVE CRESTED — PROCEED MINDFULLY'); setTimeout(() => { stopElapsed = 0; renderStop(); }, 1500); return; }
      renderStop();
    }, 100);
    renderStop(); toast('S — STOP. LET THE FIRST FIVE SECONDS PASS.');
  });
  renderStop();

  /* ---------- TIPP ---------- */
  $$('.tipp-row input').forEach((cb, i) => {
    cb.checked = store.get('tipp' + i, false);
    cb.addEventListener('change', () => { store.set('tipp' + i, cb.checked); toast(cb.checked ? 'TIPP SWITCH ON — CHANGE THE BODY FIRST' : 'TIPP SWITCH OFF'); });
  });
  const dive = $('#diveSlider'), diveBars = $('#diveBars');
  for (let i = 0; i < 28; i++) diveBars.appendChild(document.createElement('i'));
  function renderDive() {
    const v = +dive.value;
    $$('i', diveBars).forEach((b, i) => b.classList.toggle('on', i < Math.round(v / 100 * 28)));
    $('#diveValue').textContent = v < 35 ? '-18% · DIP' : v > 70 ? '+6% · RISING' : 'BASELINE';
    store.set('dive', v);
  }
  dive.value = store.get('dive', 50); dive.addEventListener('input', renderDive); renderDive();

  /* ---------- opposite action graph ---------- */
  const oppCanvas = $('#oppositeCanvas'), invertToggle = $('#invertToggle');
  function drawOpposite(t) {
    const { ctx, w, h } = fitCanvas(oppCanvas);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(214,190,145,.1)'; ctx.lineWidth = 1;
    for (let y = 0; y < h; y += h / 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(214,190,145,.3)'; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    const inv = invertToggle.checked;
    // green smooth trend line
    ctx.beginPath(); ctx.strokeStyle = '#c7daa0'; ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 3) {
      const y = h * .52 + Math.sin(x / w * Math.PI * 1.4 + .4) * h * .045 * (inv ? 1 : -1);
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // orange volatile urge line
    ctx.beginPath(); ctx.strokeStyle = '#c98a5f'; ctx.lineWidth = 1.3;
    for (let x = 0; x <= w; x += 2) {
      const p = x / w;
      const noise = Math.sin(p * 41 + t * .002) * .5 + Math.sin(p * 97 + t * .0031) * .3 + Math.sin(p * 23 - t * .001) * .2;
      const envelope = .5 + .5 * Math.sin(p * Math.PI);
      const y = h * .52 + noise * h * .12 * envelope * (inv ? 1 : -1) - (inv ? 0 : 0);
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
  invertToggle.addEventListener('change', () => toast(invertToggle.checked ? 'INVERTED — ACT AGAINST THE URGE' : 'URGE VIEW — NOTICE WITHOUT ACTING'));

  /* ---------- check the facts ---------- */
  const predSlider = $('#predictedSlider'), repSlider = $('#reportedSlider');
  function renderFacts() {
    $('#predictedVal').textContent = `${predSlider.value} / 10 ` + (+predSlider.value >= 8 ? 'unbearable' : +predSlider.value >= 5 ? 'uncomfortable' : 'manageable');
    $('#reportedVal').textContent = `${repSlider.value} / 10, lasted ${repSlider.value * 5} min`;
  }
  [predSlider, repSlider].forEach(s => s.addEventListener('input', renderFacts)); renderFacts();
  $('#forecastBtn').addEventListener('click', () => {
    const a = predSlider.value; predSlider.value = repSlider.value; repSlider.value = a; renderFacts();
    toast('FORECAST AND REPORT SWAPPED — SEE THE GAP');
  });
  ['predictedThought', 'reportedThought'].forEach(id => {
    const el = $('#' + id);
    el.textContent = store.get(id, el.textContent);
    el.addEventListener('input', () => store.set(id, el.textContent));
  });
  $$('#factQuestions [contenteditable]').forEach((el, i) => {
    el.textContent = store.get('factQ' + i, el.textContent);
    el.addEventListener('input', () => store.set('factQ' + i, el.textContent));
  });

  /* ---------- window of tolerance ---------- */
  const tolSlider = $('#tolSlider'), tolMarker = $('#tolMarker');
  tolSlider.value = store.get('tol', 50);
  function renderTol() {
    tolMarker.style.left = tolSlider.value + '%';
    store.set('tol', +tolSlider.value);
  }
  tolSlider.addEventListener('input', renderTol); renderTol();

  /* ---------- breathing pacer ---------- */
  const pacerPlay = $('#pacerPlay'), pacerProgress = $('#pacerProgress');
  const P_CIRC = 2 * Math.PI * 160;
  let pacerTimer = null, pacerElapsed = 0; // seconds within 19s cycle
  let pacerTotal = 0, pacerRound = 1;
  function pacerPhase(sec) {
    if (sec < 4) return { name: 'INHALE', left: 4 - sec, color: '#d9e8a5' };
    if (sec < 11) return { name: 'HOLD', left: 11 - sec, color: '#d9e8a5' };
    return { name: 'EXHALE', left: 19 - sec, color: '#d99a6c' };
  }
  function renderPacer() {
    const ph = pacerPhase(pacerElapsed);
    $('#pacerPhase').textContent = ph.name;
    $('#breathPhase').textContent = ph.name + ' · ' + Math.ceil(ph.left);
    $('#pacerCount').textContent = String(Math.ceil(ph.left)).padStart(2, '0');
    pacerProgress.style.stroke = ph.color;
    pacerProgress.style.strokeDashoffset = String(P_CIRC * (1 - pacerElapsed / 19));
    $('#pacerTime').textContent = `${String(Math.floor(pacerTotal / 60)).padStart(2, '0')}:${String(Math.floor(pacerTotal % 60)).padStart(2, '0')}`;
    $('#roundLabel').textContent = `ROUND ${pacerRound}/8`;
  }
  function setPacer(on) {
    if (on) {
      if (pacerTimer) return;
      pacerTimer = setInterval(() => {
        pacerElapsed += .1; pacerTotal += .1;
        if (pacerElapsed >= 19) { pacerElapsed = 0; pacerRound = pacerRound >= 8 ? 1 : pacerRound + 1; }
        if (pacerTotal >= 180) { setPacer(false); toast('THREE MINUTES COMPLETE — NOTICE THE SIGNAL'); pacerTotal = 0; }
        renderPacer();
      }, 100);
      pacerPlay.textContent = '❚❚';
      toast('PACER RUNNING — INHALE 4, HOLD 7, EXHALE 8');
    } else {
      clearInterval(pacerTimer); pacerTimer = null; pacerPlay.textContent = '▶';
    }
    renderPacer();
  }
  pacerPlay.addEventListener('click', () => setPacer(!pacerTimer));
  $$('[data-play-pacer]').forEach(b => b.addEventListener('click', () => {
    $('#mindfulness').scrollIntoView({ behavior: 'smooth' }); setPacer(true);
  }));
  $('[data-calibrate]').addEventListener('click', () => {
    $('#mindfulness').scrollIntoView({ behavior: 'smooth' }); setPacer(true); toast('2-MIN CALIBRATION — PACER STARTED');
  });
  renderPacer();

  /* ---------- grounding ---------- */
  $$('.ground-row').forEach((row, ri) => {
    const dots = $$('i', $('.dots', row));
    dots.forEach((d, i) => d.addEventListener('click', () => {
      d.classList.toggle('on');
      store.set('ground' + ri, dots.map(x => x.classList.contains('on')));
    }));
    const saved = store.get('ground' + ri, null);
    if (saved) saved.forEach((on, i) => dots[i]?.classList.toggle('on', on));
  });

  /* ---------- DEAR MAN ---------- */
  $$('.out-line div[contenteditable]').forEach((el, i) => {
    el.textContent = store.get('dear' + i, el.textContent);
    el.addEventListener('input', () => store.set('dear' + i, el.textContent));
  });
  $('#repatchBtn').addEventListener('click', () => {
    const paths = $$('.cables path');
    const p = paths[Math.floor(Math.random() * paths.length)];
    p.classList.remove('flicker'); void p.offsetWidth; p.classList.add('flicker');
    toast('CABLE RE-PATCHED — READ THE OUTPUT OUT LOUD');
  });
  let outTimer = null;
  $('#sendLine').addEventListener('click', () => {
    const sentence = $$('.out-line div').map(d => d.textContent.trim()).filter(Boolean).join(' ');
    if (!sentence) { toast('NOTHING PATCHED YET — WRITE THE SENTENCE FIRST'); return; }
    saveEntry('DEAR MAN → ' + sentence);
    toast('SENT — COPIED TO THE OPEN CHANNEL');
    if (navigator.clipboard) navigator.clipboard.writeText(sentence).catch(() => {});
    clearInterval(outTimer);
    let s = 38;
    $('#outputTimer').textContent = s + ' SEC · OUT LOUD';
    outTimer = setInterval(() => { s--; $('#outputTimer').textContent = Math.max(0, s) + ' SEC · OUT LOUD'; if (s <= 0) clearInterval(outTimer); }, 1000);
  });

  /* ---------- cognitive triangle ---------- */
  /* Static diagram — positions and connectors are fixed to the reference layout. */


  /* ---------- thought record ---------- */
  const recordIds = ['recSituation', 'recThought', 'recFor', 'recAgainst', 'recBalanced'];
  recordIds.forEach(id => {
    const el = $('#' + id);
    el.value = store.get(id, el.value);
    el.addEventListener('input', () => store.set(id, el.value));
  });
  $$('#distortionChips .chip').forEach((c, i) => {
    c.classList.toggle('selected', store.get('dist' + i, i === 0));
    c.addEventListener('click', () => { c.classList.toggle('selected'); store.set('dist' + i, c.classList.contains('selected')); });
  });
  let entryNum = store.get('entryNum', 82);
  $('#entryCount').textContent = `ENTRY ${entryNum} / 83`;
  $('#addEvidence').addEventListener('click', () => {
    const label = document.createElement('label');
    label.innerHTML = '<span>ADDITIONAL EVIDENCE</span><textarea rows="2" placeholder="What else did you notice?"></textarea>';
    $('.record-fields', $('.record-card')).insertBefore(label, $('.balanced'));
    label.querySelector('textarea').focus();
    toast('NEW EVIDENCE LINE ADDED');
  });
  $('#rateBtn').addEventListener('click', () => {
    const cur = store.get('belief', 4);
    const next = cur >= 10 ? 1 : cur + 1;
    store.set('belief', next);
    $('#beliefRate').textContent = `NEW THOUGHT · RATE ${next}/10 BELIEVABLE · ${cur}/10`;
    toast(`BELIEF RATED ${next}/10 — KEEP THE NOTE, NOT THE VERDICT`);
  });
  $('#beliefRate').textContent = `NEW THOUGHT · RATE ${store.get('belief', 4)}/10 BELIEVABLE · 9/10`;
  $('#saveRecord').addEventListener('click', () => {
    const text = recordIds.map(id => $('#' + id).value.trim()).filter(Boolean).join(' | ');
    saveEntry('THOUGHT RECORD → ' + text);
    entryNum++; store.set('entryNum', entryNum);
    $('#recordNum').textContent = String(41 + (entryNum - 82)).padStart(3, '0');
    $('#entryCount').textContent = `ENTRY ${entryNum} / 83`;
    $('#recordMeta').textContent = new Date().toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase() + ' · JUST NOW';
    toast('RECORD SAVED TO THE OPEN CHANNEL');
  });
  $$('.noise').forEach(n => n.addEventListener('click', () => {
    n.style.opacity = n.style.opacity === '.55' ? '1' : '.55';
    toast('ORIGINAL SIGNAL: ' + $('span', n).textContent);
  }));

  /* ---------- the 90-second wave ---------- */
  const waveCanvas = $('#waveCanvas');
  let waveT = 0, wavePlaying = false;
  function waveY(t) {
    if (t <= 90) {
      const p = t / 90;
      return Math.sin(p * Math.PI) * .9 + .05;
    }
    const p = (t - 90) / 220;
    return Math.exp(-p * .55) * Math.sin(p * Math.PI * 2.6) * .3;
  }
  // 0–90s fills the first 45% of the plot; the long replay fills the rest.
  function timeAt(x, w) {
    const p = x / w;
    return p <= .45 ? p / .45 * 90 : 90 + (p - .45) / .55 * 1110;
  }
  function xAt(t, w) {
    return t <= 90 ? t / 90 * w * .45 : w * .45 + (t - 90) / 1110 * w * .55;
  }
  function drawWave() {
    const { ctx, w, h } = fitCanvas(waveCanvas);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(214,190,145,.08)'; ctx.lineWidth = 1;
    for (let y = 0; y <= h; y += h / 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    const chemX = w * .45;
    ctx.strokeStyle = 'rgba(214,190,145,.3)'; ctx.setLineDash([3, 5]);
    ctx.beginPath(); ctx.moveTo(chemX, 0); ctx.lineTo(chemX, h); ctx.stroke(); ctx.setLineDash([]);
    function curve(from, to, dashed, color, width) {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = width;
      if (dashed) ctx.setLineDash([5, 5]);
      for (let x = from; x <= to; x += 2) {
        const t = timeAt(x, w);
        const y = h * .78 - waveY(t) * h * .58;
        x === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    curve(0, chemX, false, '#e8dfcd', 1.6);
    curve(chemX, w, true, '#d99a6c', 1.3);
    // travelling marker
    const mx = xAt(waveT, w);
    const my = h * .78 - waveY(waveT) * h * .58;
    ctx.fillStyle = '#d9e8a5'; ctx.beginPath(); ctx.arc(mx, my, 5, 0, 7); ctx.fill();
    ctx.font = '12px "Barlow Condensed", sans-serif'; ctx.fillStyle = 'rgba(214,190,145,.7)';
    ctx.fillText('RISE', w * .09, h - 12); ctx.fillText('CREST', w * .25, h - 12);
    ctx.fillText('FALL', w * .38, h - 12); ctx.fillText('CHEMISTRY DONE — 90s', chemX + 10, 28);
    ctx.fillText('RE-TRIGGERED BY THE STORY', w * .62, h * .34);
    ctx.fillText('GET OFF AT ANY PEAK', w * .72, h * .46);
    ctx.fillText('SUBSIDES', w * .9, h * .7);
  }
  $('#wavePlay').addEventListener('click', e => {
    wavePlaying = !wavePlaying;
    e.currentTarget.textContent = wavePlaying ? '❚❚' : '▶';
    if (wavePlaying && waveT >= 1200) waveT = 0;
    toast(wavePlaying ? 'WAVE RUNNING — 90 SECONDS OF CHEMISTRY' : 'WAVE PAUSED');
  });

  /* ---------- main animation loop ---------- */
  let last = 0;
  function frame(t) {
    if (t - last > 30) {
      drawMonitor(t); drawOpposite(t);
      if (wavePlaying) { waveT += .05; if (waveT > 1200) { waveT = 1200; wavePlaying = false; $('#wavePlay').textContent = '▶'; } }
      drawWave();
      last = t;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- session count (cosmetic, local only) ---------- */
  const sessions = store.get('sessions', 412);
  $('#sessionCount').textContent = sessions;
  window.addEventListener('beforeunload', () => store.set('sessions', sessions + 1));

  /* ---------- save visible editable content on unload ---------- */
  $$('.editable, .editable-line, [contenteditable][data-placeholder]').forEach(el => {
    if (!el.dataset.bound) {
      el.dataset.bound = '1';
      el.addEventListener('blur', () => { if (el.id) store.set('edit_' + el.id, el.textContent); });
    }
  });
})();
