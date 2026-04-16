const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'realtime_coming_soon' });
});

module.exports = router;
