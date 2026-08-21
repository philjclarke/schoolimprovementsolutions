// Form handler for all site forms (contact panel, write-to-your-mp, spread-the-word).
// Sends a notification email via Resend and forwards the submission to a
// Zapier catch-hook, both configured through environment variables — see FORMS.md.

// Only the two campaign forms use Zapier; the contact form is email-only.
// Both campaign pages are only reachable from the retired campaign homepage,
// so these hooks stay unconfigured unless that campaign ever launches.
const ZAPIER_HOOKS = {
  'mp-send-form': process.env.ZAPIER_HOOK_MP_SEND,
  'spread-word-form': process.env.ZAPIER_HOOK_SPREAD_WORD,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { form, page, data } = req.body || {};
  if (!form || !data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'Bad payload' });
  }
  // Honeypot: site-forms.js never fills this field; bots often do.
  if (data['website']) {
    return res.status(200).json({ ok: true });
  }

  const results = [];
  const deliver = async (label, url, options) => {
    try {
      const r = await fetch(url, options);
      results.push([label, r.ok]);
      if (!r.ok) console.error(`${label} error`, r.status, await r.text());
    } catch (err) {
      results.push([label, false]);
      console.error(`${label} error`, err);
    }
  };

  // 1. Email notification via Resend
  const { RESEND_API_KEY, FORM_FROM, FORM_TO } = process.env;
  if (RESEND_API_KEY && FORM_FROM && FORM_TO) {
    const lines = Object.entries(data)
      .map(([k, v]) => `${k.replace(/-/g, ' ')}: ${v}`)
      .join('\n');
    await deliver('email', 'https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FORM_FROM,
        to: FORM_TO.split(',').map((s) => s.trim()),
        reply_to: data['Email-Address'] || data['User-Email-Address'] || undefined,
        subject: `Website form: ${form}`,
        text: `Form: ${form}\nPage: ${page || 'unknown'}\n\n${lines}`,
      }),
    });
  }

  // 2. Forward to the form's Zapier catch-hook
  const hook = ZAPIER_HOOKS[form];
  if (hook) {
    await deliver('zapier', hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, page, ...data }),
    });
  }

  if (results.length === 0) {
    console.error(`No delivery configured for form "${form}" — set env vars (see FORMS.md)`);
    return res.status(500).json({ ok: false, error: 'Form handling not configured' });
  }
  const ok = results.some(([, success]) => success);
  return res.status(ok ? 200 : 502).json({ ok });
}
