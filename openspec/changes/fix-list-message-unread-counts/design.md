## Context

`list_messages` currently passes `labelIds: [labelId]`, forwards `query` directly as Gmail `q`, and returns `response.data.resultSizeEstimate` as `totalResults`. Gmail documents this value as an estimate, and observed behavior shows it can match a broader text search when `is:unread` is supplied inside `q`.

`count_messages` already distinguishes exact and label-derived counts for some cases, but `list_messages` exposes a listing-oriented response and should remain page based.

## Goals / Non-Goals

**Goals:**

- Make `list_messages` treat query-level `is:unread` the same as the `UNREAD` label filter for Gmail listing requests.
- Preserve existing message pagination behavior.
- Make count metadata explicit enough that callers can tell estimated counts from exact counts.
- Keep the change local to Gmail listing behavior unless a shared helper is clearly useful.

**Non-Goals:**

- Reimplement Gmail's full search parser.
- Guarantee exact counts for all Gmail searches by default.
- Change send, draft, label modification, or message-read behavior.
- Change authentication, scopes, or Gmail API dependencies.

## Decisions

### Normalize only safe standalone unread state tokens

Detect standalone `is:unread` tokens in `list_messages` query text, remove those tokens from the `q` string, and add `UNREAD` to the Gmail `labelIds` array if it is not already present.

Rationale: This directly addresses the observed issue without trying to parse every Gmail search feature. Using `labelIds` aligns with the known-good behavior from the label-filter call.

Alternative considered: leave the query untouched and only rename `totalResults`. That would reduce confusion but still leave a poorer count estimate for the same logical request.

Alternative considered: implement a complete Gmail query parser. That is too large for this fix and risks changing semantics for quoted text, grouped expressions, negation, and less common operators.

### Expose count semantics without relying on an exact count pass

Return Gmail's `resultSizeEstimate` as explicitly estimated metadata, for example:

```json
{
  "resultSizeEstimate": 29,
  "countType": "estimate"
}
```

The implementation can temporarily keep `totalResults` as a compatibility alias if removing it would be disruptive, but it should not be documented or described as exact.

Rationale: Exact counting requires paginating through all results, which may be slow or quota-expensive. The existing `count_messages` tool remains the better path when callers need exact counts.

Alternative considered: make `list_messages` compute exact counts for every request. That would make a lightweight listing tool unexpectedly expensive and could delay common mailbox browsing.

### Keep pagination tied to the normalized Gmail request

The same normalized `labelIds` and cleaned query must be used when fetching each page. `nextPageToken` should remain Gmail's token from that filtered request.

Rationale: Page tokens are only meaningful for the request shape that produced them. Changing filters between pages would produce confusing or invalid pagination.

## Risks / Trade-offs

- `is:unread` inside quoted text could be accidentally removed by a naive matcher -> Use token-boundary matching that avoids quoted strings, or explicitly limit normalization to simple whitespace-delimited tokens.
- Existing clients may depend on `totalResults` -> Keep a compatibility alias during this change and add clearer metadata beside it.
- Gmail `resultSizeEstimate` can still be approximate after normalization -> Label the field as estimated and direct exact-count needs to `count_messages`.
- Future state filters such as `is:read` and `is:starred` may have similar issues -> Structure the helper so more safe state-to-label mappings can be added deliberately.

## Migration Plan

1. Add query normalization for `is:unread` in `list_messages`.
2. Add explicit estimated count metadata to `list_messages` responses.
3. Keep existing response fields that callers may already consume unless tests and documentation show they are safe to remove.
4. Update README/tool descriptions to avoid implying exact totals from listing responses.
5. Verify with tests covering `query: "tibber is:unread"` and `labelId: "UNREAD", query: "tibber"`.
