const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001';

// Analyze a call transcript and score motivation — runs after every call
async function analyzeCallTranscript(transcript, leadData) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert wholesale real estate call analyst. Analyze this seller call transcript.

Transcript: ${transcript}
Seller: ${JSON.stringify(leadData)}

Provide a JSON object with these exact keys:
- motivation_score: integer 0-100 — how motivated is this seller to sell?
- seller_personality: one of "analytical" | "emotional" | "skeptical" | "motivated" | "neutral"
- key_signals: string array — motivation signals detected (e.g. "financial_pressure", "inherited_property", "tired_landlord", "divorce", "behind_on_taxes", "property_damage", "vacant", "motivated_to_sell")
- objections: string array — objections raised (e.g. "price_too_low", "needs_repairs_done", "has_agent", "not_ready")
- recommended_action: string — e.g. "follow_up_48h", "send_contract", "schedule_callback", "mark_dead"
- ai_summary: string — 2-3 sentence plain English summary of the call
- outcome: one of "not_home" | "not_interested" | "callback_requested" | "appointment_set" | "offer_made" | "interested" | "verbal_yes"

Respond with raw JSON only. No markdown, no explanation.`
      }]
    });

    const text = message.content[0].text;
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { motivation_score: 0, ai_summary: text, outcome: 'not_home' };
    }
  } catch (error) {
    console.error('Transcript analysis error:', error.message);
    return { motivation_score: 0, error: 'Analysis unavailable', outcome: 'not_home' };
  }
}

// Analyze property and calculate offer — triggers when motivation score > 50
async function analyzePropertyOffer(propertyDetails, repairEstimate) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an expert wholesale real estate analyst. Calculate the investment numbers for this property.

Property Details: ${JSON.stringify(propertyDetails)}
Repair Estimate: ${repairEstimate || 'unknown — estimate from description'}

Using the 70% rule:
- ARV = after repair value based on location, size, type
- MAO = ARV × 0.70 − repairs
- Negotiation offer = MAO − 10% (leaves room to come up)

Provide JSON with these exact keys:
- estimated_arv: integer dollar amount
- repair_estimate: integer dollar amount
- mao: integer dollar amount (ARV × 0.70 − repairs)
- offer_price: integer dollar amount (negotiation offer = MAO − 10%)
- confidence_score: integer 0-100
- comp_details: array of 3 objects each with { address, sale_price, sqft, sold_date, distance }
- analysis_notes: string explanation of the calculation

Respond with raw JSON only.`
      }]
    });

    const text = message.content[0].text;
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { error: 'Analysis unavailable', analysis_notes: text };
    }
  } catch (error) {
    console.error('Property offer analysis error:', error.message);
    return { error: 'Analysis unavailable' };
  }
}

// Operator AI Assistant — answers questions about the operator's business
async function operatorAssistantChat(messages, operatorContext) {
  try {
    const systemPrompt = `You are an expert wholesale real estate advisor with 15 years of experience. You are the personal AI assistant for ${operatorContext.full_name || 'this operator'} at ${operatorContext.company_name || 'their company'}.

You have full access to their business data:
- Total leads: ${operatorContext.total_leads || 0}
- Hot leads (score 70+): ${operatorContext.hot_leads || 0}
- Calls made today: ${operatorContext.calls_today || 0}
- Active deals: ${operatorContext.active_deals || 0}
- Revenue this month: $${operatorContext.revenue_month || 0}
- Recent hot leads: ${JSON.stringify(operatorContext.recent_hot_leads || [])}
- Recent calls: ${JSON.stringify(operatorContext.recent_calls || [])}

Your style: Direct. Practical. No fluff. Give specific, actionable answers. You know numbers and deal psychology deeply. Reference the operator's actual data when answering questions about their business.

You can help with: analyzing leads, calculating offers, drafting messages, explaining strategies, reviewing call transcripts, and any wholesale real estate question.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Operator assistant error:', error.message);
    return 'I encountered an issue. Please try again.';
  }
}

// Aria public chatbot — free real estate advisor
async function ariaChat(messages) {
  try {
    const systemPrompt = `You are Aria, a free AI real estate advisor available on the Veori AI platform. You are warm, knowledgeable, and encouraging. You celebrate when someone finds a good deal. You make investing feel accessible, not intimidating. You speak in plain language.

You can help with:
- Real estate investing basics and education
- How wholesale real estate works
- How to calculate ARV and MAO
- General deal evaluation
- Market concepts (not specific properties)
- How to talk to motivated sellers
- What to look for in distressed properties
- Basic negotiation advice
- How to find cash buyers
- How to structure a wholesale deal

You will NOT do these things for free (they require Veori AI platform access):
- Running actual comps on specific real properties
- Analyzing specific deals with real numbers from real addresses
- Generating actual offer amounts for specific addresses
- Accessing live market data for specific cities
- Drafting actual contracts or agreements
- Calling sellers or managing leads

When someone asks for something that requires the platform, say: "That's a great question! To get specific numbers on real properties and run live comps, you'd need access to Veori AI. It takes about 2 minutes to sign up and your first week is free. Want me to walk you through it?"

Keep responses conversational and helpful. When someone finds a good deal or learns something, be genuinely excited for them.`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      system: systemPrompt,
      messages: messages
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Aria chat error:', error.message);
    return "I'm having a brief technical moment. Let me try again — what's your question?";
  }
}

// Generate follow-up email
async function generateFollowUpEmail(leadData, callHistory, tone = 'professional') {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Draft a follow-up email for this seller.

Seller: ${JSON.stringify(leadData)}
Call History: ${JSON.stringify(callHistory)}
Tone: ${tone}

Write a personalized, genuine email. Reference specific details from the conversation. Keep it brief — 3-4 short paragraphs max. Do not sound like a template.

Return JSON with: { subject: string, body: string }`
      }]
    });

    const text = message.content[0].text;
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { subject: 'Following up', body: text };
    }
  } catch (error) {
    return { subject: 'Following up', body: 'Unable to generate email.' };
  }
}

// Generate daily morning briefing
async function generateDailyReport(stats, hotLeads) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `Generate a morning intelligence briefing for a wholesale real estate operator.

Yesterday's Stats: ${JSON.stringify(stats)}
Hot Leads (score 70+): ${JSON.stringify(hotLeads)}

Write a concise, action-oriented briefing. Cover:
1. One-line performance summary
2. Top 3 priority leads to call today (by name and why)
3. Any deals at risk of going cold
4. 3 recommended actions for today

Keep it punchy. Max 250 words. Use plain paragraph text — no markdown headers.`
      }]
    });

    return message.content[0].text;
  } catch (error) {
    return 'Daily report unavailable. Check your dashboard for updates.';
  }
}

// Analyze property for AI property research
async function analyzeProperty(propertyData, comparables) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Analyze this wholesale real estate investment opportunity.

Property: ${JSON.stringify(propertyData)}
Comparables: ${JSON.stringify(comparables)}

Provide JSON with:
- estimated_arv: integer
- repair_estimate: integer
- mao: integer (ARV × 0.70 − repairs)
- recommendation: "buy" | "pass" | "negotiate"
- risk_factors: string array
- motivation_assessment: string
- investment_notes: string

Raw JSON only.`
      }]
    });

    const text = message.content[0].text;
    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      return { analysis: text };
    }
  } catch (error) {
    return { error: 'AI analysis unavailable' };
  }
}

// Generate seller contract text
async function generateSellerContract(dealData, sellerData) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate a wholesale real estate Purchase and Sale Agreement.

Deal: ${JSON.stringify(dealData)}
Seller: ${JSON.stringify(sellerData)}
State: ${dealData.property_state || 'Texas'}
Closing Date: ${dealData.closing_date || '14 days from today'}

Include: seller name and address, property address, purchase price, closing date, earnest money ($500), as-is clause, assignment clause, inspection period (7 days), standard representations.

Return the complete contract as formatted text.`
      }]
    });

    return message.content[0].text;
  } catch (error) {
    return null;
  }
}

// Generate buyer assignment agreement
async function generateBuyerContract(dealData, buyerData) {
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate a wholesale real estate Assignment Agreement.

Deal: ${JSON.stringify({ ...dealData, purchase_price: '[CONFIDENTIAL]' })}
Buyer: ${JSON.stringify(buyerData)}
Buyer Purchase Price: $${dealData.buyer_price}
Assignment Fee: $${dealData.assignment_fee}

Do NOT include the original seller purchase price. Show buyer price and assignment fee only.
Include: assignment clause, non-circumvention, earnest money from buyer ($1,000), closing date, as-is, signatures.

Return as formatted text.`
      }]
    });

    return message.content[0].text;
  } catch (error) {
    return null;
  }
}

module.exports = {
  analyzeCallTranscript,
  analyzePropertyOffer,
  operatorAssistantChat,
  ariaChat,
  generateFollowUpEmail,
  generateDailyReport,
  analyzeProperty,
  generateSellerContract,
  generateBuyerContract
};
