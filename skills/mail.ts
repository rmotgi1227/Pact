// Outbound email for skills, through Resend's HTTPS API (api.resend.com is in the sandbox's egress policy).
// Without a verified domain Resend sends from onboarding@resend.dev, and only to the Resend account's own address.
export async function sendMail(m: { to: string; subject: string; text: string; html?: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  const res = await fetch('https://api.resend.com/emails', { method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: process.env.PACT_MAIL_FROM ?? 'Pact <onboarding@resend.dev>', to: [m.to],
      subject: m.subject, text: m.text, ...(m.html ? { html: m.html } : {}) }) });
  if (!res.ok) throw new Error(`resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return ((await res.json()) as { id: string }).id;
}
