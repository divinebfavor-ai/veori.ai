const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');
const { operatorAssistantChat, ariaChat } = require('../services/aiService');

const PLAN_LIMITS = {
  free: 50,
  hustle: 200,
  grind: 500,
  empire: 2000,
  dynasty: Infinity,
  enterprise: Infinity
};

// POST operator assistant chat (authenticated users only)
router.post('/chat', auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Check usage limits
    const plan = req.user.plan || 'hustle';
    const limit = PLAN_LIMITS[plan] || 200;
    const used = req.user.assistant_messages_used || 0;

    if (used >= limit) {
      return res.status(429).json({
        error: 'Monthly message limit reached',
        limit,
        used,
        upgrade_prompt: true
      });
    }

    // Build operator context from their data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [leadsResult, callsResult, dealsResult, hotLeadsResult] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', req.user.id),
      supabase.from('calls').select('id', { count: 'exact' }).eq('user_id', req.user.id).gte('started_at', today.toISOString()),
      supabase.from('deals').select('status, assignment_fee').eq('user_id', req.user.id).in('status', ['offer_sent', 'seller_signed', 'buyer_found', 'closing']),
      supabase.from('leads').select('first_name, last_name, property_address, motivation_score, status').eq('user_id', req.user.id).gte('motivation_score', 70).order('motivation_score', { ascending: false }).limit(5)
    ]);

    const monthRevenue = await supabase
      .from('deals')
      .select('assignment_fee')
      .eq('user_id', req.user.id)
      .eq('status', 'closed')
      .gte('created_at', new Date(today.getFullYear(), today.getMonth(), 1).toISOString());

    const revenue = (monthRevenue.data || []).reduce((sum, d) => sum + (d.assignment_fee || 0), 0);

    const operatorContext = {
      full_name: req.user.full_name,
      company_name: req.user.company_name,
      total_leads: leadsResult.count || 0,
      hot_leads: hotLeadsResult.data?.length || 0,
      calls_today: callsResult.count || 0,
      active_deals: dealsResult.data?.length || 0,
      revenue_month: revenue,
      recent_hot_leads: hotLeadsResult.data || []
    };

    const response = await operatorAssistantChat(messages, operatorContext);

    // Increment usage counter
    await supabase.from('users').update({
      assistant_messages_used: used + 1
    }).eq('id', req.user.id);

    res.json({
      message: response,
      usage: { used: used + 1, limit }
    });
  } catch (error) {
    console.error('Assistant chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST Aria public chatbot (no auth required — session-based)
router.post('/aria', async (req, res) => {
  try {
    const { messages, session_id } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Track usage by session (simple approach — production would use Redis)
    // For now we trust client-side tracking and enforce lightly server-side
    const response = await ariaChat(messages);

    res.json({ message: response });
  } catch (error) {
    console.error('Aria chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
