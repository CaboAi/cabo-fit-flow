const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  'https://pamzfhiiuvmtlwwvufut.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbXpmaGlpdXZtdGx3d3Z1ZnV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTgwNzYsImV4cCI6MjA2OTM5NDA3Nn0.nK7BnVHNwoHuVCnkp2oWgGfyDxCA_Tjfc_0uhuKTF74'
);

const testUserId = '00000000-0000-0000-0000-000000000001';

async function runTests() {
  console.log('🚀 Testing Cabo Fit Pass Credit System');
  console.log('=====================================\n');

  // Test 1: Test credit balance function
  console.log('1️⃣  Testing credit balance function...');
  try {
    const { data: balance, error } = await supabase.rpc('get_user_credit_balance', {
      p_user_id: testUserId
    });
    
    if (error) throw error;
    console.log('✅ Credit balance:', balance);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 2: Verify user_credits table was populated
  console.log('\n2️⃣  Checking user_credits table...');
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', testUserId);
    
    if (error) throw error;
    console.log('✅ User credits record:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 3: Test credit deduction function
  console.log('\n3️⃣  Testing credit deduction function...');
  try {
    const { data: result, error } = await supabase.rpc('deduct_user_credits', {
      p_user_id: testUserId,
      p_amount: 1,
      p_description: 'Test booking'
    });
    
    if (error) throw error;
    console.log('✅ Credit deduction result:', result);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 4: Check credit transaction was recorded
  console.log('\n4️⃣  Checking credit transaction record...');
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('user_id, amount, type, description, balance_after, created_at')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Latest transaction:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test 5: Get a class ID from existing classes
  console.log('\n5️⃣  Getting available classes...');
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('id, title, gym_id')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Available classes:', JSON.stringify(data, null, 2));
    
    // Test 6: If classes exist, test the full booking workflow
    if (data && data.length > 0) {
      const classId = data[0].id;
      console.log('\n6️⃣  Testing full booking workflow...');
      
      try {
        const { data: bookingResult, error: bookingError } = await supabase.rpc('book_class_with_credits', {
          p_user_id: testUserId,
          p_class_id: classId,
          p_booking_type: 'subscription'
        });
        
        if (bookingError) throw bookingError;
        console.log('✅ Booking workflow result:', bookingResult);
      } catch (error) {
        console.log('❌ Booking error:', error.message);
      }
    } else {
      console.log('⚠️  No classes found - skipping booking workflow test');
    }
    
  } catch (error) {
    console.log('❌ Error getting classes:', error.message);
  }

  console.log('\n🎉 Credit system testing completed!');
}

// Run the tests
runTests().catch(console.error);