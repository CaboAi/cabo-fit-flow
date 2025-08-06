const { createClient } = require('@supabase/supabase-js');
const supabase = require('../config/database');

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate role is one of the allowed values
const validRoles = ['local', 'tourist', 'gym_owner'];

exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Input validation
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${validRoles.join(', ')}` });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check for existing email in profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows
      return res.status(500).json({ error: profileError.message });
    }
    if (existingProfile) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, role, email });
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) return res.status(500).json({ error: sessionError.message });
      res.status(201).json({
        message: 'Registration successful',
        user: data.user,
        session: session.session // Include session token for future requests
      });
    } else {
      res.status(201).json({ message: 'Registration initiated, check email for confirmation', user: null });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
  return res.status(400).json({ error: 'Email and password are required' });
}
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: 'Invalid email format' });
}
if (password.length < 8) {
  return res.status(400).json({ error: 'Password must be at least 8 characters' });
}

    // Login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    if (data.user) {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) return res.status(500).json({ error: sessionError.message });
      res.status(200).json({
        message: 'Login successful',
        user: data.user,
        session: session.session // Include session token
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};