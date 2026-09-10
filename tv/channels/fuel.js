import '../fuel-gate.js';
/* tv/channels/fuel.js - MBS FUEL, CH 7, the THIRD channel converted to a module and the first one
   that owns a WebGL context for its whole life (2.18, PLAN-r9 D.1.7). Same code that sat in an inline
   <script> at the bottom of fuel.html, with one change made throughout: every listener, timer,
   ResizeObserver and animation frame is registered through the CONTEXT, so channel-runtime.js can
   release all of it. Nothing about what the channel does changed.

   WHY THIS CHANNEL WENT THIRD. Every channel still on the legacy path pulls three.js, so "simplest
   first" means the smallest of them, and fuel was it: 612 script lines against lilboyfriend's 944,
   girlfriend's 1026 and corgi's 1662.

   THOSE FIGURES WERE MEASURED TWICE, because the first measurement was wrong and the handoff warned
   that this table has been wrong before. Counting from the FIRST <script> to the first </script>
   gave fuel 963, lilboyfriend 1329 and corgi 2088 - inflated, because fuel, corgi and lilboyfriend
   each quote a literal <script> inside their own header comment, explaining why type='module' would
   throw, and the count started there and swallowed the comment and the stylesheet. The real block is
   the LAST one. The choice of fuel survives the correction; the numbers did not, and the ordering of
   what remains changed with them - lilboyfriend is next, not girlfriend. Same mistake, three times in
   one session: it also broke the script that stripped this fragment and the first two versions of
   tools/scan_strict.py, which is why that tool now states its own reach.

   WHAT ctx CANNOT OWN HERE, AND WHY IT IS THE POINT. mominc had a <video>; djscratch's hand editor
   was the first WebGLRenderer on this television. fuel is the first channel whose ENTIRE reason for
   existing is a WebGL scene: a renderer, a scene graph of some forty meshes, six canvas-generated
   jar labels, a wrapping product label regenerated on every rename, a burst backdrop and a flag
   texture. None of that is a disposable the context knows about. A browser holds only a handful of
   live WebGL contexts and silently drops the OLDEST once a page opens too many, so a renderer that
   outlives its channel does not throw - it takes an EARLIER channel's canvas away, several channel
   changes later, with no error anywhere. unmount() below is what stops that, and check_teardown.py
   measures it as a property (how many recorded contexts are still un-lost), never as a tally.

   THE DISPOSAL IS A TRAVERSE, NOT A REGISTER. djscratch listed its geometries and materials because
   it had a handful and built them in one place. This scene builds around forty meshes across eight
   sections, and a list that has to be appended to at every one of them is a list that will be
   forgotten at the next edit - the exact failure mode channel-runtime.js exists to remove. The scene
   graph already knows what it holds, so unmount() walks it. The only thing kept by hand is the shared
   particle geometry, because it is deliberately NOT parented to anything.

   THE THREE.JS IMPORT STAYS DYNAMIC, and that is a decision rather than a leftover. A module may use
   a static import, and a static import would be tidier - but it resolves BEFORE this module's body
   runs, so a CDN that is down would fail the whole module import, and channel-runtime.js would
   correctly render the unavailable testcard. That would be a REGRESSION: fuel's flat form - six
   radiogroups, eight flavour buttons, the can readout, the mailto - is fully functional on its own and
   is what a no-WebGL, no-CDN visitor is supposed to get. The 3D is a skin and an input method over
   those exact buttons, never a parallel system. Keeping the import dynamic keeps the fallback
   reachable, which is the whole architecture of this channel. */

const THREE_URL = "/tv/assets/armie-intro/vendor/three.module.js";

/* The one piece of module state, held for the reason set out above: a WebGLRenderer and a scene
   graph are not disposables the context can own. `session` is the mount token - the three.js import
   resolves long after mount() returns, and whatever comes back for a session that has already ended
   must be dropped rather than attached to a fragment that has gone. */
let gl = null;
let session = null;

export default {
  mount(root, ctx) {
    session = {};
    const mine = session;
    const fu = root.matches("#fu") ? root : root.querySelector("#fu");
    if (!fu) return;
    // ids resolve INSIDE the channel now rather than against the whole document: only one channel is
    // mounted at a time so both find the same nodes, but scoping means a shell element can never be
    // picked up by a channel's id lookup.
    const byId = (id) => fu.querySelector("#" + id);

    const rows = [...fu.querySelectorAll(".srow[data-supp]")];
    const flavours = [...fu.querySelectorAll(".flv")];
    const canBox = fu.querySelector(".can");
    const canLabel = byId("canLabel");        // the same element as canBox; both names kept from the original
    const submitBtn = byId("submitBtn");
    const result = byId("result");
    const resultNote = byId("resultNote");
    const mailLink = byId("mailLink");
    const flavTag = byId("fuFlavTag");
    const costBar = byId("costBar");
    const assumpBody = byId("assumpBody");    // C061: where the versioned cost record is printed for the visitor
    let bandsUpdater = null;   // set once three.js builds the powder bands; no-op in the flat fallback
    const nameA = byId("nameA"), nameB = byId("nameB"), nameC = byId("nameC");
    let flavour = null;
    let phase = 'fill', mixing = false, busy = false, mixTurns = 0, labelColor = '#ff2e88';
    let animateScoop = null, animateFlavor = null, sceneBatch = null;
    const history = [];
    const total = () => rows.reduce((n,r)=>n+(r.dataset.level==='strong'?2:r.dataset.level==='weak'?1:0),0);
    rows.forEach(r=>{r.dataset.level='none';r.querySelector('[data-level="none"]').setAttribute('aria-checked','true');});
    const ingredientPanel=byId('batchIngredients'), flavorPanel=byId('batchFlavors');
    const nextButton=byId('batchNext'), status=byId('batchStatus');
    rows.forEach((r,i)=>{
      const b=document.createElement('button');b.type='button';b.dataset.index=i;
      ctx.on(b,'click',()=>{if(animateScoop)animateScoop(i);else addScoop(i);});ingredientPanel.append(b);
    });
    flavours.forEach((f,i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=f.dataset.flavour;
      ctx.on(b,'click',()=>{if(phase!=='flavor'||busy||mixing)return;if(animateFlavor)animateFlavor(i);else f.click();});flavorPanel.append(b);
    });
    [['HOT PINK','#ff2e88'],['VOLT LIME','#c8ff00'],['NUCLEAR BLUE','#45dfff'],['GOLD RUSH','#ffea00']].forEach(([name,color])=>{
      const b=document.createElement('button');b.type='button';b.textContent=name;b.style.background=color;b.dataset.color=color;
      ctx.on(b,'click',()=>{if(phase!=='label')return;labelColor=color;renderCan();});byId('batchColors').append(b);
    });
    function addScoop(i){
      const row=rows[i];if(phase!=='fill'||busy||total()>=8||row.dataset.level==='strong')return false;
      history.push(i);row.querySelector('[data-level="'+(row.dataset.level==='none'?'weak':'strong')+'"]').click();
      status.textContent=row.querySelector('.name').textContent+' added. '+total()+' of 8 scoops.';return true;
    }
    function renderBatch(){
      fu.dataset.batch=phase;
      fu.querySelectorAll('[data-step]').forEach(s=>{if(s.dataset.step===phase)s.setAttribute('aria-current','step');else s.removeAttribute('aria-current');});
      byId('batchTitle').textContent={fill:'FILL YOUR TUB',flavor:'FLAVOR & MIX',label:'MAKE IT YOURS',done:'BATCH COMPLETE!'}[phase];
      byId('batchHelp').textContent={fill:'Add eight scoops. Pick any combination, up to two of each ingredient.',flavor:'Pick a flavor, then press MIX three times to blend your batch.',label:'Choose the name and color below, then seal your tub.',done:'Your own MBS FUEL. Start another batch to try a different mix.'}[phase];
      ingredientPanel.hidden=phase!=='fill';flavorPanel.hidden=phase!=='flavor';
      byId('batchFill').value=total();byId('batchCount').textContent=total()+' / 8 scoops';
      [...ingredientPanel.children].forEach((b,i)=>{const n=rows[i].dataset.level==='strong'?2:rows[i].dataset.level==='weak'?1:0;b.textContent=rows[i].querySelector('.name').textContent+' · '+n+'/2';b.disabled=phase!=='fill'||busy||n===2||total()>=8;});
      [...flavorPanel.children].forEach((b,i)=>{b.setAttribute('aria-pressed',String(flavours[i].dataset.flavour===flavour));b.disabled=busy||mixing;});
      nextButton.hidden=phase==='label'||phase==='done';nextButton.textContent=phase==='fill'?'NEXT: FLAVOR':mixing?'MIXING…':'MIX '+mixTurns+'/3';nextButton.disabled=busy||mixing||(phase==='fill'?total()!==8:!flavour);
      byId('batchUndo').hidden=phase!=='fill';byId('batchUndo').disabled=busy||!history.length;byId('batchReset').disabled=busy||mixing;
      [nameA,nameB,nameC].forEach(s=>s.disabled=phase==='done');
      [...byId('batchColors').children].forEach(b=>{b.disabled=phase==='done';b.setAttribute('aria-pressed',String(b.dataset.color===labelColor));});
      if(sceneBatch)sceneBatch();
    }
    ctx.on(byId('batchUndo'),'click',()=>{if(phase!=='fill'||busy||!history.length)return;const r=rows[history.pop()];r.querySelector('[data-level="'+(r.dataset.level==='strong'?'weak':'none')+'"]').click();status.textContent='Last scoop removed.';});
    ctx.on(nextButton,'click',()=>{
      if(busy||mixing)return;
      if(phase==='fill'&&total()===8){phase='flavor';status.textContent='Tub filled! Choose your flavor.';renderCan();}
      else if(phase==='flavor'&&flavour){mixing=true;renderBatch();ctx.timeout(()=>{mixTurns++;mixing=false;if(mixTurns===3){phase='label';status.textContent='Blend ready. Name it, label it, seal it!';}else status.textContent='Keep mixing: '+mixTurns+' of 3 turns.';renderCan();},700);}
    });
    ctx.on(byId('batchReset'),'click',()=>{
      if(busy||mixing)return;phase='fill';mixTurns=0;sealed=null;flavour=null;history.length=0;labelColor='#ff2e88';
      rows.forEach(r=>{r.dataset.level='none';r.querySelectorAll('.lvl').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.level==='none')));});
      flavours.forEach(b=>{b.classList.remove('sel');b.setAttribute('aria-checked','false');});
      [nameA,nameB,nameC].forEach(s=>s.selectedIndex=0);result.hidden=true;status.textContent='Fresh tub. Choose your first ingredient.';renderCan();if(bandsUpdater)bandsUpdater();
    });
    let productLabelUpdater = null;   // set once three.js builds the tub's wall texture; no-op in the flat fallback

    // ---- cost model (3.3/C061). The versioned record below IS the provenance. It used to say
    // "see COST-MODEL.md" - a file that existed in neither tree, so the justification the visitor was
    // pointed at was not there to read. Now every figure a visitor sees is derived from this object
    // and printed straight back to them under the cost bar (#assumpBody), so the arithmetic can be
    // checked without leaving the page. Estimated bulk supplement-grade pricing, frozen, never a live quote.
    // `kg` is dollars per kilogram; `weak`/`strong`/`dose` are grams per scoop.
    const ASSUMPTIONS = {
      version: "fuel-cost-1.0",
      snapshot: "2026-09-07",
      currency: "USD",
      basis: "Estimated bulk supplement-grade pricing, carried forward unchanged from this channel's first build. Frozen figures, not a live quote, and not sourced from a named supplier.",
      excluded: [
        "labour, blending and filling",
        "shipping, freight and duties",
        "tooling, minimum order quantities and wastage",
        "testing, certification and insurance",
        "payment fees, returns and marketing"
      ],
      ingredients: {
        caffeine:     { kg: 12, weak: 0.10, strong: 0.30 },
        theanine:     { kg: 45, weak: 0.10, strong: 0.20 },
        glutamine:    { kg: 9,  weak: 2.5,  strong: 5 },
        citrulline:   { kg: 18, weak: 3,    strong: 6 },
        creatine:     { kg: 6,  weak: 3,    strong: 5 },
        electrolytes: { kg: 5,  weak: 0.5,  strong: 1.5 }
      },
      flavour: { kg: 30, dose: 0.6 },
      packaging: 0.85,
      servingsPerContainer: 30,
      retailPrice: 54.99
    };
    const COST = ASSUMPTIONS.ingredients;
    const FLAVOUR_COST = ASSUMPTIONS.flavour;
    const PACKAGING_COST = ASSUMPTIONS.packaging,
          SERVINGS_PER_CONTAINER = ASSUMPTIONS.servingsPerContainer,
          RETAIL_PRICE = ASSUMPTIONS.retailPrice;
    const productName = () => [nameA.value, nameB.value, nameC.value].join(" ");
    function scoopCost() {
      let c = 0;
      rows.forEach(r => {
        const ing = COST[r.dataset.supp], lvl = r.dataset.level;
        if (ing && (lvl === "weak" || lvl === "strong")) c += (ing[lvl] / 1000) * ing.kg;
      });
      if (flavour) c += (FLAVOUR_COST.dose / 1000) * FLAVOUR_COST.kg;
      return c;
    }
    const containerCost = () => scoopCost() * SERVINGS_PER_CONTAINER + PACKAGING_COST;

    // ---- the original interaction, unchanged. This is the whole fallback: no WebGL, no three.js CDN, JS
    // partly broken - whatever happens, these buttons and this handler are what actually fires MBS.form/.unlock/.wave.
    rows.forEach(row => {
      row.querySelectorAll(".lvl").forEach(btn => ctx.on(btn, "click", () => {
        row.querySelectorAll(".lvl").forEach(b => b.setAttribute("aria-checked", "false"));
        btn.setAttribute("aria-checked", "true");
        row.dataset.level = btn.dataset.level;
        renderCan();
        if (bandsUpdater) bandsUpdater();
      }));
    });

    flavours.forEach(btn => ctx.on(btn, "click", () => {
      if(phase!=='flavor'||mixing)return;
      flavours.forEach(b => { b.setAttribute("aria-checked", "false"); b.classList.remove("sel"); });
      btn.setAttribute("aria-checked", "true"); btn.classList.add("sel");
      flavour = btn.dataset.flavour; mixTurns=0;
      status.textContent=flavour+' injected. Mix your batch.';
      renderCan();
    }));

    [nameA, nameB, nameC].forEach(sel => ctx.on(sel, "change", renderCan));

    const levelLabel = row => row.dataset.level==='strong'?'2 GAME SCOOPS':row.dataset.level==='weak'?'1 GAME SCOOP':'NONE';
    const complete = () => total()===8 && !!flavour && mixTurns===3;

    // 3.3/C065: the stack's identity, not its history. Two clicks on an unchanged stack produce the same
    // string, so the second one seals nothing and fires no second wave; change any level, the flavour or a
    // name word and it is a different concept, sealable again.
    const fingerprint = () => rows.map(r => `${r.dataset.supp}=${r.dataset.level || "none"}`).join("|")
      + `|flavour=${flavour || "none"}|name=${productName()}`;
    let sealed = null;                                // the fingerprint already sealed; null until the first seal
    const isSealed = () => sealed !== null && sealed === fingerprint();

    // built fresh every render so the mailto link is always real, never a placeholder, from first paint
    function buildMailto() {
      const stackLines = rows.map(r => `${r.querySelector(".name").textContent}: ${levelLabel(r)}`);
      stackLines.push(`Flavour: ${flavour || "not set"}`);
      stackLines.push(`Name: ${productName()}`);
      stackLines.push(`Cost per scoop (est.): $${scoopCost().toFixed(4)}`);
      stackLines.push(`Cost per container (est., ${SERVINGS_PER_CONTAINER} servings): $${containerCost().toFixed(2)}`);
      const body = "My " + productName() + " stack:\n" + stackLines.join("\n") + "\n\nNothing was sent by the site. I am sending this myself. This drink is untested and does not exist yet.";
      const mail = (ctx.mbs && ctx.mbs.MAIL) || "";
      mailLink.href = `mailto:${mail}?subject=${encodeURIComponent("My " + productName() + " stack")}&body=${encodeURIComponent(body)}`;
      return stackLines;
    }

    function renderCan() {
      const lines = rows.map(r => `<span>${r.querySelector(".name").textContent}: ${levelLabel(r)}</span>`);
      lines.push(`<span>FLAVOUR: ${flavour || "NOT SET"}</span>`);
      lines.push(`<span>NAME: ${productName()}</span>`);
      canLabel.innerHTML = lines.join("");
      canBox.classList.toggle("full", complete());
      const done = isSealed();                        // C065: only the already-sealed, unchanged stack locks the button
      submitBtn.disabled = done || !complete() || phase!=='label';
      submitBtn.textContent = done ? "STACK LOCKED IN" : "APPLY LABEL & SEAL TUB";
      flavTag.textContent = flavour ? `FLAVOUR: ${flavour}` : "FLAVOUR: TAP A BOTTLE";
      costBar.innerHTML = `<span>COST/SCOOP (est.): $${scoopCost().toFixed(4)}</span>`
        + `<span>COST/CONTAINER (est., ${SERVINGS_PER_CONTAINER} sv): $${containerCost().toFixed(2)}</span>`
        + `<span>MBS FUEL RETAIL: $${RETAIL_PRICE.toFixed(2)}</span>`;
      if (productLabelUpdater) productLabelUpdater(productName());
      buildMailto();
      renderBatch();
    }

    // C061: the record, printed. Written once - none of it depends on the visitor's choices - and printed
    // in the same units the arithmetic uses, so the two lines in the cost bar above can be recomputed by hand.
    function renderAssumptions() {
      if (!assumpBody) return;
      // labelled off the rows, not off the record's own keys, so every line here reads back with the exact
      // name the can readout above prints ("L-THEANINE", not "theanine") and the two can be lined up
      const out = rows.filter(r => COST[r.dataset.supp]).map(r => {
        const c = COST[r.dataset.supp];
        return `<span>${r.querySelector(".name").textContent}: $${c.kg.toFixed(2)}/kg`
          + ` · WEAK ${c.weak} g/scoop · STRONG ${c.strong} g/scoop</span>`;
      });
      out.push(`<span>FLAVOUR: $${FLAVOUR_COST.kg.toFixed(2)}/kg · ${FLAVOUR_COST.dose} g/scoop</span>`);
      out.push(`<span>PACKAGING: $${PACKAGING_COST.toFixed(2)} PER CONTAINER · ${SERVINGS_PER_CONTAINER} SCOOPS PER CONTAINER</span>`);
      out.push(`<span>SCOOP = SUM OF (g/scoop ÷ 1000 × $/kg), SET LEVELS ONLY. CONTAINER = SCOOP × ${SERVINGS_PER_CONTAINER} + PACKAGING.</span>`);
      out.push(`<span>MBS FUEL RETAIL: $${RETAIL_PRICE.toFixed(2)} ${ASSUMPTIONS.currency}</span>`);
      out.push(`<span>RECORD ${ASSUMPTIONS.version}, SNAPSHOT ${ASSUMPTIONS.snapshot}. ${ASSUMPTIONS.basis}</span>`);
      out.push(`<span>NOT COUNTED: ${ASSUMPTIONS.excluded.join("; ")}. A real container costs more than the figure above.</span>`);
      assumpBody.innerHTML = out.join("");
    }

    renderCan();
    renderAssumptions();

    ctx.on(submitBtn, "click", () => {
      const fp = fingerprint();
      if (!complete() || phase!=='label') return;
      if (sealed === fp) return;             // C065: this exact stack is already sealed - no second form, no second wave
      const stackLines = buildMailto();
      result.hidden = false;
      if (complete()) {
        sealed = fp; phase='done';renderBatch();status.textContent=productName()+' sealed! Your batch is ready.';
        resultNote.textContent = productName() + " — STACK LOCKED IN. NOTHING WAS SENT. THE STACK STAYS IN THIS BROWSER, IF IT ALLOWS STORAGE. THIS DRINK DOES NOT EXIST YET.";
        submitBtn.textContent = "STACK LOCKED IN";
        submitBtn.disabled = true;           // re-enabled by renderCan() the moment the stack becomes a different one
        ctx.mbs && ctx.mbs.form && ctx.mbs.form("fuel", { stack: stackLines, name: productName() });
        // D.1.10 (C018): Fuel's terminal state IS its unlock site - the seal is the last user action -
        // but they are still two calls with two meanings. complete() goes FIRST so the run's own
        // GAME_COMPLETE carries {terminal}, not the transitional payload unlock() still emits from
        // mbs-shim.js:124; the two share one guard, so this pair emits once, and the packet that removes
        // that emission changes nothing here. Idempotent per site: sealing a SECOND, different stack
        // waves and files again (C065) and completes nothing - the run reached its end once.
        ctx.mbs && ctx.mbs.complete && ctx.mbs.complete("fuel", { terminal: "seal" });
        ctx.mbs && ctx.mbs.unlock && ctx.mbs.unlock("fuel");
        ctx.mbs && ctx.mbs.wave && ctx.mbs.wave();
      } else {
        // C064: name the first missing choice and put the caret on it. In the 3D skin the flat rows are
        // display:none, so focus is skipped there - the sentence still says which one, and the in-scene
        // nudge is already pointing at the tub.
        const missing = rows.find(r => !r.dataset.level);
        const what = missing ? missing.querySelector(".name").textContent.toUpperCase() : "A FLAVOUR";
        resultNote.textContent = `NOTHING WAS SENT OR SAVED. SET ${what} TO CARRY ON, THEN EVERY REMAINING ROW AND A FLAVOUR, TO LOCK IN THE FULL STACK.`;
        const target = missing ? missing.querySelector(".lvl") : flavours[0];
        if (target && target.offsetParent) target.focus();
      }
    });

    // ---- the tub. A skin and an input method over the rows/flavours above: every scoop tap and vial tap
    // just clicks the real button, so the state, the aria, and the MBS calls are all one code path.
    const stage = byId("fuStage");
    const canvas = byId("fuCanvas");
    const nudge = byId("fuNudge");
    const faceEl = byId("fuFace");
    if (!stage || !canvas) return;

    /* Can this browser do WebGL at all? Asked BEFORE the CDN import, so a machine that cannot render
       the tub never downloads three.js to find that out.

       THE PROBE HAS TO GIVE ITS CONTEXT BACK, and the version carried over from the inline script did
       not. Asking a throwaway canvas for a context to prove a context can be had leaves a REAL live
       WebGL context behind, on a detached canvas, held until the collector happens to notice - and a
       browser keeps only a handful alive, dropping the OLDEST when a page asks for one too many. So
       the probe was quietly spending the same budget the renderer needs, once per mount, and the
       teardown gate caught it the moment this channel became measurable: two contexts made per visit,
       one still live after unmount. WEBGL_lose_context is the only way to hand one back on purpose.

       This is not a defect introduced by the conversion. The same probe is inline in corgi,
       girlfriend, lilboyfriend and sag and leaks there too; on the legacy path nothing can observe
       it, because an unconverted channel has no teardown to measure. Each conversion fixes its own. */
    const glOK = (() => {
      try {
        if (!window.WebGLRenderingContext) return false;
        const c = document.createElement("canvas");
        const probe = c.getContext("webgl2") || c.getContext("webgl");
        if (!probe) return false;
        const lose = probe.getExtension("WEBGL_lose_context");
        if (lose) lose.loseContext();
        return true;
      } catch { return false; }
    })();
    if (!glOK) return;   // stageCard stays display:none by default CSS; the rows/flavours above are the whole page

    const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // colour per additive, reused straight from the page's own palette (see .fu vars in fuel.html)
    const HOT = 0xff2e88, ACID = 0xc6ff00, VOLT = 0x00e0ff, SUN = 0xffea00, SUND = 0xe0a500, GRAPE = 0x7a2fc4;
    const SUPPS = [
      { key: "caffeine",     col: SUN },
      { key: "theanine",     col: VOLT },
      { key: "glutamine",    col: ACID },
      { key: "citrulline",   col: HOT },
      { key: "creatine",     col: GRAPE },
      { key: "electrolytes", col: SUND }
    ];
    const N = SUPPS.length;
    const rowByKey = key => rows.find(r => r.dataset.supp === key);

    // flavour colours, matched to what each name suggests - decoration only, not a claim of any kind
    const FLAV_COL = [ACID, VOLT, SUN, HOT, 0xff5a1e, 0xa8d400, GRAPE, 0xff5fa3];

    import(/* @vite-ignore */ THREE_URL).then(THREE => {
      // the channel was left while the CDN was in flight: build nothing, and above all do not open a
      // WebGL context for a fragment that is no longer in the document
      if (session !== mine) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
      renderer.setClearColor(0x2a1030, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);

      // registered BEFORE the scene is populated: if any of the building below throws, the promise's
      // .catch reports it and unmount() still has a renderer and a scene to release. A half-built
      // scene that nothing can dispose is the leak this record exists to prevent.
      const pGeo = new THREE.SphereGeometry(0.045, 8, 6);
      gl = { renderer: renderer, scene: scene, extra: [pGeo] };

      const M = {
        plastic: c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25 }),
        cream:   new THREE.MeshPhysicalMaterial({ color: 0xfffef2, roughness: 0.55, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.25 }),
        ink:     new THREE.MeshStandardMaterial({ color: 0x1a0a10, roughness: 0.6, metalness: 0.05 }),
        metal:   new THREE.MeshPhysicalMaterial({ color: 0xfffef2, roughness: 0.55, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 }),
        glass:   new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.0, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
      };

      // ---- floor + backdrop burst (a flat sunburst disc behind the tub, cheap and on-brand)
      const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 40), new THREE.MeshStandardMaterial({ color: 0x1a0a10, roughness: 1 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.02; floor.receiveShadow = true; scene.add(floor);
      function burstTexture() {
        const c = document.createElement("canvas"); c.width = c.height = 512;
        const x = c.getContext("2d"); const cx = 256, cy = 256;
        x.fillStyle = "#3a1544"; x.fillRect(0, 0, 512, 512);
        x.translate(cx, cy);
        for (let i = 0; i < 24; i++) {
          x.rotate((Math.PI * 2) / 24);
          x.fillStyle = i % 2 ? "#ffea00" : "#3a1544";
          x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, 260, 0, Math.PI / 24); x.closePath(); x.fill();
        }
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      }
      const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(9, 9),
        new THREE.MeshStandardMaterial({ map: burstTexture(), roughness: 1, metalness: 0, transparent: true, opacity: 0.5 }));
      backdrop.position.set(0, 3.2, -3.6); scene.add(backdrop);

      // ---- light
      scene.add(new THREE.HemisphereLight(0xffe0f5, 0x2a1030, 0.95));
      const key = new THREE.DirectionalLight(0xfff2d0, 2.0);
      key.position.set(-4, 7, 5); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.near = 1; key.shadow.camera.far = 20;
      key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
      scene.add(key);
      const rimLight = new THREE.DirectionalLight(0xffffff, 1.3); rimLight.position.set(4, 3, -3); scene.add(rimLight);

      // ---- everything floats
      const floaters = [];
      const floatIt = (o, y, a) => floaters.push({ o, y, a: a == null ? 0.05 : a, p: Math.random() * 6.28 });

      // ---- the base (fixed, does not rotate)
      const BASE_Y = 0;
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.5, 28), M.plastic(0x2a1030));
      stand.position.y = BASE_Y + 0.25; stand.castShadow = true; stand.receiveShadow = true; scene.add(stand);

      // ---- the tub itself: this is what the visitor drags. Continuous rotation.y, never clamped, so
      // there is no seam turning either way - "endless" by construction, not by faking a loop.
      const TUB = new THREE.Group(); TUB.position.y = BASE_Y + 0.5; scene.add(TUB);
      // the label: the wordmark and the chosen name wrap the tub like a real printed label,
      // rendered entirely in canvas - never generated art, so it can always spell correctly.
      function labelTexture(name) {
        const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
        const x = c.getContext("2d");
        // BUGFIX (part 21): part 17's 180-rotate did not fix this - confirmed by reading the actual
        // screenshot, still mirrored. The tub is only ever seen from its inside (an open bowl viewed
        // from above never shows its outside), and three.js does not alter UV sampling for a
        // DoubleSide back face - so the back reads as a plain left-right mirror of the front, like
        // print seen through the back of the page. A mirror needs a mirror, not a rotation.
        // Outer wall uses normal outward-facing UVs.
        const grad = x.createLinearGradient(0, 0, 0, 256);
        grad.addColorStop(0, labelColor); grad.addColorStop(0.5, "#ffea00"); grad.addColorStop(1, "#7a2fc4");
        x.fillStyle = grad; x.fillRect(0, 0, 1024, 256);
        for (let i = 0; i < 6; i++) { x.fillStyle = "rgba(255,255,255,.22)"; x.fillRect(i * 171, 0, 2, 256); }
        x.textAlign = "center"; x.textBaseline = "middle";
        x.fillStyle = "#1a0a10"; x.font = "bold 92px Arial"; x.fillText(phase==='fill'||phase==='flavor'?"MBS / MIXING":"MBS FUEL", 512, 96);
        x.font = "bold 46px Arial"; x.fillText(phase==='fill'||phase==='flavor'?"BATCH IN PROGRESS":name || "", 512, 176, 960);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      }
      // outer wall: carries the product label, FrontSide only so the label is visible from outside and
      // never renders on the inside face - "we don't want the copy... on the inside of it" (client).
      const wallMat = M.plastic(0xffffff); wallMat.map = labelTexture(productName());
      wallMat.side = THREE.FrontSide;
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.55, 1.15, 32, 1, true), wallMat);
      productLabelUpdater = (name) => { wallMat.map.dispose(); wallMat.map = labelTexture(name); wallMat.needsUpdate = true; };
      wall.position.y = 0.58; wall.castShadow = true; TUB.add(wall);
      // inner wall: a second shell just inside the outer one, giving the tub real thickness (it was a
      // single paper-thin surface, which is what let the far interior wall clip away to nothing when
      // viewed from above) and facing the powder with plain colour, no label.
      const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.48, 1.1, 32, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x8a1040, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }));
      innerWall.position.y = 0.58; TUB.add(innerWall);
      // lived-in: a sticker peeled off long ago, the ghost rectangle and residue still there
      const residue = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.22),
        new THREE.MeshStandardMaterial({ color: 0xfffef2, roughness: 0.85, metalness: 0, transparent: true, opacity: 0.3 }));
      residue.position.set(0, 0.7, 1.62); TUB.add(residue);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.11, 12, 40), M.cream);
      rim.rotation.x = Math.PI / 2; rim.position.y = 1.15; TUB.add(rim);
      const tubFloor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), M.plastic(0x8a1040));
      tubFloor.rotation.x = -Math.PI / 2; tubFloor.position.y = 0.02; TUB.add(tubFloor);

      // powder bands: one flat disc per additive, nested like a target seen from above - each
      // additive owns a fixed radius ring, so its own colour always shows in its own annulus
      // whenever it is set, independent of every other additive's state. None removes the band.
      // The jar is a live record of the mix, not a re-tinted liquid.
      const BAND_H = { none: 0, weak: 0.12, strong: 0.26 };
      const BAND_R = [1.48, 1.30, 1.12, 0.94, 0.76, 0.58];
      const bands = SUPPS.map((s, i) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(BAND_R[i], BAND_R[i], 1, 24),
          new THREE.MeshStandardMaterial({ color: s.col, roughness: 0.95, metalness: 0 }));
        m.position.y = 0.03; m.scale.y = 0.0001; m.visible = false; TUB.add(m); return m;
      });
      function updateBands() {
        let height=0;
        SUPPS.forEach((s, i) => {
          const row = rowByKey(s.key);
          const h = BAND_H[row.dataset.level || "none"];
          bands[i].visible = h > 0;
          bands[i].scale.y = Math.max(0.0001, h);
          bands[i].scale.x=bands[i].scale.z=1.48/BAND_R[i];
          bands[i].position.y = 0.03 + height + h / 2; height+=h;
        });
      }
      updateBands();
      bandsUpdater = updateBands;
      function topLabelTexture(name){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle=labelColor;x.fillRect(0,0,512,512);x.strokeStyle='#20142a';x.lineWidth=14;x.beginPath();x.arc(256,256,223,0,Math.PI*2);x.stroke();x.fillStyle='#20142a';x.textAlign='center';x.font='bold 30px Arial';x.fillText('MBS FUEL',256,155);x.font='bold 38px Arial';const words=name.split(' ');let line='',y=220;for(const w of words){if(x.measureText(line+w).width>350){x.fillText(line.trim(),256,y);y+=48;line='';}line+=w+' ';}x.fillText(line.trim(),256,y);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
      const lidLabel=new THREE.Mesh(new THREE.CircleGeometry(1.84,64),new THREE.MeshBasicMaterial({map:topLabelTexture(productName())}));lidLabel.visible=false;lidLabel.name="custom-jar-top-label";lidLabel.rotation.x=-Math.PI/2;lidLabel.position.y=1.351;TUB.add(lidLabel);
      const updateWallLabel=productLabelUpdater;productLabelUpdater=name=>{updateWallLabel(name);lidLabel.material.map.dispose();lidLabel.material.map=topLabelTexture(name);};
      const lid=new THREE.Mesh(new THREE.CylinderGeometry(1.98,1.98,.18,40),M.cream);lid.position.y=1.25;lid.visible=false;TUB.add(lid);
      sceneBatch=()=>{jars.forEach((_,i)=>updateJarVisual(i));vials.forEach((_,i)=>updateVialVisual(i));lid.visible=lidLabel.visible=phase==='done';if(mixTurns>0){const color=new THREE.Color(FLAV_COL[Math.max(0,flavours.findIndex(f=>f.dataset.flavour===flavour))]);bands.forEach((b,i)=>b.material.color.copy(new THREE.Color(SUPPS[i].col).lerp(color,mixTurns/3)));}else bands.forEach((b,i)=>b.material.color.set(SUPPS[i].col));};

      // Ingredient jars keep their colored caps; names are on the controls.
      const jarBay = new THREE.Group(); jarBay.position.set(0, 0, 2.05); scene.add(jarBay);
      const JAR_SPACING = 0.62;
      const jars = SUPPS.map((s, i) => {
        const x = (i - (N - 1) / 2) * JAR_SPACING;
        const g = new THREE.Group(); g.position.set(x, 0.5, 0);
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.5, 16), M.cream);
        body.castShadow = true; g.add(body);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16),
          new THREE.MeshStandardMaterial({ color: s.col, roughness: 0.6, metalness: 0.1, emissive: s.col, emissiveIntensity: 0.05 }));
        cap.position.y = 0.3; g.add(cap);
        // lived-in: a moulding sprue nub repeats on every canister, the raw plastic never fully trimmed
        const sprue = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.04, 6), M.ink);
        sprue.position.set(0, -0.22, 0.26); g.add(sprue);
        if (i === 0) {
          // lived-in: one canister carries a scratch through its finish, down to the raw plastic underneath
          const scratch = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.02, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 }));
          scratch.position.set(0.02, 0.05, -0.27); scratch.rotation.z = 0.6; g.add(scratch);
        }
        const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 0.15; g.add(hit);
        g.userData = { key: s.key, cap, hit };
        jarBay.add(g);
        floatIt(g, g.position.y, 0.03);
        return g;
      });

      function updateJarVisual(i) {
        const row = rowByKey(jars[i].userData.key);
        const lvl = row && row.dataset.level;
        const cap = jars[i].userData.cap;
        cap.material.emissiveIntensity = lvl === "strong" ? 1.25 : lvl === "weak" ? 0.5 : 0.05;
        cap.scale.setScalar(lvl === "strong" ? 1.14 : 1);
      }
      jars.forEach((_, i) => updateJarVisual(i));

      // ---- the flavour menu: eight bottles, fixed to the LEFT of the tub (client, round 3 pass 3),
      // laid out as a small 2x4 shelf under a title card so it reads as a menu, not a loose row.
      const rack = new THREE.Group(); rack.position.set(-1.7, 0, 1.3); scene.add(rack);
      function menuTitleTexture(text) {
        const c = document.createElement("canvas"); c.width = 320; c.height = 96;
        const x = c.getContext("2d");
        x.fillStyle = "#1a0a10"; x.fillRect(0, 0, 320, 96);
        x.strokeStyle = "#ffea00"; x.lineWidth = 4; x.strokeRect(3, 3, 314, 90);
        x.fillStyle = "#ffea00"; x.font = "bold 40px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText(text, 160, 48);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      }
      const menuTitle = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.26),
        new THREE.MeshBasicMaterial({ map: menuTitleTexture("FLAVOUR"), transparent: true }));
      menuTitle.position.set(0, 1.04, 0); rack.add(menuTitle);
      const FLAV_COLS = 2;
      const vials = flavours.map((btn, i) => {
        const col = i % FLAV_COLS, row = Math.floor(i / FLAV_COLS);
        const x = (col - (FLAV_COLS - 1) / 2) * 0.3;
        const y = 0.78 - row * 0.28;
        const g = new THREE.Group(); g.position.set(x, y, 0);
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.5, 14),
          new THREE.MeshStandardMaterial({ color: FLAV_COL[i], roughness: 0.5, metalness: 0.05, emissive: FLAV_COL[i], emissiveIntensity: 0.15 }));
        bottle.castShadow = true; g.add(bottle);
        if (i === 0) bottle.material.color.lerp(new THREE.Color(0xffffff), 0.4);   // lived-in: this one bottle sun-faded on the shelf
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.14, 10), M.ink);
        neck.position.y = 0.32; g.add(neck);
        // lived-in: the same moulding sprue nub as the canisters, repeated on every bottle
        const sprue2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.03, 6), M.ink);
        sprue2.position.set(0, -0.24, 0.13); g.add(sprue2);
        // an invisible, generous hit target - the bottle itself is a small thing to aim at on a phone
        const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.45, 8), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 0.15; g.add(hit);
        g.userData = { i, bottle, hit };
        rack.add(g);
        floatIt(g, g.position.y, 0.02);
        return g;
      });
      function updateVialVisual(i) {
        const sel = flavours[i].dataset.flavour === flavour;
        vials[i].userData.bottle.material.emissiveIntensity = sel ? 1.1 : 0.15;
      }
      vials.forEach((_, i) => updateVialVisual(i));
      // Round 3 note: this used to also drop a tiny projected DOM label under each of the 8 bottles.
      // At 1280 they were already tight; at 390 they collided and became unreadable - a real failure
      // even though the stage itself fit on screen. Coordinator's fix, in the order given: name the
      // selected flavour in the header line instead (#fuFlavTag, updated from renderCan()) rather than
      // label all eight at once. Bottle colour still tells them apart; tapping one reveals which.

      // ---- the injector: a slim nozzle that drives down into the powder from directly above the tub,
      // then a colour bloom spreads through the surface. Different verb from the scoop: scooping dumps
      // in bulk from the side, injecting is a single potent plunge from above.
      const NOZZLE_HOME = new THREE.Vector3(0, 2.6, 0);
      const nozzle = new THREE.Group(); nozzle.position.copy(NOZZLE_HOME); scene.add(nozzle);
      const nozzleBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 10), M.metal);
      nozzle.add(nozzleBody);
      const nozzleTip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 10), M.ink);
      nozzleTip.position.y = -0.38; nozzle.add(nozzleTip);
      nozzle.visible = false;
      floatIt(nozzle, NOZZLE_HOME.y, 0.03);

      // ---- the scoop: fixed outside the tub, at the front. Tapping it is the act of choosing.
      const SCOOP_HOME = new THREE.Vector3(0, 1.85, 2.15);
      const scoop = new THREE.Group(); scoop.position.copy(SCOOP_HOME); scoop.rotation.x = -0.5; scene.add(scoop);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.7, 10), M.metal);
      handle.position.y = 0.3; scoop.add(handle);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 12, 0, Math.PI * 2, 0, Math.PI / 1.7), M.metal);
      bowl.rotation.x = Math.PI; bowl.position.y = -0.08; bowl.castShadow = true; scoop.add(bowl);
      // lived-in: the same sprue nub, repeated once more on the scoop
      const scoopSprue = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.03, 6), M.ink);
      scoopSprue.position.set(0.2, -0.05, 0); scoopSprue.rotation.z = Math.PI / 2; scoop.add(scoopSprue);
      floatIt(scoop, SCOOP_HOME.y, 0.035);

      // the two UNTESTED flags, fixed beside the tub, float on their own
      function flagTexture() {
        const c = document.createElement("canvas"); c.width = 220; c.height = 100;
        const x = c.getContext("2d");
        x.fillStyle = "#ffea00"; x.fillRect(0, 0, 220, 100);
        x.strokeStyle = "#1a0a10"; x.lineWidth = 8; x.strokeRect(4, 4, 212, 92);
        x.fillStyle = "#1a0a10"; x.font = "bold 34px Arial"; x.textAlign = "center"; x.textBaseline = "middle";
        x.fillText("UNTESTED", 110, 52);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
      }
      const flagMat = new THREE.MeshStandardMaterial({ map: flagTexture(), roughness: 0.9, metalness: 0, side: THREE.DoubleSide });
      [[-2.5, -1.1], [2.5, -1.1]].forEach(([fx, fz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.1, 6), M.ink);
        pole.position.set(fx, 0.75, fz); scene.add(pole);
        const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.24), flagMat);
        flag.position.set(fx + (fx > 0 ? 0.26 : -0.26), 1.28, fz); scene.add(flag);
        floatIt(flag, flag.position.y, 0.05);
      });

      // ---- resize: narrow (phone) backs the camera off so the whole tub still reads
      function resize() {
        const w = stage.clientWidth || 320, h = stage.clientHeight || 240;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        const narrow = w / h < 1.05;
        camera.position.set(0, narrow ? 5.6 : 4.7, narrow ? 6.6 : 5.6);
        camera.lookAt(0, 0.7, 0.3);
        camera.updateProjectionMatrix();
      }
      // world matrices only update on render or on an explicit call - a tab that loads without ever getting a
      // requestAnimationFrame tick (backgrounded on load) would leave every raycast target sitting at identity
      // until the first render, so every tap would silently miss. Force it once, up front.
      scene.updateMatrixWorld(true);
      ctx.observe(new ResizeObserver(resize), stage);
      resize();
      ctx.timeout(resize, 80);   // a tab that loads backgrounded can hand the stage a 0x0 layout on the first pass

      // ---- rotation follows the pointer's horizontal position (client, round 3: "get rid of the drag
      // feature... it just needs to be based off of where the mouse is"). No press/move/release: while the
      // pointer sits over the stage, the tub keeps spinning at a speed/direction set by how far left or
      // right of centre it is - hard stop the instant the pointer leaves. Still endless (angle is never
      // clamped), so there is still no seam turning either way. Touch has no hover (Codex C4), so mouse/pen
      // only here; the rotate buttons below cover touch. .channel's zoom:1.15 is retired (2.16/C002), so
      // visual and layout px now agree; the rect+event form below is kept because it is correct either way -
      // every bit of this is built from the rect and the event only, never clientWidth.
      let angle = 0, hoverActive = false, hoverFrac = 0, lastJar = 0;
      const ROT_SPEED = 2.0;   // rad/s at full deflection
      ["pointerenter", "pointermove"].forEach(evt => ctx.on(canvas, evt, e => {
        if (e.pointerType === "touch") return;
        const r = canvas.getBoundingClientRect();
        hoverFrac = ((e.clientX - r.left) / r.width) * 2 - 1;
        hoverActive = true;
      }));
      ctx.on(canvas, "pointerleave", e => { if (e.pointerType !== "touch") hoverActive = false; });

      // ---- visible tap controls: a touch device has no hover, so it needs its own way to spin the tub.
      const rotL = byId("fuRotL"), rotR = byId("fuRotR");
      const ROT_STEP = Math.PI / 8;
      if (rotL) ctx.on(rotL, "click", () => { angle -= ROT_STEP; });
      if (rotR) ctx.on(rotR, "click", () => { angle += ROT_STEP; });

      // ---- raycast, same rect-and-event rule
      const ray = new THREE.Raycaster(), pt = new THREE.Vector2();
      function pick(e) {
        const r = canvas.getBoundingClientRect();
        pt.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        pt.y = -((e.clientY - r.top) / r.height) * 2 + 1;
        ray.setFromCamera(pt, camera);
        const targets = [...vials.map(v => v.userData.hit), ...jars.map(j => j.userData.hit)];
        const isect = ray.intersectObjects(targets, false);
        if (!isect.length) return null;
        const o = isect[0].object;
        const vi = vials.findIndex(v => v.userData.hit === o);
        if (vi >= 0) return { kind: "vial", i: vi };
        const ji = jars.findIndex(j => j.userData.hit === o);
        if (ji >= 0) return { kind: "jar", i: ji };
        return null;
      }

      // ---- particles: a scoop's dump. Colour is the additive's; amount is the level.
      const particles = [];
      function dump(color, count) {
        for (let i = 0; i < count; i++) {
          const m = new THREE.Mesh(pGeo, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0, emissive: color, emissiveIntensity: 0.4 }));
          m.position.copy(scoop.position).add(new THREE.Vector3((Math.random() - 0.5) * 0.2, -0.15, (Math.random() - 0.5) * 0.2));
          const vel = new THREE.Vector3((Math.random() - 0.5) * 0.9, -0.5 - Math.random() * 0.5, -1.1 - Math.random() * 0.4);
          scene.add(m);
          particles.push({ m, vel, life: 700 + Math.random() * 300, t: 0 });
        }
      }

      // ---- act: scoop cycles the front canister's level; vial injects a flavour. Both drive the same state.
      let scooping = false, injecting = false;

      function injectFlavour(i) {
        if (injecting || scooping || phase!=='flavor' || mixing || busy) return;
        busy=true;
        injecting = true;
        flavours[i].click(); updateVialVisual(i);
        nozzle.visible = true;
        const col = new THREE.Color(FLAV_COL[i]);
        const bloom = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
        bloom.rotation.x = -Math.PI / 2; bloom.position.y = 0.35; TUB.add(bloom);
        const t0 = performance.now();
        const down = new THREE.Vector3(0, 0.5, 0);
        function step(now) {
          // the channel went away mid-animation: the context has already cancelled this frame and
          // unmount() disposes the whole graph, so there is nothing left to tidy here
          if (!gl || session !== mine) return;
          const t = Math.min(1, (now - t0) / 900);
          if (t < 0.4) { nozzle.position.lerpVectors(NOZZLE_HOME, down, t / 0.4); }
          else {
            const k = (t - 0.4) / 0.6;
            nozzle.position.lerpVectors(down, NOZZLE_HOME, k);
            bloom.scale.setScalar(0.3 + k * 6);
            bloom.material.opacity = 0.85 * (1 - k);
          }
          if (t < 1) ctx.frame(step);
          else { nozzle.visible = false; TUB.remove(bloom); bloom.geometry.dispose(); bloom.material.dispose(); injecting = false; busy=false;renderBatch(); }
        }
        ctx.frame(step);
      }
      function act(hit) {
        if (hit.kind === "vial") { injectFlavour(hit.i); return; }
        if (hit.kind === "jar") { scoopJar(hit.i); return; }
      }
      // scoop a specific jar by index - jars are now standalone and clicked directly (client: "jars...
      // outside... each individually labeled"), so there is no more "front" jar to compute from rotation.
      function scoopJar(i) {
        if (scooping || injecting || phase!=='fill' || !addScoop(i)) return;
        busy=true;renderBatch();
        const row = rowByKey(jars[i].userData.key);
        const next = row.dataset.level;
        updateJarVisual(i);
        lastJar = i;
        scooping = true;
        // The animation completion releases the input lock.   // backstop: rAF can stall on a dropped frame, setTimeout can't
        const t0 = performance.now();
        const from = SCOOP_HOME.clone();
        const dip = jars[i].getWorldPosition(new THREE.Vector3());dip.y+=0.4;
        const pour = new THREE.Vector3(SCOOP_HOME.x, SCOOP_HOME.y + 0.15, SCOOP_HOME.z - 1.6);
        function step(now) {
          if (!gl || session !== mine) return;   // see injectFlavour's step
          const t = Math.min(1, (now - t0) / 900);
          if (t < 0.35) {
            const k = t / 0.35;
            scoop.position.lerpVectors(from, dip, k); scoop.rotation.x = -0.5 - k * 0.3;
          } else if (t < 0.6) {
            const k = (t - 0.35) / 0.25;
            scoop.position.lerpVectors(dip, pour, k); scoop.rotation.x = -0.5 - 0.3 + k * 1.7;
            if (next !== "none" && k > 0.85 && !scoop.userData.dumped) {
              scoop.userData.dumped = true;
              dump(SUPPS[i].col, next === "strong" ? 26 : 10);
            }
          } else {
            const k = (t - 0.6) / 0.4;
            scoop.position.lerpVectors(pour, from, k); scoop.rotation.x = -0.5 + 1.4 * (1 - k);
          }
          if (t < 1) ctx.frame(step);
          else { scoop.position.copy(from); scoop.rotation.x = -0.5; scoop.userData.dumped = false; scooping = false;busy=false;renderBatch(); }
        }
        ctx.frame(step);
      }
      animateScoop=scoopJar;animateFlavor=injectFlavour;
      ctx.on(canvas, "click", e => { const hit = pick(e); if (hit) act(hit); });

      // ---- keyboard path: same state, same act() the touch/pointer path uses. Arrow keys only inside
      // the canvas, so the rest of the page still scrolls normally with the keyboard.
      canvas.tabIndex = 0;
      let kbFlav = 0;
      ctx.on(canvas, "keydown", e => {
        const step = (Math.PI * 2 / N) / 3;
        if (e.key === "ArrowLeft") { angle -= step; }
        else if (e.key === "ArrowRight") { angle += step; }
        else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          kbFlav = (kbFlav + (e.key === "ArrowDown" ? 1 : -1) + flavours.length) % flavours.length;
          act({ kind: "vial", i: kbFlav });
        } else if (e.key === "[" || e.key === "]") {
          lastJar = (lastJar + (e.key === "]" ? 1 : -1) + N) % N;
        } else if (e.key === "Enter" || e.key === " ") { act({ kind: "jar", i: lastJar }); }
        else return;
        e.preventDefault();
      });

      // ---- frame loop
      let last = performance.now();
      function frame(now) {
        // unmounted: stop before touching the scene. ctx cancels the pending frame as well, so this
        // guard is the belt to that braces - what it actually prevents is a frame already in flight
        // when unmount() ran from rendering into a disposed renderer.
        if (!gl || session !== mine) return;
        ctx.frame(frame);
        const dt = Math.min(50, now - last); last = now;

        if (hoverActive) angle += hoverFrac * ROT_SPEED * (dt / 1000);
        if(mixing&&!REDUCED)angle+=dt*.008;
        TUB.rotation.y = angle;

        if (!REDUCED) for (const f of floaters) f.o.position.y = f.y + Math.sin(now / 900 + f.p) * f.a;

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.t += dt;
          p.vel.y -= 0.0022 * dt;
          p.m.position.addScaledVector(p.vel, dt / 220);
          p.m.scale.setScalar(Math.max(0, 1 - p.t / p.life));
          if (p.t >= p.life || p.m.position.y < 0.1) { scene.remove(p.m); p.m.geometry === pGeo || p.m.geometry.dispose(); p.m.material.dispose(); particles.splice(i, 1); }
        }

        const row = rowByKey(SUPPS[lastJar].key);
        const lvl = row.dataset.level;
        const promiseEl = row.querySelector(lvl ? `.p-${lvl}` : ".p-unset");
        faceEl.querySelector("b").textContent = row.querySelector(".name").textContent + (lvl ? " · " + lvl.toUpperCase() : "");
        faceEl.querySelector("i").textContent = promiseEl ? promiseEl.textContent : "";
        nudge.textContent = {fill:'Tap a jar to add a scoop.',flavor:'Inject a flavor. Mix three times.',label:'Choose your label below.',done:'BATCH SEALED!'}[phase];

        renderer.render(scene, camera);
      }
      ctx.frame(frame);

      fu.classList.add("has3d");renderCan();
    }).catch(err => {
      console.error("[fu] three.js failed to load", err);   // stageCard stays hidden; rows/flavours above still work
    });
  },

  /* What the CONTEXT cannot own, and nothing else. Every listener, the ResizeObserver, both scoop
     timers and all three animation-frame chains are registered through ctx and are deliberately not
     re-listed here - that is mominc's rule and it holds. What is left is the GPU.

     A WebGLRenderer holds a real graphics context, and a browser keeps only a handful of them alive
     at once, silently dropping the OLDEST when a page asks for one too many. So a renderer that
     outlives its channel does not throw; it takes an EARLIER channel's canvas away, several channel
     changes later. dispose() releases the GPU-side resources, and forceContextLoss() hands the
     context itself back rather than waiting for the collector to notice.

     The scene is disposed by WALKING it rather than from a list built at construction time. Forty-odd
     meshes are created across eight sections of mount(), and a registration list that has to be
     appended to at each one is a list a later edit will forget - which is the failure mode this whole
     runtime exists to remove. The graph already knows what it holds. `extra` carries the one thing
     the graph does not: the shared particle geometry, which is deliberately parented to nothing so
     that a thousand particles can share it.

     The canvas itself is NOT removed here, unlike djscratch's: fuel's canvas is #fuCanvas in the
     fragment's own markup, so it goes when the fragment is replaced. Removing it would be reaching
     into markup this module did not create. */
  unmount() {
    session = null;
    if (!gl) return;
    const g = gl;
    gl = null;
    const killMat = (m) => {
      if (!m) return;
      // a material's textures are disposables in their own right, and the canvas-generated ones here
      // (the wrapping product label, six jar labels, the burst, the menu card, the flag) are the
      // largest thing this channel puts on the GPU
      for (const k of ["map", "emissiveMap", "normalMap", "roughnessMap", "alphaMap"]) {
        if (m[k]) { try { m[k].dispose(); } catch (e) { /* already gone */ } }
      }
      try { m.dispose(); } catch (e) { /* already gone */ }
    };
    try {
      g.scene.traverse(o => {
        if (o.geometry) { try { o.geometry.dispose(); } catch (e) { /* already gone */ } }
        // dispose() is safe to call twice, which matters: M.cream, M.ink and flagMat are each shared
        // by several meshes, so the walk reaches them more than once
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(killMat);
      });
    } catch (e) { console.error("[fu] scene teardown", e); }
    g.extra.forEach(x => { try { x.dispose(); } catch (e) { /* already gone */ } });
    try { g.renderer.dispose(); } catch (e) { /* already disposed */ }
    try { g.renderer.forceContextLoss(); } catch (e) { /* context already lost */ }
  },
};
