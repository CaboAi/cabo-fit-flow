# Credit System Integration Instructions

## 🎯 Components Created
✅ ClassCreditCost.tsx - Shows credit cost on class cards
✅ EnhancedBookingButton.tsx - Smart booking with insufficient credits modal
✅ useCredits.js - Credit management hook (already exists)
✅ CreditBadge.jsx - Header credit display (already integrated)

## 🔧 Integration Steps

### Step 1: Add ClassCreditCost to Class Cards

Find your class card components and add the credit cost display:

```tsx
// Add this import at the top of your class card component
import { ClassCreditCost } from './ClassCreditCost';

// Add this JSX where you want to show credit cost (usually near price)
<ClassCreditCost classId={class.id} className="mb-2" />
```

**Likely locations to update:**
- src/components/ClassCard.tsx
- src/pages/Index.tsx

### Step 2: Replace Booking Buttons

Replace existing booking buttons with the enhanced version:

```tsx
// Add this import
import { EnhancedBookingButton } from './EnhancedBookingButton';

// Replace existing booking button
// OLD:
<button onClick={() => bookClass(classId)} className="your-styles">
  Book Class
</button>

// NEW:
<EnhancedBookingButton 
  classId={classId} 
  user={user}
  className="your-existing-styles"
  onBookingSuccess={(result) => {
    console.log('Booking successful!', result);
    // Add your success handling here
    // Example: show success toast, refresh data, etc.
  }}
  onBookingError={(error) => {
    console.log('Booking error:', error);
    // Add your error handling here
    // Example: show error toast
  }}
>
  Book Class
</EnhancedBookingButton>
```

### Step 3: Ensure User Context is Available

Make sure your components have access to the user object:

```tsx
// In your main app or layout component
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      <Header user={user} /> {/* Already has CreditBadge */}
      <ClassList user={user} /> {/* Pass user to class components */}
    </div>
  );
}
```

## 🧪 Testing Checklist

After integration, test these features:

- [ ] Credit balance shows in header (already working)
- [ ] Class cards show credit cost (1-3 credits)
- [ ] Peak time classes show "Peak" indicator
- [ ] Booking button shows loading state when clicking
- [ ] Insufficient credits modal appears when needed
- [ ] Modal shows correct credit shortage and pricing
- [ ] Successful bookings update credit balance
- [ ] Error handling works for various scenarios

## 🎨 Styling Notes

All components use Tailwind CSS classes that should match your existing design:
- Components inherit your existing button styles
- Modal uses clean white overlay design
- Credit displays use blue color scheme (easily customizable)

## ⚡ Demo Features Ready

Once integrated, you'll have:
- **Always-visible credit balance** in header
- **Dynamic pricing display** on class cards
- **Peak hour indicators** for surge pricing
- **Smart booking flow** with credit validation
- **Professional upgrade prompts** for insufficient credits
- **Real-time credit deduction** after successful booking

## 🚀 Quick Integration Script

If you want to quickly test the integration, add these imports to your main class display component:

```tsx
import { ClassCreditCost } from './ClassCreditCost';
import { EnhancedBookingButton } from './EnhancedBookingButton';

// Then add the components to your JSX
```

Your credit system will then be fully functional and demo-ready!