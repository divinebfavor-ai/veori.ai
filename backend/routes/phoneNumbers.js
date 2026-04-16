const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

// GET all phone numbers with health scores
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', req.user.id)
      .order('spam_score', { ascending: false });

    if (error) throw error;

    // Calculate health status dynamically
    const numbers = (data || []).map(n => {
      let health_status = 'healthy';
      if ((n.spam_score || 100) < 40) health_status = 'flagged';
      else if (n.cooldown_until && new Date(n.cooldown_until) > new Date()) health_status = 'cooling';
      else if ((n.daily_calls_made || 0) >= (n.daily_call_limit || 50)) health_status = 'limit_reached';

      return { ...n, health_status };
    });

    res.json({ phone_numbers: numbers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET health summary for rotation
router.get('/health', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true);

    if (error) throw error;

    const now = new Date();
    const summary = (data || []).map(n => {
      const isCooling = n.cooldown_until && new Date(n.cooldown_until) > now;
      const isAtLimit = (n.daily_calls_made || 0) >= (n.daily_call_limit || 50);
      const available = !isCooling && !isAtLimit && (n.spam_score || 100) >= 30;

      return {
        id: n.id,
        number: n.number,
        friendly_name: n.friendly_name,
        area_code: n.area_code,
        state: n.state,
        spam_score: n.spam_score || 100,
        daily_calls_made: n.daily_calls_made || 0,
        daily_call_limit: n.daily_call_limit || 50,
        health_status: available ? 'healthy' : isCooling ? 'cooling' : isAtLimit ? 'limit_reached' : 'flagged',
        cooldown_until: n.cooldown_until,
        available
      };
    });

    res.json({
      total: summary.length,
      available: summary.filter(n => n.available).length,
      numbers: summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST select best phone number for a call (intelligent rotation)
router.post('/select', auth, async (req, res) => {
  try {
    const { seller_area_code, seller_state } = req.body;

    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .gte('spam_score', 30)
      .order('spam_score', { ascending: false });

    if (error) throw error;

    const now = new Date();
    const available = (data || []).filter(n => {
      const isCooling = n.cooldown_until && new Date(n.cooldown_until) > now;
      const isAtLimit = (n.daily_calls_made || 0) >= (n.daily_call_limit || 50);
      return !isCooling && !isAtLimit;
    });

    if (available.length === 0) return res.status(400).json({ error: 'No available phone numbers' });

    // Rule 3: Geographic matching — prefer same area code or state
    let best = null;
    if (seller_area_code) {
      best = available.find(n => n.area_code === seller_area_code);
    }
    if (!best && seller_state) {
      best = available.find(n => n.state === seller_state);
    }
    if (!best) {
      best = available[0]; // fallback to healthiest
    }

    // Set 90-second cooldown on selected number
    const cooldownUntil = new Date(now.getTime() + 90 * 1000);
    await supabase.from('phone_numbers').update({ cooldown_until: cooldownUntil }).eq('id', best.id);

    res.json({ phone_number: best });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add phone number
router.post('/', auth, async (req, res) => {
  try {
    const { number, friendly_name, area_code, state, carrier, vapi_phone_number_id } = req.body;

    if (!number) return res.status(400).json({ error: 'Phone number required' });

    const { data, error } = await supabase
      .from('phone_numbers')
      .insert({
        user_id: req.user.id,
        number,
        friendly_name: friendly_name || number,
        area_code: area_code || number.replace(/\D/g, '').slice(1, 4),
        state: state || '',
        carrier: carrier || '',
        vapi_phone_number_id: vapi_phone_number_id || null,
        spam_score: 100,
        health_status: 'healthy',
        is_active: true,
        daily_call_limit: 50
      })
      .select().single();

    if (error) throw error;
    res.status(201).json({ phone_number: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update phone number
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single();

    if (error) throw error;
    res.json({ phone_number: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE phone number
router.delete('/:id', auth, async (req, res) => {
  try {
    await supabase.from('phone_numbers').update({ is_active: false }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Phone number deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST reset daily counts (called by a daily cron)
router.post('/reset-daily', async (req, res) => {
  try {
    await supabase.from('phone_numbers').update({ daily_calls_made: 0 });
    res.json({ message: 'Daily counts reset' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
