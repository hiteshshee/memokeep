import nodemailer from 'nodemailer';
import env from './env.js';

// Build a Gmail transporter when credentials are present. When they aren't
// (e.g. local dev before setup), we fall back to logging the OTP to the console
// so the flow is still testable.
let transporter = null;
if (env.email.enabled) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.email.user, pass: env.email.pass },
  });
}

function otpEmailHtml(name, otp) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f4f7fe;border-radius:16px;color:#10193b">
    <p style="font-weight:700;letter-spacing:.2em;color:#2f6bff;margin:0 0 24px">MEMOKEEP</p>
    <h1 style="font-size:22px;margin:0 0 8px">Verify your email</h1>
    <p style="color:#5b6788;margin:0 0 24px">Hi ${name || 'there'}, use this code to finish creating your MemoKeep account.</p>
    <div style="background:#fff;border:1px solid #e7ecf5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:34px;font-weight:700;letter-spacing:.4em;color:#2f6bff">${otp}</div>
    </div>
    <p style="color:#8a94ad;font-size:13px;margin:0">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
  </div>`;
}

// Send a one-time passcode to the given address. Returns true if "delivered"
// (or logged in dev), throws only on a real transport failure.
export async function sendOtpEmail(to, name, otp) {
  if (!transporter) {
    // Dev fallback — no email credentials configured.
    console.log(`\n📧 [DEV] OTP for ${to}: ${otp}  (expires in 10 min)\n`);
    return true;
  }
  await transporter.sendMail({
    from: env.email.from,
    to,
    subject: `${otp} is your MemoKeep verification code`,
    html: otpEmailHtml(name, otp),
    text: `Your MemoKeep verification code is ${otp}. It expires in 10 minutes.`,
  });
  return true;
}

function resetEmailHtml(name, otp) {
  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f4f7fe;border-radius:16px;color:#10193b">
    <p style="font-weight:700;letter-spacing:.2em;color:#2f6bff;margin:0 0 24px">MEMOKEEP</p>
    <h1 style="font-size:22px;margin:0 0 8px">Reset your password</h1>
    <p style="color:#5b6788;margin:0 0 24px">Hi ${name || 'there'}, use this code to set a new password for your MemoKeep account.</p>
    <div style="background:#fff;border:1px solid #e7ecf5;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
      <div style="font-size:34px;font-weight:700;letter-spacing:.4em;color:#2f6bff">${otp}</div>
    </div>
    <p style="color:#8a94ad;font-size:13px;margin:0">This code expires in 10 minutes. If you didn't request a reset, you can safely ignore this email — your password won't change.</p>
  </div>`;
}

// Send a password-reset one-time passcode. Same dev fallback as sendOtpEmail.
export async function sendResetOtpEmail(to, name, otp) {
  if (!transporter) {
    console.log(`\n📧 [DEV] Password reset OTP for ${to}: ${otp}  (expires in 10 min)\n`);
    return true;
  }
  await transporter.sendMail({
    from: env.email.from,
    to,
    subject: `${otp} is your MemoKeep password reset code`,
    html: resetEmailHtml(name, otp),
    text: `Your MemoKeep password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
  });
  return true;
}

function reminderEmailHtml(name, items, appUrl) {
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #e7ecf5">
          <div style="font-weight:600;color:#10193b">${it.title}</div>
          <div style="font-size:13px;color:#8a94ad">${it.sub || ''}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #e7ecf5;text-align:right;white-space:nowrap">
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;${
            it.daysLeft <= 7 ? 'background:#ffe1e6;color:#e11d48' : 'background:#fff3d6;color:#b7791f'
          }">${it.daysLeft <= 0 ? 'expires today' : `${it.daysLeft} day${it.daysLeft === 1 ? '' : 's'} left`}</span>
          <div style="font-size:12px;color:#8a94ad;margin-top:4px">${it.expiryStr}</div>
        </td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#f4f7fe;border-radius:16px;color:#10193b">
    <p style="font-weight:700;letter-spacing:.2em;color:#2f6bff;margin:0 0 24px">MEMOKEEP</p>
    <h1 style="font-size:22px;margin:0 0 8px">⏰ Expiring soon</h1>
    <p style="color:#5b6788;margin:0 0 20px">Hi ${name || 'there'}, a heads-up that ${
      items.length === 1 ? 'one item is' : `${items.length} items are`
    } about to expire:</p>
    <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e7ecf5;border-radius:12px;padding:8px 16px">
      ${rows}
    </table>
    <div style="text-align:center;margin:28px 0 8px">
      <a href="${appUrl}" style="display:inline-block;background:#2f6bff;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">Open MemoKeep</a>
    </div>
    <p style="color:#8a94ad;font-size:13px;margin:16px 0 0">Tip: if you're still in warranty, now's the time to claim repairs or buy an extension.</p>
  </div>`;
}

// Send a digest of the user's soon-to-expire items (warranties, documents,
// subscriptions). Each item: { title, sub, daysLeft, expiryStr }.
export async function sendReminderEmail(to, name, items, appUrl) {
  const list = items.map((i) => `${i.title} — ${i.daysLeft <= 0 ? 'expires today' : `${i.daysLeft} days left`}`).join('\n');
  if (!transporter) {
    console.log(`\n📧 [DEV] Reminder for ${to}:\n${list}\n`);
    return true;
  }
  await transporter.sendMail({
    from: env.email.from,
    to,
    subject:
      items.length === 1
        ? `⏰ ${items[0].title} expires soon`
        : `⏰ ${items.length} items expiring soon`,
    html: reminderEmailHtml(name, items, appUrl),
    text: `Expiring soon:\n${list}\n\nOpen MemoKeep: ${appUrl}`,
  });
  return true;
}

export default transporter;
