#!/usr/bin/env node

/**
 * Test script to verify profile exists and test booking creation
 * Run this AFTER creating the profile manually via SQL
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const config = {
  targetUserId: '40ec6001-c070-426a-9d8d-45326d0d7dac',
  testClassId: 'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06',
  bookingType: 'drop-in',
  paymentStatus: 'pending',
  notes: 'Test booking after profile creation'
};

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

console.log('🧪 Testing Profile and Booking Creation');
console.log('=' + '='.repeat(50));

async function testProfileExists() {
  console.log('1️⃣ Verifying profile exists...');
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', config.targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ Profile does not exist');
        console.log('   Please run the manual SQL script first:');
        console.log('   1. Go to Supabase SQL Editor');
        console.log('   2. Run create_profile_manual.sql');
        return false;
      } else {
        console.log('❌ Error checking profile:', error.message);
        return false;
      }
    }

    console.log('✅ Profile exists!');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Full Name: ${profile.full_name}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Created: ${profile.created_at}`);
    return true;

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
    return false;
  }
}

async function testClassExists() {
  console.log('\n2️⃣ Verifying test class exists...');
  
  try {
    const { data: classData, error } = await supabase
      .from('classes')
      .select('id, title, capacity, price, schedule')
      .eq('id', config.testClassId)
      .single();

    if (error) {
      console.log('❌ Test class does not exist:', error.message);
      console.log(`   Class ID: ${config.testClassId}`);
      return false;
    }

    console.log('✅ Test class exists!');
    console.log(`   Title: ${classData.title}`);
    console.log(`   Capacity: ${classData.capacity}`);
    console.log(`   Price: $${classData.price}`);
    console.log(`   Schedule: ${classData.schedule}`);
    return classData;

  } catch (error) {
    console.log('❌ Unexpected error checking class:', error.message);
    return false;
  }
}

async function createTestBooking() {
  console.log('\n3️⃣ Creating test booking...');
  
  try {
    const bookingData = {
      user_id: config.targetUserId,
      class_id: config.testClassId,
      type: config.bookingType,
      payment_status: config.paymentStatus,
      notes: config.notes
    };

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        id,
        user_id,
        class_id,
        type,
        payment_status,
        notes,
        created_at,
        classes (
          title,
          price
        ),
        profiles (
          email,
          full_name
        )
      `)
      .single();

    if (error) {
      if (error.code === '23503') {
        if (error.message.includes('bookings_user_id_fkey')) {
          console.log('❌ FOREIGN KEY VIOLATION: bookings_user_id_fkey');
          console.log('   The profile still does not exist or has RLS restrictions');
          console.log('   Please ensure the profile was created correctly');
          return false;
        } else if (error.message.includes('bookings_class_id_fkey')) {
          console.log('❌ FOREIGN KEY VIOLATION: bookings_class_id_fkey');
          console.log('   The class does not exist');
          return false;
        }
      } else if (error.code === '23505') {
        console.log('ℹ️  Booking already exists (duplicate detected)');
        
        // Fetch existing booking
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select(`
            id, type, payment_status, notes, created_at,
            classes (title),
            profiles (email, full_name)
          `)
          .eq('user_id', config.targetUserId)
          .eq('class_id', config.testClassId)
          .single();

        if (existingBooking) {
          console.log('✅ Found existing booking:');
          console.log(`   Booking ID: ${existingBooking.id}`);
          console.log(`   Class: ${existingBooking.classes.title}`);
          console.log(`   User: ${existingBooking.profiles.full_name} (${existingBooking.profiles.email})`);
          console.log(`   Type: ${existingBooking.type}`);
          console.log(`   Status: ${existingBooking.payment_status}`);
          console.log(`   Created: ${existingBooking.created_at}`);
        }
        return true;
      }
      
      console.log('❌ Error creating booking:', error.message);
      console.log('   Error code:', error.code);
      return false;
    }

    console.log('✅ Booking created successfully!');
    console.log(`   Booking ID: ${booking.id}`);
    console.log(`   User ID: ${booking.user_id}`);
    console.log(`   Class: ${booking.classes.title} ($${booking.classes.price})`);
    console.log(`   User: ${booking.profiles.full_name} (${booking.profiles.email})`);
    console.log(`   Type: ${booking.type}`);
    console.log(`   Payment Status: ${booking.payment_status}`);
    console.log(`   Notes: ${booking.notes}`);
    console.log(`   Created: ${booking.created_at}`);
    return true;

  } catch (error) {
    console.log('❌ Unexpected error creating booking:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log(`📋 Target User ID: ${config.targetUserId}`);
  console.log(`🎯 Test Class ID: ${config.testClassId}`);
  console.log('');

  // Test 1: Check profile exists
  const profileExists = await testProfileExists();
  if (!profileExists) {
    console.log('\n❌ Cannot proceed without valid profile');
    console.log('\n🔧 MANUAL STEPS REQUIRED:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Run the create_profile_manual.sql script');
    console.log('3. Re-run this test script');
    return false;
  }

  // Test 2: Check class exists
  const classExists = await testClassExists();
  if (!classExists) {
    console.log('\n❌ Cannot proceed without valid class');
    return false;
  }

  // Test 3: Create booking
  const bookingCreated = await createTestBooking();

  console.log('\n📊 FINAL RESULTS:');
  console.log('================');
  console.log(`✅ Profile exists: ${profileExists ? 'YES' : 'NO'}`);
  console.log(`✅ Class exists: ${classExists ? 'YES' : 'NO'}`);
  console.log(`✅ Booking created: ${bookingCreated ? 'YES' : 'NO'}`);

  const overallSuccess = profileExists && classExists && bookingCreated;
  console.log(`\n🏁 OVERALL: ${overallSuccess ? '✅ SUCCESS - Foreign key violation FIXED!' : '❌ NEEDS ATTENTION'}`);

  if (overallSuccess) {
    console.log('\n🎉 CONGRATULATIONS!');
    console.log('   The profiles_id_fkey foreign key violation has been resolved.');
    console.log('   Bookings can now be created successfully with this user ID.');
  }

  return overallSuccess;
}

runAllTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n💥 FATAL ERROR:', error.message);
    process.exit(1);
  });