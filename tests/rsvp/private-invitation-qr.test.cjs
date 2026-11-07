const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const { renderPrivateInvitationQr } = require(path.join(
  process.env.SYNC_TEST_BUILD,
  "rsvp/private-invitation-qr.js"
));
const fixtureUrl = "https://site-love.invalid/rsvp/FictionalToken_abcdefghijklmnopqrstuvwxyz01";

test("private QR renderer creates a high-resolution in-memory PNG for an exact RSVP URL", async () => {
  const dataUrl = await renderPrivateInvitationQr(fixtureUrl, "https://site-love.invalid");
  assert.match(dataUrl, /^data:image\/png;base64,/);
  const png = Buffer.from(dataUrl.slice("data:image/png;base64,".length), "base64");
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(png.length > 1_000, true);
});

test("private QR renderer rejects noncanonical origins, routes and URL parameters", async () => {
  await assert.rejects(renderPrivateInvitationQr(fixtureUrl, "https://attacker.invalid"), /INVALID_PRIVATE_RSVP_URL/);
  await assert.rejects(renderPrivateInvitationQr("https://site-love.invalid/admin", "https://site-love.invalid"), /INVALID_PRIVATE_RSVP_URL/);
  await assert.rejects(renderPrivateInvitationQr(`${fixtureUrl}?email=fictional@example.invalid`, "https://site-love.invalid"), /INVALID_PRIVATE_RSVP_URL/);
  await assert.rejects(renderPrivateInvitationQr(fixtureUrl.replace("https://", "https://user:pass@"), "https://site-love.invalid"), /INVALID_PRIVATE_RSVP_URL/);
});
