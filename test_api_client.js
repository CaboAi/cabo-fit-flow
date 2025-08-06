#!/usr/bin/env node

/**
 * Cabo FitPass API Client Test Script
 * Tests the local Express server endpoints
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000';
const API_VERSION = 'v1';

// Test data
const TEST_USER_ID = '661db286-593a-4c1e-8ce8-fb4ea43cd58a';
const VALID_CLASS_IDS = [
  'e8c7dd4f-2346-484d-9933-2b338c405540', // Yoga Session
  'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06', // CrossFit WOD
  '351ce744-e434-4561-9a86-32bcb3874c32'  // Swimming Lessons
];

class APITester {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/${API_VERSION}`;
    this.testResults = [];
    this.createdBookings = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    
    console.log(`[${timestamp}] ${emoji} ${message}`);
    this.testResults.push({ timestamp, message, type });
  }

  async makeRequest(method, endpoint, data = null) {
    try {
      const config = {
        method,
        url: endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status || 500
      };
    }
  }

  async testHealthCheck() {
    await this.log('Testing health check endpoint...');
    
    const result = await this.makeRequest('GET', `${API_BASE_URL}/health`);
    
    if (result.success) {
      await this.log('Health check passed', 'success');
      return true;
    } else {
      await this.log(`Health check failed: ${result.error}`, 'error');
      return false;
    }
  }

  async testServerInfo() {
    await this.log('Testing server info endpoint...');
    
    const result = await this.makeRequest('GET', '/info');
    
    if (result.success) {
      await this.log('Server info retrieved successfully', 'success');
      await this.log(`Supported booking types: ${result.data.data.supportedBookingTypes.join(', ')}`);
      return true;
    } else {
      await this.log(`Server info failed: ${result.error}`, 'error');
      return false;
    }
  }

  async testGetGyms() {
    await this.log('Testing get gyms endpoint...');
    
    const result = await this.makeRequest('GET', '/gyms');
    
    if (result.success) {
      await this.log(`Found ${result.data.count} gyms`, 'success');
      if (result.data.data.length > 0) {
        await this.log(`Sample gym: ${result.data.data[0].name}`);
      }
      return result.data.data;
    } else {
      await this.log(`Get gyms failed: ${result.error}`, 'error');
      return [];
    }
  }

  async testGetClasses() {
    await this.log('Testing get classes endpoint...');
    
    const result = await this.makeRequest('GET', '/classes');
    
    if (result.success) {
      await this.log(`Found ${result.data.count} classes`, 'success');
      if (result.data.data.length > 0) {
        await this.log(`Sample class: ${result.data.data[0].title} - $${result.data.data[0].price}`);
      }
      return result.data.data;
    } else {
      await this.log(`Get classes failed: ${result.error}`, 'error');
      return [];
    }
  }

  async testValidBooking() {
    await this.log('Testing valid booking creation...');
    
    const bookingData = {
      user_id: TEST_USER_ID,
      class_id: VALID_CLASS_IDS[0],
      type: 'drop-in',
      payment_status: 'pending',
      notes: 'Test booking from API client'
    };

    const result = await this.makeRequest('POST', '/book', bookingData);
    
    if (result.success) {
      await this.log(`Valid booking created: ${result.data.data.id}`, 'success');
      await this.log(`Class: ${result.data.data.classes.title} at ${result.data.data.classes.gyms.name}`);
      this.createdBookings.push(result.data.data.id);
      return result.data.data;
    } else {
      await this.log(`Valid booking failed: ${JSON.stringify(result.error)}`, 'error');
      return null;
    }
  }

  async testInvalidBookingType() {
    await this.log('Testing invalid booking type...');
    
    const bookingData = {
      user_id: TEST_USER_ID,
      class_id: VALID_CLASS_IDS[0],
      type: 'invalid-type',
      payment_status: 'pending'
    };

    const result = await this.makeRequest('POST', '/book', bookingData);
    
    if (!result.success && result.status === 400) {
      await this.log('Invalid booking type rejected correctly', 'success');
      return true;
    } else {
      await this.log(`Invalid booking type test failed: expected rejection but got ${result.status}`, 'error');
      return false;
    }
  }

  async testMissingRequiredFields() {
    await this.log('Testing missing required fields...');
    
    const bookingData = {
      type: 'drop-in',
      payment_status: 'pending'
      // Missing user_id and class_id
    };

    const result = await this.makeRequest('POST', '/book', bookingData);
    
    if (!result.success && result.status === 400) {
      await this.log('Missing fields validation working correctly', 'success');
      return true;
    } else {
      await this.log(`Missing fields test failed: expected 400 but got ${result.status}`, 'error');
      return false;
    }
  }

  async testInvalidClassId() {
    await this.log('Testing invalid class ID...');
    
    const bookingData = {
      user_id: TEST_USER_ID,
      class_id: '00000000-0000-0000-0000-000000000000',
      type: 'drop-in',
      payment_status: 'pending'
    };

    const result = await this.makeRequest('POST', '/book', bookingData);
    
    if (!result.success && result.status === 404) {
      await this.log('Invalid class ID rejected correctly', 'success');
      return true;
    } else {
      await this.log(`Invalid class ID test failed: expected 404 but got ${result.status}`, 'error');
      return false;
    }
  }

  async testDuplicateBooking() {
    await this.log('Testing duplicate booking prevention...');
    
    const bookingData = {
      user_id: TEST_USER_ID,
      class_id: VALID_CLASS_IDS[1], // Different class from first test
      type: 'monthly',
      payment_status: 'pending'
    };

    // Create first booking
    const result1 = await this.makeRequest('POST', '/book', bookingData);
    
    if (result1.success) {
      this.createdBookings.push(result1.data.data.id);
      await this.log('First booking created successfully');
      
      // Try to create duplicate
      const result2 = await this.makeRequest('POST', '/book', bookingData);
      
      if (!result2.success && result2.status === 409) {
        await this.log('Duplicate booking prevented correctly', 'success');
        return true;
      } else {
        await this.log(`Duplicate booking test failed: expected 409 but got ${result2.status}`, 'error');
        return false;
      }
    } else {
      await this.log(`Could not create first booking for duplicate test: ${result1.error}`, 'error');
      return false;
    }
  }

  async testGetUserBookings() {
    await this.log('Testing get user bookings...');
    
    const result = await this.makeRequest('GET', `/bookings/${TEST_USER_ID}`);
    
    if (result.success) {
      await this.log(`Retrieved ${result.data.count} bookings for user`, 'success');
      return result.data.data;
    } else {
      await this.log(`Get user bookings failed: ${result.error}`, 'error');
      return [];
    }
  }

  async testBookingTypesValidation() {
    await this.log('Testing all valid booking types...');
    
    const validTypes = ['drop-in', 'monthly', 'one-time'];
    let allPassed = true;

    for (const type of validTypes) {
      const bookingData = {
        user_id: TEST_USER_ID,
        class_id: VALID_CLASS_IDS[2], // Swimming lessons
        type: type,
        payment_status: 'pending',
        notes: `Testing ${type} booking type`
      };

      const result = await this.makeRequest('POST', '/book', bookingData);
      
      if (result.success) {
        await this.log(`✅ Booking type '${type}' accepted`);
        this.createdBookings.push(result.data.data.id);
      } else if (result.status === 409 && result.error.code === 'DUPLICATE_BOOKING') {
        await this.log(`⚠️  Booking type '${type}' would be accepted (duplicate prevented)`);
      } else {
        await this.log(`❌ Booking type '${type}' rejected: ${result.error}`, 'error');
        allPassed = false;
      }
    }

    return allPassed;
  }

  async cleanupTestBookings() {
    await this.log('Cleaning up test bookings...');
    
    let cleanedCount = 0;
    for (const bookingId of this.createdBookings) {
      const result = await this.makeRequest('DELETE', `/bookings/${bookingId}`, {
        userId: TEST_USER_ID
      });
      
      if (result.success) {
        cleanedCount++;
      }
    }
    
    await this.log(`Cleaned up ${cleanedCount}/${this.createdBookings.length} test bookings`);
  }

  async generateReport() {
    await this.log('\n📊 API TEST REPORT');
    await this.log('=' + '='.repeat(40));
    
    const successCount = this.testResults.filter(r => r.type === 'success').length;
    const errorCount = this.testResults.filter(r => r.type === 'error').length;
    const warningCount = this.testResults.filter(r => r.type === 'warning').length;
    
    await this.log(`✅ Successful tests: ${successCount}`);
    await this.log(`❌ Failed tests: ${errorCount}`);
    await this.log(`⚠️  Warnings: ${warningCount}`);
    
    if (errorCount === 0) {
      await this.log('\n🎉 All API tests passed! Server is working correctly.');
    } else if (errorCount < 3) {
      await this.log('\n⚠️  Some tests failed. Check server logs for details.');
    } else {
      await this.log('\n❌ Many tests failed. Server may not be running or configured correctly.');
    }

    await this.log(`\n📈 Total test bookings created: ${this.createdBookings.length}`);
  }

  async run() {
    await this.log('🧪 Starting Cabo FitPass API Client Tests');
    await this.log('=' + '='.repeat(50));
    
    const tests = [
      { name: 'Health Check', fn: () => this.testHealthCheck() },
      { name: 'Server Info', fn: () => this.testServerInfo() },
      { name: 'Get Gyms', fn: () => this.testGetGyms() },
      { name: 'Get Classes', fn: () => this.testGetClasses() },
      { name: 'Valid Booking', fn: () => this.testValidBooking() },
      { name: 'Invalid Booking Type', fn: () => this.testInvalidBookingType() },
      { name: 'Missing Fields', fn: () => this.testMissingRequiredFields() },
      { name: 'Invalid Class ID', fn: () => this.testInvalidClassId() },
      { name: 'Duplicate Booking', fn: () => this.testDuplicateBooking() },
      { name: 'Booking Types Validation', fn: () => this.testBookingTypesValidation() },
      { name: 'Get User Bookings', fn: () => this.testGetUserBookings() }
    ];

    for (const test of tests) {
      await this.log(`\n🧪 ${test.name}`);
      try {
        await test.fn();
      } catch (error) {
        await this.log(`Test failed with exception: ${error.message}`, 'error');
      }
    }

    await this.cleanupTestBookings();
    await this.generateReport();
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return true;
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.error('   npm start  (or)  node server.js');
    console.error(`   Expected server at: ${API_BASE_URL}`);
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServerStatus();
  if (!serverRunning) {
    process.exit(1);
  }

  const tester = new APITester();
  await tester.run();
}

// Add axios as dependency check
try {
  require('axios');
} catch (error) {
  console.error('❌ Missing dependency: axios');
  console.error('Install it with: npm install axios');
  process.exit(1);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = APITester;