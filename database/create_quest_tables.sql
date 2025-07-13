-- 퀘스트 시스템 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요

-- 1. 퀘스트 정의 테이블 생성
CREATE TABLE IF NOT EXISTS quest_definitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  min_duration_hours INTEGER NOT NULL,
  max_duration_hours INTEGER NOT NULL,
  min_reward_food INTEGER NOT NULL,
  max_reward_food INTEGER NOT NULL,
  bonus_reward_chance DECIMAL(3,2) NOT NULL,
  bonus_reward_food INTEGER NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 개별 퀘스트 테이블 생성
CREATE TABLE IF NOT EXISTS quests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  duration_hours INTEGER NOT NULL,
  reward_food_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기본 퀘스트 정의 삽입 (테스트용)
INSERT INTO quest_definitions (id, title, description, min_duration_hours, max_duration_hours, min_reward_food, max_reward_food, bonus_reward_chance, bonus_reward_food, category, difficulty) VALUES
('quest_001', '아침 운동', '가벼운 운동으로 하루를 시작하여 에너지를 충전하세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_002', '숲 탐험', '신비로운 숲을 탐험하고 숨겨진 보물을 발견하세요.', 10, 16, 4, 6, 0.05, 10, 'adventure', 'normal')
ON CONFLICT (id) DO NOTHING;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quest_definitions_category ON quest_definitions(category);
CREATE INDEX IF NOT EXISTS idx_quest_definitions_difficulty ON quest_definitions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_character_id ON quests(character_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);

-- 5. RLS 정책 설정 (필요한 경우)
-- ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- 6. 확인 쿼리
SELECT 'quest_definitions' as table_name, COUNT(*) as row_count FROM quest_definitions
UNION ALL
SELECT 'quests' as table_name, COUNT(*) as row_count FROM quests; 