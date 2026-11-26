-- 2048 Reminder full build: richer reminders on the same tables. Additive only: every existing row keeps working (NULL recur_json/tz_json = the legacy
-- 'once'|'daily'|'weekdays' + zone-string columns, read through recurFromLegacy).
ALTER TABLE schedules ADD COLUMN recur_json TEXT;            -- contract recur object (kind/days/date/dates/every/start/skip/skipNext)
ALTER TABLE schedules ADD COLUMN tz_json TEXT;               -- contract tz object {mode:'device'|'fixed', zone}
ALTER TABLE schedules ADD COLUMN webhook TEXT;               -- user-owned https endpoint {url, token}; validated by webhook.mjs
ALTER TABLE schedules ADD COLUMN snooze INTEGER NOT NULL DEFAULT 0;   -- seconds; 0 = snooze off
ALTER TABLE occurrences ADD COLUMN hook_stage INTEGER NOT NULL DEFAULT -1;   -- last stage (1..4) the webhook was told about
-- occurrences.paused_until (migration 0001) now carries the snooze: sends for that occurrence are skipped until then; due time, stage and the Turn-off lock never move.
ALTER TABLE attempts ADD COLUMN intended_at INTEGER;         -- when the schedule meant to send (planned_at moves on retry; sent_at is the effective time)
ALTER TABLE attempts ADD COLUMN retry_after INTEGER;         -- provider Retry-After (s) from the last 429/5xx
ALTER TABLE subs ADD COLUMN backoff_until INTEGER NOT NULL DEFAULT 0;   -- provider said slow down: nothing is sent to this endpoint before this time
