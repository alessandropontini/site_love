const { test } = require('node:test');
const assert = require('node:assert/strict');
const { headers, parseSheet, buildPlan } = require(process.env.SYNC_TEST_BUILD + '/model.js');
const id = '11111111-1111-4111-8111-111111111111';
const hid = '33333333-3333-4333-8333-333333333333';
const cols = [...headers, 'Surname'];
function sheet(overrides = {}, columns = cols) {
  const row = { 'Guest name': 'Rowan', 'Guest type': 'Adult',
    Group: 'Test', 'List owner': 'Ale', 'Party / family': 'Fictional household',
    'Planning status': 'On list', Priority: 'Unassigned', 'Sync UUID': id, ...overrides };
  return [columns, columns.map(h => row[h] ?? '')];
}
function snapshot(values) {
  const g = parseSheet(values).guests[0];
  return { contractVersion: 3, households: [{ id: hid, name: g.party, owner: g.owner, plusOne: false,
    issued: false, responded: false, version: 0, status: 'disabled' }],
  members: [{ externalId: id, householdId: hid, inviteeId: id, data: g, actualName: g.name }], inviteeCount: 1 };
}
test('Guest name is the given-name input without an extra firstName field', () => {
  const p = parseSheet(sheet({Surname: 'Example'}));
  assert.deepEqual(p.errors, []);
  assert.equal(p.guests[0].sourceName, 'Rowan');
  assert.equal(p.guests[0].surname, 'Example');
  assert.equal(p.guests[0].name, 'Rowan Example');
  assert(!Object.hasOwn(p.guests[0], 'firstName'));
});
test('unrelated First name and Last name columns cannot override canonical values', () => {
  const p = parseSheet(sheet({Surname: 'Example', 'First name': 'Wrong', 'Last name': 'Ignored'},
    [...cols, 'First name', 'Last name']));
  assert.deepEqual(p.errors, []);
  assert.equal(p.guests[0].sourceName, 'Rowan');
  assert.equal(p.guests[0].name, 'Rowan Example');
  assert(!JSON.stringify(p).includes('Wrong'));
});
test('Guest name correction preserves mapping and repeat sync is unchanged', () => {
  const before = sheet({Surname: 'Example'});
  const after = sheet({'Guest name': 'Robin', Surname: 'Example'});
  const p = buildPlan(parseSheet(after), snapshot(before));
  assert.deepEqual(p.errors, []);
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].next.externalId, id);
  assert.equal(p.changes[0].householdId, hid);
  assert.equal(p.changes[0].next.name, 'Robin Example');
  assert.equal(buildPlan(parseSheet(after), snapshot(after)).counts.unchanged, 1);
});
test('Guest name correction after RSVP is blocked, without mutating snapshot', () => {
  const before = sheet({'Guest name': 'Rowan Example', Surname: 'Example'});
  const db = snapshot(before);
  db.households[0].responded = true;
  const saved = JSON.stringify(db);
  const p = buildPlan(parseSheet(sheet({Surname: 'Example'})), db);
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].current.name, p.changes[0].next.name);
  assert(p.errors.some(e => e.includes('RSVP responses')));
  assert.equal(JSON.stringify(db), saved);
});
test('a surname edit changes display name without inventing or splitting identity', () => {
  const db = snapshot(sheet({Surname: 'Old'}));
  const p = buildPlan(parseSheet(sheet({Surname: 'New'})), db);
  assert.deepEqual(p.errors, []);
  assert.equal(p.changes[0].next.name, 'Rowan New');
  assert.equal(p.changes[0].next.sourceName, 'Rowan');
  assert.equal(p.changes[0].next.externalId, id);
});
