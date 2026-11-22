-- FarmWard business-use SQL demonstrations.
-- Run after 01_schema.sql and 02_seed.sql.
-- Queries 1, 3, 4, 10 and 11 modify data.

-- Q1. INSERT: grant veterinarian access to Green Valley Pig Farm.
INSERT INTO farm_access (user_id, farm_id, role)
VALUES ('22222222-2222-4222-8222-222222222222',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'veterinarian')
ON CONFLICT (user_id, farm_id) DO NOTHING;

-- Q2. SELECT + JOIN + filter + sort: farms accessible to the veterinarian.
SELECT f.farm_name, f.species, fa.role
FROM farm_access fa
JOIN farm f ON f.farm_id = fa.farm_id
WHERE fa.user_id = '22222222-2222-4222-8222-222222222222'
ORDER BY f.farm_name;

-- Q3. INSERT: create a new pig-farm assessment header.
INSERT INTO assessment
(assessment_id, farm_id, submitted_by, assessed_on, risk_level, completion_percent,
 submission_key, checklist_version, checklist_snapshot)
VALUES
('c4444444-4444-4444-8444-444444444444',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 '11111111-1111-4111-8111-111111111111',
 CURRENT_DATE,
 'high',
 66.67,
 'd4444444-4444-4444-8444-444444444444',
 'v1',
 '{"species":"pig","version":"v1","criteria":["VISITOR_LOG","EQUIPMENT_CLEAN","ENTRY_CONTROL","ANIMAL_HEALTH","FEED_WATER","MORTALITY_DISPOSAL"]}'::jsonb)
ON CONFLICT (submission_key) DO NOTHING;

-- Q4. INSERT MANY: save six checklist responses for the new assessment.
INSERT INTO assessment_response
(assessment_id, criterion_code, criterion_label, status, note)
VALUES
('c4444444-4444-4444-8444-444444444444', 'VISITOR_LOG', 'Visitor log maintained', 'done', NULL),
('c4444444-4444-4444-8444-444444444444', 'EQUIPMENT_CLEAN', 'Equipment cleaned', 'follow_up', 'Document disinfection schedule'),
('c4444444-4444-4444-8444-444444444444', 'ENTRY_CONTROL', 'Entry controls followed', 'done', NULL),
('c4444444-4444-4444-8444-444444444444', 'ANIMAL_HEALTH', 'Animal health monitored', 'follow_up', 'Record routine observations'),
('c4444444-4444-4444-8444-444444444444', 'FEED_WATER', 'Feed and water protected', 'done', NULL),
('c4444444-4444-4444-8444-444444444444', 'MORTALITY_DISPOSAL', 'Mortality disposed safely', 'done', NULL)
ON CONFLICT (assessment_id, criterion_code) DO NOTHING;

-- Q5. SELECT + filtering + sorting: latest assessments for one farm.
SELECT a.assessment_id, a.assessed_on, a.risk_level, a.completion_percent, u.full_name AS submitted_by
FROM assessment a
JOIN app_user u ON u.user_id = a.submitted_by
WHERE a.farm_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
ORDER BY a.assessed_on DESC, a.created_at DESC;

-- Q6. Aggregate + GROUP BY: assessment count by farm and risk category.
SELECT f.farm_name, a.risk_level, COUNT(*) AS assessment_count
FROM assessment a
JOIN farm f ON f.farm_id = a.farm_id
GROUP BY f.farm_name, a.risk_level
ORDER BY f.farm_name, a.risk_level;

-- Q7. AVG + GROUP BY + HAVING: farms whose average completion is below 100%.
SELECT f.farm_name, ROUND(AVG(a.completion_percent), 2) AS average_completion,
       COUNT(*) AS assessment_count
FROM farm f
JOIN assessment a ON a.farm_id = f.farm_id
GROUP BY f.farm_id, f.farm_name
HAVING AVG(a.completion_percent) < 100
ORDER BY average_completion ASC;

-- Q8. JOIN + filter: outstanding corrective follow-ups across farms.
SELECT f.farm_name, a.assessed_on, ar.criterion_label, ar.note
FROM assessment_response ar
JOIN assessment a ON a.assessment_id = ar.assessment_id
JOIN farm f ON f.farm_id = a.farm_id
WHERE ar.status = 'follow_up'
ORDER BY a.assessed_on DESC, f.farm_name;

-- Q9. Subquery: farms with at least one critical assessment.
SELECT f.farm_id, f.farm_name, f.species
FROM farm f
WHERE EXISTS (
  SELECT 1
  FROM assessment a
  WHERE a.farm_id = f.farm_id
    AND a.risk_level = 'critical'
)
ORDER BY f.farm_name;

-- Q10. UPDATE: change the veterinarian's Sunrise Poultry Farm role to manager.
UPDATE farm_access
SET role = 'manager'
WHERE user_id = '22222222-2222-4222-8222-222222222222'
  AND farm_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

-- Q11. DELETE: revoke the temporary veterinarian access grant to Green Valley.
DELETE FROM farm_access
WHERE user_id = '22222222-2222-4222-8222-222222222222'
  AND farm_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

-- Q12. Historical detail: fetch assessment header and immutable snapshot.
SELECT assessment_id, assessed_on, risk_level, completion_percent,
       checklist_version, checklist_snapshot
FROM assessment
WHERE assessment_id = 'c1111111-1111-4111-8111-111111111111';

SELECT criterion_code, criterion_label, status, note
FROM assessment_response
WHERE assessment_id = 'c1111111-1111-4111-8111-111111111111'
ORDER BY criterion_code;
