const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/plans', (req, res) => {
  res.json({
    plans: [
      { id: 'hustle', name: 'Hustle', price: 297, calls: 500 },
      { id: 'grind', name: 'Grind', price: 697, calls: 2000 },
      { id: 'empire', name: 'Empire', price: 1497, calls: 5000 },
      { id: 'dynasty', name: 'Dynasty', price: 4997, calls: 15000 }
    ]
  });
});

router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  res.json({ received: true });
});

module.exports = router;
