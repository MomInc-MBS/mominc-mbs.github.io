// Console-key tab stepping: bounded (no wrap), skips disabled draft-only tabs, null at either end.  node --test tools/check_alarm_tabstep.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {stepTab} from '../apps/alarm/ui/time.js';

const T = ['clock', 'sound', 'screen', 'challenge', 'devices', 'history', 'prefs'], draft = new Set(['sound', 'screen', 'challenge']);
test('stepTab: bounded, skips disabled tabs, no wrap', () => {
  assert.equal(stepTab(T, 'clock', 1), 'sound');
  assert.equal(stepTab(T, 'clock', 1, id => draft.has(id)), 'devices');
  assert.equal(stepTab(T, 'devices', -1, id => draft.has(id)), 'clock');
  assert.equal(stepTab(T, 'clock', -1), null);
  assert.equal(stepTab(T, 'prefs', 1), null);
  assert.equal(stepTab(T, 'prefs', -5), 'history');
});
