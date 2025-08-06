# Lovable.io Credit Integration Guide

## 🎯 What Was Added

✅ **useCredits Hook** - Manages credit balance and booking logic
✅ **CreditBadge Component** - Shows credit balance in header
✅ **ClassCreditCost Component** - Displays credit cost on class cards  
✅ **EnhancedBookingButton Component** - Handles credit-based booking

## 🚀 Integration Steps

### Step 1: Add Credit Badge to Header (2 minutes)

Find your header/navigation component and add:

```jsx
import { CreditBadge } from './components/CreditBadge';

// Inside your header component:
<CreditBadge user={user} className="ml-4" />
```

### Step 2: Add Credit Cost to Class Cards (3 minutes)

Find where you display class information and add:

```jsx
import { ClassCreditCost } from './components/ClassCreditCost';

// Inside your class card component:
<ClassCreditCost classId={class.id} className="mb-2" />
```

### Step 3: Replace Booking Buttons (5 minutes)

Replace your existing booking buttons:

```jsx
// Before:
<button onClick={() => bookClass(classId)} className="your-styles">
  Book Class
</button>

// After:
import { EnhancedBookingButton } from './components/EnhancedBookingButton';

<EnhancedBookingButton 
  classId={classId} 
  user={user}
  className="your-existing-styles"
  onBookingSuccess={(result) => {
    console.log('Booking successful!', result);
    // Your existing success handling
  }}
  onBookingError={(error) => {
    console.log('Booking error:', error);
    // Your existing error handling
  }}
>
  Book Class
</EnhancedBookingButton>
```

### Step 4: Update Your Main App Component (3 minutes)

Make sure your app has access to the user context:

```jsx
// In your main App.jsx or wherever you handle auth
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Pass user to your components
  return (
    <div>
      <Header user={user} />
      <ClassList user={user} />
    </div>
  );
}
```

## 🧪 Testing Checklist

- [ ] Credit balance appears in header when user is logged in
- [ ] Class cards show credit cost (1-3 credits)
- [ ] Booking button shows "Booking..." when processing
- [ ] Insufficient credits modal appears when needed
- [ ] Successful bookings update credit balance immediately
- [ ] Peak time classes show "Peak" indicator

## 🎨 Styling Notes

All components use Tailwind CSS classes that should work with your existing design:
- **CreditBadge**: Blue badge with icon, fits in navigation
- **ClassCreditCost**: Minimal inline display with credit icon
- **EnhancedBookingButton**: Uses your existing button styles
- **Modal**: Clean white modal with proper backdrop

## ⚡ Performance

- Credit balance is cached and only fetches when user changes
- Class costs are fetched once per class and cached
- Components gracefully handle loading states
- No impact on existing UI performance

## 🔧 Customization

### Change Credit Badge Style:
```jsx
<CreditBadge 
  user={user} 
  className="bg-purple-100 text-purple-800" 
/>
```

### Customize Insufficient Credits Modal:
Edit the modal JSX in `EnhancedBookingButton.jsx` to match your design system.

### Add Your Branding:
Replace the credit icons with your logo or custom icons.

## 🚀 Go Live

1. Copy all components to your Lovable.io project
2. Follow integration steps above
3. Test with your existing user account
4. Deploy to production

Your existing UI will look exactly the same, but now with powerful credit functionality! 🎉