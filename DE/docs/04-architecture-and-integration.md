# 4. Database Architecture, Integration, Integrity and Performance

## Architecture

```text
Browser
  |
  v
Next.js App Router page / API route
  |
  v
Authentication guard (existing FarmWard session layer)
  |
  v
Repository / data-access layer (parameterized SQL)
  |
  v
PostgreSQL connection pool (`pg`)
  |
  v
PostgreSQL tables, constraints, transactions and indexes
```

The browser must not connect directly to PostgreSQL. The server-side Next.js API validates the request, verifies the session and farm authorization, then calls the repository. SQL uses parameters (`$1`, `$2`, …) rather than string concatenation.

## Assessment write flow

1. Authenticate the user using FarmWard's existing session mechanism.
2. Validate the requested farm, date, submission UUID, checklist item identifiers and statuses.
3. Confirm that the user has a `farm_access` row for the requested farm.
4. Begin a database transaction.
5. Insert the assessment header using the unique `submission_key`.
6. Insert each checklist response.
7. Commit the transaction. On any error, roll back.
8. Return the stored assessment identifier to the client.

The unique idempotency key prevents duplicate assessment headers when the client retries a request. The unique (`assessment_id`, `criterion_code`) constraint prevents duplicate criterion responses in one assessment.

## CRUD mapping to application features

| Application feature | Database operation |
|---|---|
| Sign-in lookup | `SELECT` user by unique email; password verification remains in auth layer |
| Farm selector | `SELECT` farms joined through `farm_access` for the authenticated user |
| Submit checklist | Transactional `INSERT` into `assessment` and `assessment_response` |
| Dashboard | `JOIN`, `COUNT`, `AVG`, `GROUP BY` over assessments and responses |
| Assessment history | Filtered `SELECT` with joins and sorting |
| Historical detail | Fetch assessment header and its response rows |
| Correct a farm assignment | Authorized `UPDATE` to `farm_access` |
| Remove a farm assignment | Authorized `DELETE` from `farm_access` |

Assessment records are intended to be append-only historical records. The normal application workflow should not edit or delete completed assessments. The demonstration UPDATE and DELETE queries operate on access grants or clearly identified test records, not on historical assessment evidence.

## Integration example supplied

- `integration/lib/db.ts`: server-side `pg` pool.
- `integration/lib/assessment-repository.ts`: parameterized SQL, transaction, access check and assessment retrieval.
- `integration/app/api/assessments/route.ts`: illustrative Next.js route.

The route intentionally calls `requireUserId()` as an integration point. Replace that placeholder import with the actual session guard from the project's `lib/session.ts`. The current FarmWard authentication implementation and authorization semantics must be retained. Do not trust a `user_id` supplied by the browser.

## Data integrity controls

- Primary keys identify every entity.
- Foreign keys prevent orphan assessments, response rows, and access grants.
- Unique email and submission key prevent duplicates.
- Check constraints restrict species, role, risk, response status, completion range and valid assessment dates.
- `NOT NULL` ensures required values are present.
- Parameterized SQL reduces SQL injection risk.
- A transaction ensures assessment header and responses are saved atomically.
- Farm access is checked in the repository before reading or writing farm records.

## Indexing and performance

The schema defines:
- `app_user(email)` unique index for sign-in lookup.
- `farm_access(user_id, farm_id)` primary key and a reverse `farm_id` index.
- `assessment(farm_id, assessed_on DESC)` for farm history.
- `assessment(submitted_by, created_at DESC)` for submitter history.
- `assessment_response(assessment_id)` for loading assessment details.
- Unique `(assessment_id, criterion_code)` for response integrity.

Indexes speed up reads but add storage and write overhead. Indexes should be validated with `EXPLAIN (ANALYZE, BUFFERS)` against realistic data before adding more.

## Scaling considerations

For a larger deployment:
- Use a managed PostgreSQL service with automated backups and point-in-time recovery.
- Configure connection pooling with a bounded pool size.
- Use migrations (for example, SQL migration files or a migration framework) instead of editing production schema manually.
- Monitor query plans, slow queries, connection saturation and table growth.
- Consider partitioning assessment history by date only when measured volume justifies the added operational complexity.
- Keep application instances stateless and store database credentials in deployment secrets.

## Deployment and security notes

Use TLS for remote database connections, least-privilege database credentials, private networking where possible, and regular tested backups. Do not commit `.env.local`, passwords, `AUTH_SECRET`, or database connection strings to Git.
