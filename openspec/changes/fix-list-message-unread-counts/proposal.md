## Why

`list_messages` can return a page of unread-filtered messages while reporting a misleading `totalResults` value when `is:unread` is embedded in the Gmail search query. This makes callers treat Gmail's broad or estimated count as the filtered unread count, which is confusing and can lead to incorrect mailbox summaries.

## What Changes

- Normalize supported Gmail state filters, starting with `is:unread`, into Gmail label filters when listing messages.
- Preserve the remaining search text in the Gmail query so combined searches like `tibber is:unread` continue to match the same messages.
- Make the returned count semantics explicit so callers know whether the value is Gmail's estimate or an exact/label-derived count.
- Add coverage for combined text plus unread searches to prevent regressions.

## Capabilities

### New Capabilities

- `message-list-counts`: Message listing results expose count metadata that reflects the applied filters and does not present Gmail estimates as exact totals.

### Modified Capabilities

- None.

## Impact

- Affected tools: `list_messages`; possibly `search_messages` and `list_threads` if the same count metadata naming is standardized across list-style tools.
- Affected code: Gmail message listing request construction and response formatting in `src/tools/messages.ts`; tests or fixtures for Gmail API list calls.
- External APIs: Gmail `users.messages.list` and label filtering through `labelIds`.
- Dependencies: No new runtime dependency expected.
