# Applying the integration example to the existing FarmWard repository

1. Provision PostgreSQL and execute `sql/01_schema.sql` and `sql/02_seed.sql`.
2. Install `pg` and `@types/pg`.
3. Add `DATABASE_URL` to the server environment. Never expose it with a `NEXT_PUBLIC_` prefix.
4. Adapt `integration/lib/db.ts` and `integration/lib/assessment-repository.ts` into the application's `lib/` directory.
5. Replace the placeholder `@/lib/auth-adapter` import in the example route with the actual authenticated session function from FarmWard's `lib/session.ts`. The function must return the verified user ID from the signed cookie; never accept the user ID from request JSON.
6. Map the existing checklist response types to `NewAssessment`. Keep the existing centralized `classifyRisk()` business logic as the source of the risk level; validate again on the server.
7. Replace SQLite-specific repository calls with PostgreSQL calls. Update reporting queries to use PostgreSQL syntax and test every route.
8. Add integration tests for: unauthorized user, user without farm access, duplicate submission key, invalid status, missing required fields, and successful assessment with all response rows.
9. Run `npm run lint`, `npm test`, and `npm run build`, plus PostgreSQL integration tests.
10. Only after successful tests should the project README and deployment configuration describe PostgreSQL as the active database.

## Evidence to capture for final evaluation

- `psql` or pgAdmin showing all five tables and constraints.
- ER diagram image/export.
- Successful execution output for all 12 statements in `sql/03_queries.sql`.
- Application screenshot of a submitted assessment.
- Database query showing the same assessment and response rows.
- Test output showing authorized and unauthorized farm access behavior.

This package does not include fabricated screenshots or claim that a database server was run in this environment.
