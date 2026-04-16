const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');
const { analyzeCallTranscript, analyzePropertyOffer } = require('../services/aiService');
const axios = require('axios');

const VAPI_BASE = 'https://api.vapi.ai';

const ALEX_SYSTEM_PROMPT = `You are Alex, a professional real estate investor with 10 years of wholesale experience. You are warm, direct, and genuinely helpful. You adapt your tone to match the seller. You listen more than you talk. You never sound scripted. You speak at a measured pace — never rushed. You are confident but never pushy. You understand that sellers are often in difficult situations and treat them with respect. Your goal is to find a solution that works for everyone.

CALL FLOW:

INTRODUCTION (first 30 seconds):
"Hi, is this [FirstName]? Great. My name is Alex — I'm a local real estate investor. I was reaching out because I came across your property at [Address] and I wanted to see if you might be open to a quick conversation. Do you have just two or three minutes?"
If yes: continue. If no: "Totally understand. When would be a better time to reach you?"

DISCOVERY — gather situation information:
"How long have you owned the property?"
"Is it currently occupied or vacant?"
"Have you given any thought to what you want to do with it going forward?"
Listen carefully. Let the seller talk. Do not interrupt.

OFFER PRESENTATION (when appropriate):
"I really appreciate you sharing all of that with me [FirstName]. Based on what you've described and looking at what similar homes have recently sold for in your area, I'm in a position to make you a cash offer today. I can offer you [offer_amount] cash. We would close in as little as 14 days — no repairs needed, no agent fees, no showings, no waiting. You pick the closing date. Does that number work for your situation?"

NEGOTIATION:
- If too low: "I completely understand. Help me understand — what would make this work for you today? [Listen] Let me see what I can do. The most I could stretch to is [MAO]. That's my ceiling but it gets you closed fast with zero costs on your end. Can we make that work?"
- If maybe: "Of course, take your time. I do want to be upfront — I have a few other properties I'm working through this week and my buying capacity does get used up. Could I follow up with you [specific day] at [specific time]?"
- If not interested: "I completely respect that. If anything changes or you decide you want to revisit this, please don't hesitate to reach out. Would it be alright if I checked back in a few months?"
- If has agent: "No problem at all — we work alongside agents all the time. Your agent would still earn their full commission. We just move faster than traditional buyers."
- If needs repairs done first: "That's actually the reason sellers like you come to buyers like us — we buy as-is so you don't have to spend a single dollar fixing anything. The offer already accounts for the condition."

CALL OUTCOMES:
- Not home: note for retry in 4 hours
- Not interested: note for 30-day follow-up
- Callback requested: confirm specific time
- Appointment set: confirm details
- Verbal yes: ask for confirmation and note next steps`;

async function makeVapiCall(lead, phoneNumberId) {
  const firstName = lead.first_name || 'there';
  const address = lead.property_address || 'your property';

  const response = await axios.post(
    `${VAPI_BASE}/call/phone`,
    {
      phoneNumberId: phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID,
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
            content: ALEX_SYSTEM_PROMPT + `\n\nSELLER INFO:\nName: ${lead.first_name} ${lead.last_name || ''}\nProperty: ${address}, ${lead.property_city || ''} ${lead.property_state || ''}\nEstimated Value: ${lead.estimated_value ? '$' + lead.estimated_value.toLocaleString() : 'unknown'}\nPrevious Notes: ${lead.notes || 'none'}`
          }]
        },
        voice: {
          provider: '11labs',
          voiceId: 'pNInz6obpgDQGcFmaJgB'
        },
        recordingEnabled: true,
        transcriptPlan: { enabled: true },
        firstMessage: `Hi, is this ${firstName}? Great — my name is Alex. I'm a local real estate investor and I was reaching out because I came across your property at ${address}. Do you have just two or three minutes?`
      },
      metadata: { leadId: lead.id, userId: lead.user_id }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
}

// GET all calls with filters
router.get('/', auth, async (req, res) => {
  try {
    const { lead_id, status, limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('calls')
      .select('*, leads(first_name, last_name, phone, property_address, property_city, property_state)')
      .eq('user_id', req.user.id)
      .order('started_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ calls: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET live active calls
router.get('/live', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*, leads(first_name, last_name, phone, property_address, property_city, property_state, estimated_value)')
      .eq('user_id', req.user.id)
      .in('status', ['ringing', 'in_progress'])
      .order('started_at', { ascending: false });

    if (error) throw error;
    res.json({ calls: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single call
router.get('/:id', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*, leads(first_name, last_name, phone, property_address, property_city, property_state)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Call not found' });
    res.json({ call: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST initiate single call
router.post('/initiate', auth, async (req, res) => {
  try {
    const { lead_id, phone_number_id } = req.body;
    if (!lead_id) return res.status(400).json({ error: 'lead_id required' });

    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .eq('user_id', req.user.id)
      .single();

    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (lead.is_on_dnc) return res.status(400).json({ error: 'Number is on DNC list' });

    const { data: callRecord } = await supabase
      .from('calls')
      .insert({
        user_id: req.user.id,
        lead_id: lead.id,
        phone_number_id: phone_number_id || null,
        direction: 'outbound',
        status: 'initiated',
        started_at: new Date()
      })
      .select().single();

    const vapiCall = await makeVapiCall(lead, phone_number_id);

    await supabase.from('calls').update({ vapi_call_id: vapiCall.id, status: 'ringing' }).eq('id', callRecord.id);
    await supabase.from('leads').update({
      status: 'calling',
      call_count: (lead.call_count || 0) + 1,
      last_call_date: new Date()
    }).eq('id', lead.id);
    await supabase.from('users').update({ calls_used: (req.user.calls_used || 0) + 1 }).eq('id', req.user.id);

    res.json({ message: 'Call initiated', call: callRecord, vapi_call_id: vapiCall.id });
  } catch (error) {
    console.error('Call initiate error:', error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.message || error.message });
  }
});

// POST operator takes over a live call
router.post('/takeover', auth, async (req, res) => {
  try {
    const { call_id, vapi_call_id } = req.body;

    await supabase.from('calls').update({ operator_took_over: true }).eq('id', call_id).eq('user_id', req.user.id);

    // Mute the AI assistant via Vapi
    await axios.post(
      `${VAPI_BASE}/call/${vapi_call_id}/control`,
      { type: 'mute-assistant' },
      { headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` } }
    ).catch(() => {});

    res.json({ message: 'Takeover initiated', call_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST return call to AI
router.post('/return-to-ai', auth, async (req, res) => {
  try {
    const { call_id, vapi_call_id } = req.body;

    await axios.post(
      `${VAPI_BASE}/call/${vapi_call_id}/control`,
      { type: 'unmute-assistant' },
      { headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` } }
    ).catch(() => {});

    res.json({ message: 'Returned to AI', call_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST Vapi webhook — handles all call events
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    const vapiCallId = event.call?.id;
    if (!vapiCallId) return res.status(200).json({ received: true });

    const { data: callRecord } = await supabase
      .from('calls')
      .select('*, leads(*)')
      .eq('vapi_call_id', vapiCallId)
      .single();

    if (!callRecord) return res.status(200).json({ received: true });

    if (event.type === 'call-started') {
      await supabase.from('calls').update({ status: 'in_progress' }).eq('vapi_call_id', vapiCallId);
    }

    if (event.type === 'transcript') {
      // Stream transcript update — store partial and broadcast via realtime
      const partial = event.transcript || '';
      await supabase.from('calls').update({ transcript: partial }).eq('vapi_call_id', vapiCallId);

      // Run quick motivation score every ~10 seconds worth of transcript
      if (partial.length > 200 && partial.length % 500 < 50) {
        const analysis = await analyzeCallTranscript(partial, callRecord.leads || {});
        if (analysis.motivation_score) {
          await supabase.from('calls').update({ motivation_score: analysis.motivation_score }).eq('vapi_call_id', vapiCallId);
          await supabase.from('leads').update({ motivation_score: analysis.motivation_score }).eq('id', callRecord.lead_id);
        }
      }
    }

    if (event.type === 'call-ended') {
      const transcript = event.call?.artifact?.transcript || event.artifact?.transcript || '';
      const recordingUrl = event.call?.artifact?.recordingUrl || event.artifact?.recordingUrl || null;
      const duration = event.call?.duration || 0;

      await supabase.from('calls').update({
        status: 'completed',
        duration_seconds: Math.round(duration),
        transcript,
        recording_url: recordingUrl,
        ended_at: new Date()
      }).eq('vapi_call_id', vapiCallId);

      // Run full AI analysis
      if (transcript && callRecord.leads) {
        const analysis = await analyzeCallTranscript(transcript, callRecord.leads);

        await supabase.from('calls').update({
          motivation_score: analysis.motivation_score,
          seller_personality: analysis.seller_personality,
          key_signals: analysis.key_signals || [],
          objections: analysis.objections || [],
          outcome: analysis.outcome,
          ai_summary: analysis.ai_summary
        }).eq('vapi_call_id', vapiCallId);

        // Update lead with score and status
        const leadStatus = analysis.outcome === 'verbal_yes' ? 'under_contract'
          : analysis.outcome === 'appointment_set' ? 'appointment_set'
          : analysis.outcome === 'offer_made' ? 'offer_made'
          : analysis.outcome === 'interested' ? 'interested'
          : analysis.outcome === 'not_interested' ? 'contacted'
          : 'contacted';

        await supabase.from('leads').update({
          status: leadStatus,
          motivation_score: analysis.motivation_score,
          seller_personality: analysis.seller_personality,
          last_call_date: new Date()
        }).eq('id', callRecord.lead_id);

        // If motivation score > 50, run offer analysis
        if (analysis.motivation_score > 50 && callRecord.leads.property_address) {
          const offerAnalysis = await analyzePropertyOffer(callRecord.leads, null);
          if (offerAnalysis.offer_price) {
            await supabase.from('calls').update({
              offer_made: offerAnalysis.offer_price
            }).eq('vapi_call_id', vapiCallId);
          }
        }
      }

      // Update phone number health score
      if (callRecord.phone_number_id) {
        const { data: pn } = await supabase.from('phone_numbers').select('*').eq('id', callRecord.phone_number_id).single();
        if (pn) {
          let healthDelta = 0;
          if (duration < 15) healthDelta = -10;
          else if (duration > 60) healthDelta = 3;
          const newHealth = Math.max(0, Math.min(100, (pn.spam_score || 100) + healthDelta));
          await supabase.from('phone_numbers').update({
            spam_score: newHealth,
            daily_calls_made: (pn.daily_calls_made || 0) + 1,
            weekly_calls_made: (pn.weekly_calls_made || 0) + 1,
            last_used: new Date()
          }).eq('id', callRecord.phone_number_id);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(200).json({ received: true });
  }
});

module.exports = router;
