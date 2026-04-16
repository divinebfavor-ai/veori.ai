const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ buyers: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .insert({ ...req.body, user_id: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json({ buyer: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('buyers')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json({ buyer: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('buyers').update({ is_active: false }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Buyer removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
