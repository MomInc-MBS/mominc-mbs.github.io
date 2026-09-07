/* tv/questionnaire.js - the assessment engine (PLAN-r9 2.19, Part E.8 "Footprint Calculator").

   ONE engine, three assessments, and the assessments are JSON. The acceptance for 2.19 is
   "the engine renders all three assessments from data alone; no channel-specific branch exists in
   the engine", so there is no channel id anywhere in this file and tools/check_questionnaire.py
   asserts that against the manifest's own id list rather than against a hard-coded one.

   ES module, not a classic script, because its consumers are the converted channel modules (2.18).
   It reaches the shared store through window.MBS_STATE - which IS a classic script - by name, so a
   page that never loaded state.js still renders and simply does not persist.

   The contract E.8 sets, and the parts of it that live here rather than in the data:
     - The privacy statement renders BEFORE the first question. Not "the data should remember to put
       it first": this file appends it first, from spec.privacy, always.
     - No email or phone is required to reveal the result. There is no field type here that could ask
       for either - every question is a radio group over its own declared options.
     - Answers stay on this device. The only write is MBS_STATE.saveDraft(spec.id, ...), which is the
       same `drafts` collection card.js uses, in the same {title, answers} shape. Not a fourth key.

   The data decides everything else: the questions, the options, what each option is worth, and how
   each outcome is derived. Three derivations exist (below) and the JSON names the one it wants.
   A fourth assessment is a fourth JSON file and no change here; if it ever isn't, that is the bug. */

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* A band or a map entry is either a plain string or {text, src}. Provenance is not optional prose:
   F.6 says concision never deletes a safety or sourcing disclosure, so the src line renders whenever
   the data carries one. */
const norm = (v) => (v == null || v === "") ? null : (typeof v === "object" ? v : { text: String(v) });

const within = (b, n) => n >= (b.min == null ? -Infinity : b.min) && n <= (b.max == null ? Infinity : b.max);

/* The only three ways an outcome can be derived, selected BY THE DATA through `kind`.
     score - the number itself, as "n of max" when the assessment declares a max
     band  - a range of the score picks the text
     map   - one question's answer picks the text
   E.8's five required outcomes are all one of these: compression score (score), MOM diagnosis (band),
   prescribed residence (band), real housing-burden context (map), Wednesday's show (map). */
const RESOLVE = {
  score: (o, ans, score, spec) => norm(
    (spec.score && spec.score.max != null) ? `${score} of ${spec.score.max}` : String(score)),
  band: (o, ans, score) => norm((o.bands || []).find(b => within(b, score))) || norm(o.fallback),
  map: (o, ans) => norm((o.map || {})[ans[o.of]]) || norm(o.fallback),
};

/* Renders `spec` into `root` and returns a handle. Throws on a spec this engine cannot honour, which
   the shell's mount try/catch turns into the unavailable state - a loud failure, never a blank one. */
export function create(root, spec, opts = {}) {
  if (!root) throw new Error("questionnaire: no root element");
  if (!spec || !spec.id || !Array.isArray(spec.questions) || !spec.questions.length)
    throw new Error("questionnaire: a spec needs an id and at least one question");

  spec.questions.forEach(q => {
    if (!q.id || !Array.isArray(q.options) || q.options.length < 2)
      throw new Error(`questionnaire: question ${JSON.stringify(q.id)} in ${spec.id} needs an id and two or more options`);
  });
  (spec.outcomes || []).forEach(o => {
    if (!RESOLVE[o.kind])
      throw new Error(`questionnaire: outcome ${JSON.stringify(o.id)} in ${spec.id} has unknown kind ${JSON.stringify(o.kind)}`);
    if (o.kind === "map" && !spec.questions.some(q => q.id === o.of))
      throw new Error(`questionnaire: outcome ${JSON.stringify(o.id)} in ${spec.id} maps question ${JSON.stringify(o.of)}, which this assessment does not ask`);
  });

  const form = el("form", "q");
  form.dataset.assessment = spec.id;
  form.noValidate = true;                       // the missing-answer message below is the one that speaks

  if (spec.title) form.appendChild(el("h2", "q-title", spec.title));
  if (spec.intro) form.appendChild(el("p", "q-intro", spec.intro));

  // before the first question, always
  const privacy = el("p", "q-privacy", spec.privacy);
  privacy.dataset.privacy = "";
  form.appendChild(privacy);

  const list = el("ol", "q-list");
  spec.questions.forEach(q => {
    const item = el("li", "q-item");
    item.dataset.q = q.id;
    const field = el("fieldset", "q-field");
    const legend = el("legend", "q-legend", q.label);
    if (q.optional) legend.appendChild(el("span", "q-optional", " (optional)"));
    field.appendChild(legend);
    if (q.help) field.appendChild(el("p", "q-help", q.help));
    q.options.forEach((op, i) => {
      const label = el("label", "q-opt");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.value = op.value;
      label.appendChild(input);                 // wrapped, so no id/for pair to keep unique per mount
      label.appendChild(el("span", "q-opt-label", op.label));
      field.appendChild(label);
    });
    item.appendChild(field);
    list.appendChild(item);
  });
  form.appendChild(list);

  const actions = el("div", "q-actions");
  const submit = el("button", "q-submit", spec.submitLabel || "See the result");
  submit.type = "submit";
  actions.appendChild(submit);
  const error = el("p", "q-error");
  error.setAttribute("role", "alert");
  error.hidden = true;
  actions.appendChild(error);
  form.appendChild(actions);

  const out = el("section", "q-out");
  out.setAttribute("aria-live", "polite");
  out.hidden = true;
  form.appendChild(out);

  const inputs = () => Array.from(form.querySelectorAll("input[type=radio]"));

  const answers = () => {
    const a = {};
    inputs().forEach(i => { if (i.checked) a[i.name] = i.value; });
    return a;
  };

  const scoreOf = (a) => spec.questions.reduce((n, q) => {
    const op = q.options.find(o => o.value === a[q.id]);
    return n + ((op && Number(op.score)) || 0);
  }, 0);

  const store = () => opts.store || window.MBS_STATE || null;

  /* Returns whether the write actually landed, same guarantee saveDraft gives card.js: a form that
     says "saved" when site data is blocked is a lie the visitor cannot see. */
  const save = (a, score) => {
    const s = store();
    if (!s || typeof s.saveDraft !== "function") return false;
    try { return s.saveDraft(spec.id, { title: spec.title || spec.id, answers: a, score }); }
    catch { return false; }
  };

  const restore = () => {
    const s = store();
    const draft = (s && typeof s.draftFor === "function") ? s.draftFor(spec.id) : null;
    const a = draft && draft.answers;
    if (!a || typeof a !== "object") return null;
    inputs().forEach(i => { if (a[i.name] === i.value) i.checked = true; });
    return a;
  };

  const reveal = (a, score) => {
    out.replaceChildren();
    (spec.outcomes || []).forEach(o => {
      const r = RESOLVE[o.kind](o, a, score, spec);
      if (!r || !r.text) return;                // an outcome with nothing to say says nothing
      const box = el("div", "q-outcome");
      box.dataset.outcome = o.id;
      if (o.label) box.appendChild(el("h3", "q-outcome-label", o.label));
      box.appendChild(el("p", "q-outcome-text", r.text));
      if (r.src) box.appendChild(el("p", "q-src", r.src));
      out.appendChild(box);
    });
    out.hidden = false;
  };

  const onSubmit = (e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    const a = answers();
    const missing = spec.questions.find(q => !q.optional && a[q.id] === undefined);
    if (missing) {
      error.textContent = (spec.missingLabel || "Answer this one first: ") + missing.label;
      error.hidden = false;
      const first = inputs().find(i => i.name === missing.id);
      if (first) first.focus();
      return null;
    }
    error.hidden = true;
    const score = scoreOf(a);
    reveal(a, score);
    const saved = save(a, score);
    const result = { id: spec.id, answers: a, score, saved };
    if (typeof opts.onComplete === "function") opts.onComplete(result);
    return result;
  };

  form.addEventListener("submit", onSubmit);
  root.appendChild(form);
  const restored = restore();

  return {
    form,
    restored,                                   // the draft this mount found, or null
    answers,
    score: () => scoreOf(answers()),
    submit: () => onSubmit(null),
    destroy() {
      form.removeEventListener("submit", onSubmit);
      form.remove();
    },
  };
}

/* Convenience for a consumer that has a URL rather than a parsed spec. Kept here rather than in each
   channel so the fetch failure has one shape: a throw the shell's mount already handles. */
export async function load(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`questionnaire: ${url} answered ${res.status}`);
  return res.json();
}
