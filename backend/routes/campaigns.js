const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');
const axios = require('axios');

const VAPI_BASE = 'https://api.vapi.ai';
const ALEX_SYSTEM_PROMPT = `You are Alex, a professional real estate investor with 10 years of wholesale experience. You are warm, direct, and genuinely helpful. You adapt your tone to match the seller. You listen more than you talk. You never sound scripted. You speak at a measured pace — never rushed. You are confident but never pushy. Your goal is to find a solution that works for everyone.

Start with: "Hi, is this [FirstName]? Great — my name is Alex. I'm a local real estate investor and I was reaching out about your property at [Address]. Do you have just two or three minutes?"

Ask about their situation, timeline, and motivation. If motivated, make a cash offer. Handle objections professionally. Always be respectful.`;

// In-memory campaign state (production would use Redis)
const activeCampaigns = new Map();

// GET all campaigns
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ campaigns: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET campaign stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !campaign) return res.status(404).json({ error: 'Campaign not found' });

    // Get call stats for this campaign
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: calls } = await supabase
      .from('calls')
      .select('status, outcome, duration_seconds, motivation_score, started_at')
      .eq('user_id', req.user.id)
      .gte('started_at', today.toISOString());

    const stats = {
      calls_today: calls?.length || 0,
      answered: calls?.filter(c => c.status === 'completed' && c.duration_seconds > 10).length || 0,
      motivated: calls?.filter(c => (c.motivation_score || 0) >= 40).length || 0,
      appointments: calls?.filter(c => c.outcome === 'appointment_set').length || 0,
      offers: calls?.filter(c => c.outcome === 'offer_made').length || 0,
      contracts: calls?.filter(c => c.outcome === 'verbal_yes').length || 0,
    };

    res.json({ campaign, stats, is_active: activeCampaigns.has(req.params.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create campaign
router.post('/', auth, async (req, res) => {
  try {
    const {
      name, concurrent_lines = 3, daily_limit_per_number = 50,
      calling_hours_start = '09:00', calling_hours_end = '20:00',
      retry_attempts = 3, call_delay_seconds = 3,
      daily_spend_limit, lead_filter = {}
    } = req.body;

    // Count leads matching filter
    let countQuery = supabase.from('leads').select('id', { count: 'exact' }).eq('user_id', req.user.id).eq('is_on_dnc', false);
    if (lead_filter.status) countQuery = countQuery.eq('status', lead_filter.status);
    const { count } = await countQuery;

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: req.user.id,
        name,
        status: 'draft',
        concurrent_lines,
        daily_limit_per_number,
        calling_hours_start,
        calling_hours_end,
        retry_attempts,
        call_delay_seconds,
        daily_spend_limit,
        total_leads: count || 0
      })
      .select().single();

    if (error) throw error;
    res.status(201).json({ campaign: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select().single();
    if (error) throw error;
    res.json({ campaign: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST start campaign — launches concurrent Vapi sessions
router.post('/:id/start', auth, async (req, res) => {
  try {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (activeCampaigns.has(req.params.id)) return res.status(400).json({ error: 'Campaign already running' });

    // Get healthy phone numbers
    const { data: phoneNumbers } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .eq('health_status', 'healthy')
      .order('spam_score', { ascending: false });

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).json({ error: 'No healthy phone numbers available' });
    }

    // Get leads queue — priority: score >= 70 first, then callbacks, then new
    const { data: hotLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_on_dnc', false)
      .in('status', ['new', 'contacted'])
      .gte('motivation_score', 70)
      .order('motivation_score', { ascending: false })
      .limit(100);

    const { data: normalLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('is_on_dnc', false)
      .in('status', ['new'])
      .lt('motivation_score', 70)
      .order('created_at', { ascending: true })
      .limit(500);

    const queue = [...(hotLeads || []), ...(normalLeads || [])];

    if (queue.length === 0) {
      return res.status(400).json({ error: 'No leads available to call' });
    }

    await supabase.from('campaigns').update({ status: 'active', leads_called: 0 }).eq('id', req.params.id);

    const concurrentLines = Math.min(campaign.concurrent_lines || 3, phoneNumbers.length, 5);
    const campaignState = {
      queue: [...queue],
      phoneNumbers: [...phoneNumbers],
      active: true,
      callCount: 0,
      userId: req.user.id,
      campaignId: req.params.id,
      delayMs: (campaign.call_delay_seconds || 3) * 1000
    };
    activeCampaigns.set(req.params.id, campaignState);

    // Start concurrent call workers
    for (let i = 0; i < concurrentLines; i++) {
      const phoneNumber = phoneNumbers[i % phoneNumbers.length];
      runCallWorker(campaignState, phoneNumber, i);
    }

    res.json({
      message: `Campaign started with ${concurrentLines} concurrent lines`,
      queue_size: queue.length,
      concurrent_lines: concurrentLines
    });
  } catch (error) {
    console.error('Campaign start error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST pause campaign
router.post('/:id/pause', auth, async (req, res) => {
  try {
    const state = activeCampaigns.get(req.params.id);
    if (state) state.active = false;
    await supabase.from('campaigns').update({ status: 'paused' }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Campaign paused' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST stop campaign
router.post('/:id/stop', auth, async (req, res) => {
  try {
    const state = activeCampaigns.get(req.params.id);
    if (state) {
      state.active = false;
      activeCampaigns.delete(req.params.id);
    }
    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Campaign stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function runCallWorker(state, phoneNumber, workerIndex) {
  while (state.active && state.queue.length > 0) {
    const lead = state.queue.shift();
    if (!lead) break;

    try {
      // Check TCPA calling hours
      const now = new Date();
      const hour = now.getHours();
      if (hour < 9 || hour >= 20) {
        console.log(`TCPA: Outside calling hours, pausing worker ${workerIndex}`);
        break;
      }

      // Check daily limit for phone number
      if ((phoneNumber.daily_calls_made || 0) >= (phoneNumber.daily_call_limit || 50)) {
        console.log(`Phone number ${phoneNumber.number} hit daily limit`);
        break;
      }

      // Create call record
      const { data: callRecord } = await supabase
        .from('calls')
        .insert({
          user_id: state.userId,
          lead_id: lead.id,
          phone_number_id: phoneNumber.id,
          direction: 'outbound',
          status: 'initiated',
          started_at: new Date()
        })
        .select().single();

      // Make Vapi call
      const firstName = lead.first_name || 'there';
      const address = lead.property_address || 'your property';

      const vapiResponse = await axios.post(
        `${VAPI_BASE}/call/phone`,
        {
          phoneNumberId: phoneNumber.vapi_phone_number_id || process.env.VAPI_PHONE_NUMBER_ID,
          customer: {
            number: lead.phone,
            name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Homeowner'
          },
          assistant: {
            model: {
              provider: 'anthropic',
              model: 'claude-haiku-4-5-20251001',
              messages: [{
                role: 'system',
                content: ALEX_SYSTEM_PROMPT + `\n\nSELLER: ${firstName} ${lead.last_name || ''}\nPROPERTY: ${address}, ${lead.property_city || ''} ${lead.property_state || ''}\nNOTES: ${lead.notes || 'none'}`
              }]
            },
            voice: { provider: '11labs', voiceId: 'pNInz6obpgDQGcFmaJgB' },
            recordingEnabled: true,
            transcriptPlan: { enabled: true },
            firstMessage: `Hi, is this ${firstName}? Great — my name is Alex. I'm a local real estate investor and I was reaching out about your property at ${address}. Do you have just two or three minutes?`
          },
          metadata: { leadId: lead.id, userId: state.userId, campaignId: state.campaignId }
        },
        { headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, 'Content-Type': 'application/json' } }
      );

      await supabase.from('calls').update({ vapi_call_id: vapiResponse.data.id, status: 'ringing' }).eq('id', callRecord.id);
      await supabase.from('leads').update({ status: 'calling', call_count: (lead.call_count || 0) + 1, last_call_date: new Date() }).eq('id', lead.id);
      await supabase.from('campaigns').update({ leads_called: supabase.raw('leads_called + 1') }).eq('id', state.campaignId).catch(() => {});
      await supabase.from('phone_numbers').update({ daily_calls_made: (phoneNumber.daily_calls_made || 0) + 1, last_used: new Date() }).eq('id', phoneNumber.id);
      phoneNumber.daily_calls_made = (phoneNumber.daily_calls_made || 0) + 1;

      state.callCount++;

    } catch (err) {
      console.error(`Worker ${workerIndex} call error:`, err.response?.data?.message || err.message);
    }

    // Delay between calls
    await new Promise(resolve => setTimeout(resolve, state.delayMs));
  }

  console.log(`Campaign worker ${workerIndex} finished. Total calls: ${state.callCount}`);
  if (state.queue.length === 0) {
    supabase.from('campaigns').update({ status: 'completed' }).eq('id', state.campaignId).then(() => {});
    activeCampaigns.delete(state.campaignId);
  }
}

module.exports = router;
