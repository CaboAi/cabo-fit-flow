#!/usr/bin/env node

/**
 * PRODUCTION DEMO DATA REFRESH UTILITY - Cabo Fit Pass
 * Maintains future class schedules and validates demo readiness
 * Works with exact repository structure and constraints
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with your exact setup
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Mario's exact user ID from your repository
const MARIO_USER_ID = '40ec6001-c070-426a-9d8d-45326d0d7dac';

// Console styling
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n${'='.repeat(60)}`)
};

// Generate smart future dates
function generateFutureDate(daysFromNow = null) {
  const now = new Date();
  const targetDays = daysFromNow || (Math.floor(Math.random() * 7) + 1);
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + targetDays);
  
  // Smart time selection based on class type
  const hour = Math.floor(Math.random() * 14) + 6; // 6 AM - 8 PM
  const minute = Math.random() < 0.5 ? 0 : 30; // :00 or :30
  
  futureDate.setHours(hour, minute, 0, 0);
  return futureDate;
}

// Format date for display
function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Main refresh function
async function refreshDemoData() {
  log.header('🔄 Cabo Fit Pass Demo Data Refresh');
  
  try {
    // Step 1: Analyze current data
    log.info('Analyzing current database state...');
    
    const [classesResult, bookingsResult, profileResult] = await Promise.all([
      supabase.from('classes').select('id, title, schedule').order('schedule'),
      supabase.from('bookings').select('*').eq('user_id', MARIO_USER_ID),
      supabase.from('profiles').select('*').eq('id', MARIO_USER_ID).single()
    ]);

    if (classesResult.error) throw classesResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (profileResult.error) throw profileResult.error;

    const allClasses = classesResult.data || [];
    const marioBookings = bookingsResult.data || [];
    const marioProfile = profileResult.data;

    log.success(`Found ${allClasses.length} total classes`);
    log.success(`Mario has ${marioBookings.length} bookings`);
    log.success(`Mario has ${marioProfile.monthly_credits} credits remaining`);

    // Step 2: Identify past classes
    const now = new Date();
    const pastClasses = allClasses.filter(c => new Date(c.schedule) < now);
    const futureClasses = allClasses.filter(c => new Date(c.schedule) >= now);

    log.info(`📊 Class Status: ${pastClasses.length} past, ${futureClasses.length} future`);

    // Step 3: Update past classes to future dates
    if (pastClasses.length > 0) {
      log.header('📅 Updating Past Classes to Future Dates');
      
      let updateCount = 0;
      for (const classItem of pastClasses) {
        const newDate = generateFutureDate();
        
        const { error: updateError } = await supabase
          .from('classes')
          .update({ schedule: newDate.toISOString() })
          .eq('id', classItem.id);
        
        if (updateError) {
          log.error(`Failed to update "${classItem.title}": ${updateError.message}`);
        } else {
          log.success(`"${classItem.title}" → ${formatDateTime(newDate)}`);
          updateCount++;
        }
      }
      
      log.success(`Updated ${updateCount} classes to future dates`);
    } else {
      log.success('All classes are already in the future! 🎉');
    }

    // Step 4: Display upcoming schedule
    log.header('📅 Current Demo Schedule (Next 7 Days)');
    
    const { data: upcomingClasses, error: scheduleError } = await supabase
      .from('classes')
      .select(`
        id,
        title,
        schedule,
        price,
        capacity,
        gyms (name, location)
      `)
      .gte('schedule', new Date().toISOString())
      .lte('schedule', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('schedule');

    if (scheduleError) {
      log.error(`Failed to fetch schedule: ${scheduleError.message}`);
    } else {
      // Group by day
      const classesByDay = {};
      upcomingClasses.forEach(classItem => {
        const date = new Date(classItem.schedule);
        const dayKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (!classesByDay[dayKey]) {
          classesByDay[dayKey] = [];
        }
        classesByDay[dayKey].push(classItem);
      });

      // Display organized schedule
      Object.entries(classesByDay).forEach(([day, classes]) => {
        console.log(`\n${colors.bright}${day}${colors.reset}`);
        classes.forEach(c => {
          const time = new Date(c.schedule).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });
          console.log(`  ${time} - ${c.title} @ ${c.gyms.name}`);
          console.log(`         ${c.gyms.location} • $${c.price} • ${c.capacity} spots`);
        });
      });
    }

    // Step 5: Validate Mario's demo profile
    log.header('👤 Mario\'s Demo Profile Status');
    
    const { data: marioDetails, error: detailsError } = await supabase
      .from('bookings')
      .select(`
        id,
        type,
        payment_status,
        notes,
        classes (
          title,
          schedule,
          gyms (name)
        )
      `)
      .eq('user_id', MARIO_USER_ID)
      .order('id', { ascending: false });

    if (detailsError) {
      log.error(`Failed to fetch Mario's bookings: ${detailsError.message}`);
    } else {
      const upcomingBookings = marioDetails.filter(b => 
        new Date(b.classes.schedule) >= now
      );
      const completedBookings = marioDetails.filter(b => 
        new Date(b.classes.schedule) < now
      );

      log.info(`📊 Mario's Booking Status:`);
      log.info(`   Total: ${marioDetails.length} bookings`);
      log.info(`   Upcoming: ${upcomingBookings.length} classes`);
      log.info(`   Completed: ${completedBookings.length} classes`);
      log.info(`   Credits: ${marioProfile.monthly_credits} of 4 remaining`);

      if (upcomingBookings.length > 0) {
        console.log(`\n${colors.green}Upcoming Classes:${colors.reset}`);
        upcomingBookings.forEach(b => {
          const classDate = formatDateTime(b.classes.schedule);
          console.log(`  • ${b.classes.title} @ ${b.classes.gyms.name}`);
          console.log(`    ${classDate} (${b.type} booking)`);
          if (b.notes) {
            console.log(`    Note: "${b.notes}"`);
          }
        });
      }
    }

    // Step 6: Demo readiness check
    log.header('🚀 Demo Readiness Verification');
    
    const [totalGyms, totalUpcomingClasses, totalBookings] = await Promise.all([
      supabase.from('gyms').select('*', { count: 'exact', head: true }),
      supabase.from('classes').select('*', { count: 'exact', head: true })
        .gte('schedule', new Date().toISOString()),
      supabase.from('bookings').select('*', { count: 'exact', head: true })
    ]);

    const demoMetrics = {
      gyms: totalGyms.count || 0,
      upcomingClasses: totalUpcomingClasses.count || 0,
      totalBookings: totalBookings.count || 0,
      marioBookings: marioDetails.length,
      marioUpcoming: upcomingBookings.length
    };

    log.success(`✅ ${demoMetrics.gyms} gyms across Los Cabos`);
    log.success(`✅ ${demoMetrics.upcomingClasses} upcoming classes available`);
    log.success(`✅ ${demoMetrics.totalBookings} total bookings for social proof`);
    log.success(`✅ Mario has ${demoMetrics.marioBookings} bookings (${demoMetrics.marioUpcoming} upcoming)`);

    // Final status
    const isReadyForDemo = 
      demoMetrics.gyms >= 7 &&
      demoMetrics.upcomingClasses >= 20 &&
      demoMetrics.marioUpcoming >= 2 &&
      marioProfile.monthly_credits <= 2;

    if (isReadyForDemo) {
      log.success('\n🎉 DEMO READY! Your platform is perfectly configured for studio partner presentations.');
      console.log('\n📋 Demo Checklist:');
      console.log(`   ✅ Multi-studio ecosystem (${demoMetrics.gyms} gyms)`);
      console.log(`   ✅ Class variety (${demoMetrics.upcomingClasses} upcoming)`);
      console.log(`   ✅ Active user profile (Mario with realistic history)`);
      console.log(`   ✅ Social proof (${demoMetrics.totalBookings} total bookings)`);
      console.log(`   ✅ Credit system demo (${marioProfile.monthly_credits} of 4 remaining)`);
    } else {
      log.warn('\n⚠️  Some demo requirements need attention:');
      if (demoMetrics.gyms < 7) log.warn(`   Need more gyms (${demoMetrics.gyms}/7)`);
      if (demoMetrics.upcomingClasses < 20) log.warn(`   Need more classes (${demoMetrics.upcomingClasses}/20)`);
      if (demoMetrics.marioUpcoming < 2) log.warn(`   Mario needs more upcoming bookings`);
    }

    // Usage instructions
    console.log('\n📱 Demo URLs:');
    console.log('   Dashboard: http://localhost:3000/dashboard');
    console.log('   Classes:   http://localhost:3000/classes');
    console.log('   Signup:    http://localhost:3000/signup');
    console.log('   Login:     http://localhost:3000/login');

  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error('\nFull error details:', error);
    process.exit(1);
  }
}

// Health check function
async function healthCheck() {
  log.header('🏥 Demo Health Check');
  
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (error) {
      log.error('Database connection failed');
      return false;
    }
    
    log.success('✅ Database connection healthy');
    log.success(`✅ ${data || 'Unknown'} profiles in database`);
    
    // Check Mario specifically
    const { data: mario } = await supabase
      .from('profiles')
      .select('full_name, email, monthly_credits')
      .eq('id', MARIO_USER_ID)
      .single();
    
    if (mario) {
      log.success(`✅ Mario profile found: ${mario.full_name} (${mario.email})`);
      log.success(`✅ Credits: ${mario.monthly_credits} remaining`);
    } else {
      log.error('❌ Mario profile not found');
    }
    
    return true;
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--health')) {
    await healthCheck();
  } else if (args.includes('--help')) {
    console.log(`
${colors.bright}Cabo Fit Pass Demo Refresh Utility${colors.reset}

Usage:
  node refresh_demo_final.js           Run full demo refresh
  node refresh_demo_final.js --health  Check database health
  node refresh_demo_final.js --help    Show this help

This utility:
  • Updates past classes to future dates
  • Validates Mario's demo profile
  • Verifies demo readiness criteria
  • Shows organized class schedule
  • Provides demo URLs and instructions
    `);
  } else {
    await refreshDemoData();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Fatal Error:${colors.reset}`, error.message);
    process.exit(1);
  });
}

module.exports = { refreshDemoData, healthCheck };