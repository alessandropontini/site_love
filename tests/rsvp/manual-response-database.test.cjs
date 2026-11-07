const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");

test("manual RSVP journal is atomic, replay-safe and metadata-only", {
  skip: !process.env.PGLITE_TEST_MODULE
}, async (t) => {
  const { PGlite } = require(process.env.PGLITE_TEST_MODULE);
  const db = new PGlite();
  await db.exec("create role site_love_sync; create role site_love_app;");

  const ids = {
    household: "22222222-2222-4222-8222-222222222222",
    invitee: "44444444-4444-4444-8444-444444444444"
  };
  const tokenHash = "a".repeat(64);
  const actor = "fictional-admin";
  const initial = {
    id: "55555555-5555-4555-8555-555555555555",
    household: ids.household,
    actor,
    provenance: "phone",
    recordingReason: "initial_offsite_response",
    requestHash: "b".repeat(64),
    submission: {
      revision: 0,
      locale: "it",
      contactEmail: "fictional@example.test",
      answers: [{ inviteeId: ids.invitee, attendance: "yes", mealPreference: "standard" }],
      plusOne: null,
      hasChildren: false,
      privacyNoticeVersion: "fictional-v1",
      confirmed: true
    }
  };
  const record = async (request) => (await db.query(
    "select rsvp.record_manual_response($1::jsonb) result", [JSON.stringify(request)]
  )).rows[0].result;

  try {
    for (const file of (await fs.readdir("db/migrations")).filter((name) => name.endsWith(".sql")).sort()) {
      const sql = (await fs.readFile(`db/migrations/${file}`, "utf8"))
        .replace("create extension if not exists pgcrypto;", "");
      await db.exec(sql);
    }
    await db.query(
      `insert into rsvp.households(id,display_name,token_hash,status,invited_by,preferred_locale)
       values($1,'Fictional household',$2,'disabled','groom','it')`,
      [ids.household, tokenHash]
    );
    await db.query(
      "insert into rsvp.invitees(id,household_id,display_name) values($1,$2,'Fictional guest')",
      [ids.invitee, ids.household]
    );

    await t.test("records one offline answer without changing household identity or token", async () => {
      const before = (await db.query(
        `select h.id household_id,h.token_hash,h.status,i.id invitee_id
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id where h.id=$1`,
        [ids.household]
      )).rows[0];
      await db.exec("begin; set role site_love_sync;");
      try {
        assert.deepEqual(await record(initial), { revision: 1, replayed: false });
        const dashboardEvents = (await db.query(
          "select * from rsvp.manual_response_dashboard_events()"
        )).rows;
        assert.equal(dashboardEvents.length, 1);
        assert.deepEqual(Object.keys(dashboardEvents[0]).sort(), [
          "actor_id", "created_at", "household_id", "provenance", "recording_reason", "revision"
        ]);
        assert.equal(dashboardEvents[0].household_id, ids.household);
        assert.equal(dashboardEvents[0].actor_id, actor);
        assert.equal(JSON.stringify(dashboardEvents).includes(initial.requestHash), false);
        assert.equal(JSON.stringify(dashboardEvents).includes("fictional@example.test"), false);
        await db.exec("savepoint deny_journal_read;");
        await assert.rejects(db.query("select * from rsvp.manual_response_events"), /permission denied/);
        await db.exec("rollback to savepoint deny_journal_read;");
        await db.exec("savepoint deny_direct_write;");
        await assert.rejects(db.exec("delete from rsvp.manual_response_events"), /permission denied/);
        await db.exec("rollback to savepoint deny_direct_write;");
      } finally {
        await db.exec("commit;");
        await db.exec("reset role;");
      }
      assert.deepEqual((await db.query(
        `select h.id household_id,h.token_hash,h.status,i.id invitee_id
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id where h.id=$1`,
        [ids.household]
      )).rows[0], before);
      assert.deepEqual((await db.query(
        "select attendance,meal_preference from rsvp.responses where household_id=$1 and invitee_id=$2",
        [ids.household, ids.invitee]
      )).rows[0], { attendance: "yes", meal_preference: "standard" });
      const event = (await db.query(
        "select actor_id,provenance,recording_reason,revision,request_hash from rsvp.manual_response_events"
      )).rows[0];
      assert.deepEqual(event, {
        actor_id: actor,
        provenance: "phone",
        recording_reason: "initial_offsite_response",
        revision: 1,
        request_hash: initial.requestHash
      });
      const audit = (await db.query("select metadata from rsvp.audit_events where household_id=$1", [ids.household])).rows[0].metadata;
      assert.equal(audit.source, "phone");
      assert.equal(audit.actor, actor);
      assert.equal(audit.recording_reason, "initial_offsite_response");
      const journal = JSON.stringify((await db.query("select * from rsvp.manual_response_events")).rows);
      assert.equal(journal.includes("fictional@example.test"), false);
      assert.equal(journal.includes("standard"), false);
      assert.equal(journal.includes(tokenHash), false);
    });

    await t.test("replays the exact operation once and rejects event reuse or a false reason", async () => {
      assert.deepEqual(await record(initial), { revision: 1, replayed: true });
      assert.equal((await db.query("select count(*)::int n from rsvp.manual_response_events")).rows[0].n, 1);
      await assert.rejects(record({
        ...initial,
        requestHash: "c".repeat(64),
        submission: { ...initial.submission, contactEmail: "other@example.test" }
      }), /MANUAL_EVENT_REUSED/);
      await assert.rejects(record({
        ...initial,
        id: "88888888-8888-4888-8888-888888888888",
        recordingReason: "correction",
        submission: {
          ...initial.submission,
          revision: 1,
          answers: [{ inviteeId: "99999999-9999-4999-8999-999999999999", attendance: "no", mealPreference: "not_needed" }]
        }
      }), /MANUAL_INVALID_OR_RATE_LIMITED/);
      assert.equal((await db.query("select response_version from rsvp.households where id=$1", [ids.household])).rows[0].response_version, 1);
      assert.equal((await db.query("select count(*)::int n from rsvp.manual_response_events")).rows[0].n, 1);
      await assert.rejects(record({
        ...initial,
        id: "66666666-6666-4666-8666-666666666666",
        recordingReason: "initial_offsite_response",
        submission: { ...initial.submission, revision: 1 }
      }), /MANUAL_REASON_STATE_MISMATCH/);
    });

    await t.test("requires current revision for a correction and records only its structured reason", async () => {
      const correction = {
        ...initial,
        id: "77777777-7777-4777-8777-777777777777",
        provenance: "paper",
        recordingReason: "correction",
        submission: {
          ...initial.submission,
          revision: 1,
          answers: [{ inviteeId: ids.invitee, attendance: "no", mealPreference: "not_needed" }]
        }
      };
      await assert.rejects(record({ ...correction, submission: { ...correction.submission, revision: 0 } }), /MANUAL_VERSION_CONFLICT/);
      assert.deepEqual(await record(correction), { revision: 2, replayed: false });
      assert.equal((await db.query("select attendance from rsvp.responses where household_id=$1", [ids.household])).rows[0].attendance, "no");
      assert.equal((await db.query("select count(*)::int n from rsvp.manual_response_events")).rows[0].n, 2);
      const allAudit = JSON.stringify((await db.query("select metadata from rsvp.audit_events where household_id=$1", [ids.household])).rows);
      assert.equal(allAudit.includes("fictional@example.test"), false);
      assert.deepEqual((await db.query(
        "select recording_reason from rsvp.manual_response_events where household_id=$1 order by revision",
        [ids.household]
      )).rows.map((row) => row.recording_reason), ["initial_offsite_response", "correction"]);
    });

    await t.test("runtime app role cannot invoke or read the manual response journal", async () => {
      await db.exec("begin; set role site_love_app;");
      try {
        await db.exec("savepoint deny_function;");
        await assert.rejects(record(initial), /permission denied/);
        await db.exec("rollback to savepoint deny_function;");
        await db.exec("savepoint deny_journal_read;");
        await assert.rejects(db.query("select * from rsvp.manual_response_events"), /permission denied/);
        await db.exec("rollback to savepoint deny_journal_read;");
        await db.exec("savepoint deny_lookup;");
        await assert.rejects(db.query("select rsvp.admin_household($1)", [ids.household]), /permission denied/);
        await db.exec("rollback to savepoint deny_lookup;");
        await db.exec("savepoint deny_dashboard_events;");
        await assert.rejects(db.query("select * from rsvp.manual_response_dashboard_events()"), /permission denied/);
        await db.exec("rollback to savepoint deny_dashboard_events;");
      } finally {
        await db.exec("rollback;");
        await db.exec("reset role;");
      }
    });
  } finally {
    await db.close();
  }
});
