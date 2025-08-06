require('dotenv').config({ path: 'C:\\Users\\mario\\OneDrive\\Documents\\Cabo Fit App\\.env', debug: true });
console.log('Loaded Env Vars:', process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const config = require('./config/environment');
const app = require('./app');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});