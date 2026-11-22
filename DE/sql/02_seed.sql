-- Fictional demonstration records only.
-- Password hashes are placeholders; these rows are not login-ready.
BEGIN;

INSERT INTO app_user (user_id, full_name, email, password_hash) VALUES
('11111111-1111-4111-8111-111111111111', 'Sample Farmer', 'farmer@example.com', 'DEMO_HASH_NOT_FOR_AUTH'),
('22222222-2222-4222-8222-222222222222', 'Sample Veterinarian', 'vet@example.com', 'DEMO_HASH_NOT_FOR_AUTH')
ON CONFLICT (email) DO NOTHING;

INSERT INTO farm (farm_id, farm_name, species) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Green Valley Pig Farm', 'pig'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Sunrise Poultry Farm', 'poultry')
ON CONFLICT (farm_id) DO NOTHING;

INSERT INTO farm_access (user_id, farm_id, role) VALUES
('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'owner'),
('11111111-1111-4111-8111-111111111111', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'manager'),
('22222222-2222-4222-8222-222222222222', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'veterinarian')
ON CONFLICT (user_id, farm_id) DO NOTHING;

INSERT INTO assessment
(assessment_id, farm_id, submitted_by, assessed_on, risk_level, completion_percent, submission_key, checklist_version, checklist_snapshot)
VALUES
('c1111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 14, 'critical', 66.67, 'd1111111-1111-4111-8111-111111111111', 'v1', '{"species":"pig","version":"v1"}'),
('c2222222-2222-4222-8222-222222222222', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', CURRENT_DATE - 7, 'moderate', 83.33, 'd2222222-2222-4222-8222-222222222222', 'v1', '{"species":"pig","version":"v1"}'),
('c3333333-3333-4333-8333-333333333333', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', CURRENT_DATE - 3, 'moderate', 83.33, 'd3333333-3333-4333-8333-333333333333', 'v1', '{"species":"poultry","version":"v1"}')
ON CONFLICT (submission_key) DO NOTHING;

INSERT INTO assessment_response (assessment_id, criterion_code, criterion_label, status, note) VALUES
('c1111111-1111-4111-8111-111111111111', 'VISITOR_LOG', 'Visitor log maintained', 'follow_up', 'Complete missing visitor details'),
('c1111111-1111-4111-8111-111111111111', 'EQUIPMENT_CLEAN', 'Equipment cleaned', 'follow_up', 'Record disinfection checks'),
('c1111111-1111-4111-8111-111111111111', 'ENTRY_CONTROL', 'Entry controls followed', 'done', NULL),
('c2222222-2222-4222-8222-222222222222', 'VISITOR_LOG', 'Visitor log maintained', 'done', NULL),
('c2222222-2222-4222-2222-222222222222', 'EQUIPMENT_CLEAN', 'Equipment cleaned', 'done', NULL),
('c3333333-3333-4333-8333-333333333333', 'WILD_BIRD_CONTROL', 'Wild-bird contact prevented', 'follow_up', 'Review shed entry controls'),
('c3333333-3333-4333-8333-333333333333', 'MORTALITY_DISPOSAL', 'Dead birds removed promptly', 'done', NULL)
ON CONFLICT (assessment_id, criterion_code) DO NOTHING;

COMMIT;
