#!/usr/bin/env node

/**
 * Test script to verify foreign key violation fixes
 * Tests both UI form submission and API endpoints
 */

require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

// Simple UUID v4 generator
function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

console.log('🧪 Testing Foreign Key Violation Fixes\n');

async function testAPIBookingWithNewUser() {
    console.log('1. Testing API booking with new user ID...');
    
    const newUserId = uuidv4();
    const testBooking = {
        user_id: newUserId,
        class_id: '40ec6001-c070-426a-9d8d-45326d0d7dac', // Assuming this class exists - update if needed
        type: 'drop-in',
        notes: 'Test booking with new user',
        full_name: 'Test User API',
        email: 'testuser@example.com'
    };
    
    try {
        const response = await axios.post(`${API_BASE}/book`, testBooking);
        
        if (response.data.success) {
            console.log('✅ API booking with new user succeeded');
            console.log(`   Created booking ID: ${response.data.data.id}`);
            if (response.data.meta) {
                console.log(`   User was ${response.data.meta.userCreated ? 'created' : 'existing'}`);
            }
        } else {
            console.log('❌ API booking failed:', response.data.message);
        }
    } catch (error) {
        if (error.response) {
            console.log('❌ API booking failed:', error.response.data.message);
            console.log(`   Error code: ${error.response.data.code}`);
        } else {
            console.log('❌ Network error:', error.message);
        }
    }
    
    console.log('');
}

async function testAPIBookingWithInvalidClass() {
    console.log('2. Testing API booking with invalid class ID...');
    
    const invalidClassId = uuidv4();
    const testBooking = {
        user_id: '661db286-593a-4c1e-8ce8-fb4ea43cd58a', // Test user
        class_id: invalidClassId,
        type: 'drop-in',
        notes: 'Test booking with invalid class'
    };
    
    try {
        const response = await axios.post(`${API_BASE}/book`, testBooking);
        console.log('❌ Expected failure but got success:', response.data);
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('✅ Correctly rejected invalid class ID');
            console.log(`   Error: ${error.response.data.message}`);
        } else if (error.response) {
            console.log('❌ Unexpected error:', error.response.data.message);
        } else {
            console.log('❌ Network error:', error.message);
        }
    }
    
    console.log('');
}

async function testUIBookingRedirect() {
    console.log('3. Testing UI form submission with new user...');
    
    const newUserId = uuidv4();
    const formData = new URLSearchParams({
        user_id: newUserId,
        class_id: '40ec6001-c070-426a-9d8d-45326d0d7dac', // Update if needed
        type: 'monthly',
        notes: 'Test UI booking',
        class_title: 'Test Class'
    });
    
    try {
        const response = await axios.post(`${BASE_URL}/book-class`, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            maxRedirects: 0, // Don't follow redirects so we can see the response
            validateStatus: (status) => status < 400 // Accept redirects as success
        });
        
        console.log('❌ Expected redirect but got:', response.status);
    } catch (error) {
        if (error.response && error.response.status === 302) {
            const location = error.response.headers.location;
            if (location && location.includes('success=')) {
                console.log('✅ UI booking succeeded - redirected to success');
                const successMessage = decodeURIComponent(location.split('success=')[1]);
                console.log(`   Success message: ${successMessage}`);
            } else if (location && location.includes('error=')) {
                console.log('❌ UI booking failed - redirected to error');
                const errorMessage = decodeURIComponent(location.split('error=')[1]);
                console.log(`   Error message: ${errorMessage}`);
            } else {
                console.log('❓ UI booking - unknown redirect:', location);
            }
        } else if (error.response) {
            console.log('❌ Unexpected status:', error.response.status);
        } else {
            console.log('❌ Network error:', error.message);
        }
    }
    
    console.log('');
}

async function testServerHealth() {
    console.log('0. Checking server health...');
    
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        if (response.data.success) {
            console.log('✅ Server is running');
        } else {
            console.log('❌ Server health check failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Server is not running. Please start with: npm start');
        return false;
    }
    
    console.log('');
    return true;
}

async function runTests() {
    const serverRunning = await testServerHealth();
    if (!serverRunning) {
        return;
    }
    
    await testAPIBookingWithNewUser();
    await testAPIBookingWithInvalidClass();
    await testUIBookingRedirect();
    
    console.log('🏁 Testing completed!\n');
    console.log('📝 Test Summary:');
    console.log('   - API bookings should auto-create user profiles when needed');
    console.log('   - Invalid class IDs should be properly rejected');
    console.log('   - UI form submissions should handle new users gracefully');
    console.log('   - Foreign key violations should show user-friendly messages');
}

// Run the tests
runTests().catch(console.error);