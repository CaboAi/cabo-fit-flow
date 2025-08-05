
# Cabo FitPass - Booking System Deployment Guide

## Files Generated
1. **fix_booking_constraints.sql** - Updates booking type constraints
2. **booking_validation_function.sql** - Validation logic for bookings
3. **booking_triggers.sql** - Auto-validation triggers and audit logging
4. **booking_system_log.txt** - Execution log

## Deployment Steps

### Step 1: Execute SQL Files in Supabase Dashboard
Go to: https://supabase.com/dashboard/project/pamzfhiiuvmtlwwvufut/sql

Execute in this order:
1. fix_booking_constraints.sql
2. booking_validation_function.sql  
3. booking_triggers.sql

### Step 2: Test User Setup

User ID: 661db286-593a-4c1e-8ce8-fb4ea43cd58a
Email: mariopjr91@gmail.com


### Step 3: Validation Features
- ✅ Class existence validation
- ✅ User existence validation  
- ✅ Capacity checking
- ✅ Booking type constraints
- ✅ Payment status validation
- ✅ Audit logging
- ✅ Automatic timestamps

### Step 4: Testing
Use the Node.js validation methods to test:
- Valid bookings
- Invalid class IDs
- Capacity limits
- Constraint violations

## Valid Class IDs for Testing
- e8c7dd4f-2346-484d-9933-2b338c405540
- e0b37bc6-4d8d-4610-97fe-e94f7ba1ba06
- 351ce744-e434-4561-9a86-32bcb3874c32

## Booking Types Supported
- drop-in
- subscription  
- day-pass
- trial
- membership

## Payment Statuses Supported
- pending
- completed
- failed
- cancelled
- refunded

## Repository Information
- **Project**: Cabo Fit Flow
- **GitHub**: https://github.com/CaboAi/cabo-fit-flow.git
- **Organization**: CaboAi

## Next Steps
1. Deploy SQL files to Supabase
2. Test booking creation via API
3. Verify triggers are working
4. Set up frontend validation
5. Integrate with Stripe payments
6. Push code to GitHub repository
