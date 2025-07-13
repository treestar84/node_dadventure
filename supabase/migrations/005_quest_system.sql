-- 퀘스트 시스템 마이그레이션
-- 2024-12-19

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

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_quest_definitions_category ON quest_definitions(category);
CREATE INDEX IF NOT EXISTS idx_quest_definitions_difficulty ON quest_definitions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_character_id ON quests(character_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);

-- 4. 20개의 퀘스트 정의 삽입 (한국어)
INSERT INTO quest_definitions (id, title, description, min_duration_hours, max_duration_hours, min_reward_food, max_reward_food, bonus_reward_chance, bonus_reward_food, category, difficulty) VALUES
('quest_001', '아침 운동', '가벼운 운동으로 하루를 시작하여 에너지를 충전하세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_002', '숲 탐험', '신비로운 숲을 탐험하고 숨겨진 보물을 발견하세요.', 10, 16, 4, 6, 0.05, 10, 'adventure', 'normal'),
('quest_003', '요리 도전', '새로운 요리법을 배우고 맛있는 음식을 만들어보세요.', 9, 14, 3, 6, 0.05, 10, 'daily', 'normal'),
('quest_004', '독서 시간', '흥미로운 책을 읽고 지식을 쌓아보세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_005', '정원 가꾸기', '아름다운 정원을 만들고 식물들을 돌봐주세요.', 12, 18, 4, 7, 0.05, 10, 'daily', 'normal'),
('quest_006', '산악 등반', '높은 산을 오르고 멋진 경치를 감상하세요.', 14, 20, 5, 7, 0.05, 10, 'adventure', 'hard'),
('quest_007', '바다 탐험', '깊은 바다를 탐험하고 해양 생물을 관찰하세요.', 16, 24, 5, 8, 0.05, 10, 'adventure', 'hard'),
('quest_008', '악기 연습', '새로운 악기를 배우고 아름다운 음악을 연주하세요.', 10, 15, 4, 6, 0.05, 10, 'daily', 'normal'),
('quest_009', '그림 그리기', '창의력을 발휘하여 아름다운 그림을 그려보세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_010', '요가 수련', '마음과 몸을 정화하는 요가를 연습하세요.', 9, 13, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_011', '캠핑 여행', '자연 속에서 캠핑을 즐기고 야외 활동을 해보세요.', 12, 18, 4, 7, 0.05, 10, 'adventure', 'normal'),
('quest_012', '수영 연습', '수영 기술을 향상시키고 물속에서 자유롭게 헤엄치세요.', 10, 16, 4, 6, 0.05, 10, 'daily', 'normal'),
('quest_013', '천문 관측', '밤하늘의 별들을 관찰하고 우주의 신비를 탐구하세요.', 14, 20, 5, 7, 0.05, 10, 'adventure', 'hard'),
('quest_014', '요리 대회', '다른 요리사들과 경쟁하며 요리 실력을 뽐내세요.', 11, 17, 4, 7, 0.05, 10, 'daily', 'normal'),
('quest_015', '댄스 연습', '리듬에 맞춰 춤을 추고 몸을 자유롭게 움직이세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_016', '등산 여행', '아름다운 산길을 따라 등산하며 자연을 만끽하세요.', 13, 19, 4, 7, 0.05, 10, 'adventure', 'normal'),
('quest_017', '수공예품 만들기', '손으로 아름다운 공예품을 만들어 창의력을 발휘하세요.', 9, 14, 3, 6, 0.05, 10, 'daily', 'normal'),
('quest_018', '자전거 여행', '자전거를 타고 새로운 장소를 탐험해보세요.', 10, 16, 4, 6, 0.05, 10, 'adventure', 'normal'),
('quest_019', '명상 시간', '마음을 차분히 하고 내면의 평화를 찾아보세요.', 7, 11, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_020', '보물 찾기', '지도와 단서를 따라 숨겨진 보물을 찾아보세요.', 15, 22, 5, 8, 0.05, 10, 'adventure', 'hard')
ON CONFLICT (id) DO NOTHING;

-- 5. RLS 정책 설정 (필요한 경우)
-- ALTER TABLE quest_definitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quests ENABLE ROW LEVEL SECURITY; 