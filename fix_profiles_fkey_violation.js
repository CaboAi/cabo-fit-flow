#!/usr/bin/env node

/**
 * Comprehensive script to debug and fix profiles_id_fkey foreign key violation
 * 
 * This script will:
 * 1. Check if user exists in auth.users
 * 2. Create user if missing  
 * 3. Create/update profile in public.profiles
 * 4. Handle RLS policies and permissions
 * 5. Test booking insert
 * 6. Provide clear error messages and status
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const config = {
  targetUserId: '40ec6001-c070-426a-9d8d-45326d0d7dac',
  userEmail: 'mariopjr91@gmail.com',
  userPassword: 'securepass123',
  fullName: 'Mario Perez',
  role: 'user',
  testClassId: 'e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06',
  bookingType: 'drop-in',
  paymentStatus: 'pending',
  notes: 'Test booking'
};

// Initialize Supabase clients
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needed for auth operations

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Client with anon key (limited permissions)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client with service role key (admin permissions) - if available
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

console.log('🔧 Fixing profiles_id_fkey Foreign Key Violation');
console.log('=' + '='.repeat(60));
console.log(`📋 Target User ID: ${config.targetUserId}`);
console.log(`📧 Email: ${config.userEmail}`);
console.log(`👤 Full Name: ${config.fullName}`);
console.log(`🎯 Test Class ID: ${config.testClassId}`);
console.log('');

let results = {
  userExists: false,
  userCreated: false,
  profileExists: false,
  profileCreated: false,
  bookingCreated: false,
  errors: [],
  warnings: []
};

async function step1_CheckUserInAuth() {
  console.log('1️⃣ Checking if user exists in auth.users...');
  
  try {
    if (!supabaseAdmin) {
      console.log('⚠️  No service role key available - cannot check auth.users directly');
      console.log('   Will attempt profile operations and handle errors gracefully');
      results.warnings.push('Cannot verify auth.users without service role key');
      return false;
    }

    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(config.targetUserId);
    
    if (error) {
      if (error.message.includes('User not found')) {
        console.log('❌ User does not exist in auth.users');
        results.userExists = false;
        return false;
      } else {
        console.log('❌ Error checking user:', error.message);
        results.errors.push(`Auth check error: ${error.message}`);
        return false;
      }
    }

    if (user && user.user) {
      console.log('✅ User exists in auth.users');
      console.log(`   Email: ${user.user.email}`);
      console.log(`   Created: ${user.user.created_at}`);
      results.userExists = true;
      return true;
    }

    console.log('❌ User does not exist in auth.users');
    results.userExists = false;
    return false;

  } catch (error) {
    console.log('❌ Unexpected error checking auth.users:', error.message);
    results.errors.push(`Unexpected auth error: ${error.message}`);
    return false;
  }
}

async function step2_CreateUserInAuth() {
  console.log('\n2️⃣ Creating user in auth.users...');
  
  try {
    if (!supabaseAdmin) {
      console.log('⚠️  Cannot create auth user without service role key');
      console.log('   Manual steps required:');
      console.log('   1. Go to Supabase Dashboard → Authentication → Users');
      console.log(`   2. Create user with email: ${config.userEmail}`);
      console.log(`   3. Set user ID to: ${config.targetUserId}`);
      results.warnings.push('Auth user creation requires manual intervention');
      return false;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      id: config.targetUserId,
      email: config.userEmail,
      password: config.userPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name: config.fullName,
        role: config.role
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists in auth.users');
        results.userExists = true;
        return true;
      } else {
        console.log('❌ Error creating user:', error.message);
        results.errors.push(`User creation error: ${error.message}`);
        return false;
      }
    }

    if (data && data.user) {
      console.log('✅ User created successfully in auth.users');
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      results.userCreated = true;
      results.userExists = true;
      return true;
    }

    console.log('❌ User creation failed - no data returned');
    results.errors.push('User creation failed - no data returned');
    return false;

  } catch (error) {
    console.log('❌ Unexpected error creating user:', error.message);
    results.errors.push(`Unexpected user creation error: ${error.message}`);
    return false;
  }
}

async function step3_CheckProfileExists() {
  console.log('\n3️⃣ Checking if profile exists in public.profiles...');
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', config.targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log('❌ Profile does not exist in public.profiles');
        results.profileExists = false;
        return false;
      } else {
        console.log('❌ Error checking profile:', error.message);
        results.errors.push(`Profile check error: ${error.message}`);
        return false;
      }
    }

    if (profile) {
      console.log('✅ Profile exists in public.profiles');
      console.log(`   Email: ${profile.email}`);
      console.log(`   Full Name: ${profile.full_name}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Created: ${profile.created_at}`);
      results.profileExists = true;
      return true;
    }

    console.log('❌ Profile does not exist');
    results.profileExists = false;
    return false;

  } catch (error) {
    console.log('❌ Unexpected error checking profile:', error.message);
    results.errors.push(`Unexpected profile check error: ${error.message}`);
    return false;
  }
}

async function step4_CreateProfile() {
  console.log('\n4️⃣ Creating profile in public.profiles...');
  
  try {
    const profileData = {
      id: config.targetUserId,
      email: config.userEmail,
      full_name: config.fullName,
      role: config.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Try using admin client first if available
    const client = supabaseAdmin || supabase;
    const { data: newProfile, error } = await client
      .from('profiles')
      .insert([profileData])
      .select('id, email, full_name, role')
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation - profile already exists
        console.log('ℹ️  Profile already exists (race condition)');
        results.profileExists = true;
        return true;
      } else if (error.message && error.message.includes('row-level security')) {
        console.log('🔒 Profile creation blocked by RLS policy');
        console.log('   Manual steps required:');
        console.log('   1. Go to Supabase Dashboard → Table Editor → profiles');
        console.log('   2. Insert new row with the following data:');
        console.log(`      - id: ${config.targetUserId}`);
        console.log(`      - email: ${config.userEmail}`);
        console.log(`      - full_name: ${config.fullName}`);
        console.log(`      - role: ${config.role}`);
        console.log('');
        console.log('   OR run this SQL in Supabase SQL Editor:');
        console.log('   ```sql');
        console.log(`   INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)`);
        console.log(`   VALUES ('${config.targetUserId}', '${config.userEmail}', '${config.fullName}', '${config.role}', NOW(), NOW())`);
        console.log(`   ON CONFLICT (id) DO UPDATE SET`);
        console.log(`     email = EXCLUDED.email,`);
        console.log(`     full_name = EXCLUDED.full_name,`);
        console.log(`     role = EXCLUDED.role,`);
        console.log(`     updated_at = NOW();`);
        console.log('   ```');
        
        results.errors.push('Profile creation blocked by RLS - manual intervention required');
        return false;
      } else if (error.code === '23503' && error.message.includes('profiles_id_fkey')) {
        console.log('❌ Foreign key violation: profiles_id_fkey');
        console.log('   This means the user does not exist in auth.users');
        console.log('   The auth user must be created first before creating the profile');
        results.errors.push('Foreign key violation - auth user must exist first');
        return false;
      } else {
        console.log('❌ Error creating profile:', error.message);
        console.log('   Error code:', error.code);
        results.errors.push(`Profile creation error: ${error.message}`);
        return false;
      }
    }

    if (newProfile) {
      console.log('✅ Profile created successfully');
      console.log(`   ID: ${newProfile.id}`);
      console.log(`   Email: ${newProfile.email}`);
      console.log(`   Full Name: ${newProfile.full_name}`);
      console.log(`   Role: ${newProfile.role}`);
      results.profileCreated = true;
      results.profileExists = true;
      return true;
    }

    console.log('❌ Profile creation failed - no data returned');
    results.errors.push('Profile creation failed - no data returned');
    return false;

  } catch (error) {
    console.log('❌ Unexpected error creating profile:', error.message);
    results.errors.push(`Unexpected profile creation error: ${error.message}`);
    return false;
  }
}

async function step5_TestBookingInsert() {
  console.log('\n5️⃣ Testing booking insert...');
  
  try {
    // First check if the class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, title, capacity, price')
      .eq('id', config.testClassId)
      .single();

    if (classError) {
      console.log('❌ Test class does not exist:', classError.message);
      results.errors.push(`Test class error: ${classError.message}`);
      return false;
    }

    console.log(`📚 Test class found: ${classData.title} (Capacity: ${classData.capacity}, Price: $${classData.price})`);

    const bookingData = {
      user_id: config.targetUserId,
      class_id: config.testClassId,
      type: config.bookingType,
      payment_status: config.paymentStatus,
      notes: config.notes,
      created_at: new Date().toISOString()
    };

    const { data: newBooking, error } = await supabase
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
        )
      `)
      .single();

    if (error) {
      if (error.code === '23503') {
        if (error.message.includes('bookings_user_id_fkey')) {
          console.log('❌ Foreign key violation: bookings_user_id_fkey');
          console.log('   User profile still does not exist or is not accessible');
          results.errors.push('Booking failed - user foreign key violation');
          return false;
        } else if (error.message.includes('bookings_class_id_fkey')) {
          console.log('❌ Foreign key violation: bookings_class_id_fkey');
          console.log('   Class does not exist');
          results.errors.push('Booking failed - class foreign key violation');
          return false;
        }
      } else if (error.code === '23505') {
        console.log('ℹ️  Booking already exists (duplicate)');
        results.warnings.push('Duplicate booking detected');
        return true;
      }
      
      console.log('❌ Error creating booking:', error.message);
      console.log('   Error code:', error.code);
      results.errors.push(`Booking creation error: ${error.message}`);
      return false;
    }

    if (newBooking) {
      console.log('✅ Booking created successfully!');
      console.log(`   Booking ID: ${newBooking.id}`);
      console.log(`   User ID: ${newBooking.user_id}`);
      console.log(`   Class: ${newBooking.classes.title}`);
      console.log(`   Type: ${newBooking.type}`);
      console.log(`   Status: ${newBooking.payment_status}`);
      console.log(`   Notes: ${newBooking.notes}`);
      console.log(`   Created: ${newBooking.created_at}`);
      results.bookingCreated = true;
      return true;
    }

    console.log('❌ Booking creation failed - no data returned');
    results.errors.push('Booking creation failed - no data returned');
    return false;

  } catch (error) {
    console.log('❌ Unexpected error creating booking:', error.message);
    results.errors.push(`Unexpected booking error: ${error.message}`);
    return false;
  }
}

async function generateSummaryReport() {
  console.log('\n📊 FINAL SUMMARY REPORT');
  console.log('=' + '='.repeat(60));
  
  console.log('\n✅ SUCCESSFUL OPERATIONS:');
  if (results.userExists) console.log('   ✓ User verified in auth.users');
  if (results.userCreated) console.log('   ✓ User created in auth.users');
  if (results.profileExists) console.log('   ✓ Profile verified in public.profiles');
  if (results.profileCreated) console.log('   ✓ Profile created in public.profiles');
  if (results.bookingCreated) console.log('   ✓ Test booking created successfully');

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
  }

  if (results.errors.length > 0) {
    console.log('\n❌ ERRORS ENCOUNTERED:');
    results.errors.forEach(error => console.log(`   ❌ ${error}`));
  }

  console.log('\n🎯 NEXT STEPS:');
  
  if (!results.userExists && !results.userCreated) {
    console.log('   1. Create user in Supabase Dashboard → Authentication → Users');
    console.log(`      - Email: ${config.userEmail}`);
    console.log(`      - Set custom ID: ${config.targetUserId}`);
  }
  
  if (!results.profileExists && !results.profileCreated) {
    console.log('   2. Create profile in Supabase Dashboard → Table Editor → profiles');
    console.log(`      - Insert row with ID: ${config.targetUserId}`);
  }
  
  if (!results.bookingCreated) {
    console.log('   3. Retry booking creation after fixing user/profile issues');
  }

  console.log('\n🔧 MANUAL SQL STATEMENTS (if needed):');
  console.log('```sql');
  console.log('-- Create profile (run in Supabase SQL Editor)');
  console.log(`INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)`);
  console.log(`VALUES ('${config.targetUserId}', '${config.userEmail}', '${config.fullName}', '${config.role}', NOW(), NOW())`);
  console.log(`ON CONFLICT (id) DO UPDATE SET`);
  console.log(`  email = EXCLUDED.email,`);
  console.log(`  full_name = EXCLUDED.full_name,`);
  console.log(`  role = EXCLUDED.role,`);
  console.log(`  updated_at = NOW();`);
  console.log('```');

  const overallSuccess = results.profileExists && (results.userExists || !supabaseAdmin);
  console.log(`\n🏁 OVERALL STATUS: ${overallSuccess ? '✅ SUCCESS' : '❌ NEEDS MANUAL INTERVENTION'}`);
  
  return overallSuccess;
}

async function main() {
  try {
    // Step 1: Check if user exists in auth.users
    const userExists = await step1_CheckUserInAuth();
    
    // Step 2: Create user if it doesn't exist
    if (!userExists && supabaseAdmin) {
      await step2_CreateUserInAuth();
    }
    
    // Step 3: Check if profile exists
    const profileExists = await step3_CheckProfileExists();
    
    // Step 4: Create profile if it doesn't exist
    if (!profileExists) {
      await step4_CreateProfile();
    }
    
    // Step 5: Test booking insert
    if (results.profileExists || results.profileCreated) {
      await step5_TestBookingInsert();
    }
    
    // Generate final report
    const success = await generateSummaryReport();
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();