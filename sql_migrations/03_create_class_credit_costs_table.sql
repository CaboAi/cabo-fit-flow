-- Migration 03: Create Class Credit Costs Table
-- Execute in Supabase SQL Editor

-- Create table to define credit costs for different classes and scenarios
CREATE TABLE IF NOT EXISTS class_credit_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    
    -- Credit cost rules
    base_credit_cost INTEGER NOT NULL DEFAULT 1, -- Standard cost in credits
    peak_credit_cost INTEGER NOT NULL DEFAULT 1, -- Cost during peak hours
    last_minute_credit_cost INTEGER NOT NULL DEFAULT 2, -- Cost when booking within X hours
    
    -- Time-based rules
    peak_hours_start TIME,
    peak_hours_end TIME,
    last_minute_threshold_hours INTEGER DEFAULT 2, -- How many hours before class is "last minute"
    
    -- Day-based rules
    weekend_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Multiplier for weekends
    holiday_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Multiplier for holidays
    
    -- Validity
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CHECK (base_credit_cost > 0),
    CHECK (peak_credit_cost > 0),
    CHECK (last_minute_credit_cost > 0),
    CHECK (weekend_multiplier > 0),
    CHECK (holiday_multiplier > 0),
    CHECK (last_minute_threshold_hours >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_class_credit_costs_class_id ON class_credit_costs(class_id);
CREATE INDEX IF NOT EXISTS idx_class_credit_costs_gym_id ON class_credit_costs(gym_id);
CREATE INDEX IF NOT EXISTS idx_class_credit_costs_active ON class_credit_costs(is_active, effective_date);

-- Enable RLS
ALTER TABLE class_credit_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY "Anyone can view credit costs" 
  ON class_credit_costs FOR SELECT 
  USING (is_active = true AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE));

CREATE POLICY "Only service role can manage credit costs" 
  ON class_credit_costs FOR ALL 
  USING (current_setting('role') = 'service_role');

-- Grant permissions
GRANT SELECT ON class_credit_costs TO authenticated;
GRANT ALL ON class_credit_costs TO service_role;

-- Insert default credit costs for different class types
-- High-demand classes (yoga, pilates)
INSERT INTO class_credit_costs (class_id, gym_id, base_credit_cost, peak_credit_cost, last_minute_credit_cost, peak_hours_start, peak_hours_end, last_minute_threshold_hours)
SELECT 
    c.id as class_id,
    c.gym_id,
    CASE 
        WHEN c.title ILIKE '%pilates%' OR c.title ILIKE '%reformer%' THEN 2
        WHEN c.title ILIKE '%yoga%' OR c.title ILIKE '%vinyasa%' OR c.title ILIKE '%flow%' THEN 1
        WHEN c.title ILIKE '%crossfit%' OR c.title ILIKE '%hiit%' THEN 2
        WHEN c.title ILIKE '%bootcamp%' OR c.title ILIKE '%conditioning%' THEN 1
        ELSE 1
    END as base_credit_cost,
    CASE 
        WHEN c.title ILIKE '%pilates%' OR c.title ILIKE '%reformer%' THEN 3
        WHEN c.title ILIKE '%yoga%' OR c.title ILIKE '%vinyasa%' OR c.title ILIKE '%flow%' THEN 2
        WHEN c.title ILIKE '%crossfit%' OR c.title ILIKE '%hiit%' THEN 3
        WHEN c.title ILIKE '%bootcamp%' OR c.title ILIKE '%conditioning%' THEN 2
        ELSE 2
    END as peak_credit_cost,
    CASE 
        WHEN c.title ILIKE '%pilates%' OR c.title ILIKE '%reformer%' THEN 4
        WHEN c.title ILIKE '%yoga%' OR c.title ILIKE '%vinyasa%' OR c.title ILIKE '%flow%' THEN 3
        WHEN c.title ILIKE '%crossfit%' OR c.title ILIKE '%hiit%' THEN 4
        WHEN c.title ILIKE '%bootcamp%' OR c.title ILIKE '%conditioning%' THEN 3
        ELSE 3
    END as last_minute_credit_cost,
    '17:00'::TIME as peak_hours_start, -- 5 PM
    '19:00'::TIME as peak_hours_end,   -- 7 PM
    2 as last_minute_threshold_hours
FROM classes c
WHERE NOT EXISTS (
    SELECT 1 FROM class_credit_costs ccc 
    WHERE ccc.class_id = c.id AND ccc.is_active = true
);

-- Insert gym-wide defaults for future classes
INSERT INTO class_credit_costs (gym_id, base_credit_cost, peak_credit_cost, last_minute_credit_cost, peak_hours_start, peak_hours_end, last_minute_threshold_hours, weekend_multiplier)
SELECT DISTINCT
    g.id as gym_id,
    CASE 
        WHEN g.name ILIKE '%pilates%' OR g.name ILIKE '%yoga%' THEN 1
        WHEN g.name ILIKE '%crossfit%' OR g.name ILIKE '%bootcamp%' THEN 2
        ELSE 1
    END as base_credit_cost,
    CASE 
        WHEN g.name ILIKE '%pilates%' OR g.name ILIKE '%yoga%' THEN 2
        WHEN g.name ILIKE '%crossfit%' OR g.name ILIKE '%bootcamp%' THEN 3
        ELSE 2
    END as peak_credit_cost,
    CASE 
        WHEN g.name ILIKE '%pilates%' OR g.name ILIKE '%yoga%' THEN 3
        WHEN g.name ILIKE '%crossfit%' OR g.name ILIKE '%bootcamp%' THEN 4
        ELSE 3
    END as last_minute_credit_cost,
    '17:00'::TIME as peak_hours_start,
    '19:00'::TIME as peak_hours_end,
    2 as last_minute_threshold_hours,
    1.5 as weekend_multiplier -- 50% more on weekends
FROM gyms g
WHERE NOT EXISTS (
    SELECT 1 FROM class_credit_costs ccc 
    WHERE ccc.gym_id = g.id AND ccc.class_id IS NULL AND ccc.is_active = true
);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_class_credit_costs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_credit_costs_updated_at
    BEFORE UPDATE ON class_credit_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_class_credit_costs_timestamp();

-- Display created credit costs
SELECT 
    ccc.id,
    COALESCE(c.title, 'Default for Gym') as class_or_gym,
    g.name as gym_name,
    ccc.base_credit_cost,
    ccc.peak_credit_cost,
    ccc.last_minute_credit_cost,
    ccc.peak_hours_start,
    ccc.peak_hours_end,
    ccc.weekend_multiplier
FROM class_credit_costs ccc
LEFT JOIN classes c ON ccc.class_id = c.id
JOIN gyms g ON ccc.gym_id = g.id
WHERE ccc.is_active = true
ORDER BY g.name, c.title NULLS FIRST;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 03 completed: Class credit costs table created';
    RAISE NOTICE '💰 Configured dynamic pricing based on class type and timing';
    RAISE NOTICE '⏰ Set up peak hours and last-minute booking costs';
    RAISE NOTICE '📅 Weekend multipliers configured';
END $$;