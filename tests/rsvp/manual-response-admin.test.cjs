const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHmac } = require("node:crypto");
const { createManualResponseAdminActions } = require(process.env.SYNC_TEST_BUILD + "/rsvp-admin/admin-actions.js");
const { createManualResponseStore } = require(process.env.SYNC_TEST_BUILD + "/rsvp-admin/persistence.js");

process.env.GUEST_SYNC_SIGNING_SECRET = "fictional-manual-signing-secret-with-more-than-32-characters";

const ids = {
  household: "22222222-2222-4222-8222-222222222222",
  invitee: "44444444-4444-4444-8444-444444444444",
  operation: "55555555-5555-4555-8555-555555555555"
};

const invitation = {
  id: ids.household,
  householdName: "Fictional Household",
  contactEmail: "fictional@example.test",
  allowPlusOne: false,
  locale: "en",
  deadline: null,
  revision: 0,
  invitees: [{
    id: ids.invitee,
    displayName: "Fictional Guest",
    attendance: null,
    mealPreference: null
  }],
  plusOne: null,
  hasChildren: false
};

const input = {
  id: ids.operation,
  household: ids.household,
  provenance: "phone",
  recordingReason: "initial_offsite_response",
  emailProvidedByRespondent: true,
  confirmed: true,
  submission: {
    revision: 0,
    locale: "en",
    contactEmail: "fictional@example.test",
    answers: [{ inviteeId: ids.invitee, attendance: "yes", mealPreference: "standard" }],
    plusOne: null,
    hasChildren: false,
    privacyNoticeVersion: "2026-08-23.1"
  }
};

function adminFixture() {
  let authorized = true;
  let authCalls = 0;
  let reads = 0;
  let writes = 0;
  const requests = [];
  const dependencies = {
    authorize: async () => {
      authCalls++;
      if (!authorized) throw new Error("AUTH_DENIED");
      return { actorId: "fictional-clerk-user" };
    },
    household: async (id) => {
      reads++;
      assert.equal(id, ids.household);
      return invitation;
    },
    record: async (request) => {
      writes++;
      requests.push(request);
      return { revision: 1, replayed: writes > 1 };
    }
  };
  return {
    actions: createManualResponseAdminActions(dependencies),
    requests,
    get authCalls() { return authCalls; },
    get reads() { return reads; },
    get writes() { return writes; },
    deny() { authorized = false; }
  };
}

test("manual household read authorizes before database access and returns only its validated RSVP shape", async () => {
  const denied = adminFixture();
  denied.deny();
  await assert.rejects(denied.actions.household(ids.household), /AUTH_DENIED/);
  assert.equal(denied.reads, 0);

  const allowed = adminFixture();
  const result = await allowed.actions.household(ids.household);
  assert.equal(result.ok, true);
  assert.deepEqual(result.household, invitation);
  assert.equal(allowed.authCalls, 1);
  assert.equal(allowed.reads, 1);
  assert.equal(Object.hasOwn(result.household, "tokenHash"), false);
});

test("each record is allowlist-authorized and HMAC binds the server actor and exact payload", async () => {
  const f = adminFixture();
  const first = await f.actions.record(input);
  const retry = await f.actions.record(input);
  assert.deepEqual(first, { ok: true, result: { revision: 1, replayed: false } });
  assert.deepEqual(retry, { ok: true, result: { revision: 1, replayed: true } });
  assert.equal(f.authCalls, 2);
  assert.equal(f.writes, 2);

  const request = f.requests[0];
  const { requestHash, ...body } = request;
  assert.equal(request.actor, "fictional-clerk-user");
  assert.equal(request.submission.confirmed, true);
  assert.equal(requestHash, createHmac("sha256", process.env.GUEST_SYNC_SIGNING_SECRET)
    .update("manual-rsvp-v1:").update(JSON.stringify({ ...body, emailProvidedByRespondent: true })).digest("hex"));
  assert.equal(f.requests[0].requestHash, f.requests[1].requestHash);

  const changed = adminFixture();
  await changed.actions.record({
    ...input,
    submission: { ...input.submission, contactEmail: "changed@example.test" }
  });
  assert.notEqual(changed.requests[0].requestHash, requestHash);

  await assert.deepEqual(await f.actions.record({ ...input, actor: "untrusted-client" }), {
    ok: false, error: "MANUAL_INVALID_REQUEST"
  });
  assert.deepEqual(await f.actions.record({ ...input, emailProvidedByRespondent: false }), {
    ok: false, error: "MANUAL_INVALID_REQUEST"
  });
  assert.equal(f.writes, 2);
});

test("authorization and validation failures never reach the database; database errors are sanitized", async () => {
  const denied = adminFixture();
  denied.deny();
  await assert.rejects(denied.actions.record(input), /AUTH_DENIED/);
  assert.equal(denied.writes, 0);

  const invalid = adminFixture();
  const badInput = await invalid.actions.record({ ...input, confirmed: false });
  assert.deepEqual(badInput, { ok: false, error: "MANUAL_INVALID_REQUEST" });
  assert.equal(invalid.writes, 0);

  const broken = adminFixture();
  broken.actions = createManualResponseAdminActions({
    authorize: async () => ({ actorId: "fictional-clerk-user" }),
    household: async () => null,
    record: async () => { throw new Error("postgres://fictional-secret-host SQL permission denied"); }
  });
  assert.deepEqual(await broken.actions.record(input), { ok: false, error: "MANUAL_UNAVAILABLE" });
});

test("database adapter uses only the restricted functions and validates their results", async () => {
  const calls = [];
  const store = createManualResponseStore(async (statement, parameters) => {
    calls.push({ statement, parameters });
    if (statement.includes("admin_household")) return [{ data: invitation }];
    return [{ result: { revision: 2, replayed: false } }];
  });

  assert.deepEqual(await store.household(ids.household), invitation);
  const request = {
    id: ids.operation,
    household: ids.household,
    actor: "fictional-clerk-user",
    provenance: "paper",
    recordingReason: "correction",
    requestHash: "a".repeat(64),
    submission: { ...input.submission, confirmed: true }
  };
  assert.deepEqual(await store.record(request), { revision: 2, replayed: false });
  assert.match(calls[0].statement, /rsvp\.admin_household\(\$1::uuid\)/);
  assert.deepEqual(calls[0].parameters, [ids.household]);
  assert.match(calls[1].statement, /rsvp\.record_manual_response\(\$1::jsonb\)/);
  assert.deepEqual(JSON.parse(calls[1].parameters[0]), request);
});
