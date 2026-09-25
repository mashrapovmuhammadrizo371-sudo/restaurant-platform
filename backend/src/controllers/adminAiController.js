const SITE_CONTEXT = `
Restaurant ordering platform — internal admin assistant.
Customer website has multiple restaurant brands, menus, cart, checkout, delivery/table orders, customer settings and order tracking.
Admin modules: dashboard, brands, menu, banners, tables, orders, customers, promo codes, employees/permissions, settings.
Staff roles include boss/admin, operator, cashier, courier and waiter (ofitsiant).
Typical delivery flow: customer submits order -> cashier/operator reviews and assigns courier -> courier delivers and marks delivered.
Typical table flow: customer/staff creates table order -> cashier/operator routes it to waiter -> waiter updates table order status.
Payment methods include cash and card transfer with customer receipt upload; online Click integration is not currently enabled.
Assistant must respond in Uzbek by default, be practical and concise. It may explain platform features, brainstorm improvements, and analyze error descriptions/logs supplied by admin.
It does NOT have direct access to live database, current orders, code repository, or production logs unless those are explicitly included in the user's message. Never claim to have inspected live data or confirmed a bug without evidence. For possible issues, give verification steps and label suggestions as hypotheses.
Never request passwords, API keys, card secrets, or customer-sensitive data. Do not suggest changing production data without admin confirmation.
`;

async function chatWithAdminAi(req, res, next) {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ success: false, message: 'Savol yozing.' });
    if (message.length > 4000) return res.status(400).json({ success: false, message: 'Savol 4000 belgidan oshmasin.' });
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ success: false, message: 'AI hali ulanmagan. Render backend sozlamalariga OPENROUTER_API_KEY qo‘shing.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://restaurant-platform-2-37lo.onrender.com',
        'X-OpenRouter-Title': 'Restaurant Platform Admin'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'openrouter/free',
        temperature: 0.4,
        messages: [
          { role: 'system', content: SITE_CONTEXT },
          { role: 'user', content: message }
        ]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('[admin-ai] OpenRouter error:', response.status, data?.error?.message || 'unknown');
      return res.status(502).json({ success: false, message: 'AI xizmatida xatolik. OpenRouter API sozlamalarini tekshiring.' });
    }
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ success: false, message: 'AI javob qaytarmadi. Qayta urinib ko‘ring.' });
    return res.json({ success: true, answer });
  } catch (err) {
    next(err);
  }
}

module.exports = { chatWithAdminAi };
