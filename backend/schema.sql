-- VEORI AI - Complete Database Schema
-- Run this in your Supabase SQL editor

-- Users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  company_name VARCHAR,
  phone VARCHAR,
  plan VARCHAR DEFAULT 'hustle' CHECK (plan IN ('free', 'hustle', 'grind', 'empire', 'dynasty', 'enterprise')),
  calls_used INTEGER DEFAULT 0,
  calls_limit INTEGER DEFAULT 500,
  assistant_messages_used INTEGER DEFAULT 0,
  stripe_customer_id VARCHAR,
  stripe_subscription_id VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR NOT NULL,
  email VARCHAR,
  property_address VARCHAR,
  property_city VARCHAR,
  property_state VARCHAR,
  property_zip VARCHAR,
  property_type VARCHAR,
  estimated_value INTEGER,
  estimated_equity INTEGER,
  mortgage_balance INTEGER,
  years_owned INTEGER,
  motivation_score INTEGER DEFAULT 0 CHECK (motivation_score BETWEEN 0 AND 100),
  deal_probability INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'calling', 'contacted', 'interested', 'appointment_set', 'appointment_done', 'offer_sent', 'under_contract', 'closed', 'dead', 'dnc')),
  seller_personality VARCHAR CHECK (seller_personality IN ('emotional', 'analytical', 'skeptical', 'motivated', 'unknown')),
  motivation_keywords TEXT[],
  notes TEXT,
  last_call_date TIMESTAMP,
  next_followup_date TIMESTAMP,
  call_count INTEGER DEFAULT 0,
  sms_count INTEGER DEFAULT 0,
  source VARCHAR DEFAULT 'manual',
  tags TEXT[],
  is_on_dnc BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Calls table
CREATE TABLE calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  vapi_call_id VARCHAR,
  direction VARCHAR DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  status VARCHAR DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'in_progress', 'completed', 'failed', 'no_answer', 'busy', 'voicemail')),
  duration_seconds INTEGER DEFAULT 0,
  recording_url VARCHAR,
  transcript TEXT,
  ai_summary TEXT,
  call_score INTEGER CHECK (call_score BETWEEN 1 AND 10),
  motivation_detected VARCHAR,
  objections_handled TEXT[],
  outcome VARCHAR CHECK (outcome IN ('not_home', 'not_interested', 'callback_requested', 'appointment_set', 'already_sold', 'hostile', 'interested', 'dnc_requested')),
  ai_notes TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SMS conversations
CREATE TABLE sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  vapi_message_id VARCHAR,
  direction VARCHAR CHECK (direction IN ('outbound', 'inbound')),
  body TEXT NOT NULL,
  status VARCHAR DEFAULT 'sent',
  ai_generated BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP NOT NULL,
  address VARCHAR,
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'no_show', 'cancelled')),
  notes TEXT,
  ai_briefing TEXT,
  suggested_offer_low INTEGER,
  suggested_offer_high INTEGER,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Deals
CREATE TABLE deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  buyer_id UUID,
  property_address VARCHAR NOT NULL,
  purchase_price INTEGER NOT NULL,
  assignment_fee INTEGER,
  buyer_price INTEGER,
  arv INTEGER,
  repair_estimate INTEGER,
  status VARCHAR DEFAULT 'offer_sent' CHECK (status IN ('offer_sent', 'seller_signed', 'buyer_found', 'buyer_signed', 'sent_to_title', 'closing', 'closed', 'cancelled')),
  seller_contract_url VARCHAR,
  buyer_contract_url VARCHAR,
  seller_signed_at TIMESTAMP,
  buyer_signed_at TIMESTAMP,
  title_company_name VARCHAR,
  title_company_email VARCHAR,
  title_company_phone VARCHAR,
  closing_date DATE,
  closed_at TIMESTAMP,
  stripe_transfer_id VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Buyers list
CREATE TABLE buyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company_name VARCHAR,
  markets TEXT[],
  property_types TEXT[],
  min_price INTEGER,
  max_price INTEGER,
  max_repairs INTEGER,
  buys_condition VARCHAR CHECK (buys_condition IN ('turnkey', 'light_rehab', 'heavy_rehab', 'any')),
  deals_closed INTEGER DEFAULT 0,
  last_deal_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Follow-up sequences
CREATE TABLE followup_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sequence_type VARCHAR CHECK (sequence_type IN ('interested', 'callback', 'cold', 'no_answer')),
  step_number INTEGER DEFAULT 1,
  action_type VARCHAR CHECK (action_type IN ('call', 'sms', 'email', 'voicemail')),
  scheduled_at TIMESTAMP NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance / DNC records
CREATE TABLE dnc_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR NOT NULL,
  added_by UUID REFERENCES users(id),
  reason VARCHAR,
  added_at TIMESTAMP DEFAULT NOW()
);

-- Property research cache
CREATE TABLE property_research (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  address VARCHAR,
  owner_name VARCHAR,
  years_owned INTEGER,
  purchase_price INTEGER,
  purchase_date DATE,
  estimated_value INTEGER,
  equity_estimate INTEGER,
  mortgage_balance INTEGER,
  tax_status VARCHAR,
  liens TEXT,
  foreclosure_status VARCHAR,
  comparable_sales JSONB,
  neighborhood_data JSONB,
  ai_analysis TEXT,
  researched_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Phone numbers for power dialer
CREATE TABLE phone_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR NOT NULL,
  vapi_phone_number_id VARCHAR,
  area_code VARCHAR(3),
  state VARCHAR(2),
  health_score INTEGER DEFAULT 100 CHECK (health_score BETWEEN 0 AND 100),
  spam_score INTEGER DEFAULT 0 CHECK (spam_score BETWEEN 0 AND 100),
  calls_made INTEGER DEFAULT 0,
  daily_calls_made INTEGER DEFAULT 0,
  daily_call_limit INTEGER DEFAULT 50,
  answered_calls INTEGER DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,
  cooldown_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  label VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'stopped', 'completed')),
  concurrent_lines INTEGER DEFAULT 1,
  call_delay_seconds INTEGER DEFAULT 3,
  max_retries INTEGER DEFAULT 3,
  calling_hours_start INTEGER DEFAULT 9,
  calling_hours_end INTEGER DEFAULT 20,
  total_leads INTEGER DEFAULT 0,
  leads_called INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  appointments_set INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_sms_lead_id ON sms_messages(lead_id);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_followup_scheduled ON followup_sequences(scheduled_at);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users only see their own data)
CREATE POLICY "Users see own data" ON leads FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users see own calls" ON calls FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users see own sms" ON sms_messages FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users see own appointments" ON appointments FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users see own deals" ON deals FOR ALL USING (user_id = auth.uid()::uuid);
CREATE POLICY "Users see own buyers" ON buyers FOR ALL USING (user_id = auth.uid()::uuid);
