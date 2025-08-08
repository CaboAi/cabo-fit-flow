#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = "https://pamzfhiiuvmtlwwvufut.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function executeDatabaseSetup() {
  console.log('🚀 Starting Cabo Fit Pass Database Setup...\n');

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'complete-database-setup.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Split SQL into individual statements (basic splitting)
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute statements one by one
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements or comments
      if (!statement || statement.startsWith('--')) continue;
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        // For CREATE statements, we'll use the raw SQL execution
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // If the RPC doesn't exist, try direct SQL execution
          if (error.code === '42883') {
            console.log(`   Using direct execution for statement ${i + 1}`);
            // Try using the SQL REST API directly
            const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: statement + ';' })
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } else {
            throw error;
          }
        }

        console.log(`   ✅ Statement ${i + 1} executed successfully`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error in statement ${i + 1}: ${error.message}`);
        
        // Log the problematic statement for debugging
        if (statement.length < 200) {
          console.log(`      Statement: ${statement.substring(0, 200)}...`);
        }
        
        errorCount++;
        
        // Continue with next statement unless it's a critical error
        if (error.message.includes('does not exist') || error.message.includes('already exists')) {
          console.log(`      ⚠️  Non-critical error, continuing...\n`);
        } else {
          console.log(`      🔴 Critical error, but continuing...\n`);
        }
      }
    }

    console.log('\n=== DATABASE SETUP SUMMARY ===');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    console.log(`📊 Total operations: ${successCount + errorCount}`);

    // Test the key functions
    console.log('\n🧪 Testing key functions...');
    await testFunctions();

  } catch (error) {
    console.error('💥 Fatal error during database setup:', error.message);
    process.exit(1);
  }
}

async function testFunctions() {
  try {
    // Test get_user_credit_balance function
    console.log('  Testing get_user_credit_balance...');
    const { data: balance, error: balanceError } = await supabase
      .rpc('get_user_credit_balance', { 
        p_user_id: '00000000-0000-0000-0000-000000000001' 
      });
    
    if (balanceError) {
      console.log(`    ❌ get_user_credit_balance: ${balanceError.message}`);
    } else {
      console.log(`    ✅ get_user_credit_balance: ${balance} credits`);
    }

    // Test studios data
    console.log('  Testing studios table...');
    const { data: studios, error: studiosError } = await supabase
      .from('studios')
      .select('name')
      .limit(3);

    if (studiosError) {
      console.log(`    ❌ Studios query: ${studiosError.message}`);
    } else {
      console.log(`    ✅ Studios: Found ${studios?.length || 0} studios`);
      if (studios && studios.length > 0) {
        console.log(`       Sample: ${studios[0].name}`);
      }
    }

    // Test user_credits table
    console.log('  Testing user_credits table...');
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .limit(1);

    if (creditsError) {
      console.log(`    ❌ User credits query: ${creditsError.message}`);
    } else {
      console.log(`    ✅ User credits table: ${credits?.length || 0} records`);
    }

  } catch (error) {
    console.log(`    ❌ Function testing failed: ${error.message}`);
  }
}

// Alternative: Manual SQL execution via Dashboard
function printManualInstructions() {
  console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS:');
  console.log('If automatic execution fails, follow these steps:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/pamzfhiiuvmtlwwvufut');
  console.log('2. Navigate to: SQL Editor');
  console.log('3. Copy the entire contents of: complete-database-setup.sql');
  console.log('4. Paste and execute in the SQL Editor');
  console.log('5. Verify success by running: npm run verify-db\n');
}

// Run the setup
if (require.main === module) {
  executeDatabaseSetup()
    .then(() => {
      console.log('\n🎉 Database setup process completed!');
      printManualInstructions();
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error.message);
      printManualInstructions();
      process.exit(1);
    });
}

module.exports = { executeDatabaseSetup, testFunctions };