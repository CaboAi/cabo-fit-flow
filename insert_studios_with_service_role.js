#!/usr/bin/env node

/**
 * Insert Studio Data with Service Role Key
 * 
 * This script bypasses RLS policies by using the service role key
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
    console.log('📄 File created: insert_studio_data.sql');
    console.log('\n📋 To use this script, set the environment variable:');
    console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
    console.log('\n🔧 Or run the SQL file manually in Supabase Dashboard > SQL Editor');
    
    // Show the SQL content for manual execution
    try {
        const sqlContent = readFileSync('./insert_studio_data.sql', 'utf8');
        console.log('\n📋 SQL to execute manually:');
        console.log('=' .repeat(60));
        console.log(sqlContent);
        console.log('=' .repeat(60));
    } catch (err) {
        console.log('💡 Check the insert_studio_data.sql file for the SQL to execute');
    }
    
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function insertStudios() {
    console.log('🏋️ Inserting studio data with service role permissions...');
    
    const studioData = [
        {
            name: 'CrossFit Cabo',
            location: 'Marina Golden Zone, Cabo San Lucas',
            logo_url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100&h=100&fit=crop'
        },
        {
            name: 'Yoga Flow Studio',
            location: 'Medano Beach, Cabo San Lucas',
            logo_url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=100&h=100&fit=crop'
        },
        {
            name: 'F45 Training Cabo',
            location: 'Downtown, Cabo San Lucas',
            logo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop'
        },
        {
            name: 'Pure Barre Cabo',
            location: 'Palmilla, San José del Cabo',
            logo_url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=100&h=100&fit=crop'
        },
        {
            name: 'Cabo Spin Studio',
            location: 'Puerto Paraiso, Cabo San Lucas',
            logo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop'
        }
    ];

    try {
        const { data, error } = await supabase
            .from('gyms')
            .upsert(studioData, { onConflict: 'name' })
            .select();

        if (error) {
            console.error('❌ Error inserting studios:', error);
            return;
        }

        console.log('✅ Studios inserted/updated successfully!');
        console.log(`📊 Processed ${data?.length || 0} studios`);

        // Verify insertion
        const { count } = await supabase
            .from('gyms')
            .select('*', { count: 'exact', head: true });

        console.log(`🏢 Total studios in database: ${count}`);

        // Show sample
        const { data: sample } = await supabase
            .from('gyms')
            .select('name, location')
            .limit(3);

        console.log('\n📋 Sample studios:');
        sample?.forEach((studio, i) => {
            console.log(`${i + 1}. ${studio.name} - ${studio.location}`);
        });

        console.log('\n🎉 Studio data setup completed!');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

insertStudios().catch(console.error);