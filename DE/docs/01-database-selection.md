# 1. Database Selection and Justification

## Selected database: PostgreSQL

FarmWard stores structured, related operational data: users, farms, user-to-farm permissions, assessment headers, and assessment response items. PostgreSQL is suitable because it is a relational database with strong referential integrity, transactions, constraints, indexing, and mature reporting/query capabilities.

## Why PostgreSQL fits FarmWard

1. **Clearly related entities:** A user can have access to multiple farms, and a farm can be accessed by multiple users. Assessments belong to a farm and are submitted by a user. These relationships are naturally represented with foreign keys and a junction table.
2. **Reliable assessment writes:** A transaction can insert an assessment and all its response rows atomically. A failed response insert can roll back the entire assessment.
3. **Data integrity:** `NOT NULL`, `CHECK`, `UNIQUE`, and foreign-key constraints prevent invalid species, roles, statuses, duplicate submissions, and orphan records.
4. **Reporting:** Joins, grouping, aggregates, date filters, and window functions support farm dashboards, risk summaries, completion trends, and history.
5. **Growth path:** PostgreSQL supports concurrent clients, connection pooling, indexing, and deployment on managed database services. It is a stronger fit for future multi-instance deployments than a single-node SQLite file.
6. **Structured and semi-structured content:** Core entities remain relational. PostgreSQL `JSONB` can optionally store a versioned snapshot of the exact checklist labels and guidance shown at assessment time.

## Nature of the data

| Data | Nature | Storage |
|---|---|---|
| User identity and password hash | Structured, security-sensitive | `app_user` |
| Farm name and species | Structured | `farm` |
| Farm membership and role | Relationship data | `farm_access` |
| Assessment date, submitter and risk | Structured transaction data | `assessment` |
| Checklist item response/status/note | Repeating structured child data | `assessment_response` |
| Historical checklist snapshot | Versioned semi-structured record | `assessment.checklist_snapshot` (`JSONB`) |

The `JSONB` snapshot is an intentional historical copy. It preserves what the user saw at the time, while normalized response rows support filtering and reporting.

## Why not MongoDB for this design?

MongoDB could store an assessment with embedded responses, but FarmWard needs many relational queries across users, farms, access permissions, assessments, and response items. PostgreSQL makes those joins and authorization constraints explicit and enforceable. Embedding every response in a MongoDB document would simplify reading one assessment but make cross-assessment reporting and relational integrity more application-dependent.

## Scope and migration note

The original FarmWard summary specifies SQLite through `node:sqlite`. This submission proposes PostgreSQL as the target database for the DE requirement. The schema and integration examples in this folder are a migration-ready implementation package; the existing application is not considered migrated until its runtime repository and deployment configuration are changed and tested.
