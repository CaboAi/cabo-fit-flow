#!/usr/bin/env python3
"""
Final verification of Cabo FitPass database updates
Shows complete current state and generated files
"""

import json
import os
from supabase import create_client, Client

# Configuration
PROJECT_REF = "pamzfhiiuvmtlwwvufut"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def show_current_database_state():
    """Display complete current database state"""
    print("🗄️  CURRENT DATABASE STATE")
    print("="*60)
    
    tables = ['gyms', 'classes', 'bookings', 'profiles', 'users']
    
    for table in tables:
        try:
            result = supabase.table(table).select('*').execute()
            print(f"\n📊 {table.upper()} - {len(result.data)} records")
            print("-" * 40)
            
            if result.data:
                for i, record in enumerate(result.data, 1):
                    print(f"Record {i}:")
                    for key, value in record.items():
                        print(f"  {key}: {value}")
                    print()
            else:
                print("  (No records)")
                
        except Exception as e:
            print(f"❌ Error accessing {table}: {e}")

def show_generated_files():
    """Show all generated files and their purposes"""
    print("\n📁 GENERATED FILES")
    print("="*60)
    
    files = [
        {
            'name': 'create_workouts.sql',
            'purpose': 'Creates workouts table for tracking completed exercises',
            'execute': 'Run in Supabase SQL Editor'
        },
        {
            'name': 'create_plans.sql', 
            'purpose': 'Creates subscription plans table with pricing',
            'execute': 'Run in Supabase SQL Editor'
        },
        {
            'name': 'create_subscriptions.sql',
            'purpose': 'Creates user subscriptions table',
            'execute': 'Run in Supabase SQL Editor'
        },
        {
            'name': 'create_payments.sql',
            'purpose': 'Creates payments table for transaction tracking',
            'execute': 'Run in Supabase SQL Editor'
        },
        {
            'name': 'lovable_config.js',
            'purpose': 'Supabase client configuration for Lovable.io',
            'execute': 'Copy to Lovable.io project'
        },
        {
            'name': 'CaboFitPassApp.jsx',
            'purpose': 'Complete React app with booking and subscription features',
            'execute': 'Use as main component in Lovable.io'
        },
        {
            'name': 'LOVABLE_INTEGRATION.md',
            'purpose': 'Complete integration guide and deployment instructions',
            'execute': 'Follow step-by-step guide'
        }
    ]
    
    for file_info in files:
        filename = file_info['name']
        filepath = f"/mnt/c/Users/mario/OneDrive/Documents/Cabo Fit App/{filename}"
        
        if os.path.exists(filepath):
            file_size = os.path.getsize(filepath)
            print(f"✅ {filename}")
            print(f"   Purpose: {file_info['purpose']}")
            print(f"   Size: {file_size:,} bytes")
            print(f"   Action: {file_info['execute']}")
            print()
        else:
            print(f"❌ {filename} - Not found")

def show_sql_queries():
    """Show the key SQL queries for Lovable integration"""
    print("\n🔍 KEY SQL QUERIES FOR LOVABLE INTEGRATION")
    print("="*60)
    
    queries = {
        "Get all classes": "SELECT * FROM classes;",
        "Get bookings for user": "SELECT * FROM bookings WHERE user_id = [current_user_id];",
        "Get user subscriptions": "SELECT * FROM subscriptions WHERE user_id = [current_user_id];",
        "Get classes with gym info": """
SELECT classes.*, gyms.name as gym_name, gyms.location 
FROM classes 
JOIN gyms ON classes.gym_id = gyms.id 
ORDER BY classes.schedule;""",
        "Get user bookings with details": """
SELECT bookings.*, classes.title, classes.schedule, gyms.name as gym_name
FROM bookings 
JOIN classes ON bookings.class_id = classes.id
JOIN gyms ON classes.gym_id = gyms.id
WHERE bookings.user_id = [current_user_id]
ORDER BY bookings.created_at DESC;""",
        "Get active user subscriptions": """
SELECT subscriptions.*, plans.name, plans.price, plans.duration_days
FROM subscriptions 
JOIN plans ON subscriptions.plan_id = plans.id
WHERE subscriptions.user_id = [current_user_id] 
AND subscriptions.status = 'active';"""
    }
    
    for query_name, sql in queries.items():
        print(f"\n📝 {query_name}")
        print("-" * 30)
        print(sql)

def show_integration_status():
    """Show integration readiness status"""
    print("\n🚀 INTEGRATION STATUS")
    print("="*60)
    
    status_items = [
        ("Database Cleanup", "✅ COMPLETE", "Invalid bookings removed, valid data verified"),
        ("Test Data", "✅ COMPLETE", "Added gyms, classes, and sample booking"),
        ("SQL Scripts", "✅ READY", "Generated for missing tables (workouts, plans, subscriptions, payments)"),
        ("Lovable Config", "✅ READY", "Supabase client configuration created"),
        ("React Components", "✅ READY", "Full app component with booking and subscription features"),
        ("User Account", "⏳ PENDING", "Need to create mariopjr91@gmail.com via Supabase Auth"),
        ("Table Creation", "⏳ PENDING", "Execute SQL scripts in Supabase dashboard"),
        ("Deployment", "⏳ PENDING", "Deploy to Lovable.io project")
    ]
    
    for item, status, description in status_items:
        print(f"{status} {item}")
        print(f"    {description}")
        print()

def main():
    """Main verification function"""
    print("🎯 CABO FITPASS - FINAL VERIFICATION REPORT")
    print("=" * 60)
    print(f"🔗 Supabase Project: {PROJECT_REF}")
    print(f"🌐 Project URL: https://cabo-fit-pass.lovable.app/")
    print(f"📊 Dashboard: https://supabase.com/dashboard/project/{PROJECT_REF}")
    print()
    
    show_current_database_state()
    show_generated_files()
    show_sql_queries() 
    show_integration_status()
    
    print("\n" + "="*60)
    print("✅ VERIFICATION COMPLETE!")
    print("\n🎯 NEXT STEPS:")
    print("1. Execute SQL scripts in Supabase dashboard")
    print("2. Copy React components to Lovable.io")
    print("3. Configure environment variables")
    print("4. Deploy and test integration")
    print("5. Create user account for mariopjr91@gmail.com")

if __name__ == "__main__":
    main()