-- Seed data for testing the social system
-- Create some test characters for interaction

-- Test Character 1: Alice the Cat Warrior
INSERT INTO characters (id, name, password_hash, species, job, level, age, stats, emotion, coins, exp, items, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Alice',
  '$2b$10$8K8QJQy6yGZ5QJQy6yGZ5uJ8QJQy6yGZ5QJQy6yGZ5QJQy6yGZ5', -- password: 'test123'
  'cat',
  'warrior',
  15,
  45,
  '{"str": 25, "dex": 18, "int": 12, "vit": 20, "agi": 16, "luk": 14, "playfulness": 18, "curiosity": 15, "sensitivity": 12, "awareness": 16, "meddling": 10, "pragmatism": 14, "appetite": 20, "anger_control": 13, "clumsiness": 8}',
  'happy',
  2500,
  2200,
  ARRAY['sword', 'shield', 'health_potion'],
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (name) DO NOTHING;

-- Test Character 2: Bob the Dog Mage
INSERT INTO characters (id, name, password_hash, species, job, level, age, stats, emotion, coins, exp, items, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'Bob',
  '$2b$10$8K8QJQy6yGZ5QJQy6yGZ5uJ8QJQy6yGZ5QJQy6yGZ5QJQy6yGZ5', -- password: 'test123'
  'dog',
  'mage',
  12,
  30,
  '{"str": 10, "dex": 14, "int": 28, "vit": 15, "agi": 12, "luk": 18, "playfulness": 14, "curiosity": 25, "sensitivity": 18, "awareness": 20, "meddling": 16, "pragmatism": 22, "appetite": 12, "anger_control": 15, "clumsiness": 12}',
  'curious',
  1800,
  1400,
  ARRAY['magic_staff', 'mana_potion', 'spellbook'],
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (name) DO NOTHING;

-- Test Character 3: Charlie the Rabbit Archer
INSERT INTO characters (id, name, password_hash, species, job, level, age, stats, emotion, coins, exp, items, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'Charlie',
  '$2b$10$8K8QJQy6yGZ5QJQy6yGZ5uJ8QJQy6yGZ5QJQy6yGZ5QJQy6yGZ5', -- password: 'test123'
  'rabbit',
  'archer',
  18,
  60,
  '{"str": 16, "dex": 26, "int": 15, "vit": 18, "agi": 24, "luk": 16, "playfulness": 20, "curiosity": 18, "sensitivity": 14, "awareness": 22, "meddling": 8, "pragmatism": 16, "appetite": 15, "anger_control": 18, "clumsiness": 6}',
  'calm',
  3200,
  3200,
  ARRAY['bow', 'arrows', 'stealth_cloak'],
  NOW() - INTERVAL '3 hours'
)
ON CONFLICT (name) DO NOTHING;

-- Test Character 4: Diana the Fox Scholar
INSERT INTO characters (id, name, password_hash, species, job, level, age, stats, emotion, coins, exp, items, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'Diana',
  '$2b$10$8K8QJQy6yGZ5QJQy6yGZ5uJ8QJQy6yGZ5QJQy6yGZ5QJQy6yGZ5', -- password: 'test123'
  'fox',
  'scholar',
  10,
  25,
  '{"str": 8, "dex": 12, "int": 30, "vit": 12, "agi": 15, "luk": 20, "playfulness": 12, "curiosity": 30, "sensitivity": 20, "awareness": 25, "meddling": 18, "pragmatism": 25, "appetite": 10, "anger_control": 20, "clumsiness": 15}',
  'excited',
  1200,
  900,
  ARRAY['research_notes', 'magnifying_glass', 'wisdom_scroll'],
  NOW() - INTERVAL '6 hours'
)
ON CONFLICT (name) DO NOTHING;

-- Create character activities for test characters
INSERT INTO character_activity (character_id, last_active_at, online_status, public_message, total_visitors, total_visits_given, popularity_score)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '30 minutes',
    'away',
    'Training hard to become stronger! 💪',
    15,
    8,
    23
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '2 hours',
    'offline',
    'Studying ancient magic spells 📚✨',
    8,
    12,
    16
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    NOW() - INTERVAL '10 minutes',
    'online',
    'Perfect weather for archery practice! 🏹',
    22,
    18,
    35
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    NOW() - INTERVAL '1 hour',
    'online',
    'Always happy to help with research! 🦊📖',
    6,
    3,
    12
  )
ON CONFLICT (character_id) DO UPDATE SET
  last_active_at = EXCLUDED.last_active_at,
  online_status = EXCLUDED.online_status,
  public_message = EXCLUDED.public_message,
  total_visitors = EXCLUDED.total_visitors,
  total_visits_given = EXCLUDED.total_visits_given,
  popularity_score = EXCLUDED.popularity_score;

-- Create some friendship relationships
INSERT INTO friendships (requester_id, addressee_id, status, created_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'accepted', NOW() - INTERVAL '1 day'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 'accepted', NOW() - INTERVAL '2 days'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'pending', NOW() - INTERVAL '3 hours')
ON CONFLICT (requester_id, addressee_id) DO NOTHING;

-- Create some visit history
INSERT INTO visits (visitor_id, visited_id, visit_type, interaction_data, visited_at)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440003',
    'play',
    '{"message": "Want to train together?", "activity": "combat_practice"}',
    NOW() - INTERVAL '4 hours'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440001',
    'greeting',
    '{"message": "Hello friend! How are you today?"}',
    NOW() - INTERVAL '6 hours'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440004',
    'help',
    '{"message": "Need help with magic research", "assistance_type": "knowledge_sharing"}',
    NOW() - INTERVAL '1 day'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    'casual',
    '{"message": "Thanks for the help earlier!"}',
    NOW() - INTERVAL '8 hours'
  )
ON CONFLICT DO NOTHING;

-- Update character statistics based on activities
INSERT INTO character_statistics (character_id, total_bugs_used, total_visits_given, total_visits_received, total_gifts_given, total_gifts_received)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 25, 8, 15, 3, 5),
  ('550e8400-e29b-41d4-a716-446655440002', 18, 12, 8, 2, 3),
  ('550e8400-e29b-41d4-a716-446655440003', 32, 18, 22, 6, 8),
  ('550e8400-e29b-41d4-a716-446655440004', 12, 3, 6, 1, 2)
ON CONFLICT (character_id) DO UPDATE SET
  total_bugs_used = EXCLUDED.total_bugs_used,
  total_visits_given = EXCLUDED.total_visits_given,
  total_visits_received = EXCLUDED.total_visits_received,
  total_gifts_given = EXCLUDED.total_gifts_given,
  total_gifts_received = EXCLUDED.total_gifts_received;