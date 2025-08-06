#!/usr/bin/env node

/**
 * Check Server Setup - Verify which endpoints are available
 */

async function checkEndpoint(url, method = 'GET') {
  try {
    const response = await fetch(url, { method });
    return {
      url,
      status: response.status,
      available: response.status !== 404,
      data: await response.text()
    };
  } catch (error) {
    return {
      url,
      status: 'ERROR',
      available: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔍 Checking Cabo Fit Pass Server Setup');
  console.log('=====================================');
  
  const endpoints = [
    'http://localhost:3000/health',
    'http://localhost:3000/',
    'http://localhost:3000/classes',
    'http://localhost:3000/dashboard',
    'http://localhost:3000/signup',
    'http://localhost:3000/login',
    'http://localhost:3000/api/v1/info',
    'http://localhost:3000/api/v1/classes',
    'http://localhost:3000/api/auth/signup'  // This should exist if auth routes were added
  ];

  console.log('📡 Testing endpoints...\n');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);
    
    const status = result.available ? '✅' : '❌';
    const statusCode = result.status === 'ERROR' ? 'ERROR' : result.status;
    
    console.log(`${status} ${endpoint} (${statusCode})`);
    
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log('\n📊 Analysis:');
  console.log('============');

  const hasHealth = results.find(r => r.url.includes('/health'))?.available;
  const hasClasses = results.find(r => r.url.includes('/classes'))?.available;
  const hasSignup = results.find(r => r.url.includes('/signup'))?.available;
  const hasAuthAPI = results.find(r => r.url.includes('/api/auth/signup'))?.available;

  if (!hasHealth) {
    console.log('❌ Server is not running!');
    console.log('   → Start with: npm start');
    return;
  }

  console.log('✅ Server is running');

  if (hasClasses) {
    console.log('✅ Classes page is available');
  } else {
    console.log('❌ Classes page missing');
  }

  if (hasSignup && hasAuthAPI) {
    console.log('✅ Auth system is set up correctly');
    console.log('   → You can test: http://localhost:3000/signup');
  } else if (!hasSignup && !hasAuthAPI) {
    console.log('❌ Auth system not implemented yet');
    console.log('   → Need to add auth routes to server.js');
    console.log('   → Need to create signup.ejs and login.ejs');
  } else if (hasSignup && !hasAuthAPI) {
    console.log('⚠️  Signup page exists but API endpoints missing');
    console.log('   → Need to add auth API routes to server.js');
  } else {
    console.log('⚠️  Partial auth setup detected');
  }

  console.log('\n🔧 Recommended Actions:');
  
  if (!hasSignup || !hasAuthAPI) {
    console.log('1. Add auth routes to server.js (see previous instructions)');
    console.log('2. Create views/signup.ejs template');
    console.log('3. Create views/login.ejs template');
    console.log('4. Restart server: npm start');
  } else {
    console.log('1. Run the fixed test: node test_auto_profile.js');
    console.log('2. Visit: http://localhost:3000/signup');
    console.log('3. Test the signup flow');
  }
}

if (require.main === module) {
  main().catch(console.error);
}