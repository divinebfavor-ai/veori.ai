const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/:leadId', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('lead_id', req.params.leadId)
      .eq('user_id', req.user.id)
      .order('sent_at', { ascending: true });
    if (error) throw error;
    res.json({ messages: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', auth, async (req, res) => {
  try {
    const { lead_id, message } = req.body;
    if (!lead_id || !message) return res.status(400).json({ error: 'lead_id and message required' });

    const { data, error } = await supabase
      .from('sms_messages')
      .insert({ user_id: req.user.id, lead_id, body: message, direction: 'outbound', ai_generated: false })
      .select().single();
    if (error) throw error;

    res.json({ message: 'SMS logged', sms: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
