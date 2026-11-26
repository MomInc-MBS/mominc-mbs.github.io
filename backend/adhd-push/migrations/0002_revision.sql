-- Records which schedule revision an occurrence was created from, so a send can check it. Existing rows keep rev 0 (= unknown, always allowed).
ALTER TABLE occurrences ADD COLUMN rev INTEGER NOT NULL DEFAULT 0;
