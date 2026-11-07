const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

test("imported-household activation is atomic, replay-safe and hash-only", {
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
      ext: "11111111-1111-4111-8111-111111111111",
      household: "22222222-2222-4222-8222-222222222222",
      guest: "33333333-3333-4333-8333-333333333333",
      invitee: "44444444-4444-4444-8444-444444444444",
      event: "55555555-5555-4555-8555-555555555555"
    };
    const tokenHash = "a".repeat(64);
    await db.query("insert into rsvp.guest_sync_sources(source_id,mode) values($1,'household_uuid')", [ids.source]);

    async function createMappedHousehold(index, options = {}) {
      const householdId = index === 1 ? ids.household : `22222222-2222-4222-8222-${String(index).padStart(12, "0")}`;
      const externalId = index === 1 ? ids.ext : `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`;
      const guestId = index === 1 ? ids.guest : `33333333-3333-4333-8333-${String(index).padStart(12, "0")}`;
      const inviteeId = index === 1 ? ids.invitee : `44444444-4444-4444-8444-${String(index).padStart(12, "0")}`;
      const name = `Fictional Guest ${index}`;
      const label = `Fictional Household ${index}`;
      await db.query(
        `insert into rsvp.households(id,display_name,token_hash,status,invited_by,preferred_locale,
          response_version,allow_plus_one,revoked_at)
         values($1,$2,$3,$4,'groom','it',$5,false,null)`,
        [householdId, label, options.issued ? "f".repeat(64) : null,
          options.issued ? "active" : "disabled", options.responseVersion ?? 0]
      );
      await db.query("insert into rsvp.invitees(id,household_id,display_name) values($1,$2,$3)",
        [inviteeId, householdId, name]);
      await db.query(
        "insert into rsvp.guest_sync_households(source_id,external_household_id,household_id) values($1,$2,$3)",
        [ids.source, externalId, householdId]
      );
      await db.query(
        `insert into rsvp.guest_sync_members(external_id,source_id,household_id,
          external_household_id,invitee_id,data)
         values($1,$2,$3,$4,$5,$6::jsonb)`,
        [guestId, ids.source, householdId, externalId, inviteeId,
          JSON.stringify({ externalId: guestId, kind: "named", name, party: label, owner: "groom" })]
      );
      return { householdId, externalId, guestId, inviteeId, name, label };
    }

    const valid = await createMappedHousehold(1);
    await db.query(
      "insert into rsvp.audit_events(household_id,event_type,metadata) values($1,'fictional_import_note',$2::jsonb)",
      [valid.householdId, JSON.stringify({ fixture: true })]
    );
    const replied = await createMappedHousehold(2, { responseVersion: 1 });
    await db.query(
      `insert into rsvp.responses(household_id,invitee_id,attendance,meal_preference)
       values($1,$2,'yes','standard')`, [replied.householdId, replied.inviteeId]
    );
    const excluded = await createMappedHousehold(3);
    // Simulate corrupted legacy state that the exclusion/member FK normally forbids.
    await db.exec("alter table rsvp.guest_sync_members drop constraint guest_sync_member_not_excluded");
    await db.query("update rsvp.guest_sync_exclusions set active=true,revision=1 where household_id=$1",
      [excluded.householdId]);
    const issued = await createMappedHousehold(4, { issued: true });
    const inconsistent = await createMappedHousehold(5);
    const syncIssued = await createMappedHousehold(6);
    await db.query("update rsvp.guest_sync_members set data=jsonb_set(data,'{name}','\"Different Fictional Name\"') where external_id=$1",
      [inconsistent.guestId]);

    const activation = async (request = {}) => (await db.query(
      `select rsvp.activate_imported_household_invitation(
        $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as result`,
      [request.event ?? ids.event, request.actor ?? "fictional-admin", request.source ?? ids.source,
        request.external ?? valid.externalId, request.household ?? valid.householdId,
        request.responseVersion ?? 0, request.tokenHash ?? tokenHash]
    )).rows[0].result;

    await t.test("updates only token hash and disabled status, then exact retry replays", async () => {
      const before = (await db.query(
        `select h.id,h.display_name,h.invited_by,h.preferred_locale,h.deadline,h.response_version,
          h.revoked_at,h.allow_plus_one,h.has_children,h.created_at,h.updated_at,
          i.id invitee_id,i.display_name invitee_name,
          m.external_id,m.external_household_id,m.invitee_id mapped_invitee,
          r.attendance,r.meal_preference
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.guest_sync_members m on m.household_id=h.id
         left join rsvp.responses r on r.household_id=h.id and r.invitee_id=i.id
         where h.id=$1`, [valid.householdId]
      )).rows[0];
      assert.deepEqual(await activation(), { status: "active", replayed: false });
      assert.deepEqual(await activation(), { status: "active", replayed: true });
      assert.equal((await db.query(
        `select rsvp.imported_household_invitation_activation_committed(
          $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as committed`,
        [ids.event, "fictional-admin", ids.source, valid.externalId, valid.householdId, 0, tokenHash]
      )).rows[0].committed, true);
      assert.equal((await db.query(
        `select rsvp.imported_household_invitation_activation_committed(
          $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as committed`,
        ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "fictional-admin", ids.source, valid.externalId, valid.householdId, 0, tokenHash]
      )).rows[0].committed, false);
      const after = (await db.query(
        `select h.id,h.display_name,h.invited_by,h.preferred_locale,h.deadline,h.response_version,
          h.revoked_at,h.allow_plus_one,h.has_children,h.created_at,h.updated_at,
          i.id invitee_id,i.display_name invitee_name,
          m.external_id,m.external_household_id,m.invitee_id mapped_invitee,
          r.attendance,r.meal_preference
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.guest_sync_members m on m.household_id=h.id
         left join rsvp.responses r on r.household_id=h.id and r.invitee_id=i.id
         where h.id=$1`, [valid.householdId]
      )).rows[0];
      assert.deepEqual(after, before);
      const household = (await db.query("select token_hash,status from rsvp.households where id=$1", [valid.householdId])).rows[0];
      assert.equal(household.token_hash, tokenHash);
      assert.equal(household.status, "active");
      assert.equal((await db.query("select count(*)::int n from rsvp.imported_household_invitation_events")).rows[0].n, 1);
      const journal = (await db.query("select to_jsonb(e) event from rsvp.imported_household_invitation_events e")).rows[0].event;
      assert.equal(Object.hasOwn(journal, "token_hash"), false);
      assert.equal(JSON.stringify(journal).includes(tokenHash), false);
      assert.equal((await db.query("select count(*)::int n from rsvp.audit_events where household_id=$1", [valid.householdId])).rows[0].n, 1);
    });

    await t.test("changed replay, missing mapping, replies, exclusion, token and roster drift fail closed", async () => {
      await assert.rejects(activation({ tokenHash: "b".repeat(64) }), /IMPORTED_ACTIVATION_EVENT_REUSED/);
      await assert.rejects(activation({ event: "66666666-6666-4666-8666-666666666666", external: "77777777-7777-4777-8777-777777777777" }), /IMPORTED_MAPPING_CHANGED/);
      await assert.rejects(activation({ event: "88888888-8888-4888-8888-888888888888", external: replied.externalId, household: replied.householdId, responseVersion: 0 }), /IMPORTED_HOUSEHOLD_INCOMPATIBLE/);
      await assert.rejects(activation({ event: "99999999-9999-4999-8999-999999999999", external: excluded.externalId, household: excluded.householdId }), /IMPORTED_HOUSEHOLD_EXCLUDED/);
      await assert.rejects(activation({ event: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", external: issued.externalId, household: issued.householdId }), /IMPORTED_HOUSEHOLD_INCOMPATIBLE/);
      await assert.rejects(activation({ event: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", external: inconsistent.externalId, household: inconsistent.householdId }), /IMPORTED_ROSTER_INCONSISTENT/);
      assert.equal((await db.query("select count(*)::int n from rsvp.imported_household_invitation_events")).rows[0].n, 1);
      assert.equal((await db.query("select token_hash,status from rsvp.households where id=$1", [replied.householdId])).rows[0].status, "disabled");
      assert.equal((await db.query("select attendance from rsvp.responses where household_id=$1", [replied.householdId])).rows[0].attendance, "yes");
    });

    await t.test("sync can call the function but has no direct write or journal access; RSVP role is denied", async () => {
      await db.exec("begin; set role site_love_sync;");
      try {
        assert.deepEqual(await activation({ event: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", external: syncIssued.externalId,
          household: syncIssued.householdId, tokenHash: "b".repeat(64) }),
          { status: "active", replayed: false });
        assert.equal((await db.query(
          `select rsvp.imported_household_invitation_activation_committed(
            $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as committed`,
          ["cccccccc-cccc-4ccc-8ccc-cccccccccccc", "fictional-admin", ids.source,
            syncIssued.externalId, syncIssued.householdId, 0, "b".repeat(64)]
        )).rows[0].committed, true);
        await db.exec("savepoint deny_direct_write");
        await assert.rejects(db.query("update rsvp.households set status='disabled' where id=$1", [syncIssued.householdId]), /permission denied/);
        await db.exec("rollback to savepoint deny_direct_write");
        await db.exec("savepoint deny_journal_read");
        await assert.rejects(db.query("select * from rsvp.imported_household_invitation_events"), /permission denied/);
        await db.exec("rollback to savepoint deny_journal_read");
      } finally {
        await db.exec("rollback;");
      }
      await db.exec("begin; set role site_love_app;");
      try {
        await db.exec("savepoint deny_function_execution");
        await assert.rejects(activation({ event: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", external: valid.externalId, household: valid.householdId }), /permission denied/);
        await db.exec("rollback to savepoint deny_function_execution");
        await db.exec("savepoint deny_lookup_execution");
        await assert.rejects(db.query(
          `select rsvp.imported_household_invitation_activation_committed(
            $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text)`,
          [ids.event, "fictional-admin", ids.source, valid.externalId, valid.householdId, 0, tokenHash]
        ), /permission denied/);
        await db.exec("rollback to savepoint deny_lookup_execution");
      } finally {
        await db.exec("rollback;");
      }
    });
  } finally {
    await db.close();
  }
});
