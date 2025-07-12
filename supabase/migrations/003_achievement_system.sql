-- Achievement System Migration
-- Creates tables and functions for the achievement system

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  points INTEGER NOT NULL DEFAULT 0,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward JSONB NOT NULL DEFAULT '{}',
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique achievements per character
  UNIQUE(character_id, key)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_achievements_character_id ON achievements(character_id);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(key);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON achievements(tier);
CREATE INDEX IF NOT EXISTS idx_achievements_achieved_at ON achievements(achieved_at);

-- Create character_statistics table for tracking various counts
CREATE TABLE IF NOT EXISTS character_statistics (
  character_id UUID PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  total_bugs_used INTEGER DEFAULT 0,
  total_visits_given INTEGER DEFAULT 0,
  total_visits_received INTEGER DEFAULT 0,
  total_gifts_given INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_seeds_created INTEGER DEFAULT 0,
  total_seed_shares INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  perfect_timing_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  last_bug_feed_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for character_statistics
CREATE INDEX IF NOT EXISTS idx_character_statistics_character_id ON character_statistics(character_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_character_statistics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_character_statistics_updated_at
  BEFORE UPDATE ON character_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_character_statistics_updated_at();

-- RPC function to add coins to character
CREATE OR REPLACE FUNCTION add_character_coins(character_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE characters 
  SET coins = coins + amount 
  WHERE id = character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to add experience to character
CREATE OR REPLACE FUNCTION add_character_exp(character_id UUID, amount INTEGER)
RETURNS VOID AS $$
DECLARE
  new_exp INTEGER;
  new_level INTEGER;
BEGIN
  -- Update experience
  UPDATE characters 
  SET exp = exp + amount 
  WHERE id = character_id
  RETURNING exp INTO new_exp;
  
  -- Calculate new level
  new_level = FLOOR(SQRT(new_exp / 100.0)) + 1;
  
  -- Update level if changed
  UPDATE characters 
  SET level = new_level 
  WHERE id = character_id AND level < new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to add items to character
CREATE OR REPLACE FUNCTION add_character_items(character_id UUID, items TEXT[])
RETURNS VOID AS $$
BEGIN
  UPDATE characters 
  SET items = array_cat(items, $2)
  WHERE id = character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment bug usage statistics
CREATE OR REPLACE FUNCTION increment_bug_usage(character_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO character_statistics (character_id, total_bugs_used, last_bug_feed_time)
  VALUES (character_id, 1, NOW())
  ON CONFLICT (character_id) 
  DO UPDATE SET 
    total_bugs_used = character_statistics.total_bugs_used + 1,
    last_bug_feed_time = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment visit statistics
CREATE OR REPLACE FUNCTION increment_visit_stats(visitor_id UUID, visited_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Increment visits given for visitor
  INSERT INTO character_statistics (character_id, total_visits_given)
  VALUES (visitor_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_visits_given = character_statistics.total_visits_given + 1;
  
  -- Increment visits received for visited character
  INSERT INTO character_statistics (character_id, total_visits_received)
  VALUES (visited_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_visits_received = character_statistics.total_visits_received + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment gift statistics
CREATE OR REPLACE FUNCTION increment_gift_stats(giver_id UUID, receiver_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Increment gifts given for giver
  INSERT INTO character_statistics (character_id, total_gifts_given)
  VALUES (giver_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_gifts_given = character_statistics.total_gifts_given + 1;
  
  -- Increment gifts received for receiver
  INSERT INTO character_statistics (character_id, total_gifts_received)
  VALUES (receiver_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_gifts_received = character_statistics.total_gifts_received + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to increment seed statistics
CREATE OR REPLACE FUNCTION increment_seed_stats(creator_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO character_statistics (character_id, total_seeds_created)
  VALUES (creator_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_seeds_created = character_statistics.total_seeds_created + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get character statistics
CREATE OR REPLACE FUNCTION get_character_statistics(character_id UUID)
RETURNS character_statistics AS $$
DECLARE
  result character_statistics;
BEGIN
  SELECT * INTO result
  FROM character_statistics
  WHERE character_statistics.character_id = $1;
  
  -- If no statistics exist, create default entry
  IF NOT FOUND THEN
    INSERT INTO character_statistics (character_id)
    VALUES (character_id)
    RETURNING * INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(character_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_streak INTEGER := 0;
  last_login DATE;
  today DATE := CURRENT_DATE;
BEGIN
  -- Get current statistics
  SELECT daily_streak, last_login_date INTO current_streak, last_login
  FROM character_statistics
  WHERE character_statistics.character_id = $1;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO character_statistics (character_id, daily_streak, last_login_date)
    VALUES (character_id, 1, today);
    RETURN 1;
  END IF;
  
  -- Check if this is a new day
  IF last_login IS NULL OR last_login < today THEN
    -- Check if streak continues (yesterday)
    IF last_login = today - INTERVAL '1 day' THEN
      current_streak := current_streak + 1;
    ELSE
      current_streak := 1; -- Reset streak
    END IF;
    
    -- Update statistics
    UPDATE character_statistics
    SET daily_streak = current_streak, last_login_date = today
    WHERE character_statistics.character_id = $1;
  END IF;
  
  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create initial statistics entries for existing characters
INSERT INTO character_statistics (character_id)
SELECT id FROM characters
ON CONFLICT (character_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for achievements
CREATE POLICY "Users can view their own character achievements" ON achievements
  FOR SELECT USING (true); -- Public read for now

CREATE POLICY "System can insert achievements" ON achievements
  FOR INSERT WITH CHECK (true); -- System-controlled insertions

-- Create RLS policies for character_statistics  
CREATE POLICY "Users can view character statistics" ON character_statistics
  FOR SELECT USING (true); -- Public read for now

CREATE POLICY "System can update character statistics" ON character_statistics
  FOR ALL USING (true); -- System-controlled updates

COMMENT ON TABLE achievements IS 'Stores character achievements with rewards and metadata';
COMMENT ON TABLE character_statistics IS 'Tracks various character statistics for achievement system';
COMMENT ON FUNCTION add_character_coins(UUID, INTEGER) IS 'Adds coins to a character for achievement rewards';
COMMENT ON FUNCTION add_character_exp(UUID, INTEGER) IS 'Adds experience to a character and updates level';
COMMENT ON FUNCTION increment_bug_usage(UUID) IS 'Increments bug usage count for achievement tracking';
COMMENT ON FUNCTION get_character_statistics(UUID) IS 'Gets character statistics, creating default if needed';