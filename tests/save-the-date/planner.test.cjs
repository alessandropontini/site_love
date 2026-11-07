const { test } = require("node:test");
const assert = require("node:assert/strict");
const { planSaveTheDate } = require(
  process.env.SYNC_TEST_BUILD + "/save-the-date/planner.js"
);

const ids = {
  source: "fictional-source",
  externalHousehold: "11111111-1111-4111-8111-111111111111",
  household: "22222222-2222-4222-8222-222222222222",
  contact: "33333333-3333-4333-8333-333333333333",
  child: "44444444-4444-4444-8444-444444444444",
  invitee: "55555555-5555-4555-8555-555555555555"
};

function fixture() {
  return {
    parsed: {
      mode: "household_uuid",
      households: [{
        externalId: ids.externalHousehold,
        party: "Fictional household",
        owner: "groom",
        contactGuestUuid: ids.contact,
        language: "it"
      }],
      guests: [
        { externalId: ids.contact, kind: "named", name: "Fictional Rowan" },
        { externalId: ids.child, kind: "child", name: null }
      ],
      memberLinks: [
        { externalGuestId: ids.contact, householdUuid: ids.externalHousehold, hostSyncUuid: null },
        { externalGuestId: ids.child, householdUuid: ids.externalHousehold, hostSyncUuid: null }
      ],
      errors: [],
      warnings: [],
      sourceCount: 2,
      skippedRows: []
    },
    snapshot: {
      contractVersion: 3,
      sourceModes: [{ sourceId: ids.source, mode: "household_uuid" }],
      householdMappings: [{ sourceId: ids.source, externalHouseholdId: ids.externalHousehold, householdId: ids.household }],
      exclusions: [],
      households: [{ id: ids.household, name: "Fictional household", owner: "groom", plusOne: false,
        issued: true, responded: true, version: 2, status: "active", namedCount: 1 }],
      members: [
        { externalId: ids.contact, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
          inviteeId: ids.invitee, actualName: "Fictional Rowan", data: { kind: "named" } },
        { externalId: ids.child, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
          inviteeId: null, actualName: null, data: { kind: "child" } }
      ],
      inviteeCount: 1
    }
  };
}

test("plans an existing household using the exact source UUID mapping", () => {
  const { parsed, snapshot } = fixture();
  const plan = planSaveTheDate(parsed, snapshot, ids.source);

  assert.equal(plan.eligibleHouseholds, 1);
  assert.equal(plan.blockedHouseholds, 0);
  assert.deepEqual(plan.households[0], {
    externalHouseholdId: ids.externalHousehold,
    householdId: ids.household,
    contactGuestId: ids.contact,
    language: "it",
    memberCount: 2,
    eligibleForPreparation: true,
    blockers: []
  });
  assert.equal(JSON.stringify(plan).includes("Fictional Rowan"), false);
  assert.equal(JSON.stringify(plan).includes("token_hash"), false);
});

test("blocks missing, ambiguous, reused and excluded mappings", () => {
  const { parsed, snapshot } = fixture();
  const missing = planSaveTheDate(parsed, { ...snapshot, householdMappings: [] }, ids.source);
  assert(missing.households[0].blockers.some((reason) => reason.includes("No approved database mapping")));

  const ambiguous = planSaveTheDate(parsed,
    { ...snapshot, householdMappings: [...snapshot.householdMappings, ...snapshot.householdMappings] }, ids.source);
  assert(ambiguous.households[0].blockers.some((reason) => reason.includes("ambiguous")));

  const reused = planSaveTheDate(parsed,
    { ...snapshot, householdMappings: [...snapshot.householdMappings,
      { sourceId: ids.source, externalHouseholdId: "66666666-6666-4666-8666-666666666666", householdId: ids.household }] }, ids.source);
  assert(reused.households[0].blockers.some((reason) => reason.includes("mapped more than once")));

  const excluded = planSaveTheDate(parsed,
    { ...snapshot, exclusions: [{ householdId: ids.household, active: true, revision: 1 }] }, ids.source);
  assert(excluded.households[0].blockers.some((reason) => reason.includes("excluded")));
});

test("blocks contact, roster, mode and parser divergence", () => {
  const { parsed, snapshot } = fixture();
  const missingContact = planSaveTheDate({ ...parsed,
    households: parsed.households.map((household) => ({ ...household, contactGuestUuid: null })) }, snapshot, ids.source);
  assert(missingContact.households[0].blockers.some((reason) => reason.includes("contact must be selected")));

  const drift = planSaveTheDate(parsed, { ...snapshot, members: snapshot.members.slice(0, 1) }, ids.source);
  assert(drift.households[0].blockers.some((reason) => reason.includes("rosters differ")));

  const wrongMode = planSaveTheDate(parsed,
    { ...snapshot, sourceModes: [{ sourceId: ids.source, mode: "legacy" }] }, ids.source);
  assert(wrongMode.blockers.some((reason) => reason.includes("Household UUID mode")));

  const parserError = planSaveTheDate({ ...parsed, errors: ["Fictional parser conflict."] }, snapshot, ids.source);
  assert(parserError.households[0].blockers.includes("Fictional parser conflict."));
});
