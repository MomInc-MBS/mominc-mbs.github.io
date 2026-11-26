// Recurrence vectors from the shared contract. TZ is deliberately set to a DIFFERENT zone than the vectors use: results must not depend on the machine zone.
process.env.TZ = 'Asia/Tokyo';
import test from 'node:test';
import assert from 'node:assert/strict';
import {nextDue, advance, wallToInstant, recurError, zoneOf} from '../apps/alarm/recurrence.js';

const LA = {mode: 'fixed', zone: 'America/Los_Angeles'};
const rem = (time, recur, tz = LA) => ({time, recur: {kind: 'daily', days: [], date: null, dates: [], every: 1, start: null, skip: [], skipNext: false, ...recur}, tz});
const at = s => Date.parse(s.length === 10 ? s + 'T00:00:00-08:00' : s);
const iso = ms => new Date(ms).toISOString();

test('contract vector 1-8 (America/Los_Angeles)', () => {
  assert.equal(nextDue(rem('07:30', {kind: 'daily'}), at('2026-11-26T08:00:00-08:00')).due, at('2026-11-27T07:30:00-08:00'));
  assert.equal(nextDue(rem('07:30', {kind: 'weekly', days: [1, 3, 5]}), at('2026-11-26T08:00:00-08:00')).due, at('2026-11-27T07:30:00-08:00'));
  assert.equal(nextDue(rem('07:30', {kind: 'weekly', days: [1], skip: ['2026-11-30']}), at('2026-11-26')).due, at('2026-12-07T07:30:00-08:00'));
  assert.equal(nextDue(rem('09:00', {kind: 'interval', every: 3, start: '2026-11-26'}), at('2026-11-26T10:00:00-08:00')).due, at('2026-11-29T09:00:00-08:00'));
  assert.equal(nextDue(rem('02:30', {kind: 'daily'}), at('2027-03-13T12:00:00-08:00')).due, Date.parse('2027-03-14T03:30:00-07:00'));
  assert.equal(nextDue(rem('01:30', {kind: 'daily'}), Date.parse('2026-10-31T12:00:00-07:00')).due, Date.parse('2026-11-01T01:30:00-07:00'));
  const r7 = rem('08:00', {kind: 'dates', dates: ['2026-12-01', '2026-11-28']});
  const d1 = nextDue(r7, at('2026-11-26')).due, d2 = nextDue(r7, d1).due, d3 = nextDue(r7, d2).due;
  assert.deepEqual([d1, d2, d3], [at('2026-11-28T08:00:00-08:00'), at('2026-12-01T08:00:00-08:00'), null]);
  const r8 = rem('07:30', {kind: 'daily', skipNext: true}), x = nextDue(r8, at('2026-11-26T08:00:00-08:00'));
  assert.deepEqual(x, {due: at('2026-11-28T07:30:00-08:00'), skipNext: false});
  assert.equal(r8.recur.skipNext, true);                                             // pure: input untouched
  assert.equal(advance(r8, at('2026-11-26T08:00:00-08:00')).reminder.recur.skipNext, false);
});

test('fall-back hour fires once: after the first 01:30 the next is the next day, not the repeated 01:30', () => {
  const r = rem('01:30', {kind: 'daily'}), first = nextDue(r, Date.parse('2026-10-31T12:00:00-07:00')).due;
  assert.equal(iso(nextDue(r, first).due), iso(Date.parse('2026-11-02T01:30:00-08:00')));
});

test('device zone follows the phone; fixed zone does not', () => {
  const dev = {time: '07:30', recur: {kind: 'daily'}, tz: {mode: 'device', zone: 'America/Los_Angeles'}};
  const after = Date.parse('2026-11-26T00:00:00Z');
  assert.equal(iso(nextDue(dev, after, {deviceZone: 'Europe/Paris'}).due), '2026-11-26T06:30:00.000Z');
  assert.equal(iso(nextDue(dev, after).due), '2026-11-26T15:30:00.000Z');           // no phone zone given: last reported zone
  const fixed = {...dev, tz: {mode: 'fixed', zone: 'Asia/Kolkata'}};
  assert.equal(zoneOf(fixed, {deviceZone: 'Europe/Paris'}), 'Asia/Kolkata');
  assert.equal(iso(nextDue(fixed, after, {deviceZone: 'Europe/Paris'}).due), '2026-11-26T02:00:00.000Z');
});

test('once: with a date or with none; skip dates; skipNext on once; bad input never throws', () => {
  assert.equal(nextDue(rem('07:30', {kind: 'once', date: '2026-12-02'}), at('2026-11-26')).due, at('2026-12-02T07:30:00-08:00'));
  assert.equal(nextDue(rem('07:30', {kind: 'once', date: '2026-11-01'}), at('2026-11-26')).due, null);
  assert.equal(nextDue(rem('07:30', {kind: 'once'}), at('2026-11-26T08:00:00-08:00')).due, at('2026-11-27T07:30:00-08:00'));
  assert.equal(nextDue(rem('07:30', {kind: 'daily', skip: ['2026-11-27', '2026-11-28']}), at('2026-11-26T08:00:00-08:00')).due, at('2026-11-29T07:30:00-08:00'));
  assert.equal(nextDue({time: 'x', recur: {kind: 'daily'}, tz: LA}, 0).due, null);
  assert.equal(nextDue({time: '07:30', recur: {kind: 'weekly', days: []}, tz: LA}, 0).due, null);
  assert.equal(recurError({kind: 'weekly', days: []}), 'recur.days'); assert.equal(recurError({kind: 'dates', dates: ['2026-02-31']}), 'recur.dates');
  assert.equal(recurError({kind: 'interval', every: 3, start: '2026-11-26'}), null); assert.equal(recurError({kind: 'nope'}), 'recur.kind');
});

test('wall time to instant at DST edges, independent of machine zone', () => {
  assert.equal(iso(wallToInstant(Date.UTC(2027, 2, 14, 2, 30), 'America/Los_Angeles')), '2027-03-14T10:30:00.000Z');
  assert.equal(iso(wallToInstant(Date.UTC(2026, 9, 25, 2, 30), 'Europe/Berlin')), '2026-10-25T00:30:00.000Z');   // ambiguous: earlier (CEST)
  assert.equal(iso(wallToInstant(Date.UTC(2026, 6, 1, 12, 0), 'Asia/Kolkata')), '2026-07-01T06:30:00.000Z');
});
