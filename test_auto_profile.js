#!/usr/bin/env node

/**
 * Test Auto Profile Creation System
 * Tests the complete signup flow with automatic profile creation
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use valid email domain
const TEST_EMAIL = `test_user_${Date.now()}@gmail.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_FULL_NAME = 'Test User Auto Profile';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🧪 Starting Auto Profile Creation Tests');
console.log('=====================================');

class AutoProfileTester {
  constructor() {
    this.testUserId = null;
    this.testEmail = TEST_EMAIL;
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async log(message, type = 'info') {
    const prefix = {
      info: '📝',
      success: '✅',
      error: '❌',
      warn: '⚠️'
    }[type] || '📝';
    
    console.log(`${prefix} ${message}`);
  }

  async test(name, testFn) {
    this.results.total++;
    await this.log(`Test ${this.results.total}: ${name}...`);
    
    try {
      const result = await testFn();
      if (result) {
        this.results.passed++;
        await this.log(`${name} - PASSED`, 'success');
      } else {
        this.results.failed++;
        await this.log(`${name} - FAILED`, 'error');
      }
      return result;
    } catch (error) {
      this.results.failed++;
      await this.log(`${name} - ERROR: ${error.message}`, 'error');
      return false;
    }
  }

  async testUserCreation() {
    await this.log(`Creating user with email: ${this.testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: this.testEmail,
      password: TEST_PASSWORD,
      options: {
        data: {
          full_name: TEST_FULL_NAME
        }
      }
    });

    if (error) {
      await this.log(`Auth user creation failed: ${error.message}`, 'error');
      return false;
    }

    if (!data.user) {
      await this.log('No user data returned from signup', 'error');
      return false;
    }

    this.testUserId = data.user.id;
    await this.log(`User created successfully with ID: ${this.testUserId}`, 'success');
    
    // Note: User will need to confirm email for full activation
    // but the user record should exist in auth.users
    return true;
  }

  async testProfileAutoCreation() {
    if (!this.testUserId) {
      await this.log('No user ID available for profile test', 'error');
      return false;
    }

    await this.log('Waiting for profile auto-creation trigger...');
    
    // Wait a moment for database trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if profile was created automatically
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.testUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        await this.log('Profile was not auto-created by trigger', 'error');
        await this.log('Check if auto_profile_creation.sql was executed correctly', 'warn');
        return false;
      } else {
        await this.log(`Profile check failed: ${error.message}`, 'error');
        return false;
      }
    }

    if (!profile) {
      await this.log('Profile query returned no data', 'error');
      return false;
    }

    await this.log('Profile auto-created successfully!', 'success');
    await this.log(`Profile data: ${JSON.stringify(profile, null, 2)}`);
    return true;
  }

  async testSignupEndpoint() {
    const testEmail = `signup_test_${Date.now()}@gmail.com`;
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          password: TEST_PASSWORD,
          full_name: 'Signup Test User'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        await this.log(`Signup endpoint failed: ${result.error}`, 'error');
        return false;
      }

      if (!result.success) {
        await this.log(`Signup endpoint returned success: false - ${result.error}`, 'error');
        return false;
      }

      await this.log('Signup endpoint works correctly', 'success');
      return true;

    } catch (error) {
      await this.log(`Signup endpoint test failed: ${error.message}`, 'error');
      await this.log('Make sure server is running on localhost:3000', 'warn');
      return false;
    }
  }

  async testLoginEndpoint() {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'nonexistent@gmail.com',
          password: 'wrongpassword'
        })
      });

      const result = await response.json();

      // We expect this to fail with 401
      if (response.status === 401 && !result.success) {
        await this.log('Login endpoint correctly rejects invalid credentials', 'success');
        return true;
      } else {
        await this.log('Login endpoint did not handle invalid credentials correctly', 'error');
        return false;
      }

    } catch (error) {
      await this.log(`Login endpoint test failed: ${error.message}`, 'error');
      await this.log('Make sure server is running on localhost:3000', 'warn');
      return false;
    }
  }

  async cleanupTestData() {
    await this.log('🧹 Cleaning up test data...');
    
    if (this.testUserId) {
      try {
        // Delete profile (this will cascade to any bookings due to foreign key)
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', this.testUserId);

        if (profileError) {
          await this.log(`Failed to cleanup profile: ${profileError.message}`, 'warn');
        } else {
          await this.log('Test profile cleaned up successfully');
        }
        
        // Note: Cannot delete from auth.users with anon key
        // This is expected - test users will remain in auth.users
        
      } catch (error) {
        await this.log(`Cleanup error: ${error.message}`, 'warn');
      }
    }
  }

  async generateReport() {
    await this.log('\n📊 Test Results');
    await this.log('================');
    await this.log(`✅ Tests Passed: ${this.results.passed}/${this.results.total}`);
    await this.log(`❌ Tests Failed: ${this.results.failed}/${this.results.total}`);

    if (this.results.failed === 0) {
      await this.log('\n🎉 All tests passed! Auto profile creation is working correctly.', 'success');
      await this.log('✅ Database triggers are functioning');
      await this.log('✅ API endpoints are responding correctly');
      await this.log('✅ Signup/login flow is ready for production');
    } else {
      await this.log('\n❌ Some tests failed. Please check your setup:', 'error');
      await this.log('1. Execute auto_profile_creation.sql in Supabase');
      await this.log('2. Add auth routes to server.js');
      await this.log('3. Create signup.ejs and login.ejs templates');
      await this.log('4. Restart server with: npm start');
    }

    await this.log('\n📋 Next Steps:');
    await this.log('1. Visit: http://localhost:3000/signup');
    await this.log('2. Create a test account');
    await this.log('3. Visit: http://localhost:3000/classes');
    await this.log('4. Try booking a class');
  }

  async run() {
    // Test 1: Direct Supabase user creation
    await this.test('Creating user with metadata', () => this.testUserCreation());
    
    // Test 2: Auto profile creation trigger
    await this.test('Auto profile creation trigger', () => this.testProfileAutoCreation());
    
    // Test 3: Signup API endpoint (if server is running)
    await this.test('Signup API endpoint', () => this.testSignupEndpoint());
    
    // Test 4: Login API endpoint (if server is running)
    await this.test('Login API endpoint validation', () => this.testLoginEndpoint());

    await this.cleanupTestData();
    await this.generateReport();
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/health');
    return response.ok;
  } catch (error) {
    console.log('⚠️  Server not running on localhost:3000');
    console.log('   This is OK - database tests will still run');
    console.log('   Start server with: npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    console.log('✅ Server detected on localhost:3000');
  }
  
  console.log('');
  
  const tester = new AutoProfileTester();
  await tester.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = AutoProfileTester;