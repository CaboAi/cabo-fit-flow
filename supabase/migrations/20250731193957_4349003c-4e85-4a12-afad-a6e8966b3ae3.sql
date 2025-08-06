-- Enable leaked password protection for better security
UPDATE auth.config SET 
  leak_password_check = true,
  password_min_length = 8;