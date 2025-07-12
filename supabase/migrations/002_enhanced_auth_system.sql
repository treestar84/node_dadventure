-- Enhanced authentication and user management system
-- This migration adds proper user authentication tables and enhances existing structure

-- Create users table for authentication (separate from characters)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_data JSONB DEFAULT '{}'::jsonb
);

-- Create user sessions table for session management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Modify characters table to link to users
ALTER TABLE characters 
    ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN last_played_at TIMESTAMPTZ DEFAULT NOW();

-- Create character_relationships table for social features
CREATE TABLE character_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    target_character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    relationship_type VARCHAR(20) NOT NULL, -- 'friend', 'blocked', 'follower'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, target_character_id, relationship_type)
);

-- Create notifications table for future features
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'visit', 'gift', 'achievement', 'level_up', 'bug_ready'
    title VARCHAR(100) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_settings table for user preferences
CREATE TABLE game_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    setting_key VARCHAR(50) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, character_id, setting_key)
);

-- Create user_activity_log for analytics and debugging
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'character_create', 'feed_bug', etc.
    action_data JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhance achievements table for better categorization
ALTER TABLE achievements 
    ADD COLUMN category VARCHAR(30) DEFAULT 'general',
    ADD COLUMN tier VARCHAR(20) DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
    ADD COLUMN points INTEGER DEFAULT 0,
    ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;

-- Create leaderboards table for competitive features
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    leaderboard_type VARCHAR(30) NOT NULL, -- 'level', 'achievements', 'coins', 'visits'
    score INTEGER NOT NULL,
    rank INTEGER,
    period VARCHAR(20) DEFAULT 'all_time', -- 'daily', 'weekly', 'monthly', 'all_time'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create migration tracking for version control
CREATE TABLE migration_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(20) NOT NULL,
    description TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_character_relationships_character_id ON character_relationships(character_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_character_id ON notifications(character_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_game_settings_user_id ON game_settings(user_id);
CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, period);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);

-- Add RLS policies for new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be refined later)
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (auth.uid()::text = id::text);
CREATE POLICY "Users can manage their own sessions" ON user_sessions FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view character relationships" ON character_relationships FOR SELECT USING (true);
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage their own settings" ON game_settings FOR ALL USING (auth.uid()::text = user_id::text);
CREATE POLICY "Allow activity logging" ON user_activity_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Public leaderboards" ON leaderboards FOR SELECT USING (true);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_character_last_played()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_played_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_played_at when character is modified
CREATE TRIGGER trigger_update_character_last_played
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_character_last_played();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_character_id UUID,
    p_action_type VARCHAR(50),
    p_action_data JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activity_log (user_id, character_id, action_type, action_data, ip_address, user_agent)
    VALUES (p_user_id, p_character_id, p_action_type, p_action_data, p_ip_address, p_user_agent)
    RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_character_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(100),
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, character_id, type, title, message, data)
    VALUES (p_user_id, p_character_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Record this migration
INSERT INTO migration_history (version, description) 
VALUES ('002', 'Enhanced authentication system with user tables, relationships, notifications, and activity logging');

-- Add some default achievement categories and tiers
UPDATE achievements SET category = 'social' WHERE key LIKE '%visit%' OR key LIKE '%friend%';
UPDATE achievements SET category = 'progression' WHERE key LIKE '%level%' OR key LIKE '%exp%';
UPDATE achievements SET category = 'collection' WHERE key LIKE '%bug%' OR key LIKE '%item%';
UPDATE achievements SET category = 'time' WHERE key LIKE '%day%' OR key LIKE '%age%';