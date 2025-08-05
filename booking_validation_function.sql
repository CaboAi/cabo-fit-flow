
      -- Booking validation function
      CREATE OR REPLACE FUNCTION validate_booking_data()
      RETURNS TRIGGER AS $$
      DECLARE
        class_capacity INTEGER;
        current_bookings INTEGER;
        class_exists BOOLEAN;
        user_exists BOOLEAN;
      BEGIN
        -- Check if class exists
        SELECT EXISTS(SELECT 1 FROM classes WHERE id = NEW.class_id) INTO class_exists;
        IF NOT class_exists THEN
          RAISE EXCEPTION 'Class with ID % does not exist', NEW.class_id;
        END IF;

        -- Check if user exists (either in profiles or auth.users)
        SELECT EXISTS(
          SELECT 1 FROM profiles WHERE id = NEW.user_id
          UNION
          SELECT 1 FROM auth.users WHERE id = NEW.user_id
        ) INTO user_exists;
        
        IF NOT user_exists THEN
          RAISE EXCEPTION 'User with ID % does not exist', NEW.user_id;
        END IF;

        -- Get class capacity
        SELECT capacity INTO class_capacity 
        FROM classes 
        WHERE id = NEW.class_id;

        -- Count current confirmed bookings for this class
        SELECT COUNT(*) INTO current_bookings
        FROM bookings 
        WHERE class_id = NEW.class_id 
        AND payment_status IN ('completed', 'pending');

        -- Check capacity
        IF current_bookings >= class_capacity THEN
          RAISE EXCEPTION 'Class is full. Capacity: %, Current bookings: %', 
                         class_capacity, current_bookings;
        END IF;

        -- Set default values
        IF NEW.type IS NULL THEN
          NEW.type := 'drop-in';
        END IF;

        IF NEW.payment_status IS NULL THEN
          NEW.payment_status := 'pending';
        END IF;

        -- Add timestamp
        NEW.created_at := COALESCE(NEW.created_at, NOW());

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    