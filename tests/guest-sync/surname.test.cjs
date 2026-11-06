const { test } = require('node:test');
const assert = require('node:assert/strict');
const { headers, parseSheet, buildPlan } = require(process.env.SYNC_TEST_BUILD + '/model.js');
const id = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const hid = '33333333-3333-4333-8333-333333333333';
const columns = [headers[0], 'Surname', ...headers.slice(1)];
function sheet(rows = [{}], cols = columns) {
  return [cols, ...rows.map(overrides => {
    const values = { 'Guest name': 'Fictional Rowan', Surname: '', 'Guest type': 'Adult',
      Group: 'Test', 'List owner': 'Ale', 'Party / family': 'Fictional household',
      'Planning status': 'On list', Priority: 'Unassigned', 'Sync UUID': id, ...overrides };
    return cols.map(h => values[h] ?? '');
  })];
}
const empty = { contractVersion: 3, households: [], members: [], inviteeCount: 0 };
function snapshot(values, legacy = false) {
  const guests = parseSheet(values).guests;
  return {
    contractVersion: 3, households: [{ id: hid, name: 'Fictional household', owner: 'groom', plusOne: false,
      issued: false, responded: false, version: 0, status: 'disabled' }],
    members: guests.map(g => {
      const data = {...g};
      if (legacy) { delete data.sourceName; delete data.surname; }
      return { externalId: g.externalId, householdId: hid, inviteeId: other, data, actualName: g.name };
    }),
    inviteeCount: guests.length
  };
}
const plan = (values, db = empty) => buildPlan(parseSheet(values), db);
test('legacy and blank surname keep display text and do not invent a split', () => {
  for (const cols of [headers, columns]) {
    const p = parseSheet(sheet([{}], cols));
    assert.deepEqual(p.errors, []);
    assert.equal(p.guests[0].name, 'Fictional Rowan');
    assert.equal(p.guests[0].sourceName, 'Fictional Rowan');
    assert.equal(p.guests[0].surname, null);
  }
});
test('surname composes display name while preserving source fields and identity', () => {
  const p = parseSheet(sheet([{ 'Guest name': ' Rowan ', Surname: ' Example ' }]));
  assert.deepEqual(p.errors, []);
  assert.equal(p.guests[0].name, 'Rowan Example');
  assert.equal(p.guests[0].sourceName, 'Rowan');
  assert.equal(p.guests[0].surname, 'Example');
  assert.equal(p.guests[0].externalId, id);
});
test('full legacy names do not duplicate explicit surnames, including compound and Unicode names', () => {
  for (const [name, surname] of [['Rowan Example', 'Example'], ['Rowan De Example', 'de example'],
    ['Rowan  Example', 'Example'], ['Rowan García', 'Garci\u0301a'], ['Example', 'Example']]) {
    const p = parseSheet(sheet([{ 'Guest name': name, Surname: surname }]));
    assert.deepEqual(p.errors, []);
    assert.equal(p.guests[0].name, name);
    assert.equal(p.guests[0].sourceName, name);
  }
});
test('surname suffix requires a word boundary', () => {
  assert.equal(parseSheet(sheet([{ 'Guest name': 'Rowan McExample', Surname: 'Example' }])).guests[0].name,
    'Rowan McExample Example');
});
test('new blank surname is unchanged against old JSONB, including replied households', () => {
  const db = snapshot(sheet([{}], headers), true);
  db.households[0].responded = true;
  db.households[0].issued = true;
  const p = plan(sheet(), db);
  assert.deepEqual(p.errors, []);
  assert.equal(p.counts.unchanged, 1);
});
test('surname edit is an update with stable household and external UUID; repeat is unchanged', () => {
  const before = sheet([{ Surname: 'Example' }]);
  const after = sheet([{ Surname: 'Changed' }]);
  const p = plan(after, snapshot(before));
  assert.deepEqual(p.errors, []);
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].householdId, hid);
  assert.equal(p.changes[0].next.externalId, id);
  assert.equal(plan(after, snapshot(after)).counts.unchanged, 1);
});
test('clearing a surname is a visible update, never an identity replacement', () => {
  const p = plan(sheet(), snapshot(sheet([{ Surname: 'Example' }])));
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].next.surname, null);
  assert.equal(p.changes[0].next.externalId, id);
});
test('source field correction is tracked even with the same display name', () => {
  const before = sheet([{ 'Guest name': 'Rowan Example', Surname: 'Example' }]);
  const after = sheet([{ 'Guest name': 'Rowan', Surname: 'Example' }]);
  const p = plan(after, snapshot(before));
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].current.name, p.changes[0].next.name);
});
test('children and unnamed companions discard both identifying fields before preview', () => {
  const p = plan(sheet([{}, {'Guest type': 'Child', 'Guest name': 'PrivateChild', Surname: 'PrivateSurname',
    'Sync UUID': other }, { 'Guest name': 'Plus-one of PrivateHost', Surname: 'PrivateCompanion',
    'Sync UUID': '44444444-4444-4444-8444-444444444444' }]));
  assert.deepEqual(p.errors, []);
  assert(!JSON.stringify(p).includes('Private'));
  for (const c of p.changes.filter(c => c.next.kind !== 'named')) {
    assert.equal(c.next.sourceName, null);
    assert.equal(c.next.surname, null);
    assert.equal(c.next.name, null);
  }
});
test('name and surname drafts remain provisional; an existing UUID prevents skipping', () => {
  const draft = { 'Guest name': 'Pending', Surname: 'Example', 'Guest type': '', Group: '',
    'List owner': '', 'Party / family': '', 'Planning status': '', Priority: '', 'Sync UUID': '' };
  const p = parseSheet(sheet([{}, draft]));
  assert.deepEqual(p.errors, []);
  assert.deepEqual(p.skippedRows, [3]);
  assert.equal(p.sourceCount, 1);
  const invalid = parseSheet(sheet([{}, {...draft, 'Sync UUID': other}]));
  assert.deepEqual(invalid.skippedRows, []);
  assert(invalid.errors.length);
});
test('duplicate surname headers, missing names and oversized combined names fail closed', () => {
  assert(parseSheet(sheet([{}], [...columns, 'Surname'])).errors.includes('Duplicate column: Surname'));
  assert(parseSheet(sheet([{ 'Guest name': '', Surname: 'Example' }])).errors.length);
  assert(parseSheet(sheet([{ 'Guest name': 'x'.repeat(100), Surname: 'y'.repeat(30) }])).errors.length);
});
test('a couple with the same given name and different surnames remains distinct', () => {
  const p = plan(sheet([{ 'Guest name': 'Rowan', Surname: 'Example' },
    { 'Guest name': 'Rowan', Surname: 'Other', 'Sync UUID': other }]));
  assert.deepEqual(p.errors, []);
  assert.equal(p.counts.created, 2);
});
test('identical full names in the same household still require manual review', () => {
  assert(plan(sheet([{ Surname: 'Example' }, { Surname: 'Example', 'Sync UUID': other }])).errors.length);
});
test('surname changes retain issued and replied household protections', () => {
  for (const flag of ['issued', 'responded']) {
    const db = snapshot(sheet());
    db.households[0][flag] = true;
    assert(plan(sheet([{ Surname: 'Example' }]), db).errors.length);
  }
});
test('optional column reordering does not change identities or comparison', () => {
  const rows = [{ Surname: 'Example' }];
  assert.equal(plan(sheet(rows, [...columns].reverse()), snapshot(sheet(rows))).counts.unchanged, 1);
});
