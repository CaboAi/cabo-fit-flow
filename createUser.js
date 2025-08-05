require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function createUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testuser2@cabofit.local',
    password: 'securepass123'
  });
  if (error) console.error('User creation error:', error);
  else console.log('User created:', data);
  return { data, error };
}

createUser();