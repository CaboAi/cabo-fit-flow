#!/usr/bin/env node

/**
 * Alternative approach: Create user and profile using service role key
 * This script attempts to create both auth user and profile if service role key is available
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const config = {
  targetUserId: '40ec6001-c070-426a-9d8d-45326d0d7dac',
  userEmail: 'mariopjr91@gmail.com',
  userPassword: 'securepass123',
  fullName: 'Mario Perez',
  role: 'user'
};

console.log('🚀 Creating User and Profile with Service Role');
console.log('=' + '='.repeat(55));

// Check for service role key
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('');
  console.log('📋 TO GET SERVICE ROLE KEY:');
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Copy the "service_role" key (NOT the anon key)');
  console.log('3. Add to .env file:');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here');
  console.log('');
  console.log('⚠️  WARNING: Service role key has admin privileges');
  console.log('   Only use in secure environments, never in client-side code');
  console.log('');
  console.log('🔄 FALLBACK: Use the manual SQL approach instead');
  console.log('   Run: node test_profile_and_booking.js');
  console.log('   And manually execute create_profile_manual.sql');
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createAuthUser() {
  console.log('1️⃣ Creating user in auth.users...');
  
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id: config.targetUserId,
      email: config.userEmail,
      password: config.userPassword,
      email_confirm: true,
      user_metadata: {
        full_name: config.fullName,
        role: config.role
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        console.log('ℹ️  User already exists in auth.users');
        return true;
      } else {
        console.log('❌ Error creating auth user:', error.message);
        return false;
      }
    }

    console.log('✅ Auth user created successfully');
    console.log(`   ID: ${data.user.id}`);
    console.log(`   Email: ${data.user.email}`);
    return true;

  } catch (error) {
    console.log('❌ Unexpected error creating auth user:', error.message);
    return false;
  }
}

async function createProfile() {
  console.log('\n2️⃣ Creating profile in public.profiles...');
  
  try {
    const profileData = {
      id: config.targetUserId,
      email: config.userEmail,
      full_name: config.fullName,
      role: config.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Use service role client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileData])
      .select('id, email, full_name, role, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log('ℹ️  Profile already exists');
        
        // Try to update existing profile
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('profiles')
          .update({
            email: config.userEmail,
            full_name: config.fullName,
            role: config.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', config.targetUserId)
          .select('id, email, full_name, role, updated_at')
          .single();

        if (updateError) {
          console.log('❌ Error updating existing profile:', updateError.message);
          return false;
        }

        console.log('✅ Profile updated successfully');
        console.log(`   ID: ${updatedProfile.id}`);
        console.log(`   Email: ${updatedProfile.email}`);
        console.log(`   Full Name: ${updatedProfile.full_name}`);
        console.log(`   Role: ${updatedProfile.role}`);
        return true;
      } else {
        console.log('❌ Error creating profile:', error.message);
        console.log('   Code:', error.code);
        return false;
      }
    }

    console.log('✅ Profile created successfully');
    console.log(`   ID: ${data.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Full Name: ${data.full_name}`);
    console.log(`   Role: ${data.role}`);
    return true;

  } catch (error) {
    console.log('❌ Unexpected error creating profile:', error.message);
    return false;
  }
}

async function testBooking() {
  console.log('\n3️⃣ Testing booking creation...');
  
  const bookingData = {
    user_id: config.targetUserId,
    class_id: 'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06',
    type: 'drop-in',
    payment_status: 'pending',
    notes: 'Test booking with service role created profile'
  };

  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([bookingData])
      .select(`
        id, user_id, class_id, type, payment_status, notes, created_at,
        classes (title, price),
        profiles (email, full_name)
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log('ℹ️  Booking already exists (duplicate)');
        return true;
      } else if (error.code === '23503') {
        console.log('❌ Foreign key violation:', error.message);
        return false;
      } else {
        console.log('❌ Error creating booking:', error.message);
        return false;
      }
    }

    console.log('✅ Booking created successfully!');
    console.log(`   Booking ID: ${data.id}`);
    console.log(`   Class: ${data.classes.title} ($${data.classes.price})`);
    console.log(`   User: ${data.profiles.full_name} (${data.profiles.email})`);
    console.log(`   Type: ${data.type}`);
    console.log(`   Status: ${data.payment_status}`);
    return true;

  } catch (error) {
    console.log('❌ Unexpected error creating booking:', error.message);
    return false;
  }
}

async function main() {
  console.log(`👤 Target User: ${config.fullName} (${config.userEmail})`);
  console.log(`🆔 User ID: ${config.targetUserId}`);
  console.log('');

  const authSuccess = await createAuthUser();
  const profileSuccess = await createProfile();
  const bookingSuccess = profileSuccess ? await testBooking() : false;

  console.log('\n📊 FINAL RESULTS:');
  console.log('================');
  console.log(`Auth User: ${authSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Profile: ${profileSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Test Booking: ${bookingSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

  const overallSuccess = authSuccess && profileSuccess && bookingSuccess;
  
  console.log(`\n🏁 OVERALL: ${overallSuccess ? '✅ COMPLETE SUCCESS!' : '❌ PARTIAL SUCCESS'}`);

  if (overallSuccess) {
    console.log('\n🎉 FOREIGN KEY VIOLATION FIXED!');
    console.log('   ✓ Auth user exists');
    console.log('   ✓ Profile exists');
    console.log('   ✓ Booking created successfully');
    console.log('   ✓ No more profiles_id_fkey violations');
  } else if (profileSuccess) {
    console.log('\n👍 USER AND PROFILE READY');
    console.log('   ✓ Profile exists and can be used for bookings');
    console.log('   ✓ Foreign key violation should be resolved');
  }

  return overallSuccess;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('\n💥 FATAL ERROR:', error.message);
    process.exit(1);
  });