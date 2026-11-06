const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const Module = require("node:module");
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  return originalLoad.call(this, name, ...args);
};
const { readSheet, readSheets } = require(process.env.SYNC_TEST_BUILD + "/google.js");
Module._load = originalLoad;
process.env.GUEST_SYNC_SPREADSHEET_ID = "fictional-spreadsheet-id-for-tests";
process.env.GUEST_SYNC_GOOGLE_CLIENT_EMAIL = "fictional@example.invalid";
process.env.GUEST_SYNC_GOOGLE_PRIVATE_KEY = generateKeyPairSync("rsa", {
  modulusLength: 2048
}).privateKey.export({ type: "pkcs8", format: "pem" });
const response = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "retry-after": "0" }
  });
test("Google adapter: readonly scope, private requests, authorization and retry handling", async (t) => {
  const originalFetch = global.fetch;
  try {
    await t.test(
      "server-side token request uses readonly scope and no-store",
      async () => {
        let calls = 0;
        global.fetch = async (url, init) => {
          assert.equal(init.cache, "no-store");
          assert(init.signal);
          calls++;
          if (url.includes("oauth2")) {
            const assertion = init.body.get("assertion");
            const body = JSON.parse(
              Buffer.from(assertion.split(".")[1], "base64url")
            );
            assert.equal(
              body.scope,
              "https://www.googleapis.com/auth/spreadsheets.readonly"
            );
            return response({ access_token: "fictional-token" });
          }
          assert(init.headers.Authorization);
          assert(url.includes("Guest%20List"));
          return response({ values: [["Guest name"]] });
        };
        assert.deepEqual(await readSheet(), [["Guest name"]]);
        assert.equal(calls, 2);
      }
    );
    await t.test("two-tab reader fetches Guest List and Households with one readonly token", async () => {
      const requestedTabs = [];
      global.fetch = async (url, init) => {
        assert.equal(init.cache, "no-store");
        if (url.includes("oauth2")) {
          const assertion = init.body.get("assertion");
          const body = JSON.parse(Buffer.from(assertion.split(".")[1], "base64url"));
          assert.equal(body.scope, "https://www.googleapis.com/auth/spreadsheets.readonly");
          return response({ access_token: "fictional-token" });
        }
        assert(init.headers.Authorization);
        const tab = url.includes("Households") ? "Households" : "Guest List";
        requestedTabs.push(tab);
        return response({ values: [[tab]] });
      };
      assert.deepEqual(await readSheets(), {
        guestList: [["Guest List"]],
        households: [["Households"]]
      });
      assert.deepEqual(requestedTabs.sort(), ["Guest List", "Households"].sort());
    });
    await t.test("403 and 401 return sanitized actionable errors", async () => {
      global.fetch = async () => response({}, 403);
      await assert.rejects(readSheet(), (e) => e.code === "GOOGLE_ACCESS");
      global.fetch = async () => response({}, 401);
      await assert.rejects(readSheet(), (e) => e.code === "GOOGLE_AUTH");
    });
    await t.test("timeouts and network errors fail closed", async () => {
      global.fetch = async () => {
        throw Error("contains private diagnostic");
      };
      await assert.rejects(
        readSheet(),
        (e) =>
          e.code === "GOOGLE_UNAVAILABLE" && !e.message.includes("diagnostic")
      );
    });
    await t.test("rate limit retries are bounded", async () => {
      let calls = 0;
      global.fetch = async () => {
        calls++;
        return response({}, 429);
      };
      await assert.rejects(readSheet(), (e) => e.code === "GOOGLE_API");
      assert.equal(calls, 3);
    });
    await t.test("oversized source rejected without truncating", async () => {
      global.fetch = async (url) =>
        url.includes("oauth2")
          ? response({ access_token: "fictional-token" })
          : response({ values: Array.from({ length: 5002 }, () => ["x"]) });
      await assert.rejects(readSheet(), (e) => e.code === "SOURCE_SIZE");
    });
  } finally {
    global.fetch = originalFetch;
  }
});
