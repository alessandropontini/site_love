const { test } = require("node:test");
const assert = require("node:assert/strict");
const { previewImportedHouseholdActivation } = require(
  process.env.SYNC_TEST_BUILD + "/rsvp/imported-household-activation.js"
);
const { loadImportedHouseholdActivationPreview } = require(
  process.env.SYNC_TEST_BUILD + "/rsvp/imported-household-activation-preview.js"
);
const { headers, householdHeaders } = require(
  process.env.SYNC_TEST_BUILD + "/model.js"
);

const ids = {
  source: "fictional-source",
  externalHousehold: "11111111-1111-4111-8111-111111111111",
  household: "22222222-2222-4222-8222-222222222222",
  guestA: "33333333-3333-4333-8333-333333333333",
  guestB: "44444444-4444-4444-8444-444444444444",
  inviteeA: "55555555-5555-4555-8555-555555555555",
  inviteeB: "66666666-6666-4666-8666-666666666666"
};

function fixture(overrides = {}) {
  const parsed = {
    mode: "household_uuid",
    households: [{ externalId: ids.externalHousehold, party: "Fictional household", owner: "groom" }],
    guests: [
      { externalId: ids.guestA, kind: "named", name: "Fictional Rowan" },
      { externalId: ids.guestB, kind: "child", name: null }
    ],
    memberLinks: [
      { externalGuestId: ids.guestA, householdUuid: ids.externalHousehold },
      { externalGuestId: ids.guestB, householdUuid: ids.externalHousehold }
    ],
    errors: [],
    warnings: [],
    sourceCount: 2,
    skippedRows: []
  };
  const snapshot = {
    contractVersion: 3,
    sourceModes: [{ sourceId: ids.source, mode: "household_uuid" }],
    householdMappings: [{ sourceId: ids.source, externalHouseholdId: ids.externalHousehold, householdId: ids.household }],
    exclusions: [],
    households: [{ id: ids.household, name: "Fictional household", owner: "groom", plusOne: false,
      issued: false, responded: false, version: 0, status: "disabled", namedCount: 1 }],
    members: [
      { externalId: ids.guestA, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
        inviteeId: ids.inviteeA, actualName: "Fictional Rowan" },
      { externalId: ids.guestB, externalHouseholdId: ids.externalHousehold, householdId: ids.household,
        inviteeId: null, actualName: null }
    ],
    inviteeCount: 1
  };
  return { parsed: { ...parsed, ...overrides.parsed }, snapshot: { ...snapshot, ...overrides.snapshot } };
}

test("preview selects one existing mapped household and preserves its IDs", () => {
  const { parsed, snapshot } = fixture();
  const preview = previewImportedHouseholdActivation(parsed, snapshot, ids.source);
  assert.equal(preview.eligible, true);
  assert.equal(preview.eligibleHouseholds, 1);
  assert.equal(preview.households[0].householdId, ids.household);
  assert.equal(preview.households[0].externalHouseholdId, ids.externalHousehold);
  assert.equal(preview.households[0].sourceMemberCount, 2);
  assert.equal(preview.households[0].namedInviteeCount, 1);
  assert.equal(JSON.stringify(preview).includes("token"), false);
});

test("preview blocks missing, duplicate and cross-linked mappings", () => {
  const { parsed, snapshot } = fixture();
  const noMapping = previewImportedHouseholdActivation(parsed,
    { ...snapshot, householdMappings: [] }, ids.source);
  assert(noMapping.households[0].blockers.some((item) => item.includes("No approved database mapping")));

  const duplicateMapping = previewImportedHouseholdActivation(parsed,
    { ...snapshot, householdMappings: [...snapshot.householdMappings, ...snapshot.householdMappings] }, ids.source);
  assert(duplicateMapping.households[0].blockers.some((item) => item.includes("ambiguous")));

  const wrongMember = previewImportedHouseholdActivation(parsed,
    { ...snapshot, members: snapshot.members.map((m, i) => i ? m : { ...m, externalHouseholdId: ids.guestB }) }, ids.source);
  assert(wrongMember.households[0].blockers.some((item) => item.includes("different Household UUID")));
});

test("preview blocks wrong source mode, unsupported contract and active exclusions", () => {
  const { parsed, snapshot } = fixture();
  const legacy = previewImportedHouseholdActivation(parsed,
    { ...snapshot, sourceModes: [{ sourceId: ids.source, mode: "legacy" }] }, ids.source);
  assert.equal(legacy.eligible, false);
  assert(legacy.blockers.some((item) => item.includes("Household UUID mode")));

  const oldContract = previewImportedHouseholdActivation(parsed,
    { ...snapshot, contractVersion: 2 }, ids.source);
  assert(oldContract.blockers.some((item) => item.includes("contract is unsupported")));

  const excluded = previewImportedHouseholdActivation(parsed,
    { ...snapshot, exclusions: [{ householdId: ids.household, active: true, revision: 1 }] }, ids.source);
  assert(excluded.households[0].blockers.some((item) => item.includes("excluded")));
});

test("preview blocks roster, name and invitee mapping divergence", () => {
  const { parsed, snapshot } = fixture();
  const drift = previewImportedHouseholdActivation(parsed,
    { ...snapshot, members: snapshot.members.slice(0, 1) }, ids.source);
  assert(drift.households[0].blockers.some((item) => item.includes("rosters differ")));

  const nameDrift = previewImportedHouseholdActivation(parsed,
    { ...snapshot, members: snapshot.members.map((m, i) => i ? m : { ...m, actualName: "Different Fictional Name" }) }, ids.source);
  assert(nameDrift.households[0].blockers.some((item) => item.includes("names differ")));

  const extraInvitee = previewImportedHouseholdActivation(parsed,
    { ...snapshot, households: snapshot.households.map((h) => ({ ...h, namedCount: 2 })) }, ids.source);
  assert(extraInvitee.households[0].blockers.some((item) => item.includes("named-invitee rosters differ")));
});

test("preview blocks issued, answered and incompatible household states", () => {
  const { parsed, snapshot } = fixture();
  for (const patch of [
    { issued: true },
    { responded: true },
    { status: "active" }
  ]) {
    const preview = previewImportedHouseholdActivation(parsed,
      { ...snapshot, households: snapshot.households.map((h) => ({ ...h, ...patch })) }, ids.source);
    assert.equal(preview.eligible, false);
  }
});

test("any parser error prevents activation and absent rows are not silently eligible", () => {
  const { parsed, snapshot } = fixture({ parsed: { errors: ["Fixture parser error."] } });
  const preview = previewImportedHouseholdActivation(parsed, snapshot, ids.source);
  assert.equal(preview.eligible, false);
  assert(preview.households[0].blockers.includes("Fixture parser error."));
});

test("admin preview returns only the minimal household review DTO", async () => {
  const { snapshot } = fixture();
  const guestValues = {
    "Guest name": "Fictional Rowan",
    "Guest type": "Adult",
    Group: "Fictional group",
    "List owner": "Ale",
    "Party / family": "Fictional household",
    "Planning status": "On list",
    Invitation: "",
    RSVP: "",
    Priority: "Normal",
    Table: "",
    "Dietary requirements": "Fictional private note",
    Notes: "Fictional source note",
    "Sync UUID": ids.guestA,
    "Household UUID": ids.externalHousehold,
    "Host Sync UUID": ""
  };
  const householdValues = {
    "Household UUID": ids.externalHousehold,
    "Party / family": "Fictional household",
    "List owner": "Ale",
    "Contact guest UUID": ids.guestA,
    "Contact email": "fictional@example.invalid",
    "Contact phone": "+15555550123",
    Language: "en"
  };
  const result = await loadImportedHouseholdActivationPreview({
    sourceId: ids.source,
    readSheets: async () => ({
      guestList: [
        [...headers, "Household UUID", "Host Sync UUID"],
        [...headers.map((header) => guestValues[header] ?? ""), ids.externalHousehold, ""]
      ],
      households: [
        householdHeaders,
        householdHeaders.map((header) => householdValues[header] ?? "")
      ]
    }),
    snapshot: async () => ({
      data: {
        ...snapshot,
        members: snapshot.members.slice(0, 1),
        households: snapshot.households.map((household) => ({ ...household, namedCount: 1 })),
        inviteeCount: 1
      },
      hash: "fictional-snapshot-hash"
    })
  });

  assert.equal(result.eligible, true);
  assert.equal(result.households[0].householdId, ids.household);
  assert.equal(result.households[0].externalHouseholdId, ids.externalHousehold);
  const serialized = JSON.stringify(result);
  for (const privateValue of [
    "Fictional Rowan",
    "fictional@example.invalid",
    "+15555550123",
    "Fictional private note",
    "Fictional source note",
    "token"
  ]) assert.equal(serialized.includes(privateValue), false);
});

test("admin preview requests each read source once and exposes no mutation dependency", async () => {
  const calls = { sheets: 0, snapshot: 0 };
  const { snapshot } = fixture();
  const dependencies = {
    sourceId: ids.source,
    readSheets: async () => {
      calls.sheets += 1;
      return { guestList: [], households: [] };
    },
    snapshot: async () => {
      calls.snapshot += 1;
      return { data: snapshot, hash: "fictional-snapshot-hash" };
    }
  };

  await loadImportedHouseholdActivationPreview(dependencies);
  assert.deepEqual(calls, { sheets: 1, snapshot: 1 });
  assert.equal(Object.keys(dependencies).some((key) => /apply|write|activate/i.test(key)), false);
});
