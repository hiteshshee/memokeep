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

export default transporter;
