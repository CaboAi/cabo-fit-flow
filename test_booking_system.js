#!/usr/bin/env node

/**
 * Test script for Cabo FitPass booking system validation
 * Run this after executing the SQL files in Supabase dashboard
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase Configuration
const SUPABASE_URL = 'https://pamzfhiiuvmtlwwvufut.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test data
const TEST_USER_ID = '661db286-593a-4c1e-8ce8-fb4ea43cd58a';
const TEST_USER_EMAIL = 'mariopjr91@gmail.com';
const VALID_CLASS_IDS = [
  'e8c7dd4f-2346-484d-9933-2b338c405540', // Yoga Session
  'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06', // CrossFit WOD
  '351ce744-e434-4561-9a86-32bcb3874c32'  // Swimming Lessons
];

class BookingSystemTester {
  constructor() {
    this.testResults = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    console.log(formattedMessage);
    
    this.testResults.push({
      timestamp,
      message,
      type
    });
  }

  async testConnection() {
    await this.log('🔌 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      await this.log('✅ Connection successful', 'success');
      return true;
    } catch (error) {
      await this.log(`❌ Connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testUserProfile() {
    await this.log('👤 Testing user profile creation...');
    
    try {
      // Try to create the test user profile
      const profileData = {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        full_name: 'Mario Polanco Jr',
        role: 'local',
        phone: '+52-123-456-7890',
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileData])
        .select();

      if (error) throw error;

      await this.log(`✅ User profile created/updated for ${TEST_USER_EMAIL}`, 'success');
      return true;
    } catch (error) {
      await this.log(`⚠️  User profile creation failed: ${error.message}`, 'warning');
      await this.log('   Note: This is expected if RLS is enabled. Create manually in dashboard.', 'info');
      return false;
    }
  }

  async testValidBooking() {
    await this.log('📅 Testing valid booking creation...');
    
    try {
      const bookingData = {
        user_id: TEST_USER_ID,
        class_id: VALID_CLASS_IDS[0], // Yoga Session
        type: 'drop-in',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select();

      if (error) throw error;

      await this.log(`✅ Valid booking created: ${data[0].id}`, 'success');
      return data[0];
    } catch (error) {
      await this.log(`❌ Valid booking failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testInvalidClassBooking() {
    await this.log('🚫 Testing invalid class ID booking...');
    
    try {
      const invalidBookingData = {
        user_id: TEST_USER_ID,
        class_id: '00000000-0000-0000-0000-000000000000', // Invalid class ID
        type: 'drop-in',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([invalidBookingData])
        .select();

      if (error) throw error;

      await this.log(`❌ Invalid booking was accepted (triggers not working): ${data[0].id}`, 'error');
      return false;
    } catch (error) {
      await this.log(`✅ Invalid booking rejected (triggers working): ${error.message}`, 'success');
      return true;
    }
  }

  async testInvalidUserBooking() {
    await this.log('👤 Testing invalid user ID booking...');
    
    try {
      const invalidUserBooking = {
        user_id: '00000000-0000-0000-0000-000000000000', // Invalid user ID
        class_id: VALID_CLASS_IDS[0],
        type: 'drop-in',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([invalidUserBooking])
        .select();

      if (error) throw error;

      await this.log(`❌ Invalid user booking was accepted (triggers not working): ${data[0].id}`, 'error');
      return false;
    } catch (error) {
      await this.log(`✅ Invalid user booking rejected (triggers working): ${error.message}`, 'success');
      return true;
    }
  }

  async testInvalidBookingType() {
    await this.log('🏷️  Testing invalid booking type...');
    
    try {
      const invalidTypeBooking = {
        user_id: TEST_USER_ID,
        class_id: VALID_CLASS_IDS[0],
        type: 'invalid-type',
        payment_status: 'pending'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([invalidTypeBooking])
        .select();

      if (error) throw error;

      await this.log(`❌ Invalid type booking was accepted (constraints not working): ${data[0].id}`, 'error');
      return false;
    } catch (error) {
      await this.log(`✅ Invalid type booking rejected (constraints working): ${error.message}`, 'success');
      return true;
    }
  }

  async testCapacityLimit() {
    await this.log('📊 Testing capacity limit validation...');
    
    try {
      // Get class with smallest capacity (Swimming Lessons - 8 people)
      const smallClassId = VALID_CLASS_IDS[2];
      
      // Try to create multiple bookings to exceed capacity
      const bookings = [];
      for (let i = 0; i < 10; i++) {
        try {
          const bookingData = {
            user_id: TEST_USER_ID,
            class_id: smallClassId,
            type: 'drop-in',
            payment_status: 'pending'
          };

          const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select();

          if (error) throw error;
          bookings.push(data[0]);
        } catch (error) {
          if (error.message.includes('full') || error.message.includes('capacity')) {
            await this.log(`✅ Capacity limit enforced after ${bookings.length} bookings: ${error.message}`, 'success');
            return true;
          } else {
            throw error;
          }
        }
      }

      await this.log(`⚠️  Created ${bookings.length} bookings without capacity limit`, 'warning');
      return false;
    } catch (error) {
      await this.log(`❌ Capacity test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testConstraints() {
    await this.log('🔒 Testing booking constraints...');
    
    const tests = [
      { name: 'Valid booking types', test: () => this.testValidBookingTypes() },
      { name: 'Valid payment statuses', test: () => this.testValidPaymentStatuses() }
    ];

    for (const test of tests) {
      await this.log(`   Testing: ${test.name}`);
      await test.test();
    }
  }

  async testValidBookingTypes() {
    const validTypes = ['drop-in', 'subscription', 'day-pass', 'trial', 'membership'];
    
    for (const type of validTypes) {
      try {
        const bookingData = {
          user_id: TEST_USER_ID,
          class_id: VALID_CLASS_IDS[0],
          type: type,
          payment_status: 'pending'
        };

        const { error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select();

        if (error && !error.message.includes('duplicate')) {
          await this.log(`   ❌ Valid type '${type}' rejected: ${error.message}`, 'error');
        } else {
          await this.log(`   ✅ Valid type '${type}' accepted`, 'success');
        }
      } catch (error) {
        await this.log(`   ❌ Error testing type '${type}': ${error.message}`, 'error');
      }
    }
  }

  async testValidPaymentStatuses() {
    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    
    for (const status of validStatuses) {
      try {
        const bookingData = {
          user_id: TEST_USER_ID,
          class_id: VALID_CLASS_IDS[0],
          type: 'drop-in',
          payment_status: status
        };

        const { error } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select();

        if (error && !error.message.includes('duplicate')) {
          await this.log(`   ❌ Valid status '${status}' rejected: ${error.message}`, 'error');
        } else {
          await this.log(`   ✅ Valid status '${status}' accepted`, 'success');
        }
      } catch (error) {
        await this.log(`   ❌ Error testing status '${status}': ${error.message}`, 'error');
      }
    }
  }

  async cleanupTestData() {
    await this.log('🧹 Cleaning up test data...');
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', TEST_USER_ID);

      if (error) throw error;

      await this.log('✅ Test bookings cleaned up', 'success');
    } catch (error) {
      await this.log(`⚠️  Cleanup failed: ${error.message}`, 'warning');
    }
  }

  async generateReport() {
    await this.log('\n📊 BOOKING SYSTEM TEST REPORT');
    await this.log('=' + '='.repeat(40));
    
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const warningCount = this.testResults.filter(r => r.type === 'warning').length;
    
    await this.log(`✅ Successful tests: ${successCount}`);
    await this.log(`❌ Failed tests: ${errorCount}`);
    await this.log(`⚠️  Warnings: ${warningCount}`);
    
    if (errorCount === 0) {
      await this.log('\n🎉 All tests passed! Booking system is working correctly.');
    } else if (errorCount < 3) {
      await this.log('\n⚠️  Some tests failed. Check SQL deployment or RLS policies.');
    } else {
      await this.log('\n❌ Many tests failed. SQL triggers may not be deployed.');
    }
  }

  async run() {
    await this.log('🧪 Starting Cabo FitPass Booking System Tests');
    await this.log('=' + '='.repeat(50));
    
    const tests = [
      { name: 'Connection Test', fn: () => this.testConnection() },
      { name: 'User Profile Test', fn: () => this.testUserProfile() },
      { name: 'Valid Booking Test', fn: () => this.testValidBooking() },
      { name: 'Invalid Class Test', fn: () => this.testInvalidClassBooking() },
      { name: 'Invalid User Test', fn: () => this.testInvalidUserBooking() },
      { name: 'Invalid Type Test', fn: () => this.testInvalidBookingType() },
      { name: 'Capacity Limit Test', fn: () => this.testCapacityLimit() },
      { name: 'Constraints Test', fn: () => this.testConstraints() }
    ];

    for (const test of tests) {
      await this.log(`\n🧪 ${test.name}`);
      try {
        await test.fn();
      } catch (error) {
        await this.log(`❌ Test failed: ${error.message}`, 'error');
      }
    }

    await this.cleanupTestData();
    await this.generateReport();
  }
}

// Main execution
async function main() {
  const tester = new BookingSystemTester();
  await tester.run();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = BookingSystemTester;