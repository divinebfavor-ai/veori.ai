const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createVapiAssistant } = require('../services/vapiService');

router.post('/setup-assistant', auth, async (req, res) => {
  try {
    const assistant = await createVapiAssistant();
    res.json({ assistant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
