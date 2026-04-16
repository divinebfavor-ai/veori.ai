const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runComplianceCheck, addToDNC, checkPhoneHealth } = require('../services/complianceService');

router.post('/check', auth, async (req, res) => {
  try {
    const { phone, state } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const result = await runComplianceCheck(phone, state, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/dnc', auth, async (req, res) => {
  try {
    const { phone, reason } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const success = await addToDNC(phone, req.user.id, reason);
    res.json({ success, message: 'Number added to DNC list' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/phone-health', auth, async (req, res) => {
  try {
    const health = await checkPhoneHealth(null, req.user.id);
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
