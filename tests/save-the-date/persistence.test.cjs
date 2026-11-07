const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createSaveTheDateStore } = require(
  process.env.SYNC_TEST_BUILD + "/save-the-date/persistence.js"
);

const ids = {
  event: "11111111-1111-4111-8111-111111111111",
  source: "fictional-source",
  externalHousehold: "22222222-2222-4222-8222-222222222222",
  household: "33333333-3333-4333-8333-333333333333",
  contact: "44444444-4444-4444-8444-444444444444"
};

const request = {
  id: ids.event,
  actor: "fictional-admin",
  source: ids.source,
  externalHouseholdId: ids.externalHousehold,
  householdId: ids.household,
  contactGuestId: ids.contact,
  language: "en",
  channel: "email",
  expectedVersion: 0,
  sourceCommitment: "a".repeat(64),
  databaseCommitment: "b".repeat(64),
  draftCommitment: "c".repeat(64),
  template: "std-draft-v1",
  status: "READY"
};

test("persistence store maps the signed receipt to a minimized SQL request", async () => {
  const calls = [];
  const store = createSaveTheDateStore(async (statement, parameters) => {
    calls.push({ statement, parameters });
    return [{ result: { status: "READY", version: 1, replayed: false } }];
  });
  const result = await store.record(request);
  assert.deepEqual(result, { status: "READY", version: 1, replayed: false });
  assert.match(calls[0].statement, /record_save_the_date/);
  const sqlRequest = JSON.parse(calls[0].parameters[0]);
  assert.deepEqual(sqlRequest, {
    id: ids.event,
    source: ids.source,
    household: ids.externalHousehold,
    householdId: ids.household,
    contact: ids.contact,
    actor: "fictional-admin",
    expectedVersion: 0,
    status: "READY",
    channel: "email",
    language: "en",
    template: "std-draft-v1",
    sourceCommitment: "a".repeat(64),
    databaseCommitment: "b".repeat(64),
    draftCommitment: "c".repeat(64)
  });
  assert.equal(Object.hasOwn(sqlRequest, "recipient"), false);
  assert.equal(Object.hasOwn(sqlRequest, "message"), false);
});

test("record lookup accepts only the same event request and returns minimal history", async () => {
  const calls = [];
  const store = createSaveTheDateStore(async (statement, parameters) => {
    calls.push({ statement, parameters });
    return [{ status: "SENT", version: 2, same_request: true }];
  });
  assert.deepEqual(await store.recorded({ ...request, status: "SENT", expectedVersion: 1 }), {
    status: "SENT", version: 2, replayed: true
  });
  const encoded = JSON.parse(calls[0].parameters[1]);
  assert.equal(encoded.household, ids.externalHousehold);
  assert.equal(encoded.contact, ids.contact);
  assert.match(calls[0].statement, /request_hash=md5/);
});

test("metadata read queries return only state and event summaries", async () => {
  const store = createSaveTheDateStore(async (statement) => {
    if (statement.includes("save_the_date_state")) return [{
      external_household_id: ids.externalHousehold,
      household_id: ids.household,
      status: "READY",
      version: 1,
      updated_at: "2026-11-07T00:00:00Z"
    }];
    return [{
      id: ids.event,
      external_household_id: ids.externalHousehold,
      status: "READY",
      version: 1,
      channel: "paper",
      language: "it",
      created_at: "2026-11-07T00:00:00Z"
    }];
  });
  const states = await store.states(ids.source);
  const events = await store.events(ids.source);
  assert.equal(states[0].householdId, ids.household);
  assert.equal(events[0].id, ids.event);
  assert.equal(Object.hasOwn(events[0], "contact"), false);
  assert.equal(Object.hasOwn(events[0], "actor"), false);
});
