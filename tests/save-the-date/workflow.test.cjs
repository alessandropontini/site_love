const { test } = require("node:test");
const assert = require("node:assert/strict");
const { headers, householdHeaders } = require(process.env.SYNC_TEST_BUILD + "/guest-sync/model.js");
const { prepareSaveTheDate, recordSaveTheDate } = require(
  process.env.SYNC_TEST_BUILD + "/save-the-date/workflow.js"
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
    "Guest name": "Fictional Guest",
    "Guest type": "Adult",
    Group: "Fiction",
    "List owner": "Ale",
    "Party / family": "Fictional Household",
    "Planning status": "On list",
    Invitation: "",
    RSVP: "",
    Priority: "Normal",
    Table: "",
    "Dietary requirements": "",
    Notes: "",
    "Sync UUID": ids.guest,
    "Household UUID": ids.externalHousehold,
    "Host Sync UUID": ""
  };
  const household = {
    "Household UUID": ids.externalHousehold,
    "Party / family": "Fictional Household",
    "List owner": "Ale",
    "Contact guest UUID": ids.guest,
    "Contact email": "fictional@example.invalid",
    "Contact phone": "+15555550123",
    Language: "en"
  };
  let sheets = {
    guestList: [guestHeaders, guestHeaders.map((key) => guest[key] ?? "")],
    households: [householdHeaders, householdHeaders.map((key) => household[key] ?? "")]
  };
  const db = {
    contractVersion: 3,
    sources: [ids.source],
    sourceModes: [{ sourceId: ids.source, mode: "household_uuid" }],
    householdMappings: [{ sourceId: ids.source, externalHouseholdId: ids.externalHousehold, householdId: ids.household }],
    exclusions: [],
    households: [{ id: ids.household, name: "Fictional Household", owner: "groom", plusOne: false,
      issued: false, responded: false, version: 0, status: "disabled", namedCount: 1 }],
    members: [{ externalId: ids.guest, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
      inviteeId: ids.invitee, actualName: "Fictional Guest", data: { kind: "named" } }],
    inviteeCount: 1
  };
  const recorded = new Map();
  let currentState = null;
  let now = 1_800_000_000_000;
  const dependencies = {
    sourceId: () => ids.source,
    readSheets: async () => sheets,
    snapshot: async () => ({ data: db, hash: "fixture-hash-is-not-used" }),
    state: async () => currentState,
    recorded: async (request) => recorded.get(`${request.id}:${request.status}`) ?? null,
    record: async (request) => {
      const result = { status: request.status, version: (currentState?.version ?? 0) + 1, replayed: false };
      currentState = { status: request.status, version: result.version };
      recorded.set(`${request.id}:${request.status}`, result);
      return result;
    },
    now: () => now
  };
  return {
    dependencies,
    get sheets() { return sheets; },
    set sheets(value) { sheets = value; },
    set now(value) { now = value; }
  };
}

test("preparation binds one mapped household and returns no source contact values", async () => {
  const f = fixture();
  const result = await prepareSaveTheDate({
    externalHouseholdId: ids.externalHousehold,
    channel: "email"
  }, "fictional-admin", f.dependencies);
  const serialized = JSON.stringify(result);
  assert.equal(result.household.householdId, ids.household);
  assert.equal(result.draft.channel, "email");
  assert.equal(serialized.includes("fictional@example.invalid"), false);
  assert.equal(serialized.includes("+15555550123"), false);
  assert.equal(serialized.includes("Fictional Guest"), false);
});

test("receipt is actor-bound and detects source edits before recording", async () => {
  const f = fixture();
  const prepared = await prepareSaveTheDate({
    externalHouseholdId: ids.externalHousehold,
    channel: "sms"
  }, "fictional-admin", f.dependencies);
  await assert.rejects(recordSaveTheDate({ receipt: prepared.receipt, status: "READY" },
    "different-admin", f.dependencies), /INVALID_STD_RECEIPT/);

  const changed = f.sheets.households.map((row) => [...row]);
  changed[1][householdHeaders.indexOf("Contact phone")] = "+15555550124";
  f.sheets = { ...f.sheets, households: changed };
  await assert.rejects(recordSaveTheDate({ receipt: prepared.receipt, status: "READY" },
    "fictional-admin", f.dependencies), /STD_PREVIEW_CHANGED/);
});

test("expiry blocks new recording while a committed replay is recovered first", async () => {
  const f = fixture();
  const prepared = await prepareSaveTheDate({
    externalHouseholdId: ids.externalHousehold,
    channel: "paper"
  }, "fictional-admin", f.dependencies);
  f.now = 1_800_000_000_000 + 31 * 60_000;
  await assert.rejects(recordSaveTheDate({ receipt: prepared.receipt, status: "READY" },
    "fictional-admin", f.dependencies), /STD_PREVIEW_EXPIRED/);
});

test("manual outcome can be recorded once and a retry returns the committed result", async () => {
  const f = fixture();
  const prepared = await prepareSaveTheDate({
    externalHouseholdId: ids.externalHousehold,
    channel: "whatsapp"
  }, "fictional-admin", f.dependencies);
  const input = { receipt: prepared.receipt, status: "SENT" };
  const first = await recordSaveTheDate(input, "fictional-admin", f.dependencies);
  assert.deepEqual(first, { status: "SENT", version: 1, replayed: false });
  f.now = 1_800_000_000_000 + 31 * 60_000;
  const replay = await recordSaveTheDate(input, "fictional-admin", f.dependencies);
  assert.deepEqual(replay, { status: "SENT", version: 1, replayed: true });
});
