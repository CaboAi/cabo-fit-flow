const supabase = require('../config/database');

exports.getClasses = async (req, res) => {
  const { data, error } = await supabase.from('Classes').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

exports.getClassById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('Classes').select('*').eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data.length) return res.status(404).json({ error: 'Class not found' });
  res.status(200).json(data[0]);
};