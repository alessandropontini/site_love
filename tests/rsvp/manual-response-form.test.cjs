const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildManualResponseInput,
  createManualResponseDraft,
  expectedRecordingReason
} = require(process.env.SYNC_TEST_BUILD + "/rsvp-admin/form.js");

const ids = {
  household: "22222222-2222-4222-8222-222222222222",
  invitee: "44444444-4444-4444-8444-444444444444",
  plusOne: "66666666-6666-4666-8666-666666666666",
  operation: "55555555-5555-4555-8555-555555555555"
};

const invitation = {
  id: ids.household,
  householdName: "Fictional Household",
  contactEmail: "old@example.test",
  allowPlusOne: true,
  locale: "en",
  deadline: null,
  revision: 0,
  invitees: [{ id: ids.invitee, displayName: "Fictional Guest", attendance: null, mealPreference: null }],
  plusOne: null,
  hasChildren: false
};

function readyDraft() {
  return {
    ...createManualResponseDraft(invitation),
    contactEmail: "respondent@example.test",
    provenance: "phone",
    recordingReason: "initial_offsite_response",
    emailProvidedByRespondent: true,
    confirmed: true,
    answers: [{ inviteeId: ids.invitee, attendance: "yes", mealPreference: "standard" }]
  };
}

test("draft starts with blank email and preserves current permanent IDs and answers", () => {
  const existing = {
    ...invitation,
    revision: 1,
    invitees: [{ ...invitation.invitees[0], attendance: "yes", mealPreference: "vegan" }],
    plusOne: { id: ids.plusOne, firstName: "Fictional", lastName: "Companion", mealPreference: "standard" }
  };
  const draft = createManualResponseDraft(existing);
  assert.equal(draft.contactEmail, "");
  assert.equal(draft.answers[0].inviteeId, ids.invitee);
  assert.equal(draft.answers[0].attendance, "yes");
  assert.equal(draft.answers[0].mealPreference, "vegan");
  assert.equal(draft.includePlusOne, true);
  assert.equal(draft.plusOne.id, ids.plusOne);
  assert.equal(expectedRecordingReason(existing), "correction");
});

test("request construction requires the expected reason, explicit email attestation, and confirmation", () => {
  const draft = readyDraft();
  const request = buildManualResponseInput(invitation, draft, ids.operation);
  assert.equal(request.household, ids.household);
  assert.equal(request.submission.answers[0].inviteeId, ids.invitee);
  assert.equal(request.submission.contactEmail, "respondent@example.test");
  assert.equal(buildManualResponseInput(invitation, { ...draft, confirmed: false }, ids.operation), null);
  assert.equal(buildManualResponseInput(invitation, { ...draft, emailProvidedByRespondent: false }, ids.operation), null);
  assert.equal(buildManualResponseInput(invitation, { ...draft, recordingReason: "correction" }, ids.operation), null);
  assert.equal(buildManualResponseInput(invitation, { ...draft, contactEmail: "" }, ids.operation), null);
});

test("incompatible response states fail closed and existing IDs cannot be replaced", () => {
  const inconsistent = { ...invitation, revision: 1 };
  assert.equal(expectedRecordingReason(inconsistent), null);
  assert.equal(buildManualResponseInput(inconsistent, readyDraft(), ids.operation), null);
  assert.equal(buildManualResponseInput(invitation, {
    ...readyDraft(),
    answers: [{ inviteeId: "88888888-8888-4888-8888-888888888888", attendance: "yes", mealPreference: "standard" }]
  }, ids.operation), null);
});

test("permitted existing plus-one keeps its ID and all response fields are validated", () => {
  const withPlusOne = {
    ...invitation,
    revision: 1,
    invitees: [{ ...invitation.invitees[0], attendance: "yes" }],
    plusOne: { id: ids.plusOne, firstName: "Fictional", lastName: "Companion", mealPreference: "standard" }
  };
  const draft = {
    ...createManualResponseDraft(withPlusOne),
    contactEmail: "respondent@example.test",
    provenance: "paper",
    recordingReason: "correction",
    emailProvidedByRespondent: true,
    confirmed: true,
    answers: [{ inviteeId: ids.invitee, attendance: "yes", mealPreference: "standard" }],
    includePlusOne: true,
    plusOne: { id: ids.plusOne, firstName: "Fictional", lastName: "Companion", mealPreference: "standard" }
  };
  const request = buildManualResponseInput(withPlusOne, draft, ids.operation);
  assert.equal(request.submission.plusOne.id, ids.plusOne);
  assert.equal(request.provenance, "paper");
  assert.equal(buildManualResponseInput(withPlusOne, {
    ...draft,
    plusOne: { ...draft.plusOne, id: "88888888-8888-4888-8888-888888888888" }
  }, ids.operation), null);
});
