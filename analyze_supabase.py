#!/usr/bin/env python3
"""
Analyze Supabase database structure through direct connection
"""

import os
import json
from supabase import create_client, Client

# Parse the JWT token to get project info
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74"
project_ref = "pamzfhiiuvmtlwwvufut"

# Supabase URL and anon key
url = f"https://{project_ref}.supabase.co"
key = token

# Create Supabase client
supabase: Client = create_client(url, key)

def analyze_database():
    """Analyze the database structure"""
    print(f"Connecting to Supabase project: {project_ref}")
    print(f"URL: {url}\n")
    
    # Try to list tables using the information_schema
    try:
        # Query to get all tables
        query = """
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
        """
        
        # Execute raw SQL query
        result = supabase.rpc('sql', {'query': query}).execute()
        
        if result.data:
            print("Tables found:")
            for table in result.data:
                print(f"  - {table['table_name']}")
        else:
            print("No tables found or unable to access information_schema")
            
    except Exception as e:
        print(f"Error accessing database schema: {e}")
        print("\nTrying alternative approach...")
        
        # Try common table names that might exist in a Lovable/fitness app
        common_tables = ['users', 'profiles', 'memberships', 'passes', 'activities', 
                        'workouts', 'sessions', 'bookings', 'classes', 'trainers',
                        'payments', 'subscriptions', 'check_ins']
        
        print("\nChecking for common table names:")
        for table_name in common_tables:
            try:
                result = supabase.table(table_name).select("*").limit(1).execute()
                if result.data is not None:
                    print(f"✓ Found table: {table_name}")
                    
                    # Get sample data
                    sample = supabase.table(table_name).select("*").limit(5).execute()
                    if sample.data:
                        print(f"  Sample data ({len(sample.data)} rows):")
                        for i, row in enumerate(sample.data):
                            print(f"    Row {i+1}: {json.dumps(row, indent=2)}")
                    print()
                    
            except Exception as e:
                # Table doesn't exist or no access
                pass

def check_lovable_integration():
    """Check for Lovable.io specific tables or configurations"""
    print("\n" + "="*50)
    print("Checking for Lovable.io integration...")
    print("="*50 + "\n")
    
    # Check for Lovable-specific tables
    lovable_tables = ['lovable_config', 'lovable_projects', 'lovable_deployments', 
                      '_lovable_metadata', 'project_settings']
    
    for table_name in lovable_tables:
        try:
            result = supabase.table(table_name).select("*").limit(1).execute()
            if result.data is not None:
                print(f"✓ Found Lovable table: {table_name}")
                print(f"  Data: {json.dumps(result.data, indent=2)}")
        except:
            pass
    
    # Check for edge functions
    print("\nNote: Edge functions and RPC endpoints cannot be directly listed via the client.")
    print("You would need to check the Supabase dashboard for:")
    print("  - Edge Functions")
    print("  - Database Functions (RPC)")
    print("  - Row Level Security policies")
    print("  - API configuration")

if __name__ == "__main__":
    print("Supabase Database Analysis")
    print("="*50 + "\n")
    
    analyze_database()
    check_lovable_integration()
    
    print("\n" + "="*50)
    print("Analysis complete!")