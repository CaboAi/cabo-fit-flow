#!/usr/bin/env node

/**
 * Refresh Demo Data Utility
 * Updates all past classes to future dates for demo purposes
 * Ensures all classes remain bookable for studio partner demonstrations
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n${'='.repeat(50)}`)
};

// Generate random future date within next 7 days
function getRandomFutureDate() {
  const now = new Date();
  const daysToAdd = Math.floor(Math.random() * 7) + 1; // 1-7 days
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + daysToAdd);
  
  // Set random time between 6 AM and 8 PM
  const hour = Math.floor(Math.random() * 14) + 6; // 6-20 (6 AM - 8 PM)
  const minute = Math.random() < 0.5 ? 0 : 30; // Either :00 or :30
  
  futureDate.setHours(hour, minute, 0, 0);
  
  return futureDate;
}

// Format date for display
function formatDate(date) {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleString('en-US', options);
}

// Main refresh function
async function refreshDemoData() {
  log.header('🔄 Cabo Fit Pass Demo Data Refresh Utility');
  
  try {
    // Step 1: Fetch all classes
    log.info('Fetching all classes...');
    const { data: allClasses, error: fetchError } = await supabase
      .from('classes')
      .select('id, title, schedule, gym_id')
      .order('schedule', { ascending: true });
    
    if (fetchError) {
      log.error(`Failed to fetch classes: ${fetchError.message}`);
      return;
    }
    
    log.success(`Found ${allClasses.length} classes total`);
    
    // Step 2: Separate past and future classes
    const now = new Date();
    const pastClasses = allClasses.filter(c => new Date(c.schedule) < now);
    const futureClasses = allClasses.filter(c => new Date(c.schedule) >= now);
    
    log.info(`📊 Class Status:`);
    log.info(`   - Past classes: ${pastClasses.length}`);
    log.info(`   - Future classes: ${futureClasses.length}`);
    
    // Step 3: Update past classes to future dates
    if (pastClasses.length > 0) {
      log.header('📅 Updating Past Classes to Future Dates');
      
      for (const classItem of pastClasses) {
        const newDate = getRandomFutureDate();
        
        const { error: updateError } = await supabase
          .from('classes')
          .update({ 
            schedule: newDate.toISOString()
          })
          .eq('id', classItem.id);
        
        if (updateError) {
          log.error(`Failed to update class "${classItem.title}": ${updateError.message}`);
        } else {
          log.success(`Updated "${classItem.title}" → ${formatDate(newDate)}`);
        }
      }
    } else {
      log.info('No past classes to update - all classes are already in the future! 🎉');
    }
    
    // Step 4: Display current schedule
    log.header('📅 Current Class Schedule (Next 7 Days)');
    
    const { data: updatedClasses, error: scheduleError } = await supabase
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
      .order('schedule', { ascending: true });
    
    if (scheduleError) {
      log.error(`Failed to fetch updated schedule: ${scheduleError.message}`);
      return;
    }
    
    // Group classes by day
    const classesByDay = {};
    updatedClasses.forEach(classItem => {
      const date = new Date(classItem.schedule);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      
      if (!classesByDay[dayKey]) {
        classesByDay[dayKey] = [];
      }
      classesByDay[dayKey].push(classItem);
    });
    
    // Display schedule
    Object.entries(classesByDay).forEach(([day, classes]) => {
      console.log(`\n${colors.bright}${day}${colors.reset}`);
      classes.forEach(c => {
        const time = new Date(c.schedule).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit' 
        });
        console.log(`  ${time} - ${c.title} @ ${c.gyms.name} ($${c.price})`);
        console.log(`         Capacity: ${c.capacity} people`);
      });
    });
    
    // Step 5: Check Mario's bookings
    log.header('👤 Mario\'s Upcoming Bookings');
    
    const marioId = '40ec6001-c070-426a-9d8d-45326d0d7dac';
    const { data: marioBookings, error: bookingError } = await supabase
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
      .eq('user_id', marioId)
      .order('id', { ascending: false });
    
    if (bookingError) {
      log.error(`Failed to fetch Mario's bookings: ${bookingError.message}`);
    } else {
      const upcomingBookings = marioBookings.filter(b => 
        new Date(b.classes.schedule) >= now
      );
      const pastBookings = marioBookings.filter(b => 
        new Date(b.classes.schedule) < now
      );
      
      log.info(`Total bookings: ${marioBookings.length}`);
      log.info(`Upcoming: ${upcomingBookings.length} | Completed: ${pastBookings.length}`);
      
      if (upcomingBookings.length > 0) {
        console.log('\nUpcoming classes:');
        upcomingBookings.forEach(b => {
          console.log(`  - ${b.classes.title} @ ${b.classes.gyms.name}`);
          console.log(`    ${formatDate(b.classes.schedule)}`);
          if (b.notes) {
            console.log(`    Note: "${b.notes}"`);
          }
        });
      }
    }
    
    // Step 6: Summary
    log.header('✅ Demo Data Refresh Complete!');
    
    const { count: totalClasses } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .gte('schedule', new Date().toISOString());
    
    const { count: totalBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    log.success(`${totalClasses} upcoming classes available`);
    log.success(`${totalBookings} total bookings in system`);
    log.success('All classes are now bookable for demos! 🎉');
    
    // Display quick stats
    console.log('\n📊 Quick Stats for Demo:');
    console.log(`  • 7+ gyms across Los Cabos`);
    console.log(`  • ${totalClasses}+ upcoming classes`);
    console.log(`  • Various class types: Yoga, CrossFit, Pilates, Aqua Fitness`);
    console.log(`  • Price range: $15 - $38`);
    console.log(`  • Mario has 1 of 4 monthly credits remaining`);
    
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
  }
}

// Add command to check specific user bookings
async function checkUserBookings(userId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, monthly_credits')
    .eq('id', userId)
    .single();
  
  if (profile) {
    log.header(`📋 Bookings for ${profile.full_name} (${profile.email})`);
    log.info(`Monthly credits: ${profile.monthly_credits} of 4 remaining`);
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select(`
        *,
        classes (name, schedule, gyms (name))
      `)
      .eq('user_id', userId)
      .order('id', { ascending: false });
    
    if (bookings && bookings.length > 0) {
      bookings.forEach(b => {
        const status = new Date(b.classes.schedule) >= new Date() ? '🟢 Upcoming' : '✅ Completed';
        console.log(`${status} ${b.classes.name} - ${formatDate(b.classes.schedule)}`);
      });
    } else {
      log.info('No bookings found');
    }
  }
}

// Run the refresh
if (require.main === module) {
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args[0] === '--user' && args[1]) {
    checkUserBookings(args[1]);
  } else {
    refreshDemoData();
  }
}

module.exports = { refreshDemoData, checkUserBookings };