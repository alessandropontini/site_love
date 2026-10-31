const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");

const headers = [
  "Guest name", "Guest type", "Group", "List owner",
  "Party / family", "Planning status", "Priority"
];

function guest(name, overrides = {}) {
  const data = {
    "Guest name": name,
    "Guest type": "Adult",
    Group: "Test",
    "List owner": "Ale",
    "Party / family": "Fictional Household",
    "Planning status": "On list",
    Priority: "Unassigned",
    ...overrides
  };
  return headers.map(h => data[h] ?? "");
}

function setup(rows) {
  // Isolate the header row so tests never mutate shared headers.
  rows[0] = [...rows[0]];
  let writes = 0,
    fail = false,
    unlocks = 0;
  const sheet = {
    getDataRange: () => ({ getValues: () => rows.map((r) => [...r]) }),
    getMaxColumns: () => 26,
    insertColumnAfter: () => {},
    hideColumns: () => {},
    getRange: (r, c, n) => ({
      setValues: (values) => {
        writes++;
        for (let i = 0; i < values.length; i++) {
          rows[r - 1 + i] ??= [];
          rows[r - 1 + i][c - 1] = values[i][0];
          if (fail && i === 1) {
            fail = false;
            throw Error("write acknowledgement lost");
          }
        }
      },
      getValues: () => rows.slice(r - 1, r - 1 + n).map((row) => [row[c - 1]])
    })
  };
  const ui = {
    Button: { OK: "ok" },
    ButtonSet: { OK_CANCEL: "ok_cancel" },
    alert: () => "ok"
  };
  const context = {
    SpreadsheetApp: {
      getUi: () => ui,
      getActive: () => ({ getSheetByName: () => sheet }),
      flush: () => {}
    },
    LockService: {
      getDocumentLock: () => ({
        waitLock: () => {},
        releaseLock: () => {
          unlocks++;
        }
      })
    },
    Utilities: { getUuid: randomUUID },
    Set,
    JSON,
    Error,
    String
  };
  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync("scripts/guest-sync-identifiers.gs", "utf8"),
    context
  );
  return {
    run: () => context.assignMissingGuestIds(),
    failNext: () => {
      fail = true;
    },
    writes: () => writes,
    unlocks: () => unlocks
  };
}
test("identifier partial write recovery preserves persisted identities", () => {
  const rows = [headers, guest("Fictional Rowan"), guest("Fictional Morgan")];
  const s = setup(rows);
  s.failNext();
  assert.throws(s.run);
  const persisted = rows[1][headers.length];
  assert(persisted);
  s.run();
  assert.equal(rows[1][headers.length], persisted);
  assert.notEqual(rows[2][headers.length], persisted);
  const ids = JSON.stringify(rows);
  s.run();
  assert.equal(JSON.stringify(rows), ids);
  assert.equal(s.unlocks(), 3);
});
test("identifier duplicate detection performs no write", () => {
  const id = randomUUID();
  const rows = [
    [...headers, "Sync UUID"],
    [...guest("Fictional Rowan"), id],
    [...guest("Fictional Morgan"), id]
  ];
  const s = setup(rows);
  assert.throws(s.run, /duplicate/);
  assert.equal(s.writes(), 0);
});


test("complete guests receive IDs; provisional guests do not", () => {
  const rows = [
    headers,
    guest("Fictional Rowan"),
    guest("Fictional Pending", {
      "Guest type": "", Group: "", "List owner": "",
      "Party / family": "", "Planning status": "", Priority: ""
    }),
    guest("Fictional Partial", { Group: "" })
  ];

  const s = setup(rows);
  s.run();

  const col = headers.length;

  assert.equal(rows[0][col], "Sync UUID");
  assert.match(rows[1][col], /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i);
  assert.equal(rows[2][col], "");
  assert.equal(rows[3][col], "");
});

test("existing UUID survives when a guest becomes incomplete", () => {
  const id = randomUUID();
  const rows = [
    [...headers, "Sync UUID"],
    [...guest("Fictional Rowan", { "Guest type": "" }), id]
  ];

  const s = setup(rows);
  s.run();
  assert.equal(rows[1][headers.length], id);

  s.run();
  assert.equal(rows[1][headers.length], id);
});

test("invalid UUID blocks writes", () => {
  const rows = [
    [...headers, "Sync UUID"],
    [...guest("Fictional Rowan"), "INVALID-UUID"]
  ];

  const s = setup(rows);
  assert.throws(s.run, /invalid or duplicate/i);
  assert.equal(s.writes(), 0);
  assert.equal(s.unlocks(), 1);
});


test("surname column preserves existing IDs and does not identify drafts", () => {
  const id = randomUUID();
  const cols = ['Guest name', 'Surname', ...headers.slice(1), 'Sync UUID'];
  const rows = [cols,
    ['Fictional Rowan', 'Example', ...guest('Fictional Rowan').slice(1), id],
    ['Fictional Pending', 'Example', '', '', '', '', '', '', '']];
  const s = setup(rows);
  s.run();
  assert.equal(rows[1][cols.indexOf('Sync UUID')], id);
  assert.equal(rows[2][cols.indexOf('Sync UUID')], '');
  assert.equal(rows[1][1], 'Example');
});
test("duplicate surname columns block identifier writes", () => {
  const rows = [[...headers, 'Surname', 'Surname'], [...guest('Fictional Rowan'), '', '']];
  const s = setup(rows);
  assert.throws(s.run, /Duplicate Surname/);
  assert.equal(s.writes(), 0);
});
