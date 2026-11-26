-- Which app a reminder belongs to. 'adhd' = MOM's: 2048 Reminder (escalating, unchanged); 'coach' = MOM's: Coach MYR5 (plain: one notice per occurrence, followups forced to 0).
ALTER TABLE schedules ADD COLUMN app TEXT NOT NULL DEFAULT 'adhd';
ALTER TABLE occurrences ADD COLUMN app TEXT NOT NULL DEFAULT 'adhd';
