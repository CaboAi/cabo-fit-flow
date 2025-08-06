const supabase = require('../config/database');

exports.register = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) throw error;
  return data;
};

exports.login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

exports.logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

exports.refreshToken = async (refreshToken) => {
  const { data, error } = await supabase.auth.refreshSession({ 
    refresh_token: refreshToken 
  });
  
  if (error) throw error;
  return data;
};

exports.forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`
  });
  
  if (error) throw error;
};

exports.resetPassword = async (token, password) => {
  const { error } = await supabase.auth.updateUser({ 
    password 
  });
  
  if (error) throw error;
};