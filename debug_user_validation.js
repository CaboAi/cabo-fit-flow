#!/usr/bin/env node

/**
 * Debug script to check user validation and create test profiles
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🔍 Debugging User Validation\n');

async function checkProfiles() {
    try {
        console.log('1. Checking existing profiles in database...');
        
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, full_name, created_at')
            .limit(10);
            
        if (error) {
            console.log('❌ Error querying profiles:', error.message);
            return;
        }
        
        console.log(`✅ Found ${profiles.length} existing profiles:`);
        profiles.forEach(profile => {
            console.log(`   - ${profile.id} (${profile.email || 'no email'}) - ${profile.full_name || 'no name'}`);
        });
        
        console.log('');
        
    } catch (error) {
        console.log('❌ Unexpected error:', error.message);
    }
}

async function testSpecificUsers() {
    const testUsers = [
        '40ec6001-c070-426a-9d8d-45326d0d7dac',
        '661db286-593a-4c1e-8ce8-fb4ea43cd58a'
    ];
    
    console.log('2. Testing specific user IDs...');
    
    for (const userId of testUsers) {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('id, email, full_name')
                .eq('id', userId)
                .single();
                
            if (error && error.code === 'PGRST116') {
                console.log(`❌ User ${userId} - NOT FOUND`);
            } else if (error) {
                console.log(`❌ User ${userId} - ERROR: ${error.message}`);
            } else {
                console.log(`✅ User ${userId} - EXISTS (${profile.email || 'no email'})`);
            }
        } catch (error) {
            console.log(`❌ User ${userId} - UNEXPECTED ERROR: ${error.message}`);
        }
    }
    
    console.log('');
}

async function attemptProfileCreation() {
    const testUsers = [
        {
            id: '40ec6001-c070-426a-9d8d-45326d0d7dac',
            email: 'testuser1@cabofit.local',
            full_name: 'Test User 1'
        },
        {
            id: '661db286-593a-4c1e-8ce8-fb4ea43cd58a',
            email: 'testuser2@cabofit.local', 
            full_name: 'Test User 2'
        }
    ];
    
    console.log('3. Attempting to create test profiles...');
    
    for (const userData of testUsers) {
        try {
            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert([userData])
                .select('id')
                .single();
                
            if (error) {
                if (error.code === '23505') {
                    console.log(`ℹ️  Profile ${userData.id} already exists`);
                } else if (error.message.includes('row-level security')) {
                    console.log(`🔒 Profile ${userData.id} - BLOCKED by RLS policy`);
                    console.log('   Solution: Create profile via Supabase Dashboard or disable RLS temporarily');
                } else {
                    console.log(`❌ Profile ${userData.id} - ERROR: ${error.message}`);
                }
            } else {
                console.log(`✅ Profile ${userData.id} - CREATED successfully`);
            }
        } catch (error) {
            console.log(`❌ Profile ${userData.id} - UNEXPECTED ERROR: ${error.message}`);
        }
    }
    
    console.log('');
}

async function generateSQLStatements() {
    console.log('4. SQL statements to create profiles manually:');
    console.log('   (Run these in Supabase SQL Editor if RLS prevents API creation)\n');
    
    const testUsers = [
        {
            id: '40ec6001-c070-426a-9d8d-45326d0d7dac',
            email: 'testuser1@cabofit.local',
            full_name: 'Test User 1'
        },
        {
            id: '661db286-593a-4c1e-8ce8-fb4ea43cd58a',
            email: 'testuser2@cabofit.local', 
            full_name: 'Test User 2'
        }
    ];
    
    testUsers.forEach(user => {
        console.log(`INSERT INTO profiles (id, email, full_name, created_at, updated_at) 
VALUES ('${user.id}', '${user.email}', '${user.full_name}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;`);
        console.log('');
    });
}

async function runDebug() {
    await checkProfiles();
    await testSpecificUsers();
    await attemptProfileCreation();
    await generateSQLStatements();
    
    console.log('🎯 Summary:');
    console.log('   - Check existing profiles in Supabase Dashboard');
    console.log('   - If no profiles exist, create them manually via SQL Editor');
    console.log('   - RLS policies may prevent profile creation via API');
    console.log('   - Use generated SQL statements above for manual creation');
}

runDebug().catch(console.error);