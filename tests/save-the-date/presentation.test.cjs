const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  canRecordManualStatus,
  manualConfirmationText
} = require(process.env.SYNC_TEST_BUILD + "/save-the-date/presentation.js");

test("manual outcome confirmation text clearly distinguishes prepared, sent and failed", () => {
  assert.match(manualConfirmationText("READY"), /has not been sent/);
  assert.match(manualConfirmationText("SENT"), /manually outside SITE LOVE/);
  assert.match(manualConfirmationText("FAILED"), /manual attempt was made and failed/);
  assert.match(manualConfirmationText("NOT_SENT"), /corrects the previous manual record/);
});

test("record action requires an explicit confirmation and an allowed transition", () => {
  const allowed = ["READY", "FAILED"];
  assert.equal(canRecordManualStatus("READY", allowed, false), false);
  assert.equal(canRecordManualStatus("SENT", allowed, true), false);
  assert.equal(canRecordManualStatus("", allowed, true), false);
  assert.equal(canRecordManualStatus("FAILED", allowed, true), true);
});
