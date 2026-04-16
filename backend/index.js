if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const callRoutes = require('./routes/calls');
const crmRoutes = require('./routes/crm');
const smsRoutes = require('./routes/sms');
const appointmentRoutes = require('./routes/appointments');
const dealRoutes = require('./routes/deals');
const buyerRoutes = require('./routes/buyers');
const complianceRoutes = require('./routes/compliance');
const analyticsRoutes = require('./routes/analytics');
const vapiRoutes = require('./routes/vapi');
const stripeRoutes = require('./routes/stripe');
const realtimeRoutes = require('./routes/realtime');
const campaignRoutes = require('./routes/campaigns');
const phoneNumberRoutes = require('./routes/phoneNumbers');
const assistantRoutes = require('./routes/assistant');

const app = express();

app.use(helmet());
app.use(morgan('combined'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// CORS — allow Vercel frontend + local dev
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    /\.vercel\.app$/,
    /veori\.ai$/
  ],
  credentials: true
}));

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/vapi', vapiRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/phone-numbers', phoneNumberRoutes);
app.use('/api/assistant', assistantRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'Veori AI is running', timestamp: new Date(), env: process.env.NODE_ENV });
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong', message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Veori AI Server running on port ${PORT}`);
});

module.exports = app;
