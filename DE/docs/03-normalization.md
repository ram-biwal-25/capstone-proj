# 3. Database Normalization (1NF, 2NF and 3NF)

The final PostgreSQL design is normalized to Third Normal Form (3NF), with one deliberate historical JSONB snapshot used to reproduce an assessment exactly as it appeared when submitted.

## Initial unnormalized design (illustrative)

A single spreadsheet-like table might contain:

`FarmAssessment(user_email, user_name, farm_name, species, role, assessed_on, risk, visitor_status, visitor_note, cleaning_status, cleaning_note, entry_status, entry_note, ...)`

This structure repeats user/farm details for every assessment and creates repeating groups for checklist criteria.

## First Normal Form (1NF)

**Rule:** Each field contains one atomic value; each row is uniquely identifiable; repeating groups are removed.

Transformation:
- Replace columns such as `visitor_status`, `cleaning_status`, and `entry_status` with separate rows in `assessment_response`.
- Give each assessment and response a primary key.
- Store one response status and one optional note per criterion per assessment.

Result: `assessment_response` contains one criterion response per row, with no repeating columns or multi-valued cells.

## Second Normal Form (2NF)

**Rule:** Be in 1NF and every non-key attribute must depend on the whole candidate key, not just part of a composite key.

The `farm_access` junction table has composite key (`user_id`, `farm_id`). Its `role` and `granted_at` describe that specific user's access to that specific farm and depend on both key columns.

User name/email/password hash depend only on `user_id`, so they belong in `app_user`, not in `farm_access`. Farm name/species depend only on `farm_id`, so they belong in `farm`, not in `farm_access`.

The response table uses a surrogate `response_id` primary key and a unique (`assessment_id`, `criterion_code`) constraint. Response label/status/note describe that assessment's response to that criterion.

## Third Normal Form (3NF)

**Rule:** Be in 2NF and have no transitive dependency of a non-key attribute on a key.

Examples removed:
- `email -> full_name/password_hash` is kept entirely in `app_user`; user details are not repeated in assessment rows.
- `farm_id -> farm_name/species` is kept in `farm`; farm details are not copied into every assessment.
- `assessment_id -> farm_id/submitted_by/assessed_on/risk_level` is kept in `assessment`; assessment response rows refer to it through `assessment_id`.
- `user_id, farm_id -> role` is kept in `farm_access`.

The final schema separates users, farms, access grants, assessment headers, and assessment response items. This avoids update, insertion, and deletion anomalies.

## Functional dependencies

| Relation | Functional dependency |
|---|---|
| `app_user` | `user_id -> full_name, email, password_hash, created_at`; `email -> user_id, full_name, password_hash, created_at` |
| `farm` | `farm_id -> farm_name, species, created_at` |
| `farm_access` | `(user_id, farm_id) -> role, granted_at` |
| `assessment` | `assessment_id -> farm_id, submitted_by, assessed_on, risk_level, completion_percent, submission_key, checklist_version, checklist_snapshot, created_at`; `submission_key -> assessment_id` |
| `assessment_response` | `response_id -> assessment_id, criterion_code, criterion_label, status, note`; `(assessment_id, criterion_code) -> response_id, criterion_label, status, note` |

## Why retain a JSONB snapshot?

The normalized response rows are the source for querying and reporting. The `checklist_snapshot` JSONB column is a deliberate immutable historical snapshot, not a replacement for the normalized response table. It stores the checklist version and presentation details needed to reproduce the historical form if labels or guidance change later. It is written with the assessment and is not updated afterward.

## Final normalized schema

See `../sql/01_schema.sql`. The normalized core consists of:
- `app_user`
- `farm`
- `farm_access`
- `assessment`
- `assessment_response`
