import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, resetPassword } from '../store/authSlice.js';
import AuthArt from '../components/AuthArt.jsx';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // email | reset
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);

  // Reset success logs the user in → bounce to the dashboard.
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = await dispatch(forgotPassword(email.trim())).unwrap();
      setDevOtp(data.devOtp || null);
      setStep('reset');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not send reset code');
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await dispatch(resetPassword({ email: email.trim(), otp, password })).unwrap();
      // user is now set in the store → the effect above redirects.
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Reset failed');
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthArt />

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="reveal w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="font-display text-2xl font-bold tracking-[0.2em]">
              <span className="gradient-text">MemoKeep</span>
            </p>
            <div className="mx-auto mt-3 rule-gold" />
            <h1 className="mt-6 text-3xl font-bold text-ink-900">
              {step === 'email' ? 'Reset your password' : 'Enter the code'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {step === 'email' ? (
                "Enter your email and we'll send you a reset code."
              ) : (
                <>Enter the 6-digit code sent to <span className="font-medium text-ink-700">{email}</span> and choose a new password.</>
              )}
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {devOtp && (
            <div className="mb-5 rounded-lg border border-gold-200 bg-gold-50 px-4 py-2.5 text-sm text-gold-700">
              Dev mode (email not configured): your code is <b>{devOtp}</b>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={sendCode} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? 'Sending code…' : 'Send reset code'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitReset} className="space-y-5">
              <div>
                <label className="label">Verification code</label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input text-center text-2xl font-bold tracking-[0.5em]"
                  placeholder="••••••"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">New password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="At least 6 characters"
                />
              </div>
              <button
                type="submit"
                disabled={busy || otp.length !== 6}
                className="btn-primary w-full"
              >
                {busy ? 'Resetting…' : 'Reset password & sign in'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(''); }}
                  className="text-ink-500 transition hover:text-ink-900"
                >
                  ← Change email
                </button>
                <button type="button" onClick={sendCode} className="link-gold">
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-ink-500">
            Remembered it?{' '}
            <Link to="/login" className="link-gold">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
