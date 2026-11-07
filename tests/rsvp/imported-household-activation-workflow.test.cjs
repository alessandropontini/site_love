const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const build = process.env.SYNC_TEST_BUILD;
const { createImportedHouseholdActivationAdminActions } = require(
  path.join(build, "rsvp/imported-household-activation-admin-actions.js")
);
const { hashRsvpToken } = require(path.join(build, "rsvp/token.js"));
const { householdHeaders, householdGuestHeaders } = require(path.join(build, "guest-sync/model.js"));
const { createImportedActivationToken } = require(path.join(build, "rsvp/imported-household-activation-receipt.js"));

process.env.GUEST_SYNC_SIGNING_SECRET = "fictional-test-signing-secret-that-is-long-enough";

const ids = {
  source: "fictional-source",
  externalHousehold: "11111111-1111-4111-8111-111111111111",
  household: "22222222-2222-4222-8222-222222222222",
  guest: "33333333-3333-4333-8333-333333333333",
  invitee: "44444444-4444-4444-8444-444444444444"
};
const fakeToken = "FictionalToken_abcdefghijklmnopqrstuvwxyz0123456789";

function fixture() {
  const guestValues = {
    "Guest name": "Fictional Rowan", "Guest type": "Adult", Group: "Fictional group",
    "List owner": "Ale", "Party / family": "Fictional household", "Planning status": "On list",
    Invitation: "", RSVP: "", Priority: "Normal", Table: "", "Dietary requirements": "",
    Notes: "", "Sync UUID": ids.guest, "Household UUID": ids.externalHousehold, "Host Sync UUID": ""
  };
  const householdValues = {
    "Household UUID": ids.externalHousehold, "Party / family": "Fictional household",
    "List owner": "Ale", "Contact guest UUID": ids.guest, "Contact email": "fictional@example.invalid",
    "Contact phone": "", Language: "en"
  };
  const sheets = {
    guestList: [householdGuestHeaders, householdGuestHeaders.map((header) => guestValues[header] ?? "")],
    households: [householdHeaders, householdHeaders.map((header) => householdValues[header] ?? "")]
  };
  const snapshot = {
    contractVersion: 3,
    sources: [ids.source],
    sourceModes: [{ sourceId: ids.source, mode: "household_uuid" }],
    householdMappings: [{ sourceId: ids.source, externalHouseholdId: ids.externalHousehold, householdId: ids.household }],
    exclusions: [],
    households: [{ id: ids.household, name: "Fictional household", owner: "groom", plusOne: false,
      issued: false, responded: false, version: 0, status: "disabled", namedCount: 1 }],
    members: [{ externalId: ids.guest, externalHouseholdId: ids.externalHousehold,
      householdId: ids.household, inviteeId: ids.invitee, actualName: "Fictional Rowan" }],
    inviteeCount: 1
  };
  const calls = { authorize: 0, readSheets: 0, snapshot: 0, committed: 0, activate: 0 };
  const dependencies = {
    authorize: async () => { calls.authorize += 1; return { actorId: "fictional-admin" }; },
    sourceId: () => ids.source,
    readSheets: async () => { calls.readSheets += 1; return sheets; },
    snapshot: async () => { calls.snapshot += 1; return { data: snapshot, hash: "fictional-snapshot-hash" }; },
    committed: async () => { calls.committed += 1; return false; },
    activate: async () => { calls.activate += 1; return { status: "active", replayed: false }; },
    now: () => 1_000_000,
    createToken: () => fakeToken
  };
  return { sheets, snapshot, calls, dependencies };
}

test("admin prepare is authorized, read-only and returns only a one-time token plus signed receipt", async () => {
  const generatedToken = createImportedActivationToken();
  assert.match(generatedToken, /^[A-Za-z0-9_-]{43}$/);
  const { dependencies, calls } = fixture();
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  const result = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
  assert.equal(result.ok, true);
  assert.equal(result.preparation.token, fakeToken);
  assert.equal(result.preparation.household.householdId, ids.household);
  assert.equal(result.preparation.receipt.includes(fakeToken), false);
  for (const privateValue of ["Fictional Rowan", "fictional@example.invalid", "Fictional household"])
    assert.equal(result.preparation.receipt.includes(privateValue), false);
  assert.equal(calls.authorize, 1);
  assert.equal(calls.snapshot, 1);
  assert.equal(calls.activate, 0);
  assert.equal(hashRsvpToken(fakeToken).length, 64);
});

test("confirm requires explicit confirmation, fresh source and the signed actor", async () => {
  const { dependencies, calls } = fixture();
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  const prepared = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
  assert.equal(prepared.ok, true);
  const receipt = prepared.preparation.receipt;

  const missingConfirmation = await actions.confirm({ receipt, confirmed: false });
  assert.deepEqual(missingConfirmation, { ok: false, error: "INVALID_IMPORTED_ACTIVATION_CONFIRMATION" });
  const result = await actions.confirm({ receipt, confirmed: true });
  assert.deepEqual(result, { ok: true, result: { status: "active", replayed: false } });
  assert.equal(calls.authorize, 3);
  assert.equal(calls.committed, 1);
  assert.equal(calls.readSheets, 2);
  assert.equal(calls.activate, 1);
});

test("source edits cannot activate a prepared receipt", async () => {
  const { dependencies, sheets, calls } = fixture();
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  const prepared = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
  assert.equal(prepared.ok, true);
  sheets.guestList[1][householdGuestHeaders.indexOf("Guest name")] = "Different Fictional Name";
  const result = await actions.confirm({ receipt: prepared.preparation.receipt, confirmed: true });
  assert.equal(result.ok, false);
  assert.equal(result.error, "IMPORTED_ACTIVATION_PREVIEW_CHANGED");
  assert.equal(calls.activate, 0);
});

test("expired uncommitted receipts cannot activate", async () => {
  const { dependencies, calls } = fixture();
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  const prepared = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
  assert.equal(prepared.ok, true);
  dependencies.now = () => 31 * 60_000 + 1_000_000;
  const result = await actions.confirm({ receipt: prepared.preparation.receipt, confirmed: true });
  assert.equal(result.ok, false);
  assert.equal(result.error, "IMPORTED_ACTIVATION_PREVIEW_EXPIRED");
  assert.equal(calls.readSheets, 1);
  assert.equal(calls.activate, 0);
});

test("committed timeout retry is recovered before receipt expiry or source reads", async () => {
  const { dependencies, calls } = fixture();
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  const prepared = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
  assert.equal(prepared.ok, true);
  dependencies.committed = async () => { calls.committed += 1; return true; };
  dependencies.now = () => 2_000_000;
  const result = await actions.confirm({ receipt: prepared.preparation.receipt, confirmed: true });
  assert.deepEqual(result, { ok: true, result: { status: "active", replayed: true } });
  assert.equal(calls.readSheets, 1);
  assert.equal(calls.activate, 0);
});

test("each administrative activation action authorizes before reading source or database", async () => {
  const { dependencies, calls } = fixture();
  dependencies.authorize = async () => { calls.authorize += 1; throw new Error("NOT_ALLOWED"); };
  const actions = createImportedHouseholdActivationAdminActions(dependencies);
  await assert.rejects(actions.prepare({ externalHouseholdId: ids.externalHousehold }), /NOT_ALLOWED/);
  await assert.rejects(actions.confirm({ receipt: "invalid", confirmed: true }), /NOT_ALLOWED/);
  assert.equal(calls.readSheets, 0);
  assert.equal(calls.snapshot, 0);
});
