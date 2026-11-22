# 5. Project-Specific SQL Query Catalogue and Expected Results

Run `sql/01_schema.sql` and `sql/02_seed.sql` first. Then execute `sql/03_queries.sql` in PostgreSQL.

The sample data is deliberately small and fictional so that outputs can be checked manually during a viva. The outputs below describe the rows returned by the supplied seed data. They are reference outputs; capture actual `psql`/pgAdmin execution evidence after running the scripts on your PostgreSQL instance.

## Query 1 — INSERT a farm access grant
**Use case:** Give the veterinarian access to Green Valley Pig Farm. The query uses the seeded veterinarian and pig farm and is safe to run once because the key is unique.

Expected: `INSERT 0 1`.

## Query 2 — SELECT farms available to one user (JOIN + filtering + sorting)
**Use case:** Populate the signed-in user's farm selector.

Expected rows after Query 1:
- Green Valley Pig Farm | pig | veterinarian
- Sunrise Poultry Farm | poultry | veterinarian

## Query 3 — INSERT an assessment header
**Use case:** Start a new self-assessment record with an idempotency key.

Expected: `INSERT 0 1`.

## Query 4 — INSERT assessment responses
**Use case:** Save the six biosecurity criterion responses for the newly created assessment.

Expected: `INSERT 0 6`.

## Query 5 — SELECT assessment history (filter + sort)
**Use case:** Show recent assessments for Green Valley Pig Farm, newest first.

Expected: the newly inserted assessment appears first, followed by the two seeded pig-farm assessments.

## Query 6 — Aggregate risk counts by farm (JOIN + GROUP BY)
**Use case:** Dashboard risk distribution for each farm.

Expected seeded baseline before Query 3: Green Valley Pig Farm has 2 assessments; Sunrise Poultry Farm has 1. The newly inserted assessment adds one to Green Valley after Query 3.

## Query 7 — Average completion by farm (GROUP BY + HAVING)
**Use case:** Highlight farms with average completion below 100%.

Expected baseline: both farms qualify; Green Valley's average is 75%, Sunrise's average is 83.33% (rounded to 2 decimals). Query 3 adds a new assessment with 66.67% completion, changing Green Valley's average.

## Query 8 — Find unresolved follow-ups (JOIN + WHERE)
**Use case:** Create a corrective-action follow-up list.

Expected: returns the seeded response rows marked `follow_up`, plus the six responses inserted by Query 4 where applicable.

## Query 9 — Subquery: farms with at least one critical assessment
**Use case:** Prioritize farms with critical records.

Expected baseline: Green Valley Pig Farm is returned.

## Query 10 — UPDATE a farm access role
**Use case:** Promote a user's access role after an authorized administrative decision.

Expected: `UPDATE 1`.

## Query 11 — DELETE a farm access grant
**Use case:** Revoke an access grant after an authorized administrative decision. The query removes the veterinarian's temporary access to Green Valley.

Expected: `DELETE 1`.

## Query 12 — Read one historical assessment with its response details
**Use case:** Reconstruct the stored assessment view. The header and response rows are returned separately so the application can render a stable historical snapshot.

Expected: one assessment header row and its associated response rows.

## Notes

Queries 1, 3, 4, 10 and 11 mutate the demonstration database. Re-run the schema and seed scripts to restore a clean state before repeating the full demonstration. Query 11 removes the access grant created by Query 1.
