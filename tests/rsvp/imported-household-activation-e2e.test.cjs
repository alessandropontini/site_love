const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

const build = process.env.SYNC_TEST_BUILD;
const { createImportedHouseholdActivationAdminActions } = require(
  path.join(build, "rsvp/imported-household-activation-admin-actions.js")
);
const { hashRsvpToken } = require(path.join(build, "rsvp/token.js"));
const { householdHeaders, householdGuestHeaders } = require(
  path.join(build, "guest-sync/model.js")
);

const ids = {
  source: "fictional-e2e-source",
  externalHousehold: "11111111-1111-4111-8111-111111111111",
  household: "22222222-2222-4222-8222-222222222222",
  guest: "33333333-3333-4333-8333-333333333333",
  invitee: "44444444-4444-4444-8444-444444444444"
};

function sourceFixture() {
  const guestValues = {
    "Guest name": "Fictional E2E Guest", "Guest type": "Adult", Group: "Fictional group",
    "List owner": "Ale", "Party / family": "Fictional E2E household", "Planning status": "On list",
    Invitation: "", RSVP: "", Priority: "Normal", Table: "", "Dietary requirements": "",
    Notes: "", "Sync UUID": ids.guest, "Household UUID": ids.externalHousehold, "Host Sync UUID": ""
  };
  const householdValues = {
    "Household UUID": ids.externalHousehold, "Party / family": "Fictional E2E household",
    "List owner": "Ale", "Contact guest UUID": ids.guest, "Contact email": "fictional@example.invalid",
    "Contact phone": "", Language: "en"
  };
  return {
    guestList: [householdGuestHeaders, householdGuestHeaders.map((header) => guestValues[header] ?? "")],
    households: [householdHeaders, householdHeaders.map((header) => householdValues[header] ?? "")]
  };
}

async function seedDatabase(db) {
  const migrationNames = (await fs.readdir("db/migrations"))
    .filter((name) => name.endsWith(".sql")).sort();
  for (const name of migrationNames) {
    const sql = (await fs.readFile(path.join("db/migrations", name), "utf8"))
      .replace("create extension if not exists pgcrypto;", "");
    await db.exec(sql);
  }

  await db.query("insert into rsvp.guest_sync_sources(source_id,mode) values($1,'household_uuid')", [ids.source]);
  await db.query(
    `insert into rsvp.households(id,display_name,token_hash,status,invited_by,preferred_locale,
      response_version,allow_plus_one)
     values($1,'Fictional E2E household',null,'disabled','groom','en',0,false)`,
    [ids.household]
  );
  await db.query("insert into rsvp.invitees(id,household_id,display_name) values($1,$2,$3)",
    [ids.invitee, ids.household, "Fictional E2E Guest"]);
  await db.query(
    `insert into rsvp.guest_sync_households(source_id,external_household_id,household_id)
     values($1,$2,$3)`, [ids.source, ids.externalHousehold, ids.household]
  );
  await db.query(
    `insert into rsvp.guest_sync_members(external_id,source_id,household_id,
      external_household_id,invitee_id,data)
     values($1,$2,$3,$4,$5,$6::jsonb)`,
    [ids.guest, ids.source, ids.household, ids.externalHousehold, ids.invitee,
      JSON.stringify({ externalId: ids.guest, kind: "named", name: "Fictional E2E Guest",
        party: "Fictional E2E household", owner: "groom" })]
  );
  await db.query(
    "insert into rsvp.audit_events(household_id,event_type,metadata) values($1,'fictional_prior_event',$2::jsonb)",
    [ids.household, JSON.stringify({ fixture: true, sequence: 1 })]
  );
}

async function readSnapshot(db) {
  const [sourceModes, householdMappings, exclusions, households, members, inviteeCount] = await Promise.all([
    db.query("select source_id as \"sourceId\",mode from rsvp.guest_sync_sources"),
    db.query("select source_id as \"sourceId\",external_household_id as \"externalHouseholdId\",household_id as \"householdId\" from rsvp.guest_sync_households"),
    db.query("select household_id as \"householdId\",active,revision from rsvp.guest_sync_exclusions where revision > 0"),
    db.query(
      `select h.id,h.display_name as name,h.invited_by as owner,h.allow_plus_one as \"plusOne\",
        (h.token_hash is not null) as issued,
        (h.response_version > 0 or exists(select 1 from rsvp.responses r where r.household_id=h.id)
          or exists(select 1 from rsvp.additional_guests a where a.household_id=h.id)) as responded,
        h.response_version as version,h.status,
        (select count(*)::int from rsvp.invitees i where i.household_id=h.id) as \"namedCount\"
       from rsvp.households h`
    ),
    db.query(
      `select m.external_id as \"externalId\",m.household_id as \"householdId\",
        m.external_household_id as \"externalHouseholdId\",m.invitee_id as \"inviteeId\",
        m.data,i.display_name as \"actualName\"
       from rsvp.guest_sync_members m left join rsvp.invitees i on i.id=m.invitee_id`
    ),
    db.query("select count(*)::int as count from rsvp.invitees")
  ]);
  return {
    contractVersion: 3,
    sourceModes: sourceModes.rows,
    householdMappings: householdMappings.rows,
    exclusions: exclusions.rows,
    households: households.rows,
    members: members.rows,
    inviteeCount: inviteeCount.rows[0].count,
    sources: [ids.source]
  };
}

async function asSyncRole(db, query, values) {
  await db.exec("begin; set local role site_love_sync;");
  try {
    const result = await db.query(query, values);
    await db.exec("commit;");
    return result.rows[0];
  } catch (error) {
    await db.exec("rollback;");
    throw error;
  }
}

test("sandbox E2E: synthetic admin prepares and confirms against migrated PGlite state", {
  skip: !process.env.PGLITE_TEST_MODULE
}, async (t) => {
  const { PGlite } = require(process.env.PGLITE_TEST_MODULE);
  const db = new PGlite();
  const source = sourceFixture();
  const calls = { authorize: 0, readSheets: 0, snapshot: 0, committed: 0, activate: 0 };
  process.env.GUEST_SYNC_SIGNING_SECRET = "fictional-sandbox-signing-secret-long-enough";

  try {
    await db.exec("create role site_love_sync; create role site_love_app;");
    await seedDatabase(db);
    const activationParameters = (receipt) => [receipt.id, receipt.actor, receipt.source,
      receipt.externalHouseholdId, receipt.householdId, 0, receipt.tokenHash];
    const actions = createImportedHouseholdActivationAdminActions({
      authorize: async () => {
        calls.authorize += 1;
        return { actorId: "fictional-clerk-admin" };
      },
      sourceId: () => ids.source,
      readSheets: async () => {
        calls.readSheets += 1;
        return source;
      },
      snapshot: async () => {
        calls.snapshot += 1;
        return { data: await readSnapshot(db), hash: "fictional-database-snapshot" };
      },
      committed: async (receipt) => {
        calls.committed += 1;
        const row = await asSyncRole(db,
          `select rsvp.imported_household_invitation_activation_committed(
            $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as committed`,
          activationParameters(receipt));
        return row.committed;
      },
      activate: async (receipt) => {
        calls.activate += 1;
        const row = await asSyncRole(db,
          `select rsvp.activate_imported_household_invitation(
            $1::uuid,$2::text,$3::text,$4::uuid,$5::uuid,$6::integer,$7::text) as result`,
          activationParameters(receipt));
        return row.result;
      },
      now: () => 1_000_000
    });

    await t.test("explicit prepare/confirm stores only the token hash and preserves identities/history", async () => {
      const before = (await db.query(
        `select h.id household_id,i.id invitee_id,m.external_id,m.external_household_id,
          m.invitee_id mapped_invitee,m.data,
          (select count(*)::int from rsvp.audit_events a where a.household_id=h.id) audit_count
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.guest_sync_members m on m.household_id=h.id where h.id=$1`, [ids.household]
      )).rows[0];

      const prepared = await actions.prepare({ externalHouseholdId: ids.externalHousehold });
      assert.equal(prepared.ok, true);
      assert.equal(prepared.preparation.household.householdId, ids.household);
      assert.match(prepared.preparation.token, /^[A-Za-z0-9_-]{43}$/);
      assert.equal(prepared.preparation.receipt.includes(prepared.preparation.token), false);
      assert.equal(calls.activate, 0, "preparation must be read-only");

      const confirmed = await actions.confirm({ receipt: prepared.preparation.receipt, confirmed: true });
      assert.deepEqual(confirmed, { ok: true, result: { status: "active", replayed: false } });
      const household = (await db.query(
        "select id,token_hash,status from rsvp.households where id=$1", [ids.household]
      )).rows[0];
      assert.equal(household.id, ids.household);
      assert.equal(household.status, "active");
      assert.equal(household.token_hash, hashRsvpToken(prepared.preparation.token));

      const after = (await db.query(
        `select h.id household_id,i.id invitee_id,m.external_id,m.external_household_id,
          m.invitee_id mapped_invitee,m.data,
          (select count(*)::int from rsvp.audit_events a where a.household_id=h.id) audit_count
         from rsvp.households h join rsvp.invitees i on i.household_id=h.id
         join rsvp.guest_sync_members m on m.household_id=h.id where h.id=$1`, [ids.household]
      )).rows[0];
      assert.deepEqual(after, before);
      const journal = (await db.query(
        "select to_jsonb(e) as event from rsvp.imported_household_invitation_events e"
      )).rows[0].event;
      assert.equal(Object.hasOwn(journal, "token_hash"), false);
      assert.equal(JSON.stringify(journal).includes(prepared.preparation.token), false);
      assert.equal(JSON.stringify(journal).includes(hashRsvpToken(prepared.preparation.token)), false);

      const replay = await actions.confirm({ receipt: prepared.preparation.receipt, confirmed: true });
      assert.deepEqual(replay, { ok: true, result: { status: "active", replayed: true } });
      assert.equal((await db.query(
        "select count(*)::int as count from rsvp.imported_household_invitation_events"
      )).rows[0].count, 1);
      assert.equal(calls.activate, 1, "replay must not execute the activation twice");
    });

    await t.test("unauthorized synthetic actor is rejected before Sheets or database reads", async () => {
      const counts = { readSheets: calls.readSheets, snapshot: calls.snapshot };
      const blocked = createImportedHouseholdActivationAdminActions({
        authorize: async () => { calls.authorize += 1; throw new Error("NOT_ALLOWED"); },
        sourceId: () => { throw new Error("source must not be read"); },
        readSheets: async () => { calls.readSheets += 1; return source; },
        snapshot: async () => { calls.snapshot += 1; return { data: {}, hash: "" }; },
        committed: async () => false,
        activate: async () => ({ status: "active", replayed: false })
      });
      await assert.rejects(
        blocked.prepare({ externalHouseholdId: ids.externalHousehold }), /NOT_ALLOWED/
      );
      assert.deepEqual({ readSheets: calls.readSheets, snapshot: calls.snapshot }, counts);
    });
  } finally {
    await db.close();
  }
});
