#!/usr/bin/env python3
"""
Cabo FitPass Supabase Database Update Script
Cleans data, creates missing tables, and adds test data
"""

import os
import json
import uuid
from datetime import datetime, timedelta
from supabase import create_client, Client

# Configuration
PROJECT_REF = "pamzfhiiuvmtlwwvufut"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_invalid_bookings():
    """Remove bookings with invalid class_id references"""
    print("🧹 Cleaning invalid bookings...")
    
    try:
        # Get all valid class IDs
        classes_result = supabase.table('classes').select('id').execute()
        valid_class_ids = [row['id'] for row in classes_result.data]
        print(f"Found {len(valid_class_ids)} valid class IDs: {valid_class_ids}")
        
        # Get all bookings
        bookings_result = supabase.table('bookings').select('*').execute()
        print(f"Found {len(bookings_result.data)} bookings to check")
        
        # Identify invalid bookings
        invalid_bookings = []
        for booking in bookings_result.data:
            if booking['class_id'] not in valid_class_ids:
                invalid_bookings.append(booking)
                print(f"  ❌ Invalid booking: {booking['id']} -> class_id: {booking['class_id']}")
        
        # Delete invalid bookings
        for booking in invalid_bookings:
            result = supabase.table('bookings').delete().eq('id', booking['id']).execute()
            print(f"  🗑️  Deleted booking {booking['id']}")
            
        print(f"✅ Cleaned {len(invalid_bookings)} invalid bookings")
        return True
        
    except Exception as e:
        print(f"❌ Error cleaning bookings: {e}")
        return False

def create_user_and_profile():
    """Create user account and profile for mariopjr91@gmail.com"""
    print("👤 Creating user and profile...")
    
    try:
        # Note: Direct user creation requires admin privileges
        # For now, we'll create a profile entry assuming the user will sign up
        user_id = str(uuid.uuid4())
        
        # Create profile
        profile_data = {
            'id': user_id,
            'email': 'mariopjr91@gmail.com',
            'full_name': 'Mario Polanco Jr',
            'role': 'local',
            'phone': '+52-123-456-7890',
            'created_at': datetime.now().isoformat()
        }
        
        result = supabase.table('profiles').insert(profile_data).execute()
        print(f"✅ Created profile for {profile_data['email']}")
        print(f"   User ID: {user_id}")
        return user_id
        
    except Exception as e:
        print(f"❌ Error creating user/profile: {e}")
        return None

def create_missing_tables():
    """Create missing database tables"""
    print("🏗️  Creating missing tables...")
    
    tables_sql = {
        'workouts': """
            CREATE TABLE IF NOT EXISTS workouts (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                duration INTEGER, -- duration in minutes
                calories_burned INTEGER,
                notes TEXT,
                completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """,
        
        'plans': """
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
        """,
        
        'subscriptions': """
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'pending', -- pending, active, cancelled, expired
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                stripe_subscription_id VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """,
        
        'payments': """
            CREATE TABLE IF NOT EXISTS payments (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
                booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
                amount INTEGER NOT NULL, -- amount in cents
                currency VARCHAR(3) DEFAULT 'USD',
                status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
                stripe_payment_intent_id VARCHAR(255),
                payment_method VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """
    }
    
    created_tables = []
    for table_name, sql in tables_sql.items():
        try:
            # Use RPC to execute raw SQL
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
            created_tables.append(table_name)
            print(f"✅ Created table: {table_name}")
        except Exception as e:
            print(f"❌ Error creating {table_name}: {e}")
    
    return created_tables

def add_test_data(user_id):
    """Add test data to all tables"""
    print("📊 Adding test data...")
    
    try:
        # Add subscription plans
        plans_data = [
            {
                'name': 'Day Pass',
                'price': 2000,  # $20.00
                'duration_days': 1,
                'description': 'Single day access to all gyms',
                'features': ['All gym access', 'Group classes', 'Basic facilities']
            },
            {
                'name': 'Weekly Pass',
                'price': 10000,  # $100.00
                'duration_days': 7,
                'description': 'One week unlimited access',
                'features': ['All gym access', 'Group classes', 'Personal training session', 'Towel service']
            },
            {
                'name': 'Monthly Pass',
                'price': 35000,  # $350.00
                'duration_days': 30,
                'description': 'Full month membership',
                'features': ['All gym access', 'Unlimited classes', '3 personal training sessions', 'Nutrition consultation']
            }
        ]
        
        plans_result = supabase.table('plans').insert(plans_data).execute()
        plan_ids = [plan['id'] for plan in plans_result.data]
        print(f"✅ Added {len(plans_data)} subscription plans")
        
        # Add a subscription for the test user
        subscription_data = {
            'user_id': user_id,
            'plan_id': plan_ids[1],  # Weekly pass
            'status': 'active',
            'start_date': datetime.now().date().isoformat(),
            'end_date': (datetime.now() + timedelta(days=7)).date().isoformat()
        }
        
        subscription_result = supabase.table('subscriptions').insert(subscription_data).execute()
        subscription_id = subscription_result.data[0]['id']
        print(f"✅ Added test subscription")
        
        # Add a payment record
        payment_data = {
            'user_id': user_id,
            'subscription_id': subscription_id,
            'amount': 10000,
            'status': 'completed',
            'payment_method': 'stripe'
        }
        
        supabase.table('payments').insert(payment_data).execute()
        print(f"✅ Added test payment")
        
        # Get existing class ID for workout
        classes_result = supabase.table('classes').select('id').execute()
        if classes_result.data:
            class_id = classes_result.data[0]['id']
            
            # Add a workout record
            workout_data = {
                'class_id': class_id,
                'user_id': user_id,
                'duration': 60,
                'calories_burned': 350,
                'notes': 'Great yoga session! Feel more flexible already.'
            }
            
            supabase.table('workouts').insert(workout_data).execute()
            print(f"✅ Added test workout")
            
            # Add a valid booking
            booking_data = {
                'user_id': user_id,
                'class_id': class_id,
                'type': 'subscription',
                'payment_status': 'completed'
            }
            
            supabase.table('bookings').insert(booking_data).execute()
            print(f"✅ Added valid booking")
        
        return True
        
    except Exception as e:
        print(f"❌ Error adding test data: {e}")
        return False

def verify_data():
    """Verify all data was created correctly"""
    print("🔍 Verifying data...")
    
    tables = ['gyms', 'classes', 'bookings', 'profiles', 'plans', 'subscriptions', 'payments', 'workouts']
    
    for table in tables:
        try:
            result = supabase.table(table).select('*').execute()
            print(f"✅ {table}: {len(result.data)} records")
            
            # Show sample data for key tables
            if table in ['classes', 'bookings', 'subscriptions'] and result.data:
                print(f"   Sample: {json.dumps(result.data[0], indent=2, default=str)}")
                
        except Exception as e:
            print(f"❌ Error checking {table}: {e}")

def main():
    """Main execution function"""
    print("🚀 Starting Cabo FitPass Database Update")
    print("="*50)
    
    # Step 1: Clean invalid data
    clean_invalid_bookings()
    print()
    
    # Step 2: Create user and profile
    user_id = create_user_and_profile()
    if not user_id:
        print("❌ Failed to create user, stopping")
        return
    print()
    
    # Step 3: Create missing tables
    created_tables = create_missing_tables()
    print()
    
    # Step 4: Add test data
    if created_tables:
        add_test_data(user_id)
        print()
    
    # Step 5: Verify everything
    verify_data()
    
    print("\n" + "="*50)
    print("✅ Database update completed!")
    print(f"🔗 Project URL: https://{PROJECT_REF}.supabase.co")
    print(f"📊 Dashboard: https://supabase.com/dashboard/project/{PROJECT_REF}")

if __name__ == "__main__":
    main()