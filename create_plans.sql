
-- Create subscription plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL, -- price in cents
    duration_days INTEGER NOT NULL,
    description TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Sample data
INSERT INTO plans (name, price, duration_days, description, features) VALUES 
('Day Pass', 2000, 1, 'Single day access to all gyms', '["All gym access", "Group classes", "Basic facilities"]'),
('Weekly Pass', 10000, 7, 'One week unlimited access', '["All gym access", "Group classes", "Personal training session", "Towel service"]'),
('Monthly Pass', 35000, 30, 'Full month membership', '["All gym access", "Unlimited classes", "3 personal training sessions", "Nutrition consultation"]');
        