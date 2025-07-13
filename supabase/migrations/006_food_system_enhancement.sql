-- 먹이 시스템 완전 Supabase 기반화 마이그레이션
-- 2024-12-19

-- 1. 기존 bugs 테이블 수정 (타입 구분 추가)
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'small' CHECK (type IN ('small', 'large'));
ALTER TABLE bugs ADD COLUMN IF NOT EXISTS used BOOLEAN DEFAULT FALSE;

-- 2. 상자 시스템 테이블 생성
CREATE TABLE IF NOT EXISTS boxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  opened BOOLEAN DEFAULT FALSE,
  opened_at TIMESTAMPTZ,
  reward JSONB DEFAULT '{}'::jsonb
);

-- 3. 먹이 생성 타이머 테이블 생성
CREATE TABLE IF NOT EXISTS food_timers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE UNIQUE,
  last_food_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bugs_character_type ON bugs(character_id, type);
CREATE INDEX IF NOT EXISTS idx_bugs_used ON bugs(used);
CREATE INDEX IF NOT EXISTS idx_boxes_character_id ON boxes(character_id);
CREATE INDEX IF NOT EXISTS idx_boxes_opened ON boxes(opened);
CREATE INDEX IF NOT EXISTS idx_food_timers_character_id ON food_timers(character_id);

-- 5. RLS 정책 설정
ALTER TABLE boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for authenticated users" ON boxes FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON food_timers FOR ALL USING (true);

-- 6. 먹이 자동 변환 함수 (10개 작은 먹이 → 1개 큰 먹이)
CREATE OR REPLACE FUNCTION convert_small_to_large_food(character_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  small_food_count INTEGER;
  large_food_count INTEGER;
BEGIN
  -- 사용되지 않은 작은 먹이 개수 확인
  SELECT COUNT(*) INTO small_food_count 
  FROM bugs 
  WHERE character_id = character_uuid 
    AND type = 'small' 
    AND used = FALSE;
  
  -- 10개씩 큰 먹이로 변환
  large_food_count := small_food_count / 10;
  
  IF large_food_count > 0 THEN
    -- 10개씩 작은 먹이를 사용 처리
    UPDATE bugs 
    SET used = TRUE 
    WHERE id IN (
      SELECT id FROM bugs 
      WHERE character_id = character_uuid 
        AND type = 'small' 
        AND used = FALSE 
      LIMIT (large_food_count * 10)
    );
    
    -- 큰 먹이 생성
    INSERT INTO bugs (character_id, type, used)
    SELECT character_uuid, 'large', FALSE
    FROM generate_series(1, large_food_count);
  END IF;
  
  RETURN large_food_count;
END;
$$ LANGUAGE plpgsql;

-- 7. 오프라인 먹이 생성 함수
CREATE OR REPLACE FUNCTION generate_offline_food(character_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  last_time TIMESTAMPTZ;
  now_ts TIMESTAMPTZ;
  time_diff INTERVAL;
  food_to_generate INTEGER;
  small_food_count INTEGER;
BEGIN
  -- 현재 시간
  now_ts := NOW();
  
  -- 마지막 먹이 생성 시간 조회
  SELECT last_food_time INTO last_time
  FROM food_timers
  WHERE character_id = character_uuid;
  
  -- 타이머가 없으면 생성
  IF last_time IS NULL THEN
    INSERT INTO food_timers (character_id, last_food_time)
    VALUES (character_uuid, now_ts)
    ON CONFLICT (character_id) DO UPDATE SET last_food_time = now_ts;
    RETURN 0;
  END IF;
  
  -- 시간 차이 계산 (30분 = 1800초)
  time_diff := now_ts - last_time;
  food_to_generate := EXTRACT(EPOCH FROM time_diff) / 1800;
  
  -- 생성할 먹이가 있고, 작은 먹이가 100개 미만인 경우
  IF food_to_generate > 0 THEN
    SELECT COUNT(*) INTO small_food_count 
    FROM bugs 
    WHERE character_id = character_uuid 
      AND type = 'small' 
      AND used = FALSE;
    
    IF small_food_count < 100 THEN
      -- 작은 먹이 생성
      INSERT INTO bugs (character_id, type, used)
      SELECT character_uuid, 'small', FALSE
      FROM generate_series(1, LEAST(food_to_generate, 100 - small_food_count));
      
            -- 타이머 업데이트
      UPDATE food_timers
      SET last_food_time = last_time + (INTERVAL '30 minutes' * food_to_generate),
          updated_at = now_ts
      WHERE character_id = character_uuid;
      
      -- 큰 먹이로 변환
      PERFORM convert_small_to_large_food(character_uuid);
      
      RETURN LEAST(food_to_generate, 100 - small_food_count);
    END IF;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 8. 초기 먹이 생성 함수 (새 캐릭터용)
CREATE OR REPLACE FUNCTION create_initial_food(character_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- 초기 작은 먹이 9개 생성
  INSERT INTO bugs (character_id, type, used)
  SELECT character_uuid, 'small', FALSE
  FROM generate_series(1, 9);
  
  -- 타이머 생성
  INSERT INTO food_timers (character_id, last_food_time)
  VALUES (character_uuid, NOW())
  ON CONFLICT (character_id) DO NOTHING;
  
  -- 큰 먹이로 변환
  PERFORM convert_small_to_large_food(character_uuid);
END;
$$ LANGUAGE plpgsql; 