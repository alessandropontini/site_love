const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { headers, parseSheet, buildPlan } = require(
  process.env.SYNC_TEST_BUILD + "/model.js"
);

// Optional test-only PostgreSQL WASM harness, installed OUTSIDE the repository.
// No DATABASE_URL or external data is ever used by these tests.
test(
  "PostgreSQL migrations, atomic Apply and RSVP preservation",
  { skip: !process.env.PGLITE_TEST_MODULE },
  async (t) => {
    const { PGlite } = require(process.env.PGLITE_TEST_MODULE);
    const db = new PGlite();
    await db.exec("create role site_love_sync;");
    try {
      for (const file of (await fs.readdir("db/migrations"))
        .filter((f) => f.endsWith(".sql"))
        .sort()) {
        let sql = await fs.readFile(path.join("db/migrations", file), "utf8");
        // gen_random_uuid is built into modern PostgreSQL. PGlite lacks pgcrypto;
        // only its extension installation line is omitted, never application SQL.
        sql = sql.replace("create extension if not exists pgcrypto;", "");
        await db.exec(sql);
      }
      const id = randomUUID(),
        plusId = randomUUID();
      const make = (name = "Fictional Rowan", owner = "Ale") => [
        headers,
        headers.map(
          (h) =>
            ({
              "Guest name": name,
              "Guest type": "Adult",
              Group: "Fiction",
              "List owner": owner,
              "Party / family": "Fictional Household",
              "Planning status": "On list",
              Priority: "Unassigned",
              "Sync UUID": id
            })[h] ?? ""
        )
      ];
      const snapshot = async () =>
        (
          await db.query(
            "select s as data, md5(s::text) as hash from (select rsvp.guest_sync_snapshot() s) q"
          )
        ).rows[0];
      const prepare = async (values) => {
        const s = await snapshot();
        return { plan: buildPlan(parseSheet(values), s.data), hash: s.hash };
      };
      const execute = async (p, batch = randomUUID()) =>
        (
          await db.query(
            "select rsvp.apply_guest_sync($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8) status",
            [
              batch,
              "fictional-admin",
              "fictional-source",
              p.hash,
              JSON.stringify(p.plan.changes),
              JSON.stringify(p.plan.counts),
              1,
              p.plan.contractVersion ?? 2
            ]
          )
        ).rows[0].status;
      await t.test(
        "first import stores one disabled household without token",
        async () => {
          const p = await prepare(make());
          assert.equal(p.plan.errors.length, 0);
          assert.equal(await execute(p), "SUCCESS");
          const h = (await db.query("select * from rsvp.households")).rows[0];
          assert.equal(h.status, "disabled");
          assert.equal(h.token_hash, null);
          assert.equal(h.response_version, 0);
        }
      );
      await t.test(
        "unchanged import and replay do not duplicate records",
        async () => {
          const p = await prepare(make());
          assert.equal(p.plan.counts.unchanged, 1);
          const batch = randomUUID();
          assert.equal(await execute(p, batch), "SUCCESS");
          assert.equal(await execute(p, batch), "SUCCESS");
          assert.equal((await snapshot()).data.inviteeCount, 1);
        }
      );
      await t.test("name update and owner update preserve UUIDs", async () => {
        const before = (await db.query("select * from rsvp.invitees")).rows[0];
        const p = await prepare(make("Fictional Rowan Updated", "Bridget"));
        assert.equal(await execute(p), "SUCCESS");
        const after = (await db.query("select * from rsvp.invitees")).rows[0];
        assert.equal(after.id, before.id);
        assert.equal(after.household_id, before.household_id);
        assert.equal(after.display_name, "Fictional Rowan Updated");
        assert.equal(
          (await db.query("select invited_by from rsvp.households")).rows[0]
            .invited_by,
          "bride"
        );
      });
      await t.test("surname JSONB and display changes preserve IDs without a new migration", async () => {
        const before = (await db.query("select * from rsvp.invitees")).rows[0];
        // Exercise a real pre-extension mapping, with the new keys absent.
        await db.exec("update rsvp.guest_sync_members set data=data - 'sourceName' - 'surname'");
        const legacy = await prepare(make("Fictional Rowan Updated", "Bridget"));
        assert.equal(legacy.plan.counts.unchanged, 1);
        const values = make("Fictional Rowan Updated", "Bridget").map(r => [...r]);
        values[0].push("Surname");
        values[1].push("Example");
        const p = await prepare(values);
        assert.equal(p.plan.errors.length, 0);
        assert.equal(await execute(p), "SUCCESS");
        const after = (await db.query("select * from rsvp.invitees")).rows[0];
        assert.equal(after.id, before.id);
        assert.equal(after.household_id, before.household_id);
        assert.equal(after.display_name, "Fictional Rowan Updated Example");
        const member = (await db.query("select * from rsvp.guest_sync_members")).rows[0];
        assert.equal(member.external_id, id);
        assert.equal(member.data.surname, "Example");
        assert.equal(member.data.sourceName, "Fictional Rowan Updated");
        assert.equal((await prepare(values)).plan.counts.unchanged, 1);
        // Restore the fictional baseline used by the remaining integration cases.
        assert.equal(await execute(await prepare(make("Fictional Rowan Updated", "Bridget"))), "SUCCESS");
      });
      await t.test("Guest name correction round-trips through SQL with stable IDs", async () => {
        const before = (await db.query("select * from rsvp.invitees")).rows[0];
        const values = make("Robin", "Bridget").map(r => [...r]);
        values[0].push("Surname");
        values[1].push("Example");
        const p = await prepare(values);
        assert.deepEqual(p.plan.errors, []);
        assert.equal(await execute(p), "SUCCESS");
        const after = (await db.query("select * from rsvp.invitees")).rows[0];
        assert.equal(after.id, before.id);
        assert.equal(after.household_id, before.household_id);
        assert.equal(after.display_name, "Robin Example");
        const member = (await db.query("select * from rsvp.guest_sync_members")).rows[0];
        assert.equal(member.external_id, id);
        assert.equal(member.data.surname, "Example");
        assert.equal(member.data.sourceName, "Robin");
        assert.equal((await prepare(values)).plan.counts.unchanged, 1);
        assert.equal(await execute(await prepare(make("Fictional Rowan Updated", "Bridget"))), "SUCCESS");
      });
      await t.test(
        "new companion place enables permission without named invitee",
        async () => {
          const values = make("Fictional Rowan Updated", "Bridget");
          values.push([...values[1]]);
          values[2][headers.indexOf("Guest name")] =
            "Plus-one of Fictional Rowan";
          values[2][headers.indexOf("Sync UUID")] = plusId;
          const p = await prepare(values);
          assert.equal(p.plan.errors.length, 0);
          assert.equal(await execute(p), "SUCCESS");
          assert.equal((await snapshot()).data.inviteeCount, 1);
          assert.equal(
            (await db.query("select allow_plus_one from rsvp.households"))
              .rows[0].allow_plus_one,
            true
          );
        }
      );
      await t.test("missing row preserved in database", async () => {
        const p = await prepare(make("Fictional Rowan Updated", "Bridget"));
        assert.equal(p.plan.counts.missing, 1);
        assert.equal(await execute(p), "SUCCESS");
        assert.equal(
          (await db.query("select count(*) n from rsvp.guest_sync_members"))
            .rows[0].n,
          2
        );
      });
      await t.test("stale database snapshot rejected atomically", async () => {
        const a = await prepare(make("Fictional Rowan Updated", "Bridget"));
        const b = await prepare(make("Fictional Rowan Updated", "Bridget"));
        await db
          .query("update rsvp.households set status=$1", ["closed"])
          .catch(() => {}); // unissued constraint rejects this invalid mutation
        await db.query("update rsvp.households set preferred_locale=$1", [
          "en"
        ]);
        // The fingerprint intentionally tracks planning and response fields, not locale.
        await db.query("update rsvp.households set invited_by=$1", ["both"]);
        assert.equal(await execute(a), "CONFLICT");
        assert.equal(await execute(b), "CONFLICT");
        await db.query("update rsvp.households set invited_by=$1", ["bride"]);
      });
      await t.test(
        "mid-batch invalid mutation rolls back earlier writes",
        async () => {
          const s = await snapshot();
          const newId = randomUUID();
          const g = {
            externalId: newId,
            name: "Fictional Delta",
            kind: "named",
            party: "Fictional Other Household",
            owner: "groom",
            group: "Test",
            planning: "On list",
            priority: "Unassigned",
            table: ""
          };
          const changes = [
            { operation: "INSERT", next: g, householdId: null, errors: [] },
            {
              operation: "INSERT",
              next: { ...g, name: "Duplicate" },
              householdId: null,
              errors: []
            }
          ];
          await assert.rejects(
            execute({
              hash: s.hash,
              plan: {
                changes,
                counts: { created: 2, updated: 0, unchanged: 0, missing: 0 }
              }
            })
          );
          assert.equal(
            (await db.query("select count(*) n from rsvp.households")).rows[0]
              .n,
            1
          );
          assert.equal(
            (
              await db.query(
                "select count(*) n from rsvp.guest_sync_members where external_id=$1",
                [newId]
              )
            ).rows[0].n,
            0
          );
        }
      );
      await t.test(
        "RSVP response fields, hashes, relationships and audit remain byte-for-byte equal",
        async () => {
          const h = (await db.query("select id from rsvp.households")).rows[0]
            .id;
          const i = (await db.query("select id from rsvp.invitees")).rows[0].id;
          await db.query(
            "update rsvp.households set token_hash=$1,status='active',response_version=3,contact_email='fictional@example.invalid',deadline='2030-01-01',has_children=true,updated_at='2026-01-01' where id=$2",
            ["a".repeat(64), h]
          );
          await db.query(
            "insert into rsvp.responses(household_id,invitee_id,attendance,meal_preference,updated_at) values($1,$2,'yes',null,'2026-01-01')",
            [h, i]
          );
          await db.query(
            "insert into rsvp.audit_events(household_id,event_type,metadata) values($1,'response_updated','{\"revision\":3}')",
            [h]
          );
          const protectedState = async () =>
            JSON.stringify(
              await Promise.all(
                [
                  "households",
                  "invitees",
                  "responses",
                  "additional_guests",
                  "audit_events"
                ].map((table) =>
                  db.query(`select * from rsvp.${table} order by 1`)
                )
              )
            );
          const before = await protectedState();
          const p = await prepare(make("Fictional Rowan Updated", "Bridget"));
          assert.equal(p.plan.errors.length, 0);
          assert.equal(await execute(p), "SUCCESS");
          assert.equal(await protectedState(), before);
          const changedValues = make("Fictional Rowan Updated", "Bridget").map(r => [...r]);
          changedValues[0].push("Surname");
          changedValues[1].push("Example");
          const changed = await prepare(changedValues);
          assert(changed.plan.errors.length);
          await assert.rejects(execute(changed));
          assert.equal(await protectedState(), before);
          // Defense in depth: even a forged plan that hides TS validation errors is rejected.
          changed.plan.changes.forEach((c) => (c.errors = []));
          await assert.rejects(execute(changed));
          assert.equal(await protectedState(), before);
        }
      );
      await t.test(
        "public cannot execute privileged functions; restricted sync role cannot edit responses",
        async () => {
          await db.exec(
            "create role fictional_runtime; grant usage on schema rsvp to fictional_runtime; set role fictional_runtime;"
          );
          await assert.rejects(db.query("select rsvp.guest_sync_snapshot()"));
          await db.exec(
            "reset role; grant execute on function rsvp.guest_sync_snapshot() to fictional_runtime; set role fictional_runtime;"
          );
          assert(
            (await db.query("select rsvp.guest_sync_snapshot()")).rows.length
          );
          await assert.rejects(
            db.query("update rsvp.responses set attendance='no'")
          );
          await db.exec("reset role;");
        }
      );
      await t.test("actual sync role executes restricted functions but cannot edit replies", async () => {
      const p = await prepare(make("Fictional Rowan Updated", "Bridget"));
      await db.exec("set role site_love_sync;");
      try {
        assert((await snapshot()).data.inviteeCount === 1);
        assert.equal(await execute(p), "SUCCESS");
        await assert.rejects(db.query("update rsvp.responses set attendance='no'"));
        await assert.rejects(db.query("update rsvp.households set contact_email='bad@example.invalid'"));
      } finally { await db.exec("reset role;"); }
    });
  } finally {
      await db.close();
    }
  }
);
