# 퀘스트 시스템 DB 설정 가이드

## 1. Supabase SQL Editor에서 실행

Supabase 대시보드 → SQL Editor에서 다음 스크립트를 실행하세요:

```sql
-- 퀘스트 정의 테이블 생성
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

-- 개별 퀘스트 테이블 생성
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

-- 기존 데이터 삭제 (재실행 시)
DELETE FROM quest_definitions;

-- 20개의 한글 퀘스트 정의 삽입
INSERT INTO quest_definitions (id, title, description, min_duration_hours, max_duration_hours, min_reward_food, max_reward_food, bonus_reward_chance, bonus_reward_food, category, difficulty) VALUES
-- Daily Quests (일일 퀘스트)
('quest_001', '아침 운동', '가벼운 운동으로 하루를 시작하여 에너지를 충전하세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_002', '저녁 명상', '명상과 성찰을 통해 내면의 평화를 찾으세요.', 8, 12, 3, 5, 0.05, 10, 'daily', 'easy'),
('quest_003', '건강한 식사 준비', '일주일을 위한 영양가 있는 식사를 준비하세요.', 9, 13, 4, 6, 0.05, 10, 'daily', 'normal'),
('quest_004', '일일 독서', '한 시간 동안 책을 읽어 지식을 확장하세요.', 8, 11, 3, 4, 0.05, 10, 'daily', 'easy'),
('quest_005', '창작 글쓰기', '창작 글쓰기를 통해 자신을 표현하세요.', 10, 14, 4, 6, 0.05, 10, 'daily', 'normal'),

-- Adventure Quests (모험 퀘스트)
('quest_006', '숲 탐험', '신비로운 숲을 탐험하고 숨겨진 보물을 발견하세요.', 10, 16, 4, 6, 0.05, 10, 'adventure', 'normal'),
('quest_007', '산 등반', '최고봉을 등반하고 숨막히는 전망을 즐기세요.', 12, 16, 5, 7, 0.05, 10, 'adventure', 'hard'),
('quest_008', '동굴 다이빙', '고대 동굴의 깊은 곳을 탐험하고 희귀한 광물을 찾으세요.', 14, 16, 6, 7, 0.05, 10, 'adventure', 'epic'),
('quest_009', '강 래프팅', '급류를 통과하며 백워터의 스릴을 경험하세요.', 11, 15, 4, 6, 0.05, 10, 'adventure', 'normal'),
('quest_010', '사막 탐험', '광활한 사막을 건너고 고대 오아시스를 발견하세요.', 13, 16, 5, 7, 0.05, 10, 'adventure', 'hard'),

-- Social Quests (사회 퀘스트)
('quest_011', '친구 모임', '친구들과 만나 사회적 유대를 강화하세요.', 8, 14, 3, 7, 0.05, 10, 'social', 'easy'),
('quest_012', '봉사 활동', '시간을 내어 지역사회를 돕는 봉사활동을 하세요.', 10, 15, 4, 6, 0.05, 10, 'social', 'normal'),
('quest_013', '팀워크 구축', '팀 활동에 참여하여 더 강한 관계를 구축하세요.', 9, 13, 3, 5, 0.05, 10, 'social', 'easy'),
('quest_014', '멘토링 프로그램', '지식을 나누어 도움이 필요한 사람을 멘토링하세요.', 11, 16, 5, 7, 0.05, 10, 'social', 'hard'),
('quest_015', '문화 교류', '의미 있는 대화를 통해 다양한 문화에 대해 배우세요.', 10, 14, 4, 6, 0.05, 10, 'social', 'normal'),

-- Crafting Quests (제작 퀘스트)
('quest_016', '대작 제작', '제작 기술을 사용하여 놀라운 것을 만들어보세요.', 12, 16, 5, 7, 0.05, 10, 'crafting', 'hard'),
('quest_017', '정원 가꾸기', '정원을 돌보고 아름다운 식물을 기르세요.', 9, 13, 3, 5, 0.05, 10, 'crafting', 'easy'),
('quest_018', '예술 작품 창작', '그림이나 그림을 통해 창의성을 표현하세요.', 10, 14, 4, 6, 0.05, 10, 'crafting', 'normal'),
('quest_019', '음악 작곡', '아름다운 음악을 작곡하세요.', 11, 15, 4, 6, 0.05, 10, 'crafting', 'normal'),
('quest_020', '전설의 유물', '전설적인 무기나 유물을 제작하세요.', 14, 16, 6, 7, 0.05, 10, 'crafting', 'legendary');

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_quest_definitions_category ON quest_definitions(category);
CREATE INDEX IF NOT EXISTS idx_quest_definitions_difficulty ON quest_definitions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quests_character_id ON quests(character_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
```

## 2. 확인 방법

스크립트 실행 후 다음을 확인하세요:

1. **테이블 생성 확인**: Table Editor에서 `quest_definitions`와 `quests` 테이블이 생성되었는지 확인
2. **데이터 확인**: `quest_definitions` 테이블에 20개의 퀘스트가 있는지 확인
3. **권한 확인**: RLS(Row Level Security)가 활성화되어 있다면 적절한 정책 설정

## 3. 문제 해결

### 퀘스트 로딩 실패 시:
1. 브라우저 개발자 도구(F12) → Console 탭에서 에러 메시지 확인
2. Supabase 대시보드 → Logs에서 API 호출 로그 확인
3. 테이블 권한 설정 확인

### 임시 해결책:
- DB 연결이 안 될 경우 localStorage에 임시로 퀘스트가 저장됩니다
- "새 퀘스트 생성" 버튼을 클릭하여 테스트해보세요 