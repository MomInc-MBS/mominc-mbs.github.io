/* Helping Hand "Buy Now": MOM'S FICTIONAL QUOTE + an editable email inquiry. No payment, no order, nothing is sent by the site.
   Classic script loaded next to decisions.js. Reads the editor's saved design (localStorage handborne-recipe-v4, written by
   source/app/page.tsx) so the compiled editor bundle is untouched. The quote ledger is separate from the capped five-decision
   narrative counter in decisions.js / MBS_FLOW. Pure rules are exported for tools/check_buy_now.test.mjs. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.HandQuote = api; if (typeof document !== 'undefined') api.start(root); }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const BASE_CENTS = 1999, FEE_CENTS = 1; // initial tuning: $19.99 + $0.01 per committed design change (integer cents)
  const KEY = 'handborne-quote-v1', RECIPE_KEYS = ['handborne-recipe-v4', 'handborne-recipe-v3', 'handborne-recipe-v2', 'handborne-recipe-v1'];
  const SUBJECT = 'Mother, I really, really need a Helping Hand';
  // Names for the original style ids (source/app/catalog.ts LEGACY_STYLES + Flat/Clay); newer surface finishes read as "finish #N".
  const STYLE = ['Mortal', 'Verdant', 'Mycelial', 'Chitin', 'Reptilian', 'Abyssal', 'Coral', 'Skeletal', 'Spectral', 'Infernal', 'Celestial', 'Voidborn', 'Eldritch', 'Stone Golem', 'Crystal', 'Magma', 'Glacial', 'Stormcharged', 'Clockwork Robot', 'Neon Synth', 'Fluffy', 'Jelly', 'Baby'];
  const REGION = {nails: 'Nails', fingertips: 'Finger tips', fingers: 'Fingers & knuckles', palm: 'Palm', back_of_hand: 'Back of hand', wrist: 'Wrist'};

  /** What counts as "the design": the same appearance fields decisions.js watches. Pose, camera and animation are not appearance. */
  const signature = r => (r && r.sections) ? JSON.stringify({sections: r.sections, nailShape: r.nailShape || 'family', scalePattern: r.scalePattern || 'none'}) : '';
  const cents = n => BASE_CENTS + FEE_CENTS * n;
  const money = c => '$' + Math.floor(c / 100) + '.' + String(c % 100).padStart(2, '0');

  /** One committed look. Same signature (re-applying the current value, orbit, reload) is a no-op; going back to an earlier value counts. */
  function commit(ledger, sig) {
    if (!sig) return ledger;
    if (!ledger.sig) return {count: ledger.count, sig}; // first sighting: adopt the baseline, never charge for initialization
    if (sig === ledger.sig) return ledger;
    return {count: ledger.count + 1, sig};
  }

  function summary(r) {
    if (!r || !r.sections) return 'the default Helping Hand (no changes saved yet)';
    const s = r.sections;
    const parts = Object.keys(REGION).filter(k => k in s).map(k => REGION[k] + ': ' + (STYLE[s[k]] || 'finish #' + s[k]));
    parts.push('Nail shape: ' + (r.nailShape && r.nailShape !== 'family' ? r.nailShape : 'creature default'));
    parts.push('Scales: ' + (r.scalePattern && r.scalePattern !== 'none' ? r.scalePattern : 'off'));
    if (r.pose) parts.push('Gesture: ' + r.pose);
    return parts.join('; ');
  }

  function letter(o) {
    return ['Dear Mother,', '',
      'I really, really want a Helping Hand.', '',
      'I have tried doing things for myself. I gave it a fair chance. Unfortunately, the things keep happening, and apparently I am expected to keep doing them.', '',
      'Plates need washing. Bags need carrying. Buttons need pressing. I hate wiping my own butt, and I wish someone was there to do it for me. Every day presents another unreasonable demand upon the two hands I already own. I cannot continue calling this a premium experience.', '',
      'That is why I have designed the Helping Hand described below. I selected its appearance with great care. Then I changed my mind. Then I changed the color back, which I understand is a completely new opportunity to demonstrate my commitment to Mother.', '',
      'My design: ' + o.design, '',
      'Design decisions: ' + o.count, '',
      "MOM's fictional quote: " + o.quote, '',
      'I would like a hand that understands how much effort it takes me to avoid effort. Ideally, it would arrive already aware that opening a jar is not the beginning of an inspiring personal journey. Sometimes a jar is just an obstacle between me and lunch.', '',
      'Please tell me what, if anything, is actually available and what the next step would be. Until then, I will remain here, tragically responsible for my own activities and extremely impressed by your willingness to monetize the problem.', '',
      'Yours, with both hands occupied,', '',
      o.name || '[your name]', '',
      "P.S. This is an inquiry, not an order or authorization to charge me. The quote above is part of MOM's fictional sales routine."].join('\n');
  }

  /** Short draft for mail clients that choke on a long mailto: URI. Still addressed, still an inquiry, still not sent by us. */
  const shortLetter = o => ['Dear Mother,', '', 'I really, really want a Helping Hand.', '',
    'My design: ' + o.design, 'Design decisions: ' + o.count, "MOM's fictional quote: " + o.quote, '',
    'Please tell me what, if anything, is actually available.', '', 'Yours, with both hands occupied,', o.name || '[your name]', '',
    "P.S. An inquiry, not an order or authorization to charge me. The quote is part of MOM's fictional sales routine."].join('\n');

  const mailto = (to, body) => 'mailto:' + to + '?subject=' + encodeURIComponent(SUBJECT) + '&body=' + encodeURIComponent(body);

  /* ---------------- browser UI ---------------- */
  function start(win) {
    const doc = win.document, store = win.localStorage;
    const readRecipe = () => { for (const k of RECIPE_KEYS) try { const r = JSON.parse(store.getItem(k)); if (r && r.sections) return r; } catch (e) {} return null; };
    const load = () => { try { const l = JSON.parse(store.getItem(KEY)); if (l && Number.isInteger(l.count) && l.count >= 0) return {count: l.count, sig: String(l.sig || '')}; } catch (e) {} return {count: 0, sig: ''}; };
    const save = l => { try { store.setItem(KEY, JSON.stringify(l)); } catch (e) {} };
    let ledger = load(), mail = (win.MBS && win.MBS.MAIL) || '', down = false, dlg = null;
    // Reload must not count: adopt whatever is saved now as the baseline unless this ledger already tracks this design.
    ledger = commit(ledger, signature(readRecipe())); save(ledger);

    // MBS.MAIL is defined in tv/tv.js (and the standalone shim). The editor page loads neither, so read the one configured value from tv.js.
    if (!mail) fetch('/tv/tv.js').then(r => r.text()).then(t => { const m = /MBS\.MAIL\s*=\s*"([^"]+@[^"]+)"/.exec(t); if (m) { mail = m[1]; refresh(); } }).catch(() => {});

    const box = doc.createElement('aside');
    box.id = 'hand-quote';
    box.setAttribute('aria-label', "MOM's fictional quote");
    box.style.cssText = 'position:fixed;right:10px;bottom:56px;z-index:10001;max-width:230px;background:#2a0a44;color:#ffe39a;border:3px solid #ffd36e;border-radius:10px;padding:8px 10px;font:700 13px/1.3 Arial,sans-serif;box-shadow:4px 5px 0 #0007';
    box.innerHTML = "<div>MOM'S FICTIONAL QUOTE</div><div id=\"hq-price\" style=\"font-size:22px\"></div><div id=\"hq-nudge\" style=\"color:#ff9fb4;min-height:16px\" role=\"status\"></div>" +
      '<button id="hq-buy" type="button" style="margin-top:6px;min-height:44px;width:100%;background:#e04b6a;color:#fff;border:0;border-radius:8px;font:700 16px Arial">Buy Now</button>' +
      '<button id="hq-new" type="button" style="margin-top:6px;min-height:36px;width:100%;background:transparent;color:#ffe39a;border:1px solid #ffe39a;border-radius:8px;font:700 12px Arial">New design</button>';
    doc.body.appendChild(box);
    const price = box.querySelector('#hq-price'), nudge = box.querySelector('#hq-nudge');
    let nudgeTimer;
    function refresh(bump) {
      price.textContent = money(cents(ledger.count));
      if (bump) { nudge.textContent = '+' + money(FEE_CENTS) + ' — Decision fee'; clearTimeout(nudgeTimer); nudgeTimer = setTimeout(() => { nudge.textContent = ''; }, 2500); }
      if (dlg) fill();
    }
    function check() { const next = commit(ledger, signature(readRecipe())); if (next !== ledger) { const grew = next.count > ledger.count; ledger = next; save(ledger); refresh(grew); } }

    // Commit points only: a drag counts once (pointerup/change), keyboard steps count per change event. 'input' is ignored while dragging.
    const later = () => { setTimeout(check, 0); setTimeout(check, 700); }; // 700 ms: async imports and undo/redo that land after the event
    for (const ev of ['pointerdown']) doc.addEventListener(ev, e => { if (e.isTrusted) down = true; }, true);
    for (const ev of ['pointerup', 'pointercancel']) doc.addEventListener(ev, e => { if (!e.isTrusted) return; down = false; later(); }, true);
    for (const ev of ['change', 'click', 'keyup']) doc.addEventListener(ev, e => { if (e.isTrusted) later(); }, true);
    doc.addEventListener('input', e => { if (e.isTrusted && !down) later(); }, true); // keyboard/typed input with no pointer held
    win.addEventListener('storage', e => { if (e.key && RECIPE_KEYS.indexOf(e.key) >= 0) later(); });

    const ctx = () => ({design: summary(readRecipe()), count: ledger.count, quote: money(cents(ledger.count)), name: (dlg && dlg.querySelector('#hq-name').value.trim()) || ''});
    function fill() {
      const c = ctx(), ta = dlg.querySelector('#hq-letter');
      if (!dlg.dataset.edited) ta.value = letter(c);
      const body = ta.value;
      dlg.querySelector('#hq-open').href = mail ? mailto(mail, body) : '#';
      dlg.querySelector('#hq-short').href = mail ? mailto(mail, shortLetter(c)) : '#';
      dlg.querySelector('#hq-to').textContent = mail || 'loading address…';
    }
    function open() {
      if (dlg) return;
      check();
      dlg = doc.createElement('div'); dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-label', 'Email inquiry draft');
      dlg.style.cssText = 'position:fixed;inset:0;z-index:10002;background:#000c;display:flex;align-items:center;justify-content:center;padding:12px';
      dlg.innerHTML = '<div style="background:#2a0a44;color:#f5e9ff;border:3px solid #ffd36e;border-radius:10px;max-width:640px;width:100%;max-height:94vh;overflow:auto;padding:14px;font:14px/1.4 Arial,sans-serif">' +
        "<h2 style=\"margin:0 0 4px;color:#ffd36e;font-size:18px\">Your inquiry to Mother</h2><p style=\"margin:0 0 8px\"><strong>Opens an email draft. No payment taken.</strong> You edit it and press Send in your own mail app. To: <code id=\"hq-to\"></code></p>" +
        '<label style="display:block;margin-bottom:6px">Your name or signature <input id="hq-name" style="font-size:16px;min-height:40px;width:100%;box-sizing:border-box"></label>' +
        '<label for="hq-letter">Full letter (editable)</label><textarea id="hq-letter" rows="14" style="width:100%;box-sizing:border-box;font-size:14px"></textarea>' +
        '<p id="hq-status" role="status" style="min-height:18px;margin:4px 0"></p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<a id="hq-open" style="background:#e04b6a;color:#fff;padding:12px 14px;border-radius:8px;font-weight:700;text-decoration:none;min-height:20px">Open email draft</a>' +
        '<button id="hq-copy" type="button" style="min-height:44px;padding:0 14px;font-weight:700">Copy letter</button>' +
        '<a id="hq-short" style="background:#3a2d52;color:#ffe39a;padding:12px 14px;border-radius:8px;font-weight:700;text-decoration:none">Short draft</a>' +
        '<button id="hq-close" type="button" style="min-height:44px;padding:0 14px">Close</button></div></div>';
      doc.body.appendChild(dlg);
      const ta = dlg.querySelector('#hq-letter'), status = dlg.querySelector('#hq-status');
      ta.addEventListener('input', () => { dlg.dataset.edited = '1'; fill(); });
      dlg.querySelector('#hq-name').addEventListener('input', () => { if (!dlg.dataset.edited) fill(); }); // once the letter is hand-edited, the name box no longer rewrites it
      dlg.querySelector('#hq-copy').addEventListener('click', async () => {
        try { await win.navigator.clipboard.writeText(ta.value); status.textContent = 'Letter copied. Paste it into any email.'; }
        catch (e) { ta.focus(); ta.select(); status.textContent = 'Select all and copy the letter above.'; }
      });
      dlg.querySelector('#hq-open').addEventListener('click', e => { if (!mail) e.preventDefault(); else status.textContent = 'If nothing opened, use Copy letter or Short draft.'; });
      dlg.querySelector('#hq-close').addEventListener('click', () => { dlg.remove(); dlg = null; });
      fill();
    }
    box.querySelector('#hq-buy').addEventListener('click', open);
    box.querySelector('#hq-new').addEventListener('click', () => {
      if (!win.confirm('Start a new design? This resets the hand and the quote.')) return;
      ledger = {count: 0, sig: ''}; save(ledger);
      for (const k of RECIPE_KEYS) try { store.removeItem(k); } catch (e) {}
      win.location.reload(); // the editor restarts from its default hand; the next reload adopts that as the new baseline
    });
    refresh();
  }

  return {BASE_CENTS, FEE_CENTS, SUBJECT, signature, cents, money, commit, summary, letter, shortLetter, mailto, start};
});
