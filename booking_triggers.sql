
      -- Drop existing trigger if it exists
      DROP TRIGGER IF EXISTS booking_validation_trigger ON bookings;

      -- Create the validation trigger
      CREATE TRIGGER booking_validation_trigger
        BEFORE INSERT OR UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION validate_booking_data();

      -- Create audit log function for bookings
      CREATE OR REPLACE FUNCTION log_booking_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO booking_audit_log (
            booking_id, 
            action, 
            old_data, 
            new_data, 
            user_id, 
            timestamp
          ) VALUES (
            NEW.id, 
            'INSERT', 
            NULL, 
            row_to_json(NEW), 
            NEW.user_id, 
            NOW()
          );
          RETURN NEW;
        ELSIF TG_OP = 'UPDATE' THEN
          INSERT INTO booking_audit_log (
            booking_id, 
            action, 
            old_data, 
            new_data, 
            user_id, 
            timestamp
          ) VALUES (
            NEW.id, 
            'UPDATE', 
            row_to_json(OLD), 
            row_to_json(NEW), 
            NEW.user_id, 
            NOW()
          );
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO booking_audit_log (
            booking_id, 
            action, 
            old_data, 
            new_data, 
            user_id, 
            timestamp
          ) VALUES (
            OLD.id, 
            'DELETE', 
            row_to_json(OLD), 
            NULL, 
            OLD.user_id, 
            NOW()
          );
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Create audit log table if not exists
      CREATE TABLE IF NOT EXISTS booking_audit_log (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        booking_id UUID,
        action VARCHAR(10) NOT NULL,
        old_data JSONB,
        new_data JSONB,
        user_id UUID,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create audit trigger
      DROP TRIGGER IF EXISTS booking_audit_trigger ON bookings;
      CREATE TRIGGER booking_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION log_booking_changes();

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings(class_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
      CREATE INDEX IF NOT EXISTS idx_audit_log_booking_id ON booking_audit_log(booking_id);
      CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON booking_audit_log(timestamp);
    