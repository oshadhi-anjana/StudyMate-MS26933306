const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
// Test the actual TypeScript domain modules without a second implementation.
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const planner = require('../src/domain/planner.ts');
const { acknowledge, mergeRemote } = require('../src/domain/sync.ts');
const { emptyState } = require('../src/domain/models.ts');
const { demoState } = require('../src/domain/demo.ts');
const { completeSignOut } = require('../src/domain/signOut.ts');
const now = new Date(2026, 8, 28, 8, 0, 0).getTime();
const record = (data = {}) => ({ id: 'a', kind: 'task', title: 'Study', updatedAt: now, revision: 'r1', dueAt: now + 86400000, estimatedMinutes: 30, ...data });
const lecture = (start, end, extra = {}) => record({ kind: 'class', day: 1, startTime: start, endTime: end, ...extra });

test('adjacent classes do not clash', () => assert.equal(planner.clash(lecture('10:00', '11:00'), [lecture('09:00', '10:00', { id: 'b' })]), undefined));
test('contained and overlapping classes clash', () => assert.ok(planner.clash(lecture('09:30', '10:30'), [lecture('09:00', '11:00', { id: 'b' })])));
test('classes on other weekdays do not clash', () => assert.equal(planner.clash(lecture('09:00', '10:00'), [lecture('09:00', '10:00', { id: 'b', day: 2 })]), undefined));
test('editing a class does not clash with itself', () => assert.equal(planner.clash(lecture('09:00', '10:00'), [lecture('09:00', '10:00')]), undefined));
test('deleted classes do not occupy study slots', () => assert.equal(planner.suggestSlot([lecture('09:00', '12:00', { deleted: true })], 30, '09:00', '12:00', now), new Date(2026, 8, 28, 9).getTime()));
test('slot search skips a class and finds the next free interval', () => assert.equal(planner.suggestSlot([lecture('09:00', '10:00')], 45, '09:00', '12:00', now), new Date(2026, 8, 28, 10).getTime()));
test('no slot is invented when the study window is full', () => assert.equal(planner.suggestSlot([lecture('09:00', '12:00')], 25, '09:00', '12:00', now), null));
test('slots cannot begin in the past', () => assert.equal(planner.suggestSlot([], 25, '06:00', '12:00', now), now));
test('overlapping occupied intervals are not double counted', () => assert.equal(planner.availableStudyMinutes([lecture('09:00', '11:00'), lecture('10:00', '12:00')], '09:00', '13:00', now), 60));
test('expired study window has zero capacity', () => assert.equal(planner.availableStudyMinutes([], '06:00', '07:00', now), 0));
test('overdue work outranks a distant high priority task', () => assert.equal(planner.rankedTasks([record({ id: 'later', dueAt: now + 30 * 86400000, priority: 'high' }), record({ id: 'overdue', dueAt: now - 1, priority: 'low' })], now)[0].id, 'overdue'));
test('recommendations exclude completed and deleted tasks', () => assert.equal(planner.rankedTasks([record({ completed: true }), record({ deleted: true })], now).length, 0));
test('exam countdown uses calendar days', () => assert.equal(planner.daysUntil(new Date(2026, 8, 29, 1).getTime(), new Date(2026, 8, 28, 23).getTime()), 1));
test('Monday is the beginning of the study week', () => assert.equal(planner.weekStart(new Date(2026, 9, 4, 18).getTime()), new Date(2026, 8, 28).getTime()));
test('goal totals respect subject and date boundaries', () => assert.equal(planner.studyMinutes([record({ kind: 'session', subjectId: 's', date: now, minutes: 25 }), record({ kind: 'session', subjectId: 'other', date: now, minutes: 40 }), record({ kind: 'session', subjectId: 's', date: now + 100, minutes: 60 })], now, 's', now + 100), 25));
test('study streak may end yesterday before today has a session', () => assert.equal(planner.studyStreak([record({ kind: 'session', date: now - 86400000, minutes: 25 }), record({ kind: 'session', date: now - 2 * 86400000, minutes: 25 })], now), 2));
test('validates empty titles and malformed class times', () => { assert.throws(() => planner.validateRecord(record({ title: ' ' }), [])); assert.throws(() => planner.validateRecord(lecture('25:00', '26:00'), [])); });
test('rejects impossible goal ranges', () => assert.throws(() => planner.validateRecord(record({ kind: 'goal', date: now + 2 * 86400000, targetMinutes: 100 }), [])));
test('an old upload cannot clear a newer offline revision', () => { const state = { ...emptyState(), records: { a: record({ revision: 'r2' }) }, pending: { a: 'r2' } }; assert.deepEqual(acknowledge(state, record(), record()), state); });
test('acknowledgement removes only the matching outbox entry', () => { const state = { ...emptyState(), records: { a: record() }, pending: { a: 'r1', b: 'r4' } }; assert.deepEqual(acknowledge(state, record(), record()).pending, { b: 'r4' }); });
test('remote data cannot overwrite unsent local edits', () => { const state = { ...emptyState(), records: { a: record({ title: 'Local edit' }) }, pending: { a: 'r1' } }; assert.equal(mergeRemote(state, [record({ title: 'Older cloud copy' })]).records.a.title, 'Local edit'); });
test('remote tombstones propagate deletions', () => { const state = { ...emptyState(), records: { a: record() } }; assert.equal(mergeRemote(state, [record({ deleted: true })]).records.a.deleted, true); });
test('local photo paths survive only for the same cloud attachment', () => { const state = { ...emptyState(), records: { a: record({ photoUri: 'file://photo', photoPath: 'old' }) } }; assert.equal(mergeRemote(state, [record({ photoPath: 'new' })]).records.a.photoUri, undefined); assert.equal(mergeRemote(state, [record({ photoPath: 'old' })]).records.a.photoUri, 'file://photo'); });
test('demo is a valid, isolated dataset without queued cloud writes', () => { const state = demoState(now); assert.deepEqual(state.pending, {}); Object.values(state.records).forEach(item => planner.validateRecord(item, Object.values(state.records))); });

test('sign-out succeeds even when native notification cleanup throws', async () => {
  let signedOut = false;
  const failure = new TypeError('undefined is not a function');
  const result = await completeSignOut(async () => { throw failure; }, async () => { signedOut = true; });
  assert.equal(signedOut, true);
  assert.equal(result, failure);
});
test('successful sign-out clears reminders before ending the session', async () => {
  const calls = [];
  const result = await completeSignOut(async () => { calls.push('clear'); }, async () => { calls.push('signOut'); });
  assert.deepEqual(calls, ['clear', 'signOut']);
  assert.equal(result, undefined);
});
test('authentication sign-out failure is not swallowed', async () => {
  const failure = new Error('Auth persistence failed');
  await assert.rejects(completeSignOut(async () => {}, async () => { throw failure; }), error => error === failure);
});

test('Firestore photo references preserve matching local copies but clear replaced or removed attachments', () => {
 const state = { ...emptyState(), records: { a: record({photoId:'a-r1',photoUri:'file://photo'}) } };
 assert.equal(mergeRemote(state,[record({photoId:'a-r1'})]).records.a.photoUri,'file://photo');
 assert.equal(mergeRemote(state,[record({photoId:'a-r2'})]).records.a.photoUri,undefined);
 assert.equal(mergeRemote(state,[record({photoId:''})]).records.a.photoUri,undefined);
});
