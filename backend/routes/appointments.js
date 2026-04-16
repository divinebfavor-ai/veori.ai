const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, leads(first_name, last_name, phone, property_address)')
      .eq('user_id', req.user.id)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    res.json({ appointments: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ ...req.body, user_id: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json({ appointment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json({ appointment: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
