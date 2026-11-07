const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

test("Save the Date migration is atomic, idempotent and preserves RSVP identity", {
  skip: !process.env.PGLITE_TEST_MODULE
}, async (t) => {
  const { PGlite } = require(process.env.PGLITE_TEST_MODULE);
  const db = new PGlite();
  await db.exec("create role site_love_sync; create role site_love_app;");
  try {
    for (const file of (await fs.readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql")).sort()) {
      const sql = (await fs.readFile(path.join("db/migrations", file), "utf8"))
        .replace("create extension if not exists pgcrypto;", "");
      await db.exec(sql);
    }

    const ids = {
      source: "fictional-source",
      externalHousehold: "11111111-1111-4111-8111-111111111111",
      household: "22222222-2222-4222-8222-222222222222",
      guest: "33333333-3333-4333-8333-333333333333",
      invitee: "44444444-4444-4444-8444-444444444444",
      event: "55555555-5555-4555-8555-555555555555"
    };
    await db.query(
      `insert into rsvp.households(id,display_name,token_hash,status,invited_by,response_version)
       values($1,'Fictional Household',$2,'active','groom',1)`,
      [ids.household, "a".repeat(64)]
    );
    await db.query(
      "insert into rsvp.invitees(id,household_id,display_name) values($1,$2,'Fictional Guest')",
      [ids.invitee, ids.household]
    );
    await db.query(
      `insert into rsvp.responses(household_id,invitee_id,attendance,meal_preference)
       values($1,$2,'yes','standard')`,
      [ids.household, ids.invitee]
    );
    await db.query("insert into rsvp.guest_sync_sources(source_id,mode) values($1,'household_uuid')", [ids.source]);
    await db.query(
      `insert into rsvp.guest_sync_households(source_id,external_household_id,household_id)
       values($1,$2,$3)`,
      [ids.source, ids.externalHousehold, ids.household]
    );
    await db.query(
      `insert into rsvp.guest_sync_members(external_id,source_id,household_id,
        external_household_id,invitee_id,data)
       values($1,$2,$3,$4,$5,$6::jsonb)`,
      [ids.guest, ids.source, ids.household, ids.externalHousehold, ids.invitee,
        JSON.stringify({ externalId: ids.guest, kind: "named" })]
    );

    const makeRequest = (patch = {}) => ({
      id: ids.event,
      source: ids.source,
      household: ids.externalHousehold,
      householdId: ids.household,
      contact: ids.guest,
      actor: "fictional-admin",
      expectedVersion: 0,
      status: "READY",
      channel: "paper",
      language: "it",
      template: "std-draft-v1",
      sourceCommitment: "1".repeat(64),
      databaseCommitment: "2".repeat(64),
      draftCommitment: "3".repeat(64),
      ...patch
    });
    const record = async (request) => (await db.query(
      "select rsvp.record_save_the_date($1::jsonb) result", [JSON.stringify(request)]
    )).rows[0].result;

    await t.test("one event updates only the Save the Date journal", async () => {
      const before = (await db.query(
        `select h.id,h.token_hash,h.status,h.response_version,i.id invitee_id,
          r.attendance,r.meal_preference
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.responses r on r.household_id=h.id and r.invitee_id=i.id where h.id=$1`,
        [ids.household]
      )).rows[0];
      assert.deepEqual(await record(makeRequest()), { status: "READY", version: 1, replayed: false });
      assert.deepEqual(await record(makeRequest()), { status: "READY", version: 1, replayed: true });
      const after = (await db.query(
        `select h.id,h.token_hash,h.status,h.response_version,i.id invitee_id,
          r.attendance,r.meal_preference
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.responses r on r.household_id=h.id and r.invitee_id=i.id where h.id=$1`,
        [ids.household]
      )).rows[0];
      assert.deepEqual(after, before);
      assert.equal((await db.query("select count(*)::int n from rsvp.save_the_date_events")).rows[0].n, 1);
      assert.equal((await db.query("select version from rsvp.save_the_date_state")).rows[0].version, 1);
    });

    await t.test("event reuse, stale versions and mapping changes fail without partial writes", async () => {
      await assert.rejects(record(makeRequest({ status: "SENT" })), /STD_EVENT_REUSED/);
      await assert.rejects(record(makeRequest({ id: "66666666-6666-4666-8666-666666666666", expectedVersion: 0 })), /STD_VERSION_CONFLICT/);
      await assert.rejects(record(makeRequest({ id: "77777777-7777-4777-8777-777777777777", expectedVersion: 1,
        contact: "88888888-8888-4888-8888-888888888888", status: "SENT" })), /STD_MAPPING_CHANGED/);
      assert.equal((await db.query("select count(*)::int n from rsvp.save_the_date_events")).rows[0].n, 1);
      assert.equal((await db.query("select status from rsvp.save_the_date_state")).rows[0].status, "READY");
    });

    await t.test("sync can read and execute but cannot write tables; RSVP role cannot execute", async () => {
      await db.exec("begin; set role site_love_sync;");
      try {
        assert.equal((await db.query("select count(*)::int n from rsvp.save_the_date_events")).rows[0].n, 1);
        await assert.rejects(db.query("insert into rsvp.save_the_date_state(source_id,external_household_id,household_id,status,version) values($1,$2,$3,'FAILED',2)",
          [ids.source, ids.externalHousehold, ids.household]), /permission denied/);
      } finally {
        await db.exec("rollback;");
      }
      await db.exec("begin; set role site_love_app;");
      try {
        await assert.rejects(record(makeRequest({ id: "99999999-9999-4999-8999-999999999999", expectedVersion: 1,
          status: "SENT" })), /permission denied/);
      } finally {
        await db.exec("rollback;");
      }
    });
  } finally {
    await db.close();
  }
});
