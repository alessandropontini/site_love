const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getEditorialContent } = require(process.env.SYNC_TEST_BUILD + "/editorialConfig.js");
const {
  buildSaveTheDateDraft,
  saveTheDateChannels,
  saveTheDateTemplateVersion
} = require(process.env.SYNC_TEST_BUILD + "/save-the-date/message.js");

test("draft uses the centralized Italian wedding details and is channel-bound", () => {
  const draft = buildSaveTheDateDraft("it", "whatsapp");
  const footer = getEditorialContent("it").footer;
  assert.equal(draft.channel, "whatsapp");
  assert.equal(draft.language, "it");
  assert.equal(draft.templateVersion, saveTheDateTemplateVersion);
  assert(draft.text.includes(footer.date));
  assert(draft.text.includes(footer.place));
  assert(draft.text.includes(footer.names));
  assert(draft.text.includes("non serve confermare"));
  assert.equal(Object.hasOwn(draft, "recipient"), false);
  assert.equal(Object.hasOwn(draft, "send"), false);
});

test("English draft is localized and every approved manual channel is available", () => {
  const draft = buildSaveTheDateDraft("en", "paper");
  const footer = getEditorialContent("en").footer;
  assert.equal(draft.channel, "paper");
  assert(draft.text.includes(footer.date));
  assert(draft.text.includes(footer.place));
  assert(draft.text.includes("No RSVP is needed yet."));
  assert.deepEqual(saveTheDateChannels, [
    "sms", "imessage", "whatsapp", "email", "telegram", "instagram", "paper"
  ]);
});
