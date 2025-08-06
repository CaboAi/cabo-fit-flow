const supabase = require('../config/database');

exports.getGyms = async (req, res) => {
  const { data, error } = await supabase.from('Gyms').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

exports.getGymById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('Gyms').select('*').eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Gym not found' });
  res.status(200).json(data[0]);
};