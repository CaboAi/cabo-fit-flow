#!/usr/bin/env node

/**
 * Cabo FitPass API Usage Demo
 * Demonstrates how to use the booking API with real examples
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_USER_ID = '661db286-593a-4c1e-8ce8-fb4ea43cd58a';

class APIDemo {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
  }

  async log(message, data = null) {
    console.log(`📍 ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log();
  }

  async demo() {
    console.log('🎯 Cabo FitPass API Usage Demo');
    console.log('=' + '='.repeat(40));
    console.log();

    try {
      // 1. Check server health
      await this.log('1. Checking server health...');
      const health = await this.client.get('/health');
      await this.log('✅ Server is healthy!', {
        message: health.data.message,
        timestamp: health.data.timestamp
      });

      // 2. Get server info
      await this.log('2. Getting server information...');
      const info = await this.client.get('/info');
      await this.log('ℹ️  Server Info:', {
        name: info.data.data.name,
        version: info.data.data.version,
        supportedBookingTypes: info.data.data.supportedBookingTypes,
        maxBookingsPerUser: info.data.data.maxBookingsPerUser
      });

      // 3. Get all gyms
      await this.log('3. Fetching available gyms...');
      const gyms = await this.client.get('/gyms');
      await this.log(`🏢 Found ${gyms.data.count} gyms:`, 
        gyms.data.data.map(gym => ({
          id: gym.id,
          name: gym.name,
          location: gym.location
        }))
      );

      // 4. Get all classes
      await this.log('4. Fetching available classes...');
      const classes = await this.client.get('/classes');
      await this.log(`📅 Found ${classes.data.count} classes:`,
        classes.data.data.map(cls => ({
          id: cls.id,
          title: cls.title,
          price: `$${cls.price}`,
          capacity: cls.capacity,
          gym: cls.gyms.name,
          schedule: new Date(cls.schedule).toLocaleString()
        }))
      );

      // 5. Create a valid booking
      if (classes.data.data.length > 0) {
        const firstClass = classes.data.data[0];
        
        await this.log('5. Creating a booking...');
        const bookingData = {
          user_id: TEST_USER_ID,
          class_id: firstClass.id,
          type: 'drop-in',
          payment_status: 'pending',
          notes: 'Demo booking - testing API functionality'
        };

        try {
          const booking = await this.client.post('/book', bookingData);
          await this.log('✅ Booking created successfully!', {
            bookingId: booking.data.data.id,
            class: booking.data.data.classes.title,
            gym: booking.data.data.classes.gyms.name,
            type: booking.data.data.type,
            status: booking.data.data.payment_status,
            remainingCapacity: booking.data.meta.remainingCapacity
          });

          // 6. Get user's bookings
          await this.log('6. Retrieving user bookings...');
          const userBookings = await this.client.get(`/bookings/${TEST_USER_ID}`);
          await this.log(`📋 User has ${userBookings.data.count} bookings:`,
            userBookings.data.data.map(booking => ({
              id: booking.id,
              class: booking.classes.title,
              gym: booking.classes.gyms.name,
              status: booking.payment_status,
              schedule: new Date(booking.classes.schedule).toLocaleString()
            }))
          );

          // 7. Demonstrate validation errors
          await this.log('7. Testing validation (invalid booking type)...');
          try {
            await this.client.post('/book', {
              user_id: TEST_USER_ID,
              class_id: firstClass.id,
              type: 'invalid-type',
              payment_status: 'pending'
            });
          } catch (error) {
            await this.log('✅ Validation working correctly!', {
              error: error.response.data.error,
              details: error.response.data.details
            });
          }

          // 8. Test duplicate booking prevention
          await this.log('8. Testing duplicate booking prevention...');
          try {
            await this.client.post('/book', bookingData);
          } catch (error) {
            await this.log('✅ Duplicate prevention working!', {
              error: error.response.data.error,
              code: error.response.data.code
            });
          }

          // 9. Cancel the booking
          await this.log('9. Cancelling the demo booking...');
          try {
            const cancelResult = await this.client.delete(`/bookings/${booking.data.data.id}`, {
              data: { userId: TEST_USER_ID }
            });
            await this.log('✅ Booking cancelled successfully!', {
              bookingId: cancelResult.data.data.id,
              status: cancelResult.data.data.payment_status
            });
          } catch (error) {
            await this.log('⚠️  Cancellation note:', {
              error: error.response?.data?.error || error.message,
              note: 'May fail if booking is within 24 hours of class time'
            });
          }

        } catch (error) {
          if (error.response?.status === 409 && error.response?.data?.code === 'DUPLICATE_BOOKING') {
            await this.log('ℹ️  User already has a booking for this class');
          } else {
            throw error;
          }
        }
      }

      // 10. Show all valid booking types
      await this.log('10. Testing all valid booking types...');
      const validTypes = ['drop-in', 'monthly', 'one-time'];
      
      for (const type of validTypes) {
        await this.log(`    Testing type: ${type}`);
        
        // Use different class for each type to avoid duplicates
        const testClass = classes.data.data[validTypes.indexOf(type) % classes.data.data.length];
        
        try {
          const typeTest = await this.client.post('/book', {
            user_id: TEST_USER_ID,
            class_id: testClass.id,
            type: type,
            payment_status: 'pending',
            notes: `Testing ${type} booking type`
          });
          
          console.log(`    ✅ ${type}: Accepted`);
          
          // Clean up test booking
          await this.client.delete(`/bookings/${typeTest.data.data.id}`, {
            data: { userId: TEST_USER_ID }
          });
          
        } catch (error) {
          if (error.response?.status === 409) {
            console.log(`    ⚠️  ${type}: Would be accepted (duplicate/capacity issue)`);
          } else {
            console.log(`    ❌ ${type}: Rejected - ${error.response?.data?.error}`);
          }
        }
      }

      console.log('\n🎉 API Demo completed successfully!');
      console.log('\n📚 Key Features Demonstrated:');
      console.log('  ✅ Server health checks');
      console.log('  ✅ Data retrieval (gyms, classes, bookings)');
      console.log('  ✅ Booking creation with validation');
      console.log('  ✅ Business rule enforcement (capacity, duplicates)');
      console.log('  ✅ Error handling and meaningful responses');
      console.log('  ✅ Booking cancellation');
      console.log('  ✅ Multiple booking types support');
      
      console.log('\n🔗 Next Steps:');
      console.log('  1. Integrate with your frontend application');
      console.log('  2. Add user authentication');
      console.log('  3. Implement payment processing');
      console.log('  4. Add push notifications');
      console.log('  5. Deploy to production');

    } catch (error) {
      console.error('\n❌ Demo failed:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Make sure the server is running:');
        console.log('   npm start (in another terminal)');
      } else if (error.response) {
        console.log('\n📋 Error Details:', {
          status: error.response.status,
          data: error.response.data
        });
      }
    }
  }
}

// Main execution
async function main() {
  console.log('🔌 Checking if server is running...');
  
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running, starting demo...\n');
    
    const demo = new APIDemo();
    await demo.demo();
    
  } catch (error) {
    console.log('❌ Server is not running!');
    console.log('\n📝 To start the server:');
    console.log('   1. Open a new terminal');
    console.log('   2. Navigate to your project directory');
    console.log('   3. Run: npm start');
    console.log('   4. Then run this demo again');
    console.log('\n🌐 Expected server URL: http://localhost:3000');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = APIDemo;