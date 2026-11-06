const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { headers, parseSheet, buildPlan, hash } = require(
  process.env.SYNC_TEST_BUILD + "/model.js"
);
const { preview, apply, cancel } = require(
  process.env.SYNC_TEST_BUILD + "/workflow.js"
);
const { verifyReceipt, signReceipt } = require(
  process.env.SYNC_TEST_BUILD + "/receipt.js"
);
process.env.GUEST_SYNC_SIGNING_SECRET =
  "fictional-test-secret-never-use-in-production";
const id = "11111111-1111-4111-8111-111111111111";
const extraId = "22222222-2222-4222-8222-222222222222";
const hid = "33333333-3333-4333-8333-333333333333";
function row(overrides = {}) {
  const values = {
    "Guest name": "Fictional Rowan",
    "Guest type": "Adult",
    Group: "Test",
    "List owner": "Ale",
    "Party / family": "Fictional Household",
    "Planning status": "On list",
    Invitation: "Not sent",
    RSVP: "Not requested",
    Priority: "Unassigned",
    Table: "",
    Notes: "sensitive ignored",
    "Dietary requirements": "sensitive ignored",
    "Sync UUID": id,
    ...overrides
  };
  return headers.map((h) => values[h]);
}
const sheet = (...rows) => [headers, ...(rows.length ? rows : [row()])];
const blank = () => ({
  contractVersion: 3, households: [],
  members: [],
  inviteeCount: 0,
  sources: []
});
function imported(values = sheet()) {
  const guests = parseSheet(values).guests;
  return {
    contractVersion: 3, households: [
      {
        id: hid,
        name: "Fictional Household",
        owner: "groom",
        plusOne: guests.some((g) => g.kind === "plus_one"),
        issued: false,
        responded: false,
        version: 0,
        status: "disabled"
      }
    ],
    members: guests.map((g) => ({
      externalId: g.externalId,
      householdId: hid,
      inviteeId: g.kind === "named" ? randomUUID() : null,
      data: g,
      actualName: g.name
    })),
    inviteeCount: guests.filter((g) => g.kind === "named").length,
    sources: ["fictional-source"]
  };
}
const plan = (values, db = blank()) => buildPlan(parseSheet(values), db);
test("first import; no free-text or child identifiers in plan", () => {
  const p = plan(
    sheet(
      row(),
      row({
        "Sync UUID": extraId,
        "Guest type": "Child",
        "Guest name": "Private child name"
      })
    )
  );
  assert.equal(p.counts.created, 2);
  assert.equal(p.errors.length, 0);
  assert(!JSON.stringify(p).includes("sensitive"));
  assert(!JSON.stringify(p).includes("Private child name"));
});
test("provisional guests are skipped without blocking import", () => {
  const completeGuest = row();

  const provisionalGuest = row({
    "Guest name": "Fictional Pending Guest",
    "Guest type": "",
    Group: "",
    "List owner": "",
    "Party / family": "",
    "Planning status": "",
    Invitation: "",
    RSVP: "",
    Priority: "",
    Table: "",
    "Dietary requirements": "",
    Notes: "",
    "Sync UUID": ""
  });

  const result = parseSheet(
    sheet(completeGuest, provisionalGuest)
  );

  assert.equal(result.guests.length, 1);
  assert.deepEqual(result.skippedRows, [3]);
  assert.equal(result.errors.length, 0);
  assert.equal(result.sourceCount, 1);
});
test("incomplete identified guests must not be silently skipped", () => {
  const incompleteGuest = row({
    "Guest name": "Fictional Existing Guest",
    "Guest type": "",
    Group: "",
    "List owner": "",
    "Party / family": "",
    "Planning status": "",
    Invitation: "",
    RSVP: "",
    Priority: "",
    Table: "",
    "Dietary requirements": "",
    Notes: "",
    "Sync UUID": extraId
  });

  const result = parseSheet(sheet(incompleteGuest));

  // La riga non deve essere esclusa silenziosamente.
  assert.deepEqual(result.skippedRows, []);

  // I dati incompleti devono generare un errore.
  assert(result.errors.length > 0);
});
test("second import unchanged", () =>
  assert.equal(plan(sheet(), imported()).counts.unchanged, 1));
test("new named guest in unissued household", () =>
  assert.equal(
    plan(
      sheet(
        row(),
        row({ "Sync UUID": extraId, "Guest name": "Fictional Morgan" })
      ),
      imported()
    ).counts.created,
    1
  ));
test("name change preserves external identity", () => {
  const p = plan(
    sheet(row({ "Guest name": "Fictional Rowan Updated" })),
    imported()
  );
  assert.equal(p.counts.updated, 1);
  assert.equal(p.changes[0].householdId, hid);
  assert.equal(p.errors.length, 0);
});
test("owner mapping and household consistency", () => {
  assert.equal(
    plan(sheet(row({ "List owner": "Bridget" })), imported()).changes[0].next
      .owner,
    "bride"
  );
  assert.equal(
    plan(sheet(row({ "List owner": "Both" }))).changes[0].next.owner,
    "both"
  );
  assert(
    plan(
      sheet(
        row(),
        row({
          "Sync UUID": extraId,
          "Guest name": "Fictional Morgan",
          "List owner": "Bridget"
        })
      )
    ).errors.length
  );
});
test("one unnamed companion; named couple never gains another plus-one", () => {
  const plus = row({
    "Sync UUID": extraId,
    "Guest name": "Plus-one of Fictional Rowan"
  });
  assert.equal(plan(sheet(row(), plus)).errors.length, 0);
  assert(
    plan(
      sheet(
        row(),
        plus,
        row({ "Sync UUID": randomUUID(), "Guest name": "Fictional Morgan" })
      )
    ).errors.length
  );
});
test("household move conflicts", () =>
  assert(
    plan(
      sheet(row({ "Party / family": "Another Fictional Household" })),
      imported()
    ).errors.some((e) => e.includes("reconciliation"))
  ));
test("missing source retained; missing member blocks other changes", () => {
  const values = sheet(
    row(),
    row({ "Sync UUID": extraId, "Guest name": "Fictional Morgan" })
  );
  const p = plan(sheet(), imported(values));
  assert.equal(p.counts.missing, 1);
  assert.equal(p.counts.updated, 0);
  assert(
    plan(sheet(row({ "List owner": "Bridget" })), imported(values)).errors
      .length
  );
});
test("duplicate UUID, incomplete row and missing stable identity are critical", () => {
  assert(plan(sheet(row(), row())).errors.length);
  assert(plan(sheet(row({ "List owner": "" }))).errors.length);
  assert(plan(sheet(row({ "Sync UUID": "" }))).errors.length);
});
test("responded household changes blocked; unchanged allowed", () => {
  const db = imported();
  db.households[0].responded = true;
  db.households[0].version = 2;
  assert(
    plan(sheet(row({ "Guest name": "Renamed Fictional Guest" })), db).errors
      .length
  );
  assert.equal(plan(sheet(), db).errors.length, 0);
});
test("issued household roster change blocked", () => {
  const db = imported();
  db.households[0].issued = true;
  assert(
    plan(sheet(row({ "Guest name": "Renamed Fictional Guest" })), db).errors
      .length
  );
});
test("row sorting does not alter identities or create differences", () => {
  const rows = [
    row(),
    row({ "Sync UUID": extraId, "Guest name": "Fictional Morgan" })
  ];
  const p = plan(sheet(...rows.toReversed()), imported(sheet(...rows)));
  assert.equal(p.counts.unchanged, 2);
  assert.equal(p.errors.length, 0);
});
test("lost UUID is blocked rather than duplicated", () =>
  assert(plan(sheet(row({ "Sync UUID": extraId })), imported()).errors.length));
test("legacy database requires explicit reconciliation", () => {
  const db = imported();
  db.members = [];
  assert(plan(sheet(), db).errors.length);
});
test("unknown plus one spelling and empty source fail closed", () => {
  assert(
    plan(sheet(row({ "Guest name": "Fictional Plus One" }))).errors.length
  );
  assert(plan([headers]).errors.length);
});
function fake() {
  let values = sheet();
  let data = blank();
  const runs = new Map();
  let writes = 0;
  const deps = {
    sourceId: () => "fictional-source",
    readSheet: async () => values,
    snapshot: async () => ({ data, hash: hash(data).slice(0, 32) }),
    getRun: async (r) => runs.get(r.id),
    recordRun: async (r, status) => {
      if (!runs.has(r.id)) runs.set(r.id, status);
    },
    applyPlan: async (r) => {
      if (runs.has(r.id)) return runs.get(r.id);
      if (hash(data).slice(0, 32) !== r.dbHash) {
        runs.set(r.id, "CONFLICT");
        return "CONFLICT";
      }
      writes++;
      data = imported(values);
      runs.set(r.id, "SUCCESS");
      return "SUCCESS";
    }
  };
  return {
    deps,
    runs,
    setValues: (v) => {
      values = v;
    },
    getWrites: () => writes
  };
}
test("preview read-only and repeated Apply idempotent", async () => {
  const f = fake();
  const p = await preview("admin", f.deps);
  assert.equal(f.runs.size, 0);
  assert.equal(await apply(p.receipt, "admin", f.deps), "SUCCESS");
  assert.equal(await apply(p.receipt, "admin", f.deps), "SUCCESS");
  assert.equal(f.getWrites(), 1);
});
test("Google outage and database outage never report success", async () => {
  const f = fake();
  f.deps.readSheet = async () => {
    throw Error("offline");
  };
  await assert.rejects(preview("admin", f.deps));
  const g = fake();
  const p = await preview("admin", g.deps);
  g.deps.applyPlan = async () => {
    throw Error("offline");
  };
  g.deps.getRun = async () => {
    throw Error("offline");
  };
  await assert.rejects(apply(p.receipt, "admin", g.deps));
  assert.equal(g.getWrites(), 0);
});
test("two administrators: second stale batch rejected", async () => {
  const f = fake();
  const a = await preview("a", f.deps);
  const b = await preview("b", f.deps);
  const results = await Promise.all([
    apply(a.receipt, "a", f.deps),
    apply(b.receipt, "b", f.deps)
  ]);
  assert.deepEqual(results.sort(), ["CONFLICT", "SUCCESS"]);
  assert.equal(f.getWrites(), 1);
});
test("source modification after preview forces fresh preview", async () => {
  const f = fake();
  const p = await preview("admin", f.deps);
  f.setValues(sheet(row({ "Guest name": "New Fictional Name" })));
  assert.equal(await apply(p.receipt, "admin", f.deps), "CONFLICT");
  assert.equal(f.getWrites(), 0);
});
test("partial identifier assignment cannot import; later completed IDs can", async () => {
  const f = fake();
  f.setValues(sheet(row({ "Sync UUID": "" })));
  const p = await preview("admin", f.deps);
  assert(p.plan.errors.length);
  assert.equal(await apply(p.receipt, "admin", f.deps), "CONFLICT");
  f.setValues(sheet());
  const next = await preview("admin", f.deps);
  assert.equal(await apply(next.receipt, "admin", f.deps), "SUCCESS");
});
test("cancelled batch cannot be applied", async () => {
  const f = fake();
  const p = await preview("admin", f.deps);
  assert.equal(await cancel(p.receipt, "admin", f.deps), "CANCELLED");
  assert.equal(await apply(p.receipt, "admin", f.deps), "CANCELLED");
  assert.equal(f.getWrites(), 0);
});
test("receipt binds actor, expiry and integrity", async () => {
  const f = fake();
  const p = await preview("admin", f.deps);
  await assert.rejects(apply(p.receipt, "other", f.deps));
  await assert.rejects(apply(p.receipt + "x", "admin", f.deps));
  const receipt = verifyReceipt(p.receipt, "admin");
  receipt.expires = 0;
  assert.equal(await apply(signReceipt(receipt), "admin", f.deps), "CONFLICT");
});
test("lost success response recovered from persistent batch record", async () => {
  const f = fake();
  const original = f.deps.applyPlan;
  f.deps.applyPlan = async (...args) => {
    await original(...args);
    throw Error("response lost");
  };
  const p = await preview("admin", f.deps);
  assert.equal(await apply(p.receipt, "admin", f.deps), "SUCCESS");
  assert.equal(f.getWrites(), 1);
});
test("JSONB key ordering does not create an update", () => {
  const db = imported();
  db.members[0].data = Object.fromEntries(
    Object.entries(db.members[0].data).reverse()
  );
  assert.equal(plan(sheet(), db).counts.unchanged, 1);
});
test("manual database owner and roster drift block unrelated source updates", () => {
  const db = imported();
  db.households[0].owner = "bride";
  assert(
    plan(sheet(row({ Table: "2" })), db).errors.some((e) =>
      e.includes("List owner")
    )
  );
  db.households[0].owner = "groom";
  db.households[0].namedCount = 2;
  assert(plan(sheet(), db).errors.some((e) => e.includes("roster")));
});
test("same receipt race returns committed success rather than false conflict", async () => {
  const f = fake();
  const p = await preview("admin", f.deps);
  const read = f.deps.readSheet;
  f.deps.readSheet = async () => {
    f.runs.set(verifyReceipt(p.receipt, "admin").id, "SUCCESS");
    return sheet(row({ "Guest name": "Changed after concurrent commit" }));
  };
  assert.equal(await apply(p.receipt, "admin", f.deps), "SUCCESS");
  f.deps.readSheet = read;
});
test("owner change and new companion can be applied in one unissued household batch", () => {
  const p = plan(
    sheet(
      row({ "List owner": "Bridget" }),
      row({
        "Sync UUID": extraId,
        "Guest name": "Plus-one of Fictional Rowan",
        "List owner": "Bridget"
      })
    ),
    imported()
  );
  assert.equal(p.errors.length, 0);
  assert.equal(p.counts.updated, 1);
  assert.equal(p.counts.created, 1);
});
