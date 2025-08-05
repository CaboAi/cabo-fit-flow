# Cabo FitPass - Lovable.io Integration Guide

## 🚀 Quick Setup

### 1. Database Setup
Execute the SQL scripts in your Supabase dashboard:

```sql
-- Navigate to Supabase Dashboard > SQL Editor
-- Execute each file in order:
```

1. **create_plans.sql** - Subscription plans table
2. **create_subscriptions.sql** - User subscriptions table  
3. **create_payments.sql** - Payment records table
4. **create_workouts.sql** - Workout tracking table

### 2. Current Database State

After running the update script, your database contains:

#### **GYMS** (3 records)
- Cabo Fit Gym (Cabo San Lucas)
- Test Gym 
- Ocean View Fitness (Playa del Carmen)

#### **CLASSES** (3 records)
- Yoga Session - $15 (Cabo Fit Gym)
- CrossFit WOD - $25 (Ocean View Fitness)
- Swimming Lessons - $30 (Ocean View Fitness)

#### **BOOKINGS** (1 valid record)
- Valid booking for Yoga Session
- Payment status: pending

## 🔧 Lovable.io Configuration

### Step 1: Create New Lovable Project
```bash
# Go to https://lovable.dev
# Create new project: "Cabo FitPass"
# Choose React + Tailwind template
```

### Step 2: Configure Supabase Integration
In your Lovable project settings:

```javascript
// Environment Variables
VITE_SUPABASE_URL=https://pamzfhiiuvmtlwwvufut.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Install Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.3.0"
  }
}
```

## 📱 Core Components

### Main App Structure
```
src/
├── components/
│   ├── CaboFitPassApp.jsx     # Main app component
│   ├── Header.jsx             # Navigation header
│   ├── UserDashboard.jsx      # User dashboard
│   ├── ClassSchedule.jsx      # Class listings
│   └── ClassCard.jsx          # Individual class cards
├── lib/
│   └── supabase.js           # Supabase client config
└── App.jsx                   # Root component
```

## 🔑 Key Features Implemented

### 1. **Class Display** 
```sql
-- Query: Get all classes with gym information
SELECT classes.*, gyms.name as gym_name, gyms.location 
FROM classes 
JOIN gyms ON classes.gym_id = gyms.id 
ORDER BY classes.schedule;
```

### 2. **User Bookings**
```sql
-- Query: Get user bookings with class details
SELECT bookings.*, classes.title, classes.schedule, gyms.name as gym_name
FROM bookings 
JOIN classes ON bookings.class_id = classes.id
JOIN gyms ON classes.gym_id = gyms.id
WHERE bookings.user_id = [current_user_id]
ORDER BY bookings.created_at DESC;
```

### 3. **Subscription Status**
```sql
-- Query: Get user active subscriptions
SELECT subscriptions.*, plans.name, plans.price, plans.duration_days
FROM subscriptions 
JOIN plans ON subscriptions.plan_id = plans.id
WHERE subscriptions.user_id = [current_user_id] 
AND subscriptions.status = 'active';
```

## 🎨 UI Components

### Booking Button
```jsx
<button 
  onClick={() => handleBookClass(classId)}
  disabled={!user || !isUpcoming}
  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
>
  {!user ? 'Sign in to Book' : !isUpcoming ? 'Class Ended' : 'Book Class'}
</button>
```

### Subscription Status Display
```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold mb-2">Subscription Status</h3>
  {activeSubscription ? (
    <div className="space-y-2">
      <span className="text-green-600 font-medium">Active</span>
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
        {activeSubscription.plans?.name}
      </span>
      <p className="text-sm text-gray-600">
        Expires: {new Date(activeSubscription.end_date).toLocaleDateString()}
      </p>
    </div>
  ) : (
    <span className="text-gray-500">No active subscription</span>
  )}
</div>
```

## 🔐 Authentication Flow

### Supabase Auth Integration
```javascript
// Sign up new user
const { data, error } = await supabase.auth.signUp({
  email: 'mariopjr91@gmail.com',
  password: 'userPassword123',  
  options: {
    data: {
      full_name: 'Mario Polanco Jr',
      role: 'local'
    }
  }
})

// Create user profile
if (data.user) {
  await supabase.from('profiles').insert({
    id: data.user.id,
    email: data.user.email,
    full_name: 'Mario Polanco Jr',
    role: 'local',
    phone: '+52-123-456-7890'
  })
}
```

## 📊 Real-time Features

### Live Class Updates
```javascript
// Subscribe to class changes
const classSubscription = supabase
  .channel('classes-changes')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'classes' 
  }, (payload) => {
    console.log('Class updated:', payload)
    // Update UI with new class data
  })
  .subscribe()
```

### User Booking Updates
```javascript
// Subscribe to user's booking changes
const bookingSubscription = supabase
  .channel('user-bookings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public', 
    table: 'bookings',
    filter: `user_id=eq.${user.id}`
  }, (payload) => {
    console.log('Booking updated:', payload)
    // Update booking list
  })
  .subscribe()
```

## 🚀 Deployment Steps

### 1. In Lovable.io
1. Copy `CaboFitPassApp.jsx` as your main component
2. Copy `lovable_config.js` for Supabase integration
3. Configure environment variables
4. Deploy to production

### 2. In Supabase Dashboard
1. Execute all SQL migration files
2. Set up Row Level Security policies:
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
   
   -- Example policy for bookings
   CREATE POLICY "Users can view own bookings" ON bookings
   FOR SELECT USING (auth.uid() = user_id);
   ```

3. Configure authentication settings
4. Test API endpoints

## 🧪 Testing Checklist

- [ ] User can view all gyms and classes
- [ ] Authenticated users can book classes  
- [ ] Booking appears in user dashboard
- [ ] Subscription status displays correctly
- [ ] Real-time updates work
- [ ] Payment integration (future)
- [ ] Mobile responsive design

## 🔗 Live Integration

Once deployed, your Cabo FitPass app will have:

✅ **Live class schedule from Supabase**  
✅ **User authentication and profiles**  
✅ **Real-time booking system**  
✅ **Subscription management**  
✅ **Payment tracking (ready for Stripe)**  
✅ **Responsive mobile design**  

Visit your live app at: `https://cabo-fit-pass.lovable.app/`

## 📝 Next Steps

1. **Execute SQL scripts** in Supabase dashboard
2. **Deploy components** to Lovable.io 
3. **Test user registration** with mariopjr91@gmail.com
4. **Add Stripe integration** for payments
5. **Implement push notifications** for class reminders
6. **Add workout tracking** features

## 🔗 Repository Information

- **Project Name**: Cabo Fit Flow  
- **GitHub Repository**: https://github.com/CaboAi/cabo-fit-flow.git
- **Organization**: CaboAi
- **Live App**: https://cabo-fit-pass.lovable.app/

## 📝 Git Integration

```bash
# Clone the repository
git clone https://github.com/CaboAi/cabo-fit-flow.git
cd cabo-fit-flow

# Add your changes
git add .
git commit -m "feat: implement booking system with Supabase integration"
git push origin main
```

Your fitness app is now ready for Los Cabos users! 🏖️💪