const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const supabase = require('../models/supabase');
const { analyzeProperty } = require('../services/aiService');
const { runComplianceCheck } = require('../services/complianceService');
const { v4: uuidv4 } = require('uuid');

// Get all leads with filters
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, sort = 'created_at', order = 'desc', limit = 50, offset = 0 } = req.query;

    let query = supabase
      .from('leads')
      .select(`
        *,
        calls(count),
        appointments(id, scheduled_at, status),
        deals(id, status, assignment_fee)
      `)
      .eq('user_id', req.user.id)
      .order(sort, { ascending: order === 'asc' })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,property_address.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ leads: data, total: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single lead with full profile
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select(`
        *,
        calls(*),
        sms_messages(*),
        appointments(*),
        deals(*),
        property_research(*)
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create lead
router.post('/', auth, async (req, res) => {
  try {
    const {
      first_name, last_name, phone, email,
      property_address, property_city, property_state, property_zip,
      property_type, notes, tags, source
    } = req.body;

    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    // Run compliance check
    const compliance = await runComplianceCheck(phone, property_state, req.user.id);

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        user_id: req.user.id,
        first_name, last_name, phone, email,
        property_address, property_city, property_state, property_zip,
        property_type, notes, tags,
        source: source || 'manual',
        is_on_dnc: !compliance.canCall
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ lead, compliance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk import leads from CSV
router.post('/bulk', auth, async (req, res) => {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ error: 'Invalid leads data' });
    }

    const leadsToInsert = leads.map(lead => ({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      phone: lead.phone || '',
      property_address: lead.property_address || '',
      property_city: lead.property_city || '',
      property_state: lead.property_state || '',
      property_zip: lead.property_zip || '',
      user_id: req.user.id,
      source: 'csv_import',
      status: 'new'
    }));

    const { data, error } = await supabase
      .from('leads')
      .insert(leadsToInsert)
      .select();

    if (error) {
      console.error('Supabase error:', JSON.stringify(error));
      return res.status(500).json({ error: error.message, details: error });
    }

    res.status(201).json({
      message: `${data.length} leads imported successfully`,
      leads: data
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: error.message });
  }
});
// Update lead
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ ...req.body, updated_at: new Date() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete lead
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Lead deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get lead property research
router.get('/:id/research', auth, async (req, res) => {
  try {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    // Check for cached research
    const { data: existing } = await supabase
      .from('property_research')
      .select('*')
      .eq('lead_id', req.params.id)
      .single();

    if (existing) {
      return res.json({ research: existing });
    }

    // Generate AI analysis
    const propertyData = {
      address: lead.property_address,
      city: lead.property_city,
      state: lead.property_state,
      zip: lead.property_zip,
      type: lead.property_type,
      estimated_value: lead.estimated_value
    };

    const analysis = await analyzeProperty(propertyData, {});

    // Save research
    const { data: research, error } = await supabase
      .from('property_research')
      .insert({
        lead_id: req.params.id,
        address: lead.property_address,
        ai_analysis: JSON.stringify(analysis),
        researched_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ research, analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
