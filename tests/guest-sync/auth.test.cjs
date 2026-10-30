const { test } = require("node:test");
const assert = require("node:assert/strict");
const { hasVerifiedAdminEmail } = require(
  process.env.SYNC_TEST_BUILD + "/allowlist.js"
);
test("only a verified allowlisted Clerk email grants administration", () => {
  const allowed = new Set(["fictional-admin@example.invalid"]);
  for (const status of ["unverified", "failed", "expired"])
    assert.equal(
      hasVerifiedAdminEmail(
        [
          {
            emailAddress: "fictional-admin@example.invalid",
            verification: { status }
          }
        ],
        allowed
      ),
      false
    );
  assert.equal(
    hasVerifiedAdminEmail(
      [
        {
          emailAddress: " FICTIONAL-ADMIN@example.invalid ",
          verification: { status: "verified" }
        }
      ],
      allowed
    ),
    true
  );
  assert.equal(
    hasVerifiedAdminEmail(
      [
        {
          emailAddress: "other@example.invalid",
          verification: { status: "verified" }
        }
      ],
      allowed
    ),
    false
  );
  assert.equal(hasVerifiedAdminEmail([], allowed), false);
});
