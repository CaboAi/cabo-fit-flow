
-- Create workouts table
CREATE TABLE IF NOT EXISTS workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID,  -- References auth.users or profiles
    duration INTEGER, -- duration in minutes
    calories_burned INTEGER,
    notes TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Sample data
INSERT INTO workouts (class_id, user_id, duration, calories_burned, notes) VALUES 
('e8c7dd4f-2346-484d-9933-2b338c405540', '40ec6001-c070-426a-9d8d-45326d0d7dac', 60, 350, 'Great yoga session!');
        