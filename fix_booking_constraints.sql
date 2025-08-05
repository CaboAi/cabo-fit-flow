
      -- Drop existing constraint if it exists
      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'bookings_type_check' 
          AND table_name = 'bookings'
        ) THEN
          ALTER TABLE bookings DROP CONSTRAINT bookings_type_check;
        END IF;
      END $$;

      -- Add improved booking type constraint
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_type_check 
      CHECK (type IN ('drop-in', 'subscription', 'day-pass', 'trial', 'membership'));

      -- Add payment status constraint if not exists
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'bookings_payment_status_check' 
          AND table_name = 'bookings'
        ) THEN
          ALTER TABLE bookings 
          ADD CONSTRAINT bookings_payment_status_check 
          CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded'));
        END IF;
      END $$;
    