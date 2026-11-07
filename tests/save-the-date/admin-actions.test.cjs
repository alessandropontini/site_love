const { test } = require("node:test");
const assert = require("node:assert/strict");
const { headers, householdHeaders } = require(process.env.SYNC_TEST_BUILD + "/guest-sync/model.js");
const { createSaveTheDateAdminActions } = require(
  process.env.SYNC_TEST_BUILD + "/save-the-date/admin-actions.js"
);

process.env.GUEST_SYNC_SIGNING_SECRET = "fictional-test-signing-secret-with-more-than-32-characters";

const ids = {
  source: "fictional-source",
  externalHousehold: "11111111-1111-4111-8111-111111111111",
  household: "22222222-2222-4222-8222-222222222222",
  guest: "33333333-3333-4333-8333-333333333333",
  invitee: "44444444-4444-4444-8444-444444444444"
};

function fixture() {
  const guestHeaders = [...headers, "Household UUID", "Host Sync UUID"];
  const guest = {
    "Guest name": "Fictional Guest", "Guest type": "Adult", Group: "Fiction",
    "List owner": "Ale", "Party / family": "Fictional Household", "Planning status": "On list",
    Invitation: "", RSVP: "", Priority: "Normal", Table: "", "Dietary requirements": "",
    Notes: "", "Sync UUID": ids.guest, "Household UUID": ids.externalHousehold, "Host Sync UUID": ""
  };
  const household = {
    "Household UUID": ids.externalHousehold, "Party / family": "Fictional Household",
    "List owner": "Ale", "Contact guest UUID": ids.guest, "Contact email": "fictional@example.invalid",
    "Contact phone": "+15555550123", Language: "en"
  };
  const sheets = {
    guestList: [guestHeaders, guestHeaders.map((key) => guest[key] ?? "")],
    households: [householdHeaders, householdHeaders.map((key) => household[key] ?? "")]
  };
  const database = {
    contractVersion: 3,
    sourceModes: [{ sourceId: ids.source, mode: "household_uuid" }],
    householdMappings: [{ sourceId: ids.source, externalHouseholdId: ids.externalHousehold, householdId: ids.household }],
    exclusions: [],
    households: [{ id: ids.household, name: "Fictional Household", owner: "groom", plusOne: false,
      issued: false, responded: false, version: 0, status: "disabled", namedCount: 1 }],
    members: [{ externalId: ids.guest, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
      inviteeId: ids.invitee, actualName: "Fictional Guest", data: { kind: "named" } }],
    inviteeCount: 1
  };
  let authorized = true;
  let authorizations = 0;
  let reads = 0;
  const dependencies = {
    authorize: async () => {
      authorizations++;
      if (!authorized) throw new Error("AUTH_DENIED");
      return { actorId: "fictional-clerk-user" };
    },
    sourceId: () => ids.source,
    readSheets: async () => { reads++; return sheets; },
    snapshot: async () => ({ data: database, hash: "fixture-only" }),
    state: async () => null,
    states: async () => [],
    recorded: async () => null,
    record: async (request) => ({ status: request.status, version: 1, replayed: false }),
    now: () => 1_800_000_000_000
  };
  return {
    actions: createSaveTheDateAdminActions(dependencies), dependencies,
    deny() { authorized = false; },
    get authorizations() { return authorizations; },
    get reads() { return reads; }
  };
}

test("admin preview authorizes first and returns only minimized review metadata", async () => {
  const f = fixture();
  f.deny();
  await assert.rejects(f.actions.preview(), /AUTH_DENIED/);
  assert.equal(f.reads, 0);

  const allowed = fixture();
  const result = await allowed.actions.preview();
  assert.equal(result.ok, true);
  assert.equal(result.preview.eligibleHouseholds, 1);
  assert.equal(result.preview.households[0].householdId, ids.household);
  assert.equal(result.preview.households[0].status, "NOT_SENT");
  assert.equal(allowed.authorizations, 1);
  const serialized = JSON.stringify(result);
  for (const privateValue of ["fictional@example.invalid", "+15555550123", "Fictional Guest"])
    assert.equal(serialized.includes(privateValue), false);
});

test("each prepare and record action rechecks authorization and exposes sanitized results", async () => {
  const f = fixture();
  const prepared = await f.actions.prepare({
    externalHouseholdId: ids.externalHousehold, channel: "paper"
  });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.preparation.draft.channel, "paper");
  const recorded = await f.actions.record({ receipt: prepared.preparation.receipt, status: "READY" });
  assert.deepEqual(recorded, { ok: true, result: { status: "READY", version: 1, replayed: false } });
  assert.equal(f.authorizations, 2);
  assert.equal(JSON.stringify(prepared).includes("fictional@example.invalid"), false);
  assert.equal(JSON.stringify(prepared).includes("+15555550123"), false);

  const denied = fixture();
  denied.deny();
  await assert.rejects(denied.actions.prepare({ externalHouseholdId: ids.externalHousehold, channel: "email" }), /AUTH_DENIED/);
  await assert.rejects(denied.actions.record({ receipt: "fixture", status: "READY" }), /AUTH_DENIED/);
  assert.equal(denied.reads, 0);
});

test("database failures never expose raw SQL or connection details", async () => {
  const f = fixture();
  f.dependencies.record = async () => { throw new Error("postgres://secret-host SQL permission denied"); };
  const prepared = await f.actions.prepare({
    externalHouseholdId: ids.externalHousehold, channel: "email"
  });
  const result = await f.actions.record({ receipt: prepared.preparation.receipt, status: "READY" });
  assert.deepEqual(result, { ok: false, error: "STD_UNAVAILABLE" });
});
