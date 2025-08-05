
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- References auth.users or profiles
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, active, cancelled, expired
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        