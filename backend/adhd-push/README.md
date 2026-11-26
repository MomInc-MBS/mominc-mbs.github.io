# adhd-push: reminder sender for ADHD web (code-ready, NOT deployed)

Cloudflare Worker + D1 + a once-a-minute Cron Trigger. It sends Web Push reminders for the ADHD alarm PWA (`/apps/alarm/`).
It is a reminder service, not an alarm: it needs a connection, and the phone's own notification settings (Focus, Silent) still apply.

## Encryption choice
The `web-push` npm library is **not** used. `src/webpush.mjs` implements RFC 8291 (aes128gcm) and RFC 8292 (VAPID, ES256) with WebCrypto only:
no dependency, no MPL-2.0 notice to carry, and it runs on plain Workers without `nodejs_compat` (wrangler is not installed on the build PC, so
`nodejs_compat` behaviour could not be tried). `tools/check_adhd_webpush.test.mjs` reproduces the RFC 8291 appendix example byte for byte.

## Deploy (run from `backend/adhd-push/`)
```
node scripts/gen-vapid.mjs                           # prints VAPID_PUBLIC and VAPID_PRIVATE_KEY (P-256, WebCrypto)
npx wrangler d1 create adhd-push                     # copy the printed database_id into wrangler.toml
npx wrangler d1 migrations apply adhd-push --remote  # applies 0001_init.sql and 0002_revision.sql (adds occurrences.rev; existing reminders are kept)
npx wrangler secret put VAPID_PRIVATE_KEY            # paste the private key; never commit it
```
Edit the placeholders in `wrangler.toml`: `database_id`, `VAPID_PUBLIC` (public half from the script), `VAPID_SUBJECT` (`mailto:` address),
`ALLOW_ORIGIN` (`https://mominc.online`), `PUBLIC_ORIGIN` (this Worker's URL).
```
npx wrangler deploy                                  # first deploy prints the https://adhd-push.<account>.workers.dev URL
# put that URL in PUBLIC_ORIGIN, then deploy again (the URL goes into notices so the service worker can report receipt)
curl https://adhd-push.<account>.workers.dev/v1/vapid    # should return {"publicKey":"..."}
```
Then connect the client: set `ADHD_PUSH_ORIGIN` in `apps/alarm/push.js` to that URL, run `python tools/gen_game_packs.py`, ship.
Also add `"options": {"autostart": "occ"}` under the alarm entry's `web` block in `apps/apps.json` (then `python tools/gen_apps.py`), so a tapped notice opens inside the app (`apps/shell.mjs` reads it).
Local try-out once wrangler exists: `npx wrangler dev --local --test-scheduled`, then `curl "http://localhost:8787/__scheduled"`.

## API (JSON; CORS limited to `ALLOW_ORIGIN`)
| Call | Auth | Notes |
| --- | --- | --- |
| `GET /v1/vapid` | none | public key |
| `POST /v1/install` | none, 10/h per IP | returns `{installId, secret}`; only SHA-256(secret) is stored |
| `PUT/DELETE /v1/subscription` | install headers | `X-Install-Id`, `X-Install-Secret`; endpoint must be https on a known push host |
| `PUT /v1/schedule`, `DELETE /v1/schedule/:id` | install | create/update/disable (max 3 active); disable cancels the live occurrence |
| `POST /v1/occurrence/:id/ack\|complete\|cancel`, `GET /v1/occurrence/:id` | install | ack pauses follow-ups 60 s and never completes; terminal states are final |
| `POST /v1/receipt` | per-attempt HMAC | service worker reports `received` / `opened` |

Mutations: 30 per minute per install. Occurrence id = `<scheduleId>:<dueMs>`, attempt id = `<occurrenceId>:<stage>:<main|companion>` (unique, so a rerun sends nothing twice).

## Behaviour
- Alerts from the due time T0 at 0, 300, 480 and 540 s, then every 30 s on stage 4 (`apps/alarm/stages.js`, shared with the app). Stage (face) = min(alert index, 3) + 1. Escalation is per-reminder opt-in; without it only the first alert is sent.
- Workers cron cannot run finer than a minute, so each run sends what is due now, then sleeps to the next :00/:30 boundary (all deadlines sit on 30 s boundaries because due times are whole minutes; only when that is within 45 s) and re-plans **from the database**, so a stop, win/loss or disable that lands during the wait is honoured.
- Delayed cron: only the CURRENT alert is planned and sent (one push, no catch-up burst). Planned sends older than 45 s and older stages are coalesced.
- Before every send: the occurrence is ACTIVE with the same generation, the schedule still exists, is enabled (a fired once-alarm is switched off by design and still rings its live occurrence) and is not older than the occurrence's revision.
- At most 24 sends per occurrence per rolling 10 minutes (our bound; stage 4 needs 20). TTL 120 s (first alert), 60 s, 30 s for the repeats; the push topic collapses an undelivered older alert.
- 429/5xx/network: back off (honours Retry-After), 4 tries, same attempt id. 404/410: subscription retired. 400/401/403: not retried.
- Cancellation generation: complete/cancel/disable bumps `occurrences.gen` and cancels unsent attempts; the send claim re-checks status + generation in one statement.
- Turning a reminder off or changing its time (PUT enabled=false, PUT with a new time, or DELETE) answers **423 locked** with `remainingMs` while its escalating occurrence is younger than T0 + 540 s. From 540 s a new time cancels the live occurrence (reason rescheduled), bumps the revision and reschedules the still-enabled reminder. Complete (genuine win/loss) and cancel (held emergency stop) end ONE occurrence and keep the recurrence. Ack only records an open; it never pauses anything.
- Payload: title `MOM's: 2048 Reminder`, per-stage wording, `face` 1-4 (the service worker maps it to /apps/alarm/stages/stageN.webp). Label: whitespace normalised, empty becomes "Your reminder", only the preview is cut to 60 characters. Tandem notices are retired.
- A cron run that finds a due time more than 15 min old records it MISSED and sends nothing.
- No silent pushes: every push shows a notice. A tap opens `/apps/alarm/?occ=...` into the CURRENT state.

## Tests
`node --test tools/check_adhd_webpush.test.mjs tools/check_adhd_push.test.mjs tools/check_adhd_sw.test.mjs tools/check_adhd_alarm.test.mjs tools/check_alarm_board.test.mjs`
(the push tests run the real migration SQL on `node:sqlite` behind a small D1-shaped shim).
