const supabase = require('../config/database');

exports.getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

exports.updateProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

exports.deleteProfile = async (userId) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);
  
  if (error) throw error;
};

exports.getWorkouts = async (userId) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

exports.createWorkout = async (userId, workoutData) => {
  const { data, error } = await supabase
    .from('workouts')
    .insert({ ...workoutData, user_id: userId })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

exports.updateWorkout = async (userId, workoutId, workoutData) => {
  const { data, error } = await supabase
    .from('workouts')
    .update(workoutData)
    .eq('id', workoutId)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

exports.deleteWorkout = async (userId, workoutId) => {
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId)
    .eq('user_id', userId);
  
  if (error) throw error;
};