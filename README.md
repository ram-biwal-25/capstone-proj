# Digital Farm Management Portal

This repository currently contains the Farm Biosecurity Checklist and Assessment History contribution for the ASD Major Project. It supports internal self-assessment records for pig and poultry farms. It does not make official compliance determinations or publish live outbreak notices.

## Current feature

- Signed demo login with farm-based access control
- Pig and poultry farm selection
- Six record-keeping checks with Done, Needs follow-up, and Not applicable answers
- Optional notes and required-field validation
- Idempotent saves that prevent duplicate records after repeat requests
- Checklist completion that excludes Not applicable answers
- Saved assessment history with newest records first
- Read-only reopening of original answers and notes
- Responsive layouts for desktop and phone screens
- Persistent SQLite storage in `data/farm-portal.sqlite`

All seeded users and farms are visibly labeled as sample data.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo farmer account:

- Email: `farmer@example.com`
- Password: `demo123`
- Access: sample pig farm and sample poultry farm

Demo veterinarian account:

- Email: `vet@example.com`
- Password: `demo123`
- Access: sample poultry farm only

The database is created and seeded automatically on first start. To use a different database location, set `DATABASE_PATH` to an absolute file path.

## Verification

```bash
npm run lint
npm test
npm run build
```

## One-minute viva demo

1. Sign in as `farmer@example.com` and point out the two assigned sample farms.
2. Choose **New checklist**, select the pig farm, and show the three answer choices and optional note.
3. Mark some items Done, one Needs follow-up, and one Not applicable. Explain that Not applicable is excluded from **Checklist completion**.
4. Save once and show the success message, completion summary, original answers, and notes.
5. Open **Assessment History**, point out newest-first ordering, and reopen the saved record.
6. Mention that SQLite preserves the record after reload and every server read checks the signed-in user's farm access.

## Data flow

The browser sends the selected farm, date, answers, notes, and a one-time submission key to `POST /api/assessments`. The server validates every checklist item, checks the signed-in user's access to the farm, and stores the normalized response snapshot in SQLite. History queries join saved records to the user's current farm access, order them by creation time, and parse the stored snapshot for display. Saving the item label with each answer preserves what the user originally assessed even if the checklist wording changes later.

## Main code locations

- `app/(portal)/checklist/` — checklist form and responsive presentation
- `app/(portal)/history/` — history list and saved record view
- `app/api/assessments/route.ts` — authenticated validation and save endpoint
- `lib/checklist.ts` — checklist definitions, response validation, and completion calculation
- `lib/database.ts` — SQLite schema and clearly labeled sample seed data
- `lib/repository.ts` — authorized farm and assessment queries
- `lib/session.ts` — signed, HTTP-only login session
