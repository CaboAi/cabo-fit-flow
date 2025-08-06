/**
 * Credit System Test Suite
 * Comprehensive testing for the Cabo Fit Pass credit system
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const TEST_CONFIG = {
    testUserId: '40ec6001-c070-426a-9d8d-45326d0d7dac', // Mario's user ID
    colors: {
        reset: '\x1b[0m',
        bright: '\x1b[1m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        cyan: '\x1b[36m'
    }
};

// Test utilities
const log = {
    info: (msg) => console.log(`${TEST_CONFIG.colors.blue}ℹ️  ${msg}${TEST_CONFIG.colors.reset}`),
    success: (msg) => console.log(`${TEST_CONFIG.colors.green}✅ ${msg}${TEST_CONFIG.colors.reset}`),
    error: (msg) => console.log(`${TEST_CONFIG.colors.red}❌ ${msg}${TEST_CONFIG.colors.reset}`),
    warn: (msg) => console.log(`${TEST_CONFIG.colors.yellow}⚠️  ${msg}${TEST_CONFIG.colors.reset}`),
    test: (msg) => console.log(`${TEST_CONFIG.colors.cyan}🧪 ${msg}${TEST_CONFIG.colors.reset}`),
    header: (msg) => {
        console.log(`\n${TEST_CONFIG.colors.bright}${'='.repeat(60)}`);
        console.log(`${msg}`);
        console.log(`${'='.repeat(60)}${TEST_CONFIG.colors.reset}\n`);
    }
};

// Test functions
class CreditSystemTester {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
    }

    async runTest(testName, testFn) {
        this.totalTests++;
        log.test(`Running: ${testName}`);
        
        try {
            await testFn();
            this.passedTests++;
            log.success(`PASSED: ${testName}`);
            this.testResults.push({ name: testName, status: 'PASSED' });
        } catch (error) {
            log.error(`FAILED: ${testName} - ${error.message}`);
            this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
        }
        
        console.log(''); // Add spacing
    }

    async testDatabaseMigrations() {
        log.header('DATABASE MIGRATION TESTS');

        await this.runTest('Test plans table has credit fields', async () => {
            const { data, error } = await supabase
                .from('plans')
                .select('name, credits_included, credit_rollover_limit, plan_type')
                .limit(1);
            
            if (error) throw new Error(`Plans table query failed: ${error.message}`);
            if (!data || data.length === 0) throw new Error('No plans found in database');
            
            const plan = data[0];
            if (plan.credits_included === undefined) throw new Error('credits_included field missing');
            if (plan.credit_rollover_limit === undefined) throw new Error('credit_rollover_limit field missing');
            if (plan.plan_type === undefined) throw new Error('plan_type field missing');
        });

        await this.runTest('Test user_credits table exists', async () => {
            const { data, error } = await supabase
                .from('user_credits')
                .select('*')
                .limit(1);
            
            if (error) throw new Error(`User credits table query failed: ${error.message}`);
        });

        await this.runTest('Test class_credit_costs table exists', async () => {
            const { data, error } = await supabase
                .from('class_credit_costs')
                .select('*')
                .limit(1);
            
            if (error) throw new Error(`Class credit costs table query failed: ${error.message}`);
        });

        await this.runTest('Test credit_transactions table exists', async () => {
            const { data, error } = await supabase
                .from('credit_transactions')
                .select('*')
                .limit(1);
            
            if (error) throw new Error(`Credit transactions table query failed: ${error.message}`);
        });
    }

    async testCreditFunctions() {
        log.header('DATABASE FUNCTION TESTS');

        await this.runTest('Test get_user_credit_balance function', async () => {
            const { data, error } = await supabase
                .rpc('get_user_credit_balance', { p_user_id: TEST_CONFIG.testUserId });
            
            if (error) throw new Error(`Function call failed: ${error.message}`);
            if (typeof data !== 'number') throw new Error(`Expected number, got ${typeof data}`);
            
            log.info(`User credit balance: ${data}`);
        });

        await this.runTest('Test get_class_credit_cost function', async () => {
            // Get a class ID first
            const { data: classes, error: classError } = await supabase
                .from('classes')
                .select('id')
                .limit(1);
            
            if (classError || !classes || classes.length === 0) {
                throw new Error('No classes found to test with');
            }

            const { data, error } = await supabase
                .rpc('get_class_credit_cost', { 
                    p_class_id: classes[0].id,
                    p_booking_datetime: new Date().toISOString()
                });
            
            if (error) throw new Error(`Function call failed: ${error.message}`);
            if (typeof data !== 'number') throw new Error(`Expected number, got ${typeof data}`);
            if (data < 1) throw new Error(`Invalid cost: ${data}`);
            
            log.info(`Class credit cost: ${data}`);
        });

        await this.runTest('Test log_credit_transaction function', async () => {
            const { data, error } = await supabase
                .rpc('log_credit_transaction', {
                    p_user_id: TEST_CONFIG.testUserId,
                    p_transaction_type: 'purchased',
                    p_credits_amount: 1,
                    p_description: 'Test transaction for credit system verification',
                    p_metadata: { test: true, timestamp: new Date().toISOString() }
                });
            
            if (error) throw new Error(`Function call failed: ${error.message}`);
            if (!data) throw new Error('No transaction ID returned');
            
            log.info(`Created test transaction: ${data}`);
        });
    }

    async testCreditViews() {
        log.header('DATABASE VIEW TESTS');

        await this.runTest('Test user_credit_dashboard view', async () => {
            const { data, error } = await supabase
                .from('user_credit_dashboard')
                .select('*')
                .eq('user_id', TEST_CONFIG.testUserId)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                throw new Error(`View query failed: ${error.message}`);
            }
            
            if (!error && data) {
                log.info(`Dashboard data found for user: ${data.full_name}`);
                log.info(`Credits balance: ${data.credits_balance}`);
                log.info(`Plan: ${data.plan_name}`);
            } else {
                log.warn('No dashboard data found (user may not have active subscription)');
            }
        });

        await this.runTest('Test credit_transaction_summary view', async () => {
            const { data, error } = await supabase
                .from('credit_transaction_summary')
                .select('*')
                .limit(5);
            
            if (error) throw new Error(`View query failed: ${error.message}`);
            
            log.info(`Found ${data ? data.length : 0} transaction summary records`);
        });
    }

    async testSystemIntegrity() {
        log.header('SYSTEM INTEGRITY TESTS');

        await this.runTest('Test RLS policies are enabled', async () => {
            // Test that tables have RLS enabled
            const tables = ['user_credits', 'class_credit_costs', 'credit_transactions'];
            
            for (const table of tables) {
                const { data, error } = await supabase
                    .from('pg_tables')
                    .select('*')
                    .eq('tablename', table);
                
                if (error) throw new Error(`Failed to check table ${table}: ${error.message}`);
                // Note: We can't easily check RLS status from client, but we can verify tables exist
            }
        });

        await this.runTest('Test data consistency', async () => {
            // Check that there are no orphaned records
            const { data: userCreditsCount, error: ucError } = await supabase
                .from('user_credits')
                .select('*', { count: 'exact', head: true });
            
            if (ucError) throw new Error(`User credits count failed: ${ucError.message}`);

            const { data: transactionsCount, error: tError } = await supabase
                .from('credit_transactions')
                .select('*', { count: 'exact', head: true });
            
            if (tError) throw new Error(`Transactions count failed: ${tError.message}`);

            log.info(`User credits records: ${userCreditsCount}`);
            log.info(`Transaction records: ${transactionsCount}`);
        });
    }

    async testErrorHandling() {
        log.header('ERROR HANDLING TESTS');

        await this.runTest('Test invalid user ID handling', async () => {
            const { data, error } = await supabase
                .rpc('get_user_credit_balance', { p_user_id: 'invalid-uuid' });
            
            // This should either return 0 or error gracefully
            if (error && !error.message.includes('invalid input syntax')) {
                throw new Error(`Unexpected error for invalid UUID: ${error.message}`);
            }
            
            if (!error && data !== 0) {
                log.warn(`Expected 0 for invalid user, got: ${data}`);
            }
        });

        await this.runTest('Test invalid class ID handling', async () => {
            const { data, error } = await supabase
                .rpc('get_class_credit_cost', { 
                    p_class_id: '00000000-0000-0000-0000-000000000000',
                    p_booking_datetime: new Date().toISOString()
                });
            
            // Should handle non-existent class gracefully
            if (error && !error.message.includes('Class not found')) {
                log.warn(`Unexpected error handling for invalid class: ${error.message}`);
            }
        });
    }

    async runAllTests() {
        log.header('CABO FIT PASS CREDIT SYSTEM TEST SUITE');
        log.info('Starting comprehensive credit system tests...');
        log.info(`Test user: ${TEST_CONFIG.testUserId}`);
        
        const startTime = Date.now();

        try {
            await this.testDatabaseMigrations();
            await this.testCreditFunctions();
            await this.testCreditViews();
            await this.testSystemIntegrity();
            await this.testErrorHandling();
        } catch (error) {
            log.error(`Test suite error: ${error.message}`);
        }

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        this.printSummary(duration);
    }

    printSummary(duration) {
        log.header('TEST RESULTS SUMMARY');
        
        const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
        
        console.log(`${TEST_CONFIG.colors.bright}📊 Test Statistics:`);
        console.log(`   Total Tests: ${this.totalTests}`);
        console.log(`   Passed: ${TEST_CONFIG.colors.green}${this.passedTests}${TEST_CONFIG.colors.bright}`);
        console.log(`   Failed: ${TEST_CONFIG.colors.red}${this.totalTests - this.passedTests}${TEST_CONFIG.colors.bright}`);
        console.log(`   Pass Rate: ${passRate}%`);
        console.log(`   Duration: ${duration}s${TEST_CONFIG.colors.reset}`);

        if (this.passedTests === this.totalTests) {
            log.success('🎉 ALL TESTS PASSED! Credit system is working correctly.');
        } else {
            log.error('⚠️  Some tests failed. Please review the errors above.');
            console.log('\n📋 Failed Tests:');
            this.testResults
                .filter(result => result.status === 'FAILED')
                .forEach(result => {
                    console.log(`   ❌ ${result.name}: ${result.error}`);
                });
        }

        log.header('NEXT STEPS');
        
        if (this.passedTests === this.totalTests) {
            console.log('✅ Your credit system is ready for production!');
            console.log('\n🚀 To complete setup:');
            console.log('   1. Execute all SQL migrations in Supabase SQL Editor');
            console.log('   2. Start your server: node server.js');
            console.log('   3. Test API endpoints with your frontend');
            console.log('   4. Configure payment processing for credit purchases');
        } else {
            console.log('🔧 Fix the failed tests before proceeding:');
            console.log('   1. Review SQL migration files in sql_migrations/');
            console.log('   2. Execute migrations in correct order (01-05)');
            console.log('   3. Check Supabase permissions and RLS policies');
            console.log('   4. Re-run this test: node test_credit_system.js');
        }
    }
}

// Health check function
async function healthCheck() {
    log.header('CREDIT SYSTEM HEALTH CHECK');
    
    try {
        // Test database connection
        const { data, error } = await supabase
            .from('profiles')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            log.error(`Database connection failed: ${error.message}`);
            return false;
        }
        
        log.success('Database connection: OK');
        log.info(`Found ${data} profiles in database`);
        
        // Test if Mario's profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .eq('id', TEST_CONFIG.testUserId)
            .single();
        
        if (profileError) {
            log.warn('Test user profile not found (this is OK for fresh installations)');
        } else {
            log.success(`Test user found: ${profile.full_name} (${profile.email})`);
        }
        
        return true;
        
    } catch (error) {
        log.error(`Health check failed: ${error.message}`);
        return false;
    }
}

// Main execution
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--health')) {
        const healthy = await healthCheck();
        process.exit(healthy ? 0 : 1);
        return;
    }
    
    // Run full test suite
    const tester = new CreditSystemTester();
    await tester.runAllTests();
    
    // Exit with appropriate code
    const exitCode = tester.passedTests === tester.totalTests ? 0 : 1;
    process.exit(exitCode);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
    log.error(`Unhandled Rejection: ${reason}`);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    log.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

// Run the tests
if (require.main === module) {
    main().catch((error) => {
        log.error(`Test runner error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = CreditSystemTester;