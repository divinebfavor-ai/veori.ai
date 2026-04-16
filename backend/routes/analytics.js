// analytics.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [leads, calls, deals, appointments] = await Promise.all([
      supabase.from('leads').select('status', { count: 'exact' }).eq('user_id', userId),
      supabase.from('calls').select('status, duration_seconds', { count: 'exact' }).eq('user_id', userId),
      supabase.from('deals').select('status, assignment_fee', { count: 'exact' }).eq('user_id', userId),
      supabase.from('appointments').select('status', { count: 'exact' }).eq('user_id', userId)
    ]);

    const totalRevenue = (deals.data || [])
      .filter(d => d.status === 'closed')
      .reduce((sum, d) => sum + (d.assignment_fee || 0), 0);

    res.json({
      totalLeads: leads.count || 0,
      totalCalls: calls.count || 0,
      totalDeals: deals.count || 0,
      totalAppointments: appointments.count || 0,
      totalRevenue,
      callsUsed: req.user.calls_used || 0,
      callsLimit: req.user.calls_limit || 500,
      hotLeads: (leads.data || []).filter(l => l.status === 'interested').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
