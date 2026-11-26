// MOM's: 2048 Reminder, web edition. 2048 on the 3D mini-computer, plus a reminder PWA around it.
// Free play is unchanged and never touches an alarm. The alarm board is the same board.js; the rules live in remind.js (pure, tested).
import {newGame, move, encode, decode} from './board.js';
import {mountComputer} from './computer.js';
import * as R from './remind.js';
import * as P from './push.js';
import {copyFor, faceFor, faceUrl, topFace, APP_NAME, HOLD_MS} from './stages.js';

const KEY = 'mom-alarm-2048-web-v1', BEST = 'mom-alarm-2048-web-best-v1'; // BEST = apps.json web.bestKey
const AKEY = 'adhd-alarm-board-v1';                                       // the live alarm occurrence's board, keyed by attempt
const SOUNDS = '/apps/alarm/sounds/';
const SOUND_CAP_MS = 12_000;                             // one bounded play per alert
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clock = ms => new Date(ms).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'});
const when = ms => (new Date(ms).toDateString() === new Date().toDateString() ? 'today' : new Date(ms).toLocaleDateString([], {weekday: 'long'})) + ' ' + clock(ms);
const OUTCOME = {COMPLETED: 'Completed', CANCELLED: 'Stopped (not completed)', MISSED: 'Missed'};
const HTML = `<div class="al"><div class="al-stage"><canvas aria-hidden="true"></canvas></div>
<div class="al-screen" aria-live="polite"><section class="al-menu">
<img class="al-face" alt="" width="96" height="96">
<h1></h1>
<button class="al-rems" type="button">Reminders</button>
<button class="al-start alt" type="button">Free play</button>
<p class="dim"><a href="/download/alarm/">Locked-phone alarm: Android app</a></p></section>
<section class="al-play" hidden><header><strong class="al-mode">FREE PLAY</strong><span class="al-score"></span><button class="al-back alt" type="button">Menu</button></header>
<div class="al-board" role="application" aria-label="2048 board. Swipe or use arrow keys."></div><p class="al-msg" role="status"></p></section></div>
<div class="al-glass" aria-hidden="true"></div>
<div class="al-bar" hidden><button class="al-stop alt" type="button" data-hold="stop">Emergency stop (hold 3 s)</button></div>
<div class="al-rem" hidden></div></div>`;

export async function mountAlarm(host) {
  host.innerHTML = HTML;
  const root = host.firstElementChild, $ = c => root.querySelector('.al-' + c);
  $('menu').querySelector('h1').textContent = APP_NAME;
  let game = null, down = null, disposed = false, comp = null, mode = 'free', boundOcc = null;
  let S = R.load(), sub = false, capError = '';
  const ui = {view: 'home', draft: null, rev: null, err: '', msg: '', text: '', soundErr: '', needTap: false};
  const now = () => Date.now();
  const persist = () => R.save(S);

  // ---- 2048 board (free play and alarm share it) -----------------------------------------------------------
  const rmBoard = () => { try { localStorage.removeItem(AKEY); } catch {} };
  const save = () => {
    try {
      if (mode === 'alarm') { localStorage.setItem(AKEY, JSON.stringify({attempt: R.attemptId(S), enc: encode(game)})); return; }
      localStorage.setItem(KEY, encode(game)); if (game.score > (Number(localStorage.getItem(BEST)) || 0)) localStorage.setItem(BEST, game.score);
    } catch {}
  };
  const draw = () => {
    $('board').replaceChildren(...game.board.flat().map(t => {   // fixed 16 cells, rebuilt each move: the DOM never grows
      const d = document.createElement('div'); d.className = 'cell';
      if (t) { d.dataset.t = t; d.style.setProperty('--t', t); d.textContent = '$' + 2 ** (t - 1); }
      return d;
    }));
    $('score').textContent = '$' + game.score.toLocaleString();
  };
  const show = playing => { $('menu').hidden = playing; $('play').hidden = !playing; };
  const startFree = () => {
    mode = 'free'; boundOcc = null; $('mode').textContent = 'FREE PLAY'; bar();
    let saved = null; try { saved = localStorage.getItem(KEY); } catch {}
    game = (saved && decode(saved)) || newGame();
    $('msg').textContent = 'Free play. Swipe or use arrow keys. It never touches your alarm.';
    show(true); draw();
  };
  const startAlarm = () => {
    if (R.attemptId(S) === null) return;
    mode = 'alarm'; boundOcc = S.occ.id; $('mode').textContent = 'ALARM';
    let saved = null; try { saved = JSON.parse(localStorage.getItem(AKEY)); } catch {}
    game = (saved?.attempt === R.attemptId(S) && decode(saved.enc)) || newGame();
    $('msg').textContent = 'Win or lose this game to finish the alarm. No 2048 tile needed.';
    show(true); draw(); closeRem(); bar();
  };
  const bar = () => {
    const alarm = mode === 'alarm' && S.occ?.status === 'ACTIVE';
    $('bar').hidden = !alarm; root.classList.toggle('has-bar', alarm);
  };
  const endAlarmBoard = text => { mode = 'free'; boundOcc = null; show(false); bar(); ui.msg = text; ui.view = 'home'; openRem(); };
  const finishAlarm = (won, text) => {              // bound to the occurrence this board was started for: a stale board never clears another alarm
    S = (won ? R.win : R.lose)(S, boundOcc, now()); persist(); sync(); sound(); rmBoard(); endAlarmBoard(text);
  };
  const step = dir => {
    if (!game || $('play').hidden) return;
    if (game.over) {
      if (mode === 'alarm') return finishAlarm(false, 'No moves left. Alarm dismissed. Your next reminder stays.');
      game = newGame(); save(); $('msg').textContent = 'New board.'; draw(); return;
    }
    const r = move(game, dir);
    if (!r.changed) return;
    game = r.game; draw();
    if (r.won) {
      if (mode !== 'alarm') { save(); $('msg').textContent = '2048!'; return; }
      return finishAlarm(true, '2048! Alarm dismissed. Your next reminder stays.');
    }
    if (game.over && mode === 'alarm') return finishAlarm(false, 'No moves left. Alarm dismissed. Your next reminder stays.');
    save();
    if (game.over) $('msg').textContent = 'No moves. Tap the board for a new one.';
  };
  const onKey = e => {
    const d = {ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down'}[e.key];
    if (d && !$('play').hidden) { e.preventDefault(); step(d); }
  };
  const board = $('board');
  board.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; board.setPointerCapture?.(e.pointerId); });
  board.addEventListener('pointerup', e => {
    if (!down) return;
    const dx = e.clientX - down[0], dy = e.clientY - down[1]; down = null;
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) { if (game?.over) step('left'); return; }
    step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  });
  board.addEventListener('pointercancel', () => { down = null; });
  addEventListener('keydown', onKey);
  $('start').onclick = startFree;
  $('back').onclick = () => { show(false); bar(); };
  $('rems').onclick = () => { ui.view = S.occ?.status === 'ACTIVE' ? 'alert' : 'home'; openRem(); };

  // ---- foreground sound: plays only while this page is open, only after a user gesture --------------------
  const fg = new Audio(); fg.preload = 'auto';
  let fgMode = null, primed = false;
  const url = (id, ext = 'mp3') => SOUNDS + R.SOUNDS.find(s => s.id === id).file + '.' + ext;
  fg.onended = () => { if (fgMode === 'alarm') fgMode = null; };
  fg.onerror = () => { if (fgMode) { ui.soundErr = 'The sound file could not be loaded.'; fgMode = null; if (!rem.hidden) renderRem(); } };
  const prime = () => {                                    // one silent play inside a tap lets later alarm sounds start without a tap (iOS rule)
    if (primed) return; primed = true;
    fg.muted = true; fg.src = url(R.SOUNDS[0].id);
    fg.play().then(() => { fg.pause(); fg.muted = false; fg.currentTime = 0; }).catch(() => { primed = false; fg.muted = false; });
  };
  addEventListener('pointerdown', prime, {once: false});
  const wantAlarmSound = () => S.occ?.status === 'ACTIVE' && S.session?.state === 'ALERTING' && !!S.schedule?.sound;
  let cap = 0;
  const hush = () => { clearTimeout(cap); if (fgMode === 'alarm') { fg.pause(); fgMode = null; } ui.needTap = false; };
  function sound(play = false) {                           // play = start ONE bounded play for a new alert (restarts, never overlaps); otherwise just silence it if no longer wanted
    if (!wantAlarmSound()) return hush();
    if (!play) return;
    const src = new URL(url(S.schedule.sound), location.href).href;
    clearTimeout(cap); fgMode = 'alarm'; fg.muted = false; fg.loop = false; if (fg.src !== src) fg.src = src; fg.currentTime = 0;
    cap = setTimeout(hush, SOUND_CAP_MS);
    fg.play().then(() => { ui.needTap = false; if (!wantAlarmSound()) hush(); }).catch(() => { ui.needTap = true; if (!rem.hidden) renderRem(); });
  }
  function preview(id) {
    if (fgMode === 'preview' && fg.dataset.id === id) { fg.pause(); fgMode = null; return renderRem(); }
    fg.pause(); fg.dataset.id = id; fgMode = 'preview'; fg.loop = false; fg.muted = false; fg.src = url(id); ui.soundErr = '';
    fg.onended = () => { fgMode = null; if (!rem.hidden) renderRem(); };
    fg.play().catch(() => { ui.soundErr = 'The sound could not play. Check the volume and silent switch.'; fgMode = null; }).finally(() => renderRem());
  }

  // ---- server sync (queued; inert while ADHD_PUSH_ORIGIN is empty) ------------------------------------------
  const same = (a, b) => a.k === b.k && a.id === b.id && a.act === b.act;
  async function sync() {
    if (!P.ADHD_PUSH_ORIGIN || !S.outbox.length) return;
    const sent = S.outbox, left = await P.sync({...S, outbox: sent}), done = sent.filter(o => !left.includes(o));
    S = {...S, outbox: S.outbox.filter(o => !done.some(d => same(d, o)))}; persist(); if (!rem.hidden) renderRem();
  }
  const capNow = () => P.capability(P.detect(sub, capError));

  // ---- the reminders panel ------------------------------------------------------------------------------------
  // Anything user-typed goes through txt(): the markup gets an empty <span data-s>, and renderRem() sets its textContent. Never innerHTML.
  const rem = $('rem');
  let slots = [], holdT = 0;
  const txt = v => `<span data-s="${slots.push(String(v)) - 1}"></span>`;
  const openRem = () => { rem.hidden = false; renderRem(); rem.scrollTop = 0; };
  const closeRem = () => { rem.hidden = true; };
  const mmss = ms => { const t = Math.ceil(ms / 1000); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  const lockLeft = () => R.offLockLeft(S, now());
  const myFace = () => S.occ?.status === 'ACTIVE' ? faceFor(S.session?.stage) : 0;
  const appFace = () => topFace(S.occ?.status === 'ACTIVE' ? [{face: myFace(), due: S.occ.due}] : []);   // highest unresolved stage; none active -> stage 1
  const faceNow = () => { const u = faceUrl(appFace()), i = $('face'); if (i.getAttribute('src') !== u) i.src = u; };
  const dueText = () => S.schedule?.enabled && S.next ? `Next: ${when(S.next.due)} · ${{once: 'once', daily: 'every day', weekdays: 'weekdays'}[S.schedule.recur]}${S.schedule.label ? ' · ' + S.schedule.label : ''}` : '';
  const capCard = () => {
    const c = capNow(), k = c.status === 'Reminders enabled' ? 'on' : c.status === 'Permission needed' ? 'ask' : 'off';
    return `<div class="rm-card rm-cap" data-k="${k}"><strong>${c.status}</strong><p>${txt(c.reason)}</p>${c.action ? `<button type="button" data-a="enable">${c.action === 'retry' ? 'Try again' : 'Allow reminders'}</button>` : ''}
<ul class="rm-notes">${c.notes.map(n => `<li>${txt(n)}</li>`).join('')}</ul></div>`;
  };
  const syncNote = () => S.outbox.length && P.ADHD_PUSH_ORIGIN ? `<p class="rm-dim">The reminders server has not received your latest change yet${S.outbox.some(o => o.act === 'cancel') ? ' (including a stop). Reminders already sent cannot be recalled.' : '.'}</p>` : '';
  const stopBtn = () => '<button class="alt al-hold" type="button" data-hold="stop">Emergency stop (hold 3 s)</button>';
  const views = {
    home() {
      const o = S.occ, last = o && o.status !== 'ACTIVE' && o.status !== 'PENDING' ? `<p class="rm-dim">Last alarm (${clock(o.due)}): ${OUTCOME[o.status]}.</p>` : '', left = lockLeft();
      return `<h2>Reminders</h2>${ui.msg ? `<p class="rm-msg" role="status">${txt(ui.msg)}</p>` : ''}${capCard()}
<div class="rm-card"><strong>${S.schedule?.enabled ? 'Alarm armed' : 'No alarm armed'}</strong>${S.schedule?.enabled ? `<p>${txt(dueText())}</p>
<p class="rm-dim">Sound while the app is open: ${txt(R.SOUNDS.find(s => s.id === S.schedule.sound)?.name || '')}</p>` : '<p>Set a time, pick a sound, and confirm it.</p>'}${last}${syncNote()}
${left ? `<p class="rm-dim" role="status">This alarm is going off. Turn off alarm unlocks in ${mmss(left)}. Finishing a 2048 game (win or lose) dismisses it sooner.</p>` : ''}
<div class="rm-row"><button type="button" data-a="${S.schedule ? 'edit' : 'new'}">${S.schedule?.enabled ? 'Change alarm' : 'New alarm'}</button>${S.schedule?.enabled ? `<button class="alt" type="button" data-a="off"${left ? ' disabled' : ''}>Turn off alarm</button>` : ''}</div>
${S.occ?.status === 'ACTIVE' ? stopBtn() : ''}</div>
<button class="alt" type="button" data-a="close">Back to the computer</button>`;
    },
    setup() {
      const d = ui.draft;
      return `<h2>${S.schedule ? 'Change alarm' : 'New alarm'}</h2>${ui.err ? `<p class="rm-err" role="alert">${txt(ui.err)}</p>` : ''}
<label class="rm-f">Time<input id="rm-t" type="time" value="${esc(d.time)}" required></label>
<label class="rm-f">Repeats<select id="rm-r">${[['once', 'Once'], ['daily', 'Every day'], ['weekdays', 'Weekdays']].map(([v, n]) => `<option value="${v}"${d.recur === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
<label class="rm-f">Reminder text<input id="rm-l" type="text" maxlength="${R.MAX_LABEL}" placeholder="e.g. Call Alex" data-v="label"></label>
<fieldset class="rm-snd"><legend>Sound while the app is open</legend>
<p class="rm-dim">Plays only while this app is open, and only after you have tapped something. It is not your notification sound and it does not set a ringtone. When the app is closed, reminders use your phone's own notification sound.</p>
${R.SOUNDS.map(s => `<div class="rm-s"><label><input type="radio" name="snd" value="${s.id}"${d.sound === s.id ? ' checked' : ''}> <b>${s.name}</b><br><span class="rm-dim">${s.blurb}</span></label>
<div class="rm-row"><button class="alt" type="button" data-a="preview" data-id="${s.id}">${fgMode === 'preview' && fg.dataset.id === s.id ? '■ Stop' : '▶ Preview'}</button>
<a class="rm-dl" href="${url(s.id)}" download>Download file</a></div></div>`).join('')}
<p class="rm-dim">A downloaded file is just a file. It does not change your phone's ringtone or notification sound.</p>${ui.soundErr ? `<p class="rm-err" role="alert">${txt(ui.soundErr)}</p>` : ''}</fieldset>
<label class="rm-c"><input id="rm-fu" type="checkbox"${d.followups ? ' checked' : ''}> Escalate: keep reminding me: first alert at the due time, then 5 min, 3 min, 1 min, then every 30 s, until I finish a 2048 game (win or lose). I can always hold Emergency stop.</label>
${lockLeft() ? `<p class="rm-dim">Changing the time unlocks in ${mmss(lockLeft())}.</p>` : ''}<div class="rm-row"><button type="button" data-a="review">Review</button><button class="alt" type="button" data-a="home">Cancel</button></div>`;
    },
    review() {
      return `<h2>Arm this alarm?</h2><p class="rm-dim">Check every line. Nothing is armed until you confirm.</p><ul class="rm-sum">${ui.rev.summary.map(l => `<li>${txt(l)}</li>`).join('')}</ul>
<p class="rm-dim">Closed-app reminders: ${txt(capNow().status + '. ' + capNow().reason)}</p>
<div class="rm-row"><button type="button" data-a="arm">Arm this alarm</button><button class="alt" type="button" data-a="setup">Back to edit</button></div>`;
    },
    alert() {
      const o = S.occ, el = Math.max(0, Math.floor((now() - o.due) / 1000)), left = lockLeft();
      return `<img class="rm-face" src="${faceUrl(myFace())}" alt="" width="120" height="120"><h2>${txt(APP_NAME)}</h2>
<p class="rm-big" role="status">${txt(ui.text || copyFor(S.session?.stage || 0, o.label))}</p>
<p class="rm-dim">Due ${clock(o.due)} · ${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')} ago</p>
${ui.needTap ? '<button type="button" data-a="sound">Tap to start the sound</button>' : ''}${ui.soundErr ? `<p class="rm-err">${txt(ui.soundErr)}</p>` : ''}
<button type="button" data-a="open">Play 2048</button><button class="alt" type="button" data-a="home">Reminder settings</button>
${left ? `<p class="rm-dim">Turn off alarm unlocks in ${mmss(left)}.</p>` : ''}${stopBtn()}
<p class="rm-dim">Winning or losing a game dismisses this alarm. Opening the app, tapping or swiping the notice, or starting a game does not. Hold Emergency stop to end it now; your next scheduled one stays.</p>`;
    },
    notice() {
      const o = ui.notice;
      return `<h2>That reminder</h2><p class="rm-big">${o ? `It is already: ${txt(OUTCOME[o.status] || o.status)}.` : 'This phone has no record of that reminder.'}</p><p class="rm-dim">An old notice cannot restart or complete anything.</p>
<button type="button" data-a="home">OK</button>`;
    },
  };
  function renderRem() {
    if (rem.hidden || holdT) return;                       // never rebuild the button that is being held
    if (ui.view === 'alert' && S.occ?.status !== 'ACTIVE') ui.view = 'home';
    slots = []; rem.innerHTML = views[ui.view](); rem.dataset.view = ui.view;
    for (const el of rem.querySelectorAll('[data-s]')) el.textContent = slots[el.dataset.s];
    const l = rem.querySelector('[data-v=label]'); if (l) l.value = ui.draft.label;
  }
  const readForm = () => {
    if (ui.view !== 'setup') return;
    const g = id => rem.querySelector(id), snd = rem.querySelector('input[name=snd]:checked');
    ui.draft = {time: g('#rm-t').value, recur: g('#rm-r').value, label: g('#rm-l').value, sound: snd ? snd.value : null, followups: g('#rm-fu').checked, tandem: false};
  };
  const STOPPED = 'Alarm stopped. It is marked not completed and will not restart. Your next reminder stays.';
  const act = {
    close: closeRem,
    home() { ui.err = ''; ui.msg = ''; ui.view = 'home'; renderRem(); },
    new() { ui.draft = {time: '', recur: 'daily', label: '', sound: null, followups: false, tandem: false}; ui.err = ''; ui.view = 'setup'; renderRem(); },
    edit() { const s = S.schedule; ui.draft = {time: s.time, recur: s.recur, label: s.label, sound: s.sound, followups: s.followups, tandem: false}; ui.err = ''; ui.view = 'setup'; renderRem(); },
    setup() { ui.err = ''; ui.view = 'setup'; renderRem(); },
    preview(b) { readForm(); preview(b.dataset.id); },
    review() { readForm(); try { ui.rev = R.review(ui.draft); ui.err = ''; ui.view = 'review'; } catch (e) { ui.err = e.message; } renderRem(); },
    arm() {
      prime();
      try { S = R.arm(S, ui.rev, now()); } catch (e) { ui.err = e.message; ui.view = 'setup'; return renderRem(); }
      persist(); sync(); fg.pause(); fgMode = null;
      ui.msg = `Armed. ${dueText()}`; ui.view = 'home'; renderRem();
    },
    off() {
      if (lockLeft() > 0) { ui.msg = `Turn off alarm unlocks in ${mmss(lockLeft())}.`; return renderRem(); }   // the real guard is R.disable; this only words it
      S = R.disable(S, now()); persist(); sync(); sound(); bar(); faceNow(); ui.msg = 'Alarm turned off. Its text and history are kept.'; renderRem();
    },
    async enable() { const r = await P.enable(); sub = r.subscribed; capError = r.error; renderRem(); },
    sound() { sound(true); },
    open() { S = R.acknowledge(S, now()); persist(); sync(); startAlarm(); },
    stop() { S = R.stop(S, now()); persist(); sync(); sound(); bar(); faceNow(); if (mode === 'alarm') return endAlarmBoard(STOPPED); ui.msg = STOPPED; ui.view = 'home'; renderRem(); },
  };
  rem.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act[b.dataset.a]?.(b); });

  // ---- emergency stop: a deliberate ~3 s hold (pointer or Enter/Space), at every stage. The timer lives in a closure so a re-render cannot drop it.
  const holdEnd = () => { clearTimeout(holdT); holdT = 0; root.classList.remove('holding'); root.querySelectorAll('.hold-on').forEach(b => b.classList.remove('hold-on')); renderRem(); };
  const holdStart = b => {
    if (holdT) return;
    root.classList.add('holding'); b.classList.add('hold-on');
    holdT = setTimeout(() => { holdT = 0; root.classList.remove('holding'); act.stop(); }, HOLD_MS);
  };
  root.addEventListener('pointerdown', e => { const b = e.target.closest?.('[data-hold]'); if (b) { e.preventDefault(); holdStart(b); } });
  const onUp = () => holdT && holdEnd();
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  root.addEventListener('keydown', e => { const b = e.target.closest?.('[data-hold]'); if (b && (e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); holdStart(b); } });
  root.addEventListener('keyup', e => { if (holdT && (e.key === 'Enter' || e.key === ' ')) holdEnd(); });
  root.addEventListener('contextmenu', e => { if (e.target.closest?.('[data-hold]')) e.preventDefault(); });

  // ---- the clock: due time, escalation stages, ownership of the speaker -------------------------------------------
  function tick() {
    const r = R.tick(S, now());
    const changed = r.events.length > 0;
    S = r.state;
    for (const e of r.events) {
      if (e.type === 'start') { ui.text = e.text; ui.view = 'alert'; ui.soundErr = ''; sound(true); openRem(); }
      else if (e.type === 'stage') { ui.text = e.text; sound(true); }
      else if (e.type === 'missed') { ui.msg = 'You missed an alarm.'; if (mode === 'alarm') endAlarmBoard('You missed that alarm.'); }
    }
    if (changed) { persist(); sync(); if (!S.occ || S.occ.status !== 'ACTIVE') sound(); }
    faceNow();
    if (!rem.hidden && (ui.view === 'alert' || changed || (ui.view === 'home' && lockLeft() > 0))) renderRem();
    if (mode === 'alarm') bar();
  }
  const timer = setInterval(tick, 1000);
  const onVis = () => { if (!document.hidden) tick(); };
  document.addEventListener('visibilitychange', onVis);

  // ---- opening from a reminder notice: always show the CURRENT truth about that occurrence ----------------------------
  async function openOccurrence(id, view) {
    if (!id) return;
    const rm = await P.remote(id);
    if (rm) { S = R.applyRemote(S, rm, now()); persist(); }
    const o = R.lookup(S, id);
    if (o && o.status === 'ACTIVE') { S = R.acknowledge(S, now()); persist(); sync(); ui.view = view === 'settings' ? 'home' : 'alert'; }   // a tap only opens: it never stops or pauses anything
    else { ui.notice = o; ui.view = 'notice'; }
    openRem();
  }
  const onSW = e => { if (e.data?.type === 'ADHD_OPEN') openOccurrence(e.data.occurrenceId, e.data.view); };
  navigator.serviceWorker?.addEventListener('message', onSW);
  try {
    const q = new URLSearchParams(location.search), occ = q.get('occ'), view = q.get('view');
    if (occ) { q.delete('occ'); q.delete('view'); history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '')); openOccurrence(occ, view); }
  } catch {}
  P.register().then(ok => { sub = ok; if (!rem.hidden) renderRem(); }).catch(e => { capError = String(e.message || e); });
  tick(); sync();
  if (S.occ?.status === 'ACTIVE' && S.session?.state === 'ALERTING' && rem.hidden) { ui.view = 'alert'; openRem(); }   // reopened while ringing

  const size = (lw, lh) => root.style.setProperty('--bs', Math.max(96, Math.min(lw - 44 - 16, lh - 44 - 66)) + 'px');
  root.style.setProperty('--bs', '150px');
  comp = await mountComputer($('stage'), $('screen'), $('glass'), size);
  if (disposed) comp.dispose();
  else if (!comp.ok) { root.classList.add('flat'); size(300, 260); }
  return {dispose() {
    disposed = true; clearInterval(timer); removeEventListener('keydown', onKey); removeEventListener('pointerdown', prime); removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp); clearTimeout(holdT); clearTimeout(cap);
    document.removeEventListener('visibilitychange', onVis); navigator.serviceWorker?.removeEventListener('message', onSW);
    fg.pause(); fg.removeAttribute('src'); comp?.dispose(); host.replaceChildren();
  }};
}
