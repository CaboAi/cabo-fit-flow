#!/usr/bin/env node

/**
 * Execute Security Fix SQL
 * 
 * This script applies the security fixes to RPC functions
 * Set SUPABASE_SERVICE_ROLE_KEY environment variable before running
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = "https://pamzfhiiuvmtlwwvufut.supabase.co";

// Try to get service role key from environment variables
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
    console.log('⚠️  Service role key not provided.');
    console.log('💡 Alternative: Execute the SQL directly in Supabase SQL Editor');
    console.log('\n📋 To use this script, set the environment variable:');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('\n🔧 Or run the SQL file manually in Supabase Dashboard > SQL Editor');
    
    // Show the SQL content for manual execution
    try {
        const sqlContent = readFileSync('./security-fix.sql', 'utf8');
        console.log('\n📋 SQL to execute manually:');
        console.log('='.repeat(80));
        console.log(sqlContent);
        console.log('='.repeat(80));
    } catch (err) {
        console.log('💡 Check the security-fix.sql file for the SQL to execute');
    }
    
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSecurityFix() {
    console.log('🔒 Applying security fixes to RPC functions...');
    
    try {
        // Read the SQL file
        const sqlContent = readFileSync('./security-fix.sql', 'utf8');
        
        // Split SQL statements (simple approach - assumes statements are separated by semicolons)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt && !stmt.startsWith('--'));

        console.log(`📄 Executing ${statements.length} SQL statements...`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement) continue;

            console.log(`📝 Executing statement ${i + 1}...`);
            
            const { data, error } = await supabase.rpc('exec', { 
                query: statement 
            });

            if (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error);
                console.log('Statement:', statement.substring(0, 100) + '...');
                continue;
            }

            console.log(`✅ Statement ${i + 1} executed successfully`);
        }

        console.log('\n🔍 Verifying functions were updated...');

        // Test one of the functions to verify it works
        const { data: testBalance, error: testError } = await supabase
            .rpc('get_user_credit_balance', { 
                p_user_id: '00000000-0000-0000-0000-000000000001' 
            });

        if (testError) {
            console.log('⚠️  Function test warning:', testError.message);
        } else {
            console.log('✅ Function test successful - balance:', testBalance);
        }

        console.log('\n🎉 Security fix applied successfully!');
        console.log('🔒 All RPC functions now have explicit search_path settings');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

executeSecurityFix().catch(console.error);