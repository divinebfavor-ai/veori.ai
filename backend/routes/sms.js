const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');

// GET /api/sms/:leadId — fetch SMS thread for a lead
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

// POST /api/sms/send — send SMS via Vapi native SMS
router.post('/send', auth, async (req, res) => {
  try {
    const { lead_id, message, phone_number_id } = req.body;
    if (!lead_id || !message) return res.status(400).json({ error: 'lead_id and message required' });

    // Get lead phone number
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('phone, first_name, last_name')
      .eq('id', lead_id)
      .eq('user_id', req.user.id)
      .single();
    if (leadError || !lead) return res.status(404).json({ error: 'Lead not found' });

    // Get phone number to send from
    const vapiPhoneNumberId = phone_number_id || process.env.VAPI_PHONE_NUMBER_ID;
    if (!vapiPhoneNumberId) return res.status(400).json({ error: 'No Vapi phone number configured' });

    // Send via Vapi SMS API
    let vapiSid = null;
    if (process.env.VAPI_API_KEY) {
      const vapiResponse = await axios.post('https://api.vapi.ai/message', {
        phoneNumberId: vapiPhoneNumberId,
        to: lead.phone,
        message,
      }, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` }
      });
      vapiSid = vapiResponse.data?.id;
    }

    // Log to database
    const { data: sms, error } = await supabase
      .from('sms_messages')
      .insert({
        user_id: req.user.id,
        lead_id,
        vapi_message_id: vapiSid,
        body: message,
        direction: 'outbound',
        ai_generated: false,
        status: vapiSid ? 'sent' : 'logged'
      })
      .select().single();
    if (error) throw error;

    res.json({ message: 'SMS sent', sms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
