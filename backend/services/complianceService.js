const supabase = require('../models/supabase');

// Check if a number can be called legally
async function runComplianceCheck(phone, state, userId) {
  try {
    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');

    // Check internal DNC list
    const { data: dncRecord } = await supabase
      .from('dnc_records')
      .select('id')
      .eq('phone', cleanPhone)
      .single();

    if (dncRecord) {
      return {
        canCall: false,
        reason: 'Number on internal DNC list',
        dnc: true
      };
    }

    // Check calling hours by state (Eastern time as default)
    const now = new Date();
    const hour = now.getHours();

    // TCPA rules: calls only allowed 8am-9pm local time
    if (hour < 8 || hour >= 21) {
      return {
        canCall: false,
        reason: 'Outside legal calling hours (8am-9pm)',
        dnc: false,
        timeRestriction: true
      };
    }

    return {
      canCall: true,
      reason: 'Passed compliance check',
      dnc: false
    };
  } catch (error) {
    console.error('Compliance check error:', error.message);
    // Default to allowing call if check fails
    return { canCall: true, reason: 'Compliance check unavailable' };
  }
}

// Add number to DNC
async function addToDNC(phone, userId, reason) {
  const cleanPhone = phone.replace(/\D/g, '');
  const { error } = await supabase
    .from('dnc_records')
    .insert({ phone: cleanPhone, added_by: userId, reason });

  return !error;
}

// Check phone number health
async function checkPhoneHealth(phone, userId) {
  try {
    // Count calls made from this number today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('calls')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', today.toISOString());

    const dailyLimit = 100; // Safe limit per number
    const callsToday = count || 0;
    const spamRisk = callsToday > 80 ? 'HIGH' : callsToday > 50 ? 'MEDIUM' : 'LOW';

    return {
      callsToday,
      dailyLimit,
      spamRisk,
      shouldRotate: callsToday >= dailyLimit,
      healthScore: Math.max(0, 100 - (callsToday / dailyLimit * 100))
    };
  } catch (error) {
    return { error: error.message };
  }
}

module.exports = {
  runComplianceCheck,
  addToDNC,
  checkPhoneHealth
};
