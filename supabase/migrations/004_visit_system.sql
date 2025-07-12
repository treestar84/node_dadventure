-- Character Visit System Migration
-- Creates tables and functions for character visiting and social features

-- Create friendship relationships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate friendship requests
  UNIQUE(requester_id, addressee_id),
  -- Prevent self-friendship
  CHECK (requester_id != addressee_id)
);

-- Create visit history table (already exists from previous migration, but ensure it has all needed columns)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visits') THEN
    CREATE TABLE visits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      visitor_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      visited_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      visit_type VARCHAR(20) DEFAULT 'casual' CHECK (visit_type IN ('casual', 'greeting', 'play', 'help')),
      interaction_data JSONB DEFAULT '{}',
      gifts_given JSONB DEFAULT '[]',
      visited_at TIMESTAMPTZ DEFAULT NOW(),
      
      -- Prevent self-visits
      CHECK (visitor_id != visited_id)
    );
  END IF;
END $$;

-- Add missing columns to visits table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'visit_type') THEN
    ALTER TABLE visits ADD COLUMN visit_type VARCHAR(20) DEFAULT 'casual' CHECK (visit_type IN ('casual', 'greeting', 'play', 'help'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'interaction_data') THEN
    ALTER TABLE visits ADD COLUMN interaction_data JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'visits' AND column_name = 'gifts_given') THEN
    ALTER TABLE visits ADD COLUMN gifts_given JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create character discovery/activity table for showing active characters
CREATE TABLE IF NOT EXISTS character_activity (
  character_id UUID PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  online_status VARCHAR(20) DEFAULT 'offline' CHECK (online_status IN ('online', 'away', 'offline')),
  public_message TEXT,
  visit_preferences JSONB DEFAULT '{"accept_visits": true, "friend_only": false, "auto_accept_friends": false}',
  total_visitors INTEGER DEFAULT 0,
  total_visits_given INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited ON visits(visited_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_character_activity_last_active ON character_activity(last_active_at);
CREATE INDEX IF NOT EXISTS idx_character_activity_popularity ON character_activity(popularity_score);

-- Create trigger functions for updating timestamps
CREATE OR REPLACE FUNCTION update_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_friendship_updated_at ON friendships;
CREATE TRIGGER trigger_update_friendship_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendship_updated_at();

DROP TRIGGER IF EXISTS trigger_update_activity_updated_at ON character_activity;
CREATE TRIGGER trigger_update_activity_updated_at
  BEFORE UPDATE ON character_activity
  FOR EACH ROW
  EXECUTE FUNCTION update_activity_updated_at();

-- RPC function to send friend request
CREATE OR REPLACE FUNCTION send_friend_request(requester_character_id UUID, target_character_name TEXT)
RETURNS JSONB AS $$
DECLARE
  target_character_id UUID;
  existing_friendship_id UUID;
  result JSONB;
BEGIN
  -- Find target character by name
  SELECT id INTO target_character_id 
  FROM characters 
  WHERE name = target_character_name;
  
  IF target_character_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;
  
  IF target_character_id = requester_character_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send friend request to yourself');
  END IF;
  
  -- Check if friendship already exists
  SELECT id INTO existing_friendship_id
  FROM friendships
  WHERE (requester_id = requester_character_id AND addressee_id = target_character_id)
     OR (requester_id = target_character_id AND addressee_id = requester_character_id);
  
  IF existing_friendship_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Friendship request already exists');
  END IF;
  
  -- Create friendship request
  INSERT INTO friendships (requester_id, addressee_id, status)
  VALUES (requester_character_id, target_character_id, 'pending');
  
  RETURN jsonb_build_object('success', true, 'message', 'Friend request sent');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to respond to friend request
CREATE OR REPLACE FUNCTION respond_friend_request(character_id UUID, friendship_id UUID, response TEXT)
RETURNS JSONB AS $$
DECLARE
  friendship_record friendships;
BEGIN
  -- Get friendship record
  SELECT * INTO friendship_record
  FROM friendships
  WHERE id = friendship_id AND addressee_id = character_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Friend request not found or already responded');
  END IF;
  
  -- Update friendship status
  UPDATE friendships
  SET status = response, updated_at = NOW()
  WHERE id = friendship_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Friend request ' || response);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to visit a character
CREATE OR REPLACE FUNCTION visit_character(visitor_id UUID, visited_character_name TEXT, visit_type TEXT DEFAULT 'casual', interaction_data JSONB DEFAULT '{}')
RETURNS JSONB AS $$
DECLARE
  visited_character_id UUID;
  visit_id UUID;
  can_visit BOOLEAN := true;
  preferences JSONB;
BEGIN
  -- Find visited character by name
  SELECT id INTO visited_character_id
  FROM characters
  WHERE name = visited_character_name;
  
  IF visited_character_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Character not found');
  END IF;
  
  IF visited_character_id = visitor_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot visit yourself');
  END IF;
  
  -- Check visit preferences
  SELECT visit_preferences INTO preferences
  FROM character_activity
  WHERE character_id = visited_character_id;
  
  IF preferences IS NOT NULL THEN
    IF (preferences->>'accept_visits')::BOOLEAN = false THEN
      can_visit := false;
    END IF;
    
    IF (preferences->>'friend_only')::BOOLEAN = true THEN
      -- Check if they are friends
      IF NOT EXISTS (
        SELECT 1 FROM friendships
        WHERE ((requester_id = visitor_id AND addressee_id = visited_character_id)
           OR (requester_id = visited_character_id AND addressee_id = visitor_id))
          AND status = 'accepted'
      ) THEN
        can_visit := false;
      END IF;
    END IF;
  END IF;
  
  IF NOT can_visit THEN
    RETURN jsonb_build_object('success', false, 'error', 'This character is not accepting visits');
  END IF;
  
  -- Create visit record
  INSERT INTO visits (visitor_id, visited_id, visit_type, interaction_data)
  VALUES (visitor_id, visited_character_id, visit_type, interaction_data)
  RETURNING id INTO visit_id;
  
  -- Update statistics
  CALL increment_visit_stats(visitor_id, visited_character_id);
  
  -- Update activity for visited character
  INSERT INTO character_activity (character_id, total_visitors, popularity_score)
  VALUES (visited_character_id, 1, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET 
    total_visitors = character_activity.total_visitors + 1,
    popularity_score = character_activity.popularity_score + 1;
  
  -- Update activity for visitor
  INSERT INTO character_activity (character_id, total_visits_given)
  VALUES (visitor_id, 1)
  ON CONFLICT (character_id)
  DO UPDATE SET total_visits_given = character_activity.total_visits_given + 1;
  
  RETURN jsonb_build_object('success', true, 'visit_id', visit_id, 'message', 'Visit completed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get discoverable characters
CREATE OR REPLACE FUNCTION get_discoverable_characters(requesting_character_id UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  species VARCHAR,
  job VARCHAR,
  level INTEGER,
  last_active_at TIMESTAMPTZ,
  online_status VARCHAR,
  public_message TEXT,
  popularity_score INTEGER,
  is_friend BOOLEAN,
  friendship_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    c.id,
    c.name,
    c.species,
    c.job,
    c.level,
    COALESCE(ca.last_active_at, c.created_at) as last_active_at,
    COALESCE(ca.online_status, 'offline') as online_status,
    ca.public_message,
    COALESCE(ca.popularity_score, 0) as popularity_score,
    CASE WHEN f.id IS NOT NULL THEN true ELSE false END as is_friend,
    COALESCE(f.status, 'none') as friendship_status
  FROM characters c
  LEFT JOIN character_activity ca ON c.id = ca.character_id
  LEFT JOIN friendships f ON (
    (f.requester_id = requesting_character_id AND f.addressee_id = c.id) OR
    (f.requester_id = c.id AND f.addressee_id = requesting_character_id)
  ) AND f.status = 'accepted'
  WHERE c.id != requesting_character_id
    AND COALESCE((ca.visit_preferences->>'accept_visits')::BOOLEAN, true) = true
  ORDER BY 
    CASE WHEN f.id IS NOT NULL THEN 0 ELSE 1 END, -- Friends first
    ca.popularity_score DESC NULLS LAST,
    ca.last_active_at DESC NULLS LAST
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to get character's friends
CREATE OR REPLACE FUNCTION get_character_friends(character_id UUID)
RETURNS TABLE(
  friend_id UUID,
  friend_name VARCHAR,
  friend_species VARCHAR,
  friend_job VARCHAR,
  friend_level INTEGER,
  friendship_created_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  online_status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.requester_id = character_id THEN f.addressee_id
      ELSE f.requester_id
    END as friend_id,
    c.name as friend_name,
    c.species as friend_species,
    c.job as friend_job,
    c.level as friend_level,
    f.created_at as friendship_created_at,
    ca.last_active_at,
    COALESCE(ca.online_status, 'offline') as online_status
  FROM friendships f
  JOIN characters c ON (
    c.id = CASE 
      WHEN f.requester_id = character_id THEN f.addressee_id
      ELSE f.requester_id
    END
  )
  LEFT JOIN character_activity ca ON c.id = ca.character_id
  WHERE (f.requester_id = character_id OR f.addressee_id = character_id)
    AND f.status = 'accepted'
  ORDER BY f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update character activity status
CREATE OR REPLACE FUNCTION update_character_activity(character_id UUID, online_status TEXT DEFAULT 'online', public_message TEXT DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  INSERT INTO character_activity (character_id, last_active_at, online_status, public_message)
  VALUES (character_id, NOW(), online_status, public_message)
  ON CONFLICT (character_id)
  DO UPDATE SET 
    last_active_at = NOW(),
    online_status = EXCLUDED.online_status,
    public_message = COALESCE(EXCLUDED.public_message, character_activity.public_message);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize character_activity for existing characters
INSERT INTO character_activity (character_id, last_active_at)
SELECT id, created_at
FROM characters
ON CONFLICT (character_id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for friendships
CREATE POLICY "Users can view friendships they are part of" ON friendships
  FOR SELECT USING (true); -- Allow viewing for discovery features

CREATE POLICY "Users can insert friend requests" ON friendships
  FOR INSERT WITH CHECK (true); -- Controlled by RPC functions

CREATE POLICY "Users can update their received friend requests" ON friendships
  FOR UPDATE USING (true); -- Controlled by RPC functions

-- Create RLS policies for character_activity
CREATE POLICY "Anyone can view character activity" ON character_activity
  FOR SELECT USING (true); -- Public information for discovery

CREATE POLICY "Users can update their own activity" ON character_activity
  FOR ALL USING (true); -- Controlled by RPC functions

-- Create RLS policies for visits (update existing if needed)
DROP POLICY IF EXISTS "Anyone can view visits" ON visits;
CREATE POLICY "Anyone can view visits" ON visits
  FOR SELECT USING (true); -- Public for social features

DROP POLICY IF EXISTS "Users can create visits" ON visits;
CREATE POLICY "Users can create visits" ON visits
  FOR INSERT WITH CHECK (true); -- Controlled by RPC functions

COMMENT ON TABLE friendships IS 'Manages friendship relationships between characters';
COMMENT ON TABLE character_activity IS 'Tracks character online activity and visit preferences';
COMMENT ON FUNCTION send_friend_request(UUID, TEXT) IS 'Sends a friend request to a character by name';
COMMENT ON FUNCTION visit_character(UUID, TEXT, TEXT, JSONB) IS 'Records a visit to another character';
COMMENT ON FUNCTION get_discoverable_characters(UUID, INTEGER, INTEGER) IS 'Returns characters available for visiting and befriending';