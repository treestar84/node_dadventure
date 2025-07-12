-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    species VARCHAR(20) NOT NULL,
    job VARCHAR(30) NOT NULL,
    level INTEGER DEFAULT 1,
    age INTEGER DEFAULT 1,
    stats JSONB DEFAULT '{
        "str": 10, "dex": 10, "int": 10, "vit": 10, "agi": 10, "luk": 10,
        "playfulness": 10, "curiosity": 10, "sensitivity": 10, "awareness": 10,
        "meddling": 10, "pragmatism": 10, "appetite": 10, "anger_control": 10, "clumsiness": 10
    }'::jsonb,
    emotion VARCHAR(20) DEFAULT 'happy',
    appearance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    coins INTEGER DEFAULT 0,
    exp INTEGER DEFAULT 0,
    items TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- Bugs table (food items)
CREATE TABLE bugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used BOOLEAN DEFAULT FALSE
);

-- Candies table (gifts between characters)
CREATE TABLE candies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    to_character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    detail TEXT,
    achieved_at TIMESTAMPTZ DEFAULT NOW(),
    reward JSONB DEFAULT '{}'::jsonb
);

-- Visits table (character visits)
CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    visited_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seeds table (knowledge sharing)
CREATE TABLE seeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    creator_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    tree_size INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed comments table (watering the seeds)
CREATE TABLE seed_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seed_id UUID REFERENCES seeds(id) ON DELETE CASCADE,
    commenter_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skins table (cosmetic items)
CREATE TABLE skins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'clothing', 'background', 'accessory'
    image_url VARCHAR(255),
    price INTEGER DEFAULT 0,
    rarity VARCHAR(10) DEFAULT 'common' -- 'common', 'rare', 'epic', 'legendary'
);

-- Purchases table (skin ownership)
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
    skin_id UUID REFERENCES skins(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(character_id, skin_id)
);

-- Indexes for better performance
CREATE INDEX idx_characters_name ON characters(name);
CREATE INDEX idx_bugs_character_id ON bugs(character_id);
CREATE INDEX idx_bugs_created_at ON bugs(created_at);
CREATE INDEX idx_candies_to_character ON candies(to_character_id);
CREATE INDEX idx_achievements_character_id ON achievements(character_id);
CREATE INDEX idx_visits_visited_id ON visits(visited_id);
CREATE INDEX idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX idx_seeds_creator_id ON seeds(creator_id);
CREATE INDEX idx_seed_comments_seed_id ON seed_comments(seed_id);

-- RLS (Row Level Security) policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candies ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE seed_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all operations for now, can be refined later)
CREATE POLICY "Enable all operations for authenticated users" ON characters FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON bugs FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON candies FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON achievements FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON visits FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON seeds FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON seed_comments FOR ALL USING (true);
CREATE POLICY "Enable read access for skins" ON skins FOR SELECT USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON purchases FOR ALL USING (true);

-- Function to automatically create bugs every 30 minutes per character
CREATE OR REPLACE FUNCTION create_bug_for_character(character_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO bugs (character_id) VALUES (character_uuid);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate level from experience
CREATE OR REPLACE FUNCTION calculate_level(exp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Simple level calculation: level = sqrt(exp / 100) + 1
    RETURN GREATEST(1, FLOOR(SQRT(exp::float / 100.0)) + 1);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update level when exp changes
CREATE OR REPLACE FUNCTION update_character_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_level(NEW.exp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_character_level
    BEFORE UPDATE OF exp ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_character_level();

-- Insert some default skins
INSERT INTO skins (name, type, image_url, price, rarity) VALUES
('Basic Hat', 'clothing', '/images/skins/basic_hat.png', 100, 'common'),
('Cool Sunglasses', 'accessory', '/images/skins/sunglasses.png', 250, 'rare'),
('Forest Background', 'background', '/images/skins/forest_bg.png', 500, 'epic'),
('Rainbow Shirt', 'clothing', '/images/skins/rainbow_shirt.png', 300, 'rare'),
('Golden Crown', 'accessory', '/images/skins/golden_crown.png', 1000, 'legendary');