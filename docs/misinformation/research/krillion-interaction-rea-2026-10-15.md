# Krillion interaction recheck with REA - 2026-10-15

This is a behavior reference for an original implementation, not copied game code or an answer bank. Production integration base checked: `25d00cf46f6a4a2292a4c7c5b386fda5e48b58e5`, `D:/site-work/misinformation-main`. No game or backend files were changed.

## Evidence and reproducibility

Current public sources: [game](https://krillion.io/), [official FAQ](https://krillion.io/faq), [daily controller](https://krillion.io/_next/static/chunks/0dnsev-dwk49n.js), [shared input/correction components](https://krillion.io/_next/static/chunks/13amf1x8mc9_f.js), [journey renderer](https://krillion.io/_next/static/chunks/2gx7nk58jzx_n.js), and [interaction CSS](https://krillion.io/_next/static/chunks/1o2se7g_83fju.css). Downloads used the deployment query `dpl_CvyfBAysav5AEydm8LXMzH9tba3U`; immutable local hashes are in the inventory below.

The new home response references **14 JavaScript chunks**. The earlier thirteen-file investigation omitted `0dnsev-dwk49n.js`, which contains the daily controller and resolves several previously unknown behaviors. No bundle was executed locally.

An actual **REA 6.5.0** CLI run succeeded. Evidence ID: `ev_162c498310d9975d4b39991d14db27d67037cc7e3982172ddefedf8fa59a7ce8`. Inventoried artifact digest: `b1dcfd36d837fa70dda8c57dc1288d944e071239e2bf5afeba245db1537c156a`. It parsed the two selected controller/component files (63,993 bytes), visited 17,147 AST nodes, returned seven findings and zero parse failures. It explicitly leaves twelve inventoried files unselected; semantic coverage is partial and deliberately limited to 500 retained nodes / 250 per file. Ordinary inert text inspection of the renderer and CSS supplies the layout/animation details below; those are not attributed to REA's selected-file graph.

The bounded raw result is 3,447,267 bytes, rather than the earlier 386 MB record. The reproducible command was:

```text
npx.cmd -y rea-agents@6.5.0 analyze-javascript-application D:/Research/moms-misinformation-machine/current-2026-10-15/js --source-path 13amf1x8mc9_f.js --source-path 0dnsev-dwk49n.js --max-semantic-nodes 500 --max-semantic-nodes-per-file 250 --max-heap-mb 512 --analysis-timeout-ms 30000 --format json
```

Compact retained evidence: [rea-interaction-summary-2026-10-15.json](rea-interaction-summary-2026-10-15.json). Local acquisition directory: `D:/Research/moms-misinformation-machine/current-2026-10-15/`, containing `home.html`, `faq.html`, `inventory.json`, `js/`, `css/`, `rea-bounded.json` and `rea-compact.json`. Offsets below are zero-based decoded Unicode character offsets, not byte offsets.

## Question and input composition

**Direct client/CSS evidence:** one prominent question card belongs to the moving journey scene. Its hierarchy is a small prompt-number line, large open-ended category question, then one short rarity hint. The default ocean header is PROMPT n OF 7. There is no answer list in the question card.

The renderer creates this card at `2gx7nk58jzx_n.js @19638`; the ocean copy defaults are @12789. CSS `1o2se7g_83fju.css @4477` places it with 12px left and 62px right offsets, 16px/18px padding, and a 28-40px responsive question font. It is dark, bordered/glowing, and remains visually distinct from the bottom input. These measurements describe the source, not a pixel-verified current screenshot.

A bottom input dock is centered to a 600px maximum width. It has a circular sonar/countdown at left, one large text field with a shrinking time bar, and one submit button at right. The dock accounts for phone safe areas; separate advertising CSS can lift it. A correction or rejection appears just above it. CSS references: dock @9048, inner row @9352, input @10513, correction/rejection @11450-12480.

On-screen gameplay therefore emphasizes **one question, one answer field, one primary action**, while score/depth/progress remain peripheral HUD information. It does not present an archive, topic browser, source article or large settings panel as a competing active question task.

## Exact typing, checking and correction flow

**Direct controller evidence:** `0dnsev-dwk49n.js @33300-34900`, submit handler @25650-27000, plus correction component `13amf1x8mc9_f.js @15916-16570`.

1. The answer phase focuses the input. Text is stored as typed, preserving case. Form submission trims leading/trailing whitespace; blank input cannot submit. The input permits 256 characters. Browser autocomplete, autocorrect, capitalization and spellcheck are disabled.
2. Enter submits the form, as does the primary button. While a request is pending, the submit button is disabled and displays an ellipsis. Input change handling also returns early, preventing a second concurrent answer from replacing the in-flight state. This is not live checking on every keystroke.
3. The browser posts to `/api/submit` with date, prompt ID, trimmed answer, correction-preview preference and player ID. Its request abort timer is five seconds. A generic network failure restores a retry message. It does not invent a score locally for that failure.
4. If the server returns a correction, the input is replaced with the proposed name, a from/to preview appears, and focus returns to the input. A second submission checks that corrected name; editing clears the correction and rejection message. The manual second submit still follows the user's correction-preview preference; it is not the special timeout-finalization path.
5. If the result is accepted and has a tier, the result retains the raw submitted answer and server canonical answer, enters feedback, clears the dock state/deadlines, and starts the journey reward.
6. A rejected ordinary answer stays in the answer phase with the same deadline. The message quotes the rejected text and asks for another attempt; a roughly 0.4-second shake/effect reinforces the rejection. Clearing the text is a separate preference, default off. There is no observed fixed one-attempt limit within the remaining time.
7. Input text is not forcibly uppercased. The moving reward chip uppercases the accepted answer for presentation (`2gx7nk58jzx_n.js @38620`). That is not evidence of the server's case-normalization algorithm.

The correction is an accessible live-status region; it shows both the submitted and proposed names and asks for confirmation or editing. It is a compact inline preview, not an automatic silent replacement by default. The earlier report's menu observation still applies: opening the menu does not generally pause the answer clock.

## Preview, timeout and reward cadence

**Direct controller/renderer evidence:**

- Starting a round sets a **three-second preview**, with the question entering the scene before the input phase. The controller asks the renderer for a 2.4-second descent; card entry is delayed 0.45 seconds and animates for 0.7 seconds. The countdown starts from the preview deadline, not after arbitrary rendering time. Constants are in `13amf1x8mc9_f.js @11914`; transition calls are `0dnsev-dwk49n.js @27730-27860`.
- The answer window is **25 seconds**, refreshed for display every 100ms. Final-three-second styling intensifies at about 3.05 seconds remaining.
- At expiry, a nonempty draft is automatically submitted once through the finalization path; correction preview is disabled for that attempt. An empty draft becomes a zero-point miss. A rejected final attempt also becomes a miss. This is not a new full thinking window.
- If a request was already pending when time ran out, the controller waits only a bounded interval: a miss fallback occurs after approximately four seconds beyond the later of the deadline and submission time. The separate request abort is five seconds; a 6.5-second watchdog resets stuck pending UI. These are interacting client safeguards, not proof of a matching server-side time policy. References: @24870-25390 and @27100-27720.
- Acceptance starts the rarity journey immediately. There is **no separate factual-classification question** in Krillion. The accepted answer becomes a moving chip, the card leaves, tier/depth markers are revealed, and the camera traverses the earned distance.
- Fixed answer rewards remain 10/15/30/60/85/100 points, with distance equal to ten times points. Plunge durations are 3.4/3.0/3.0/3.4/4.3/4.6 seconds respectively (`2gx7nk58jzx_n.js @22074`). Rarer tiers have distinct effects; the top tier adds a gold celebration.
- The continue control is gated by the landed callback, rather than appearing immediately after the network response. It advances on click or eligible Enter; repeat/composition/modifier keys and inappropriate focused controls are guarded. The final round surfaces instead of descending. References: `0dnsev-dwk49n.js @27800-29740` and @34700 onward.
- A miss has a short approximately 0.9-second consequence, preserves banked distance/score, and then permits continuation. There is **no explicit pass/skip button in the inspected daily answering dock**; absence is scoped to this current daily UI, not all paid modes.

Prior runtime observations remain corroborating evidence, not newly performed actions: Quasar earned 60 points / 600m; banana was rejected with another attempt available while the clock continued. Root's current browser session independently reached a question preview. This recheck did not navigate or operate the shared browser.

## What can and cannot be inferred about answer validation

A read-only request to [the public daily endpoint](https://krillion.io/api/today) returned top-level date, day number, reset timestamp and seven prompts. Each prompt has only ID and text. No answer set was returned in that response. The controller delegates matching and tier assignment to `/api/submit`; its implementation is not in the shipped client.

The official FAQ describes curated, merged reference answer sets, acknowledges valid omissions, and explains that aliases participate in typo matching. It describes model assistance for **curation/rarity work**, not a proved live free-form inference grader. Do not claim its checker has unlimited semantic coverage, an exact edit-distance cutoff, or a discovered private bank. The finished-results component requests `/api/reveal?date=...` (@15012); that reveals another public-facing feature, not access to the underlying server implementation. We did not request or copy the reveal bank.

## Clean-room adaptations for MOM

Prioritize the active question and bottom answer controls. Present the original broad prompts as short open-ended requests, keep the question visible during correction/retry, and preserve focus. Give a brief preview before enabling the clock and field. Use a concise checking state, specific inline correction confirmation, and retry without charging a factual hit. Auto-submit a nonempty draft at expiry once, and guard Enter/click against duplicate resolution.

Gate continuation on the journey landing, and make higher rarity visibly change launch intensity. Keep source/article detail in the evidence stage or a reveal, instead of competing with the naming question. Retain MOM's original space art, wording, three-hit escape objective and factual-check stage; those are intentional additions. The implemented 35-second window and bounded pause for hosted lookup are also deliberate MOM differences from Krillion's 25-second running-clock/network-grace behavior.

These recommendations adapt the observed interaction pattern. They do not request copying Krillion's source, CSS, art, branded tier names, proprietary question bank or inaccessible server logic.
