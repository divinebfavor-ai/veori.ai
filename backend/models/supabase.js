const { createClient } = require('@supabase/supabase-js');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
