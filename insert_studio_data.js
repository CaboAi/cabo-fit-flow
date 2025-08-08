#!/usr/bin/env node

/**
 * Insert Studio (Gym) Sample Data into Cabo Fit Pass Database
 * 
 * This script adds 5 sample fitness studios/gyms to the database
 * using the existing 'gyms' table structure (not 'studios').
 * 
 * The gyms table has the following columns:
 * - id (UUID, auto-generated)
 * - name (string, required)
 * - location (string, optional)  
 * - logo_url (string, optional)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://pamzfhiiuvmtlwwvufut.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function insertStudioData() {
    console.log('🏋️ Starting studio data insertion...');
    
    // Sample studio data adapted for the 'gyms' table structure
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
        // Insert the studio data into the gyms table
        console.log('📝 Inserting studio data into gyms table...');
        
        const { data, error } = await supabase
            .from('gyms')
            .insert(studioData)
            .select();

        if (error) {
            // If insert fails due to conflict, try upsert instead
            if (error.message.includes('duplicate') || error.message.includes('conflict')) {
                console.log('⚠️  Some studios already exist, trying upsert...');
                
                const { data: upsertData, error: upsertError } = await supabase
                    .from('gyms')
                    .upsert(studioData, { onConflict: 'name' })
                    .select();
                    
                if (upsertError) {
                    console.error('❌ Upsert failed:', upsertError);
                    return;
                }
                
                console.log('✅ Studios upserted successfully:', upsertData?.length || 0);
            } else {
                console.error('❌ Insert failed:', error);
                return;
            }
        } else {
            console.log('✅ Studios inserted successfully:', data?.length || 0);
        }

        // Verify the insertion by counting studios
        console.log('\n🔍 Verifying insertion...');
        
        const { count, error: countError } = await supabase
            .from('gyms')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Count verification failed:', countError);
        } else {
            console.log(`📊 Total studios/gyms in database: ${count}`);
        }

        // Show sample of studios
        const { data: sampleData, error: sampleError } = await supabase
            .from('gyms')
            .select('name, location')
            .limit(3);

        if (sampleError) {
            console.error('❌ Sample query failed:', sampleError);
        } else {
            console.log('\n📋 Sample studios:');
            sampleData?.forEach((studio, index) => {
                console.log(`${index + 1}. ${studio.name} - ${studio.location}`);
            });
        }

        console.log('\n🎉 Studio data insertion completed successfully!');
        console.log('💡 Note: Data was inserted into the "gyms" table (which represents studios/fitness venues)');
        
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

// Run the script
insertStudioData().catch(console.error);