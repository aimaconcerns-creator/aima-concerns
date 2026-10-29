const FROM = 'Aima Concerns <noreply@aimaconcerns.com>'

const esc = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const money = (n: any) => 'PKR ' + Number(n || 0).toLocaleString('en-US')

const pkt = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' })

type Kind = 'accepted' | 'rejected' | 'approved' | 'issued'

const wrap = (title: string, body: string) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#12335f">` +
  `<div style="background:#0d3b47;color:#fff;padding:18px 22px;border-radius:10px 10px 0 0">` +
  `<b style="font-size:18px;letter-spacing:1px">AIMA CONCERNS</b><br>` +
  `<span style="font-size:11px;letter-spacing:3px;color:#f3d9a4">TRAVEL &amp; TOURS · EST. 1999</span></div>` +
  `<div style="border:1px solid #e3e9f1;border-top:none;padding:22px;border-radius:0 0 10px 10px;line-height:1.65;font-size:15px">` +
  `<h2 style="margin:0 0 12px;font-size:18px">${esc(title)}</h2>${body}` +
  `<hr style="border:none;border-top:1px solid #e3e9f1;margin:20px 0">` +
  `<p style="font-size:12px;color:#6b7c93;margin:0">Aima Concerns Travel &amp; Tours · Office 102 &amp; 103, Eden Heights, Jail Road, Lahore<br>` +
  `+92 322 4631622 · +92 332 7869765 · aimaconcerns@gmail.com</p></div></div>`

export async function sendVisaMail(kind: Kind, info: any): Promise<string> {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    return 'The email was not sent because the email key is not set up yet. The change is saved.'
  }
  if (!info || !info.email) {
    return 'The email was not sent because this customer has no email address on their profile. The change is saved.'
  }

  const name = esc(info.name || 'Customer')
  const code = esc(info.tracking_code || '')
  const visa = esc(info.visa_name || 'visa')

  let subject = ''
  let title = ''
  let body = ''

  if (kind === 'accepted') {
    const deadline = info.fee_set_at
      ? pkt(new Date(new Date(info.fee_set_at).getTime() + 3 * 86400000).toISOString())
      : ''
    subject = `Visa application ${info.tracking_code} accepted: please pay by ${deadline}`
    title = 'Your visa application is accepted'
    body =
      `<p>Dear ${name},</p>` +
      `<p>Your <b>${visa}</b> application <b>${code}</b> has been accepted.</p>` +
      `<p>Visa fee: <b>${esc(money(info.fee))}</b><br>Please pay by: <b>${esc(deadline)} (Pakistan time)</b></p>` +
      `<p>To pay, log in at aimaconcerns.com and open <b>Visa Status</b> on your dashboard. The fee is paid from your ` +
      `Aima Concerns wallet, so top up first if your balance is low. If it is not paid by the deadline, the application ` +
      `expires and you will need to apply again.</p>`
  } else if (kind === 'rejected') {
    subject = `Visa application ${info.tracking_code}: not accepted`
    title = 'Your visa application was not accepted'
    body =
      `<p>Dear ${name},</p>` +
      `<p>We are sorry to tell you that your <b>${visa}</b> application <b>${code}</b> could not be accepted.</p>` +
      `<p><b>Reason:</b><br>${esc(info.reason || 'Please contact our office.')}</p>` +
      (info.paid
        ? `<p>As the fee was already paid, our team will contact you about it.</p>`
        : `<p>You have not been charged.</p>`) +
      `<p>If you have any questions, please call us and quote your code <b>${code}</b>.</p>`
  } else if (kind === 'approved') {
    subject = `Visa application ${info.tracking_code} approved`
    title = 'Your visa application is approved'
    body =
      `<p>Dear ${name},</p>` +
      `<p>Good news: your <b>${visa}</b> application <b>${code}</b> has been approved.</p>` +
      `<p>Our team is now preparing your visa. We will email you again as soon as it is ready to download from your ` +
      `account. Please keep your code <b>${code}</b> and quote it whenever you contact us.</p>`
  } else {
    subject = `Your visa is ready: application ${info.tracking_code}`
    title = 'Your visa is ready'
    body =
      `<p>Dear ${name},</p>` +
      `<p>Your <b>${visa}</b> visa for application <b>${code}</b> has been issued and is ready.</p>` +
      `<p>To download it, log in at aimaconcerns.com, open <b>Visa Status</b> on your dashboard, and use the ` +
      `<b>Download visa</b> button next to each traveller's name.</p>` +
      `<p>Please check every detail on the visa carefully, and call us at once if anything looks wrong.</p>`
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [info.email],
        reply_to: 'aimaconcerns@gmail.com',
        subject,
        html: wrap(title, body),
      }),
      signal: ctrl.signal,
    })
    if (!res.ok) return `The email could not be sent (error ${res.status}). The change is saved.`
    return 'The customer has been emailed.'
  } catch {
    return 'The email could not be sent. The change is saved.'
  } finally {
    clearTimeout(timer)
  }
}
