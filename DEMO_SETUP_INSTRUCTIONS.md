# Demo Setup Instructions for Cabo Fit Pass

## 🚀 Quick Start Guide

Follow these steps to set up your demo-ready Cabo Fit Pass platform for studio partner demonstrations.

## 📋 Prerequisites

- ✅ Server running on http://localhost:3000
- ✅ Supabase project connected
- ✅ Node.js and npm installed

## 🔧 Step-by-Step Implementation

### Step 1: Execute Demo Data in Supabase

1. **Open your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/pamzfhiiuvmtlwwvufut/sql
   
2. **Run the Demo Setup SQL**
   - Copy the entire contents of `demo_data_setup.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - You should see success messages and a summary table

3. **Verify the Data**
   - The script will show:
     - Total gyms: 7+
     - Upcoming classes: 23+
     - Mario's bookings: 3 (1 completed, 2 upcoming)
     - Demo overview statistics

### Step 2: Test the Dashboard

1. **Make sure your server is running:**
   ```bash
   cd "/mnt/c/Users/mario/OneDrive/Documents/Cabo Fit App"
   npm start
   ```

2. **Visit the dashboard:**
   - Open: http://localhost:3000/dashboard
   - You should see:
     - Welcome message for Mario
     - Stats showing 3 bookings, 2 upcoming, 1 completed
     - Monthly credits: 1 of 4 remaining
     - Detailed booking cards with notes

### Step 3: Use the Refresh Utility

The refresh utility ensures all classes stay in the future for demos:

1. **Make the script executable:**
   ```bash
   chmod +x refresh_demo_data.js
   ```

2. **Run the refresh utility:**
   ```bash
   node refresh_demo_data.js
   ```

3. **Check specific user bookings:**
   ```bash
   node refresh_demo_data.js --user 40ec6001-c070-426a-9d8d-45326d0d7dac
   ```

### Step 4: Verify the Complete Demo Flow

1. **Classes Page** (http://localhost:3000/classes)
   - Should show 20+ upcoming classes
   - No "class ended" messages
   - Various class types and prices
   - Realistic booking counts

2. **Dashboard** (http://localhost:3000/dashboard)
   - Professional design with stats
   - 2 upcoming classes with details
   - 1 completed class in history
   - Credits display (1 of 4)

3. **Booking Flow**
   - Try booking a class
   - Should work seamlessly
   - Updates capacity in real-time

## 🎯 Demo Script for Studio Partners

### Opening Statement
"Welcome to Cabo Fit Pass - the premier fitness marketplace connecting studios with active locals and tourists in Los Cabos."

### Key Points to Highlight:

1. **Multi-Studio Platform**
   - "We currently have 7 partner studios across Los Cabos"
   - "From beachfront yoga to downtown CrossFit"
   - Show the variety on the classes page

2. **User Engagement**
   - "Users like Mario here have already booked 3 classes"
   - "Our credit system encourages regular attendance"
   - Show the professional dashboard

3. **Real-Time Management**
   - "All bookings update capacity in real-time"
   - "No double-bookings or overselling"
   - Demonstrate a live booking

4. **Revenue Potential**
   - "Average class price: $25"
   - "Monthly memberships drive recurring revenue"
   - "Drop-in options for tourists"

5. **Professional Experience**
   - "Mobile-responsive for on-the-go bookings"
   - "Clear booking confirmations and reminders"
   - "User notes help instructors prepare"

## 🔍 Troubleshooting

### If classes show as "ended":
```bash
node refresh_demo_data.js
```

### If dashboard shows no bookings:
1. Check Mario's user ID in the database
2. Re-run the demo_data_setup.sql script
3. Verify profile exists for Mario

### If server won't start:
```bash
# Kill any existing processes
pkill -f "node.*server"

# Start fresh
npm start
```

## 📊 Demo Data Overview

After setup, you'll have:

- **7+ Gyms** including:
  - Sunset Yoga Studio (Medano Beach)
  - Cabo CrossFit (Downtown)
  - Aqua Fitness Center (Marina)
  - Desert Pilates (San José)
  - BeachFit Cabo
  - Muscle Beach Gym
  - Flex Fitness Studio

- **23+ Classes** featuring:
  - Sunrise Beach Yoga
  - CrossFit Fundamentals
  - Aqua HIIT
  - Reformer Pilates
  - Beach Bootcamp
  - And many more!

- **Realistic Bookings**:
  - Multiple users per class
  - Various payment types
  - User comments and feedback

## ✅ Success Checklist

- [ ] SQL script executed successfully
- [ ] Dashboard shows Mario's data correctly
- [ ] Classes page has no "ended" classes
- [ ] Booking flow works smoothly
- [ ] Refresh utility runs without errors
- [ ] Mobile responsive design works

## 🎉 Ready for Demo!

Your Cabo Fit Pass platform is now fully configured for an impressive studio partner demonstration. The variety of classes, professional UI, and realistic data will showcase the platform's potential effectively.

Good luck with your demos! 🚀