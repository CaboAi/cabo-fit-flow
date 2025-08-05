#!/usr/bin/env python3
"""
Manual Supabase updates for Cabo FitPass - Working with existing structure
"""

import json
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configuration
PROJECT_REF = "pamzfhiiuvmtlwwvufut"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_current_state():
    """Analyze current database state"""
    print("🔍 Analyzing current database state...")
    
    tables = ['gyms', 'classes', 'bookings', 'profiles', 'users']
    
    for table in tables:
        try:
            result = supabase.table(table).select('*').execute()
            print(f"📊 {table}: {len(result.data)} records")
            
            if result.data:
                print(f"   Structure: {list(result.data[0].keys())}")
                for i, record in enumerate(result.data[:2]):  # Show first 2 records
                    print(f"   Record {i+1}: {json.dumps(record, indent=4, default=str)}")
            print()
            
        except Exception as e:
            print(f"❌ Error accessing {table}: {e}")
            print()

def clean_bookings():
    """Clean invalid bookings"""
    print("🧹 Checking bookings validity...")
    
    try:
        # Get valid class IDs
        classes_result = supabase.table('classes').select('id').execute()
        valid_class_ids = [row['id'] for row in classes_result.data]
        print(f"Valid class IDs: {valid_class_ids}")
        
        # Check bookings
        bookings_result = supabase.table('bookings').select('*').execute()
        print(f"Current bookings: {len(bookings_result.data)}")
        
        for booking in bookings_result.data:
            if booking['class_id'] in valid_class_ids:
                print(f"✅ Valid booking: {booking['id']} -> {booking['class_id']}")
            else:
                print(f"❌ Invalid booking: {booking['id']} -> {booking['class_id']}")
                # Delete invalid booking
                delete_result = supabase.table('bookings').delete().eq('id', booking['id']).execute()
                print(f"   Deleted invalid booking")
        
    except Exception as e:
        print(f"❌ Error cleaning bookings: {e}")

def create_test_tables():
    """Create additional tables using available methods"""
    print("🏗️  Attempting to create additional data structures...")
    
    # Since we can't create tables directly, let's add data to existing tables
    # and document the missing table structures needed
    
    missing_tables = {
        'workouts': {
            'description': 'Track completed workouts',
            'columns': ['id', 'class_id', 'user_id', 'duration', 'calories_burned', 'notes', 'completed_at'],
            'sample_data': {
                'id': str(uuid.uuid4()),
                'class_id': 'e8c7dd4f-2346-484d-9933-2b338c405540',
                'user_id': '40ec6001-c070-426a-9d8d-45326d0d7dac',
                'duration': 60,
                'calories_burned': 350,
                'notes': 'Great yoga session!',
                'completed_at': datetime.now().isoformat()
            }
        },
        'plans': {
            'description': 'Subscription plans',
            'columns': ['id', 'name', 'price', 'duration_days', 'description', 'features'],
            'sample_data': [
                {'id': str(uuid.uuid4()), 'name': 'Day Pass', 'price': 2000, 'duration_days': 1, 'description': 'Single day access'},
                {'id': str(uuid.uuid4()), 'name': 'Weekly Pass', 'price': 10000, 'duration_days': 7, 'description': 'One week unlimited'},
                {'id': str(uuid.uuid4()), 'name': 'Monthly Pass', 'price': 35000, 'duration_days': 30, 'description': 'Full month membership'}
            ]
        },
        'subscriptions': {
            'description': 'User subscriptions',
            'columns': ['id', 'user_id', 'plan_id', 'status', 'start_date', 'end_date'],
            'sample_data': {
                'id': str(uuid.uuid4()),
                'user_id': '40ec6001-c070-426a-9d8d-45326d0d7dac',
                'plan_id': 'plan-id-here',
                'status': 'active',
                'start_date': datetime.now().date().isoformat(),
                'end_date': (datetime.now() + timedelta(days=7)).date().isoformat()
            }
        },
        'payments': {
            'description': 'Payment records',
            'columns': ['id', 'user_id', 'amount', 'status', 'stripe_payment_id', 'created_at'],
            'sample_data': {
                'id': str(uuid.uuid4()),
                'user_id': '40ec6001-c070-426a-9d8d-45326d0d7dac',
                'amount': 10000,
                'status': 'completed',
                'stripe_payment_id': 'pi_test_123456',
                'created_at': datetime.now().isoformat()
            }
        }
    }
    
    print("📋 Missing tables that need to be created in Supabase dashboard:")
    for table_name, info in missing_tables.items():
        print(f"\n🏷️  {table_name.upper()}")
        print(f"   Description: {info['description']}")
        print(f"   Columns: {', '.join(info['columns'])}")
        print(f"   Sample Data: {json.dumps(info['sample_data'], indent=4, default=str)}")

def add_more_test_data():
    """Add more test data to existing tables"""
    print("📊 Adding more test data to existing tables...")
    
    try:
        # Add another gym
        new_gym = {
            'name': 'Ocean View Fitness',
            'location': 'Playa del Carmen, Mexico',
            'logo_url': 'https://example.com/ocean-view-logo.png'
        }
        
        gym_result = supabase.table('gyms').insert(new_gym).execute()
        new_gym_id = gym_result.data[0]['id']
        print(f"✅ Added new gym: {new_gym['name']}")
        
        # Add more classes
        new_classes = [
            {
                'gym_id': new_gym_id,
                'title': 'CrossFit WOD',
                'schedule': (datetime.now() + timedelta(days=1, hours=10)).isoformat(),
                'price': 25,
                'capacity': 15
            },
            {
                'gym_id': new_gym_id,
                'title': 'Swimming Lessons',
                'schedule': (datetime.now() + timedelta(days=2, hours=14)).isoformat(),
                'price': 30,
                'capacity': 8
            }
        ]
        
        classes_result = supabase.table('classes').insert(new_classes).execute()
        print(f"✅ Added {len(new_classes)} new classes")
        
        # Show updated data
        print("\n📊 Updated database state:")
        for table in ['gyms', 'classes']:
            result = supabase.table(table).select('*').execute()
            print(f"   {table}: {len(result.data)} records")
        
    except Exception as e:
        print(f"❌ Error adding test data: {e}")

def generate_sql_scripts():
    """Generate SQL scripts for manual execution"""
    print("📝 Generating SQL scripts for manual execution...")
    
    sql_scripts = {
        'create_workouts.sql': """
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
        """,
        
        'create_plans.sql': """
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
        """,
        
        'create_subscriptions.sql': """
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
        """,
        
        'create_payments.sql': """
-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- References auth.users or profiles
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL, -- amount in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    stripe_payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
        """
    }
    
    # Write SQL files
    for filename, sql in sql_scripts.items():
        with open(f"/mnt/c/Users/mario/OneDrive/Documents/Cabo Fit App/{filename}", 'w') as f:
            f.write(sql)
        print(f"✅ Created {filename}")

def main():
    """Main execution"""
    print("🚀 Cabo FitPass Database Analysis & Updates")
    print("="*60)
    
    analyze_current_state()
    clean_bookings()
    create_test_tables()
    add_more_test_data()
    generate_sql_scripts()
    
    print("\n" + "="*60)
    print("✅ Analysis and updates completed!")
    print("\n📋 Next steps:")
    print("1. Execute the generated SQL scripts in Supabase SQL Editor")
    print("2. Set up proper RLS policies for new tables")
    print("3. Configure authentication in Lovable.io")
    print("4. Test the integration")

if __name__ == "__main__":
    main()