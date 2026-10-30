const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { randomUUID } = require("node:crypto");
function setup(rows) {
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
  const rows = [["Guest name"], ["Fictional Rowan"], ["Fictional Morgan"]];
  const s = setup(rows);
  s.failNext();
  assert.throws(s.run);
  const persisted = rows[1][1];
  assert(persisted);
  s.run();
  assert.equal(rows[1][1], persisted);
  assert.notEqual(rows[2][1], persisted);
  const ids = JSON.stringify(rows);
  s.run();
  assert.equal(JSON.stringify(rows), ids);
  assert.equal(s.unlocks(), 3);
});
test("identifier duplicate detection performs no write", () => {
  const id = randomUUID();
  const rows = [
    ["Guest name", "Sync UUID"],
    ["Fictional Rowan", id],
    ["Fictional Morgan", id]
  ];
  const s = setup(rows);
  assert.throws(s.run, /duplicate/);
  assert.equal(s.writes(), 0);
});
