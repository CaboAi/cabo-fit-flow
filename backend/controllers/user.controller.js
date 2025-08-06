const supabase = require('../config/database');

// Basic email validation regex (for updates)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate optional fields for profile updates
const validProfileFields = ['full_name', 'email', 'phone', 'role'];

exports.getProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const { data, error } = await supabase
      .from('profiles')
      .select('id, role, full_name, email, phone, created_at')
      .eq('id', user_id)
      .single();
    if (error) return next(error);
    if (!data) return res.status(404).json({ error: 'Profile not found' });

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const updates = {};
    for (const field of validProfileFields) {
      if (req.body[field] !== undefined) {
        if (field === 'email' && !emailRegex.test(req.body[field])) {
          return res.status(400).json({ error: 'Invalid email format' });
        }
        if (field === 'role' && !['local', 'tourist', 'gym_owner'].includes(req.body[field])) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        updates[field] = req.body[field];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user_id)
      .select();
    if (error) return next(error);
    if (!data.length) return res.status(404).json({ error: 'Profile not found' });

    res.status(200).json({ success: true, data: data[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteProfile = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user_id);
    if (error) return next(error);

    // Optionally sign out user from Supabase Auth
    await supabase.auth.signOut();
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// Placeholder for Workouts (assuming a future table)
exports.getWorkouts = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    // Note: 'Workouts' table not in current schema
    const { data, error } = await supabase
      .from('Workouts') // Replace with actual table or remove if not needed
      .select('*')
      .eq('user_id', user_id);
    if (error) return next(error);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

exports.createWorkout = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const { name, duration } = req.body; // Example fields
    if (!name || !duration) return res.status(400).json({ error: 'Name and duration are required' });

    const { data, error } = await supabase
      .from('Workouts') // Replace with actual table
      .insert({ user_id, name, duration })
      .select();
    if (error) return next(error);
    res.status(201).json({ success: true, data: data[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateWorkout = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    if (!user_id || !id) return res.status(400).json({ error: 'User ID and workout ID are required' });

    const { name, duration } = req.body; // Example fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (duration !== undefined) updates.duration = duration;
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('Workouts') // Replace with actual table
      .update(updates)
      .eq('id', id)
      .eq('user_id', user_id)
      .select();
    if (error) return next(error);
    if (!data.length) return res.status(404).json({ error: 'Workout not found' });
    res.status(200).json({ success: true, data: data[0] });
  } catch (err) {
    next(err);
  }
};

exports.deleteWorkout = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    if (!user_id || !id) return res.status(400).json({ error: 'User ID and workout ID are required' });

    const { error } = await supabase
      .from('Workouts') // Replace with actual table
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);
    if (error) return next(error);
    res.status(200).json({ success: true, message: 'Workout deleted successfully' });
  } catch (err) {
    next(err);
  }
};