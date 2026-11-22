# FarmWard — Database Engineering (DE) Submission

This folder contains a PostgreSQL database design and implementation package for FarmWard, a digital farm biosecurity self-assessment portal.

## Important implementation note

The supplied FarmWard project description currently identifies **SQLite (`node:sqlite`)** as its database. This DE package selects **PostgreSQL** to satisfy the assignment's database-selection requirement and provides a PostgreSQL schema, seed data, project-specific SQL, and a Next.js integration example.

**Adding this folder alone does not migrate the running application.** The current application continues to use SQLite until the PostgreSQL integration code is adopted, the PostgreSQL database is provisioned, and the relevant repository/data-access modules and environment configuration are changed. Do not describe PostgreSQL as already live-integrated until that work has been completed and tested.

## Folder contents

| Path | Purpose |
|---|---|
| `docs/01-database-selection.md` | Database choice and suitability |
| `docs/02-er-diagram.md` | Entity relationships and Mermaid ER diagram |
| `docs/03-normalization.md` | Functional dependencies and 1NF–3NF |
| `docs/04-architecture-and-integration.md` | Database architecture, integrity and integration |
| `docs/05-query-catalogue.md` | 12 business-focused queries and expected outputs |
| `sql/01_schema.sql` | PostgreSQL DDL, keys, constraints and indexes |
| `sql/02_seed.sql` | Reproducible demonstration records |
| `sql/03_queries.sql` | Executable project-specific SQL operations |
| `integration/lib/db.ts` | PostgreSQL connection pool |
| `integration/lib/assessment-repository.ts` | Parameterized repository operations |
| `integration/app/api/assessments/route.ts` | Example authenticated Next.js API integration |
| `integration/.env.example` | PostgreSQL connection configuration |

## Run the PostgreSQL implementation

Requires PostgreSQL 15+ and Node.js 20+ (22+ recommended for the existing application).

1. Create a database, for example `farmward_de`.
2. Run the schema and sample data:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/01_schema.sql
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/02_seed.sql
   ```

3. Run the query demonstrations:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f sql/03_queries.sql
   ```

4. For the Next.js integration example, install the `pg` package:

   ```bash
   npm install pg
   npm install --save-dev @types/pg
   ```

5. Set `DATABASE_URL` in `.env.local` using `integration/.env.example` as a template. Keep real credentials out of Git.

6. Copy/adapt the integration files into the application, connect them to the existing authentication guard, and replace the SQLite repository calls with PostgreSQL repository calls. See `docs/04-architecture-and-integration.md`.

## Demonstration accounts and sample-data warning

All records in `02_seed.sql` are fictional demonstration data. The seed script uses illustrative password-hash placeholders and is not intended to create login-ready accounts. Authentication remains the responsibility of the application's existing secure authentication layer.

## Evidence status

- **Provided:** PostgreSQL DDL, relationships, normalization explanation, indexes, seed data, 12 executable SQL statements, expected result descriptions, and a Next.js integration example.
- **Not claimed:** A live PostgreSQL server execution or a completed migration of the existing SQLite application. Capture actual terminal/database screenshots and integration test results after running this package in your project environment.
