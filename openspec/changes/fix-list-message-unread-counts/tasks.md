## 1. Request Normalization

- [x] 1.1 Add a small query normalization helper for safe standalone `is:unread` tokens.
- [x] 1.2 Update `list_messages` to add `UNREAD` to Gmail `labelIds` when the query contains `is:unread`.
- [x] 1.3 Update `list_messages` to send the cleaned query text after removing normalized unread tokens.
- [x] 1.4 Preserve existing behavior when callers already pass `labelId: "UNREAD"`.

## 2. Response Metadata

- [x] 2.1 Add explicit estimated count metadata for Gmail `resultSizeEstimate` in `list_messages` responses.
- [x] 2.2 Keep or document any compatibility alias for the existing `totalResults` field.
- [x] 2.3 Ensure empty-result responses still expose count semantics consistently.

## 3. Verification

- [x] 3.1 Add tests or fixtures for `query: "tibber is:unread"` producing `labelIds` that include `UNREAD` and `q: "tibber"`.
- [x] 3.2 Add tests or fixtures for `labelId: "UNREAD", query: "tibber"` preserving the existing unread-label behavior.
- [x] 3.3 Add a regression check that listing responses do not describe Gmail estimates as exact totals.
- [x] 3.4 Run the project build and available test suite.

## 4. Documentation

- [x] 4.1 Update tool documentation or README text to explain estimated count metadata for list-style message responses.
- [x] 4.2 Document that exact counts should use `count_messages` when callers need full enumeration.
