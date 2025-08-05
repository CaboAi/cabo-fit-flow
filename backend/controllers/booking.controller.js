const supabase = require('../config/database');

exports.createBooking = async (req, res) => {
  const { class_id, type } = req.body;
  const user_id = (await supabase.auth.getUser()).data.user.id;
  const { data, error } = await supabase.from('Bookings').insert({ user_id, class_id, type }).select();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data[0]);
};

exports.getBookings = async (req, res) => {
  const user_id = (await supabase.auth.getUser()).data.user.id;
  const { data, error } = await supabase.from('Bookings').select('*').eq('user_id', user_id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
};

exports.cancelBooking = async (req, res) => {
  const { id } = req.params;
  const user_id = (await supabase.auth.getUser()).data.user.id;
  const { error } = await supabase.from('Bookings').delete().eq('id', id).eq('user_id', user_id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json({ message: 'Booking cancelled' });
};