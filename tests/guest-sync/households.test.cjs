const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  headers,
  householdHeaders,
  parseGuestSheets,
  parseHouseholdSheets,
  parseSheet
} = require(process.env.SYNC_TEST_BUILD + "/model.js");

const ids = {
  h1: "11111111-1111-4111-8111-111111111111",
  h2: "22222222-2222-4222-8222-222222222222",
  adult: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  partner: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  child: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  plus: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  other: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"
};
const guestHeaders = [...headers, "Surname", "Household UUID", "Host Sync UUID"];
const guestRow = (overrides = {}) => {
  const values = {
    "Guest name": "Fictional Rowan",
    Surname: "Example",
    "Guest type": "Adult",
    Group: "Friends",
    "List owner": "Ale",
    "Party / family": "Fictional household",
    "Planning status": "On list",
    Invitation: "",
    RSVP: "",
    Priority: "Normal",
    Table: "T1",
    "Dietary requirements": "",
    Notes: "",
    "Sync UUID": ids.adult,
    "Household UUID": ids.h1,
    "Host Sync UUID": "",
    ...overrides
  };
  return guestHeaders.map((header) => values[header] ?? "");
};
const householdRow = (overrides = {}) => {
  const values = {
    "Household UUID": ids.h1,
    "Party / family": "Fictional household",
    "List owner": "Ale",
    "Contact guest UUID": ids.adult,
    "Contact email": "fictional@example.invalid",
    "Contact phone": "+15555550123",
    Language: "en",
    ...overrides
  };
  return householdHeaders.map((header) => values[header] ?? "");
};
const sheets = (guests = [guestRow()], households = [householdRow()]) => ({
  guestList: [guestHeaders, ...guests],
  households: [householdHeaders, ...households]
});
const householdParse = (guests, households) =>
  parseHouseholdSheets([guestHeaders, ...guests], [householdHeaders, ...households]);

test("Household UUID parser accepts a single named guest and preserves both permanent IDs", () => {
  const result = parseGuestSheets(sheets(), "household_uuid");
  assert.equal(result.mode, "household_uuid");
  assert.deepEqual(result.errors, []);
  assert.equal(result.households[0].externalId, ids.h1);
  assert.equal(result.memberLinks[0].externalGuestId, ids.adult);
  assert.equal(result.memberLinks[0].householdUuid, ids.h1);
  assert.equal(result.guests[0].externalId, ids.adult);
});

test("a couple can share one household and each guest retains a distinct Sync UUID", () => {
  const partner = guestRow({
    "Guest name": "Fictional Avery", "Sync UUID": ids.partner,
    "Contact guest UUID": undefined
  });
  const result = householdParse([guestRow(), partner], [householdRow()]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.memberLinks.length, 2);
  assert.deepEqual(new Set(result.memberLinks.map((member) => member.externalGuestId)), new Set([ids.adult, ids.partner]));
});

test("a household can include child places without retaining child names", () => {
  const child = guestRow({
    "Guest name": "Fictional Child", "Guest type": "Child", Surname: "Private",
    "Sync UUID": ids.child
  });
  const result = householdParse([guestRow(), child], [householdRow()]);
  assert.deepEqual(result.errors, []);
  const parsedChild = result.guests.find((guest) => guest.externalId === ids.child);
  assert.equal(parsedChild.kind, "child");
  assert.equal(parsedChild.name, null);
  assert.equal(parsedChild.surname, null);
  assert(!JSON.stringify(result).includes("Fictional Child"));
});

test("an anonymous +1 may explicitly link to a named adult in the same household", () => {
  const plus = guestRow({
    "Guest name": "Plus-one of Fictional Rowan", Surname: "",
    "Guest type": "Adult", "Sync UUID": ids.plus, "Host Sync UUID": ids.adult
  });
  const result = householdParse([guestRow(), plus], [householdRow()]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.memberLinks.find((member) => member.externalGuestId === ids.plus).hostSyncUuid, ids.adult);
  assert.equal(result.guests.find((guest) => guest.externalId === ids.plus).name, null);
});

test("contact and host are never inferred from the only adult in a household", () => {
  const noContact = householdParse([guestRow()], [householdRow({ "Contact guest UUID": "" })]);
  assert.deepEqual(noContact.errors, []);
  assert.equal(noContact.households[0].contactGuestUuid, null);

  const plus = guestRow({
    "Guest name": "Plus-one of Fictional Rowan", Surname: "",
    "Guest type": "Adult", "Sync UUID": ids.plus
  });
  const noHost = householdParse([guestRow(), plus], [householdRow()]);
  assert.deepEqual(noHost.errors, []);
  assert.equal(noHost.memberLinks.find((member) => member.externalGuestId === ids.plus).hostSyncUuid, null);
});

test("same-label households with different UUIDs stay separate and emit a review warning", () => {
  const first = guestRow();
  const second = guestRow({ "Guest name": "Fictional Casey", "Sync UUID": ids.other, "Household UUID": ids.h2 });
  const firstHousehold = householdRow();
  const secondHousehold = householdRow({ "Household UUID": ids.h2, "Contact guest UUID": ids.other });
  const result = householdParse([first, second], [firstHousehold, secondHousehold]);
  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings.length, 1);
  assert.deepEqual(new Set(result.memberLinks.map((member) => member.householdUuid)), new Set([ids.h1, ids.h2]));
  assert.deepEqual(new Set(result.households.map((household) => household.externalId)), new Set([ids.h1, ids.h2]));
});

test("duplicate household UUIDs fail validation", () => {
  const duplicate = householdRow({ "Contact guest UUID": "" });
  const result = householdParse([guestRow()], [householdRow(), duplicate]);
  assert(result.errors.some((error) => error.includes("duplicate Household UUID")));
});

test("missing and unknown household UUID references fail closed", () => {
  const missing = guestRow({ "Household UUID": "" });
  const invalid = guestRow({ "Sync UUID": ids.partner, "Household UUID": "not-a-uuid" });
  const unknown = guestRow({ "Sync UUID": ids.other, "Household UUID": ids.h2 });
  const result = householdParse([missing, invalid, unknown], [householdRow()]);
  assert(result.errors.some((error) => error.includes("Household UUID is required")));
  assert(result.errors.some((error) => error.includes("Household UUID is invalid")));
  assert(result.errors.some((error) => error.includes("does not exist in Households")));
});

test("household owner and legacy guest-row owner must agree", () => {
  const result = householdParse([guestRow()], [householdRow({ "List owner": "Bridget" })]);
  assert(result.errors.some((error) => error.includes("List owner differs")));
});

test("host links reject unknown IDs, cross-household IDs, self links and non-adults", () => {
  const unknown = guestRow({ "Guest name": "Plus-one of Fictional Rowan", Surname: "", "Sync UUID": ids.plus, "Host Sync UUID": ids.other });
  assert(householdParse([guestRow(), unknown], [householdRow()]).errors.some((error) => error.includes("does not reference a complete guest row")));

  const otherHouseholdHost = guestRow({ "Guest name": "Fictional Avery", "Sync UUID": ids.partner, "Household UUID": ids.h2 });
  const secondHousehold = householdRow({ "Household UUID": ids.h2, "Contact guest UUID": ids.partner });
  const cross = guestRow({ "Guest name": "Plus-one of Fictional Rowan", Surname: "", "Sync UUID": ids.plus, "Host Sync UUID": ids.partner });
  assert(householdParse([guestRow(), cross, otherHouseholdHost], [householdRow(), secondHousehold]).errors.some((error) => error.includes("same household")));

  const self = guestRow({ "Guest name": "Plus-one of Fictional Rowan", Surname: "", "Sync UUID": ids.plus, "Host Sync UUID": ids.plus });
  assert(householdParse([guestRow(), self], [householdRow()]).errors.some((error) => error.includes("cannot refer to itself")));

  const child = guestRow({ "Guest name": "Fictional Child", "Guest type": "Child", "Sync UUID": ids.child });
  const childHost = guestRow({ "Guest name": "Plus-one of Fictional Rowan", Surname: "", "Sync UUID": ids.plus, "Host Sync UUID": ids.child });
  assert(householdParse([guestRow(), child, childHost], [householdRow()]).errors.some((error) => error.includes("host must be a named adult")));
});

test("contact guest must be a named adult in the referenced household", () => {
  const child = guestRow({ "Guest name": "Fictional Child", "Guest type": "Child", "Sync UUID": ids.child });
  const result = householdParse([guestRow(), child], [householdRow({ "Contact guest UUID": ids.child })]);
  assert(result.errors.some((error) => error.includes("contact must be a named adult")));

  const other = guestRow({ "Guest name": "Fictional Avery", "Sync UUID": ids.partner, "Household UUID": ids.h2 });
  const otherHousehold = householdRow({ "Household UUID": ids.h2, "Contact guest UUID": ids.adult });
  const movedContact = householdParse([guestRow(), other], [householdRow(), otherHousehold]);
  assert(movedContact.errors.some((error) => error.includes("Contact guest UUID must belong to this household")));
});

test("incomplete provisional rows remain skipped only when they carry no new UUID references", () => {
  const draftValues = Object.fromEntries(guestHeaders.map((header) => [header, ""]));
  draftValues["Guest name"] = "Fictional Draft";
  const draft = guestHeaders.map((header) => draftValues[header]);
  const cleanDraft = householdParse([guestRow(), draft], [householdRow()]);
  assert.deepEqual(cleanDraft.errors, []);
  assert.equal(cleanDraft.skippedRows.length, 1);

  draftValues["Household UUID"] = ids.h1;
  const linkedDraft = guestHeaders.map((header) => draftValues[header]);
  const invalid = householdParse([guestRow(), linkedDraft], [householdRow()]);
  assert(invalid.errors.some((error) => error.includes("provisional rows cannot have")));
});

test("same Household UUID with a renamed label keeps the same identity key", () => {
  const before = householdParse([guestRow()], [householdRow()]);
  const after = householdParse(
    [guestRow({ "Party / family": "Renamed fictional household" })],
    [householdRow({ "Party / family": "Renamed fictional household" })]
  );
  assert.deepEqual(before.errors, []);
  assert.deepEqual(after.errors, []);
  assert.equal(before.households[0].externalId, after.households[0].externalId);
  assert.equal(before.memberLinks[0].externalGuestId, after.memberLinks[0].externalGuestId);
  assert.equal(after.households[0].party, "Renamed fictional household");
});

test("new columns do not automatically activate Household UUID mode", () => {
  const input = sheets();
  const legacy = parseGuestSheets(input);
  assert.equal(legacy.mode, "legacy");
  assert.deepEqual(legacy.guests.errors, []);
  assert.equal(legacy.guests.guests[0].externalId, ids.adult);
  assert.equal(parseSheet(input.guestList).guests[0].externalId, ids.adult);
});

test("private contact values are validated but never returned in the model", () => {
  const result = parseGuestSheets(sheets(), "household_uuid");
  const serialized = JSON.stringify(result);
  assert(!serialized.includes("fictional@example.invalid"));
  assert(!serialized.includes("+15555550123"));
  assert.deepEqual(result.errors, []);

  const invalid = parseGuestSheets(
    sheets([guestRow()], [householdRow({ "Contact email": "not-an-email-secret", Language: "fr" })]),
    "household_uuid"
  );
  assert(invalid.errors.some((error) => error.includes("Contact email is invalid")));
  assert(invalid.errors.some((error) => error.includes("Language must be it or en")));
  assert(!JSON.stringify(invalid).includes("not-an-email-secret"));
});
