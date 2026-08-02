const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createEstimatedListResult,
  normalizeListMessageFilters,
} = require("../dist/tools/messages.js");

test("normalizes query-level is:unread into an UNREAD label filter", () => {
  assert.deepEqual(normalizeListMessageFilters("INBOX", "tibber is:unread"), {
    labelIds: ["INBOX", "UNREAD"],
    query: "tibber",
  });
});

test("preserves existing unread label filter behavior", () => {
  assert.deepEqual(normalizeListMessageFilters("UNREAD", "tibber"), {
    labelIds: ["UNREAD"],
    query: "tibber",
  });
});

test("does not duplicate UNREAD when label and query both request unread", () => {
  assert.deepEqual(normalizeListMessageFilters("UNREAD", "tibber is:unread"), {
    labelIds: ["UNREAD"],
    query: "tibber",
  });
});

test("does not normalize quoted is:unread text", () => {
  assert.deepEqual(normalizeListMessageFilters("INBOX", 'subject:"is:unread"'), {
    labelIds: ["INBOX"],
    query: 'subject:"is:unread"',
  });
});

test("list result count metadata identifies Gmail result size as estimated", () => {
  assert.deepEqual(createEstimatedListResult([], undefined, 29), {
    messages: [],
    nextPageToken: undefined,
    resultSizeEstimate: 29,
    countMetadata: {
      value: 29,
      type: "estimate",
      source: "gmail.resultSizeEstimate",
    },
    totalResults: 29,
  });
});
