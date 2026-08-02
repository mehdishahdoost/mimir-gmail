## Purpose

Defines how message listing responses report count metadata when Gmail search text and label/state filters are combined, so callers can distinguish applied filters from Gmail's estimated result size.

## ADDED Requirements

### Requirement: Message listing SHALL apply unread filters consistently

When a message listing request includes an unread state filter in the search query, the system SHALL apply that unread constraint to the Gmail listing request in a way that affects both returned messages and count metadata.

#### Scenario: Text search with unread state

- **WHEN** a caller lists messages with query text equivalent to `tibber is:unread`
- **THEN** every returned message SHALL match the text search and be unread
- **THEN** the reported count metadata SHALL be based on the unread-filtered listing, not the broader text-only search

#### Scenario: Label unread filter remains supported

- **WHEN** a caller lists messages with the unread label filter and query text equivalent to `tibber`
- **THEN** every returned message SHALL match the text search and be unread
- **THEN** the reported count metadata SHALL remain based on the unread-filtered listing

### Requirement: Message listing SHALL expose count semantics clearly

Message listing responses SHALL identify whether a returned count is an estimate from Gmail or an exact count computed by the system, and SHALL NOT present Gmail's estimated result size as an exact total.

#### Scenario: Gmail returns an estimated result size

- **WHEN** Gmail provides an estimated result size for a listing request
- **THEN** the response SHALL expose that value with metadata indicating it is estimated

#### Scenario: System computes an exact count

- **WHEN** the system computes an exact count by enumerating all matching results
- **THEN** the response SHALL expose that value with metadata indicating it is exact

### Requirement: Existing pagination behavior SHALL be preserved

Message listing changes SHALL preserve the existing page-based listing contract for returned messages and next page tokens.

#### Scenario: Filtered listing has another page

- **WHEN** a filtered message listing response includes a Gmail next page token
- **THEN** the response SHALL include a next page token that callers can use to request the next filtered page
