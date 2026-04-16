// crm.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/pipeline', auth, async (req, res) => {
  try {
    const statuses = ['new', 'calling', 'contacted', 'interested', 'appointment_set', 'offer_sent', 'under_contract', 'closed'];
    const pipeline = {};
    for (const status of statuses) {
      const { data, count } = await supabase
        .from('leads')
        .select('id, first_name, last_name, property_address, motivation_score, phone', { count: 'exact' })
        .eq('user_id', req.user.id)
        .eq('status', status)
        .limit(20);
      pipeline[status] = { leads: data || [], count: count || 0 };
    }
    res.json({ pipeline });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
