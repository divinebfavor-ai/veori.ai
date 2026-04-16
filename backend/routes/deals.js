const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*, leads(first_name, last_name, property_address)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ deals: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .insert({ ...req.body, user_id: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json({ deal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json({ deal: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
