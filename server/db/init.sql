-- SquadPlay Database Schema
-- PostgreSQL 16+

-- ─── Extensions ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url VARCHAR(500),
    total_wins INT DEFAULT 0,
    total_games INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Rooms ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id UUID REFERENCES users(id),
    game_type VARCHAR(50) NOT NULL DEFAULT 'the-odd-one',
    status VARCHAR(20) NOT NULL DEFAULT 'waiting',
    max_players INT NOT NULL DEFAULT 8,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

-- ─── Room Players ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    display_name VARCHAR(50) NOT NULL,
    seat_order INT,
    is_connected BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- ─── Word Packs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Word Pairs ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pack_id UUID NOT NULL REFERENCES word_packs(id) ON DELETE CASCADE,
    word_a VARCHAR(100) NOT NULL,
    word_b VARCHAR(100) NOT NULL,
    category VARCHAR(50)
);

-- ─── Matches ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id),
    game_type VARCHAR(50) NOT NULL,
    odd_one_id UUID REFERENCES users(id),
    winner_side VARCHAR(20),
    round_data JSONB DEFAULT '{}',
    round_number INT DEFAULT 1,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- ─── Match Players ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    submitted_word VARCHAR(200),
    voted_for UUID REFERENCES users(id),
    survived BOOLEAN,
    score_earned INT DEFAULT 0
);

-- ─── Performance Indexes ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status) WHERE status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id);
CREATE INDEX IF NOT EXISTS idx_matches_room ON matches(room_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_word_pairs_pack ON word_pairs(pack_id);

-- ─── Seed: Default Word Pack ────────────────────────────
INSERT INTO word_packs (id, name, description, is_system)
VALUES ('00000000-0000-0000-0000-000000000001', 'Classic Pack', 'The default word pack with everyday categories', true)
ON CONFLICT (name) DO NOTHING;

-- ─── Seed: Word Pairs ───────────────────────────────────
-- Fruits
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Apple', 'Pear', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Banana', 'Plantain', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Orange', 'Tangerine', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Strawberry', 'Raspberry', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Watermelon', 'Cantaloupe', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Grape', 'Blueberry', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Mango', 'Papaya', 'Fruits'),
('00000000-0000-0000-0000-000000000001', 'Peach', 'Nectarine', 'Fruits');

-- Animals
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Dog', 'Wolf', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Cat', 'Tiger', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Horse', 'Donkey', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Rabbit', 'Hare', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Eagle', 'Hawk', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Dolphin', 'Porpoise', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Crocodile', 'Alligator', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Frog', 'Toad', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Turtle', 'Tortoise', 'Animals'),
('00000000-0000-0000-0000-000000000001', 'Bee', 'Wasp', 'Animals');

-- Countries
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Japan', 'China', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'France', 'Italy', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'Brazil', 'Argentina', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'Canada', 'Australia', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'Germany', 'Austria', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'Thailand', 'Vietnam', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'Spain', 'Portugal', 'Countries'),
('00000000-0000-0000-0000-000000000001', 'India', 'Pakistan', 'Countries');

-- Jobs / Professions
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Doctor', 'Nurse', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Lawyer', 'Judge', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Chef', 'Baker', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Pilot', 'Captain', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Teacher', 'Professor', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Painter', 'Sculptor', 'Professions'),
('00000000-0000-0000-0000-000000000001', 'Musician', 'Singer', 'Professions');

-- Sports
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Football', 'Rugby', 'Sports'),
('00000000-0000-0000-0000-000000000001', 'Basketball', 'Volleyball', 'Sports'),
('00000000-0000-0000-0000-000000000001', 'Tennis', 'Badminton', 'Sports'),
('00000000-0000-0000-0000-000000000001', 'Swimming', 'Diving', 'Sports'),
('00000000-0000-0000-0000-000000000001', 'Boxing', 'Wrestling', 'Sports'),
('00000000-0000-0000-0000-000000000001', 'Golf', 'Polo', 'Sports');

-- Food & Drinks
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Pizza', 'Flatbread', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Coffee', 'Tea', 'Drinks'),
('00000000-0000-0000-0000-000000000001', 'Burger', 'Sandwich', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Pasta', 'Noodles', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Chocolate', 'Caramel', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Sushi', 'Sashimi', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Beer', 'Cider', 'Drinks'),
('00000000-0000-0000-0000-000000000001', 'Cake', 'Pie', 'Food');

-- Places & Landmarks
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Beach', 'Lake', 'Places'),
('00000000-0000-0000-0000-000000000001', 'Mountain', 'Hill', 'Places'),
('00000000-0000-0000-0000-000000000001', 'Forest', 'Jungle', 'Places'),
('00000000-0000-0000-0000-000000000001', 'Museum', 'Gallery', 'Places'),
('00000000-0000-0000-0000-000000000001', 'Hotel', 'Motel', 'Places'),
('00000000-0000-0000-0000-000000000001', 'Library', 'Bookstore', 'Places');

-- Entertainment
INSERT INTO word_pairs (pack_id, word_a, word_b, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Guitar', 'Ukulele', 'Music'),
('00000000-0000-0000-0000-000000000001', 'Piano', 'Keyboard', 'Music'),
('00000000-0000-0000-0000-000000000001', 'Movie', 'Documentary', 'Entertainment'),
('00000000-0000-0000-0000-000000000001', 'Novel', 'Memoir', 'Entertainment'),
('00000000-0000-0000-0000-000000000001', 'Concert', 'Festival', 'Entertainment');
