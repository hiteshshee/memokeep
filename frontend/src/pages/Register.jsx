import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, verifyOtp, resendOtp, clearError, resetOtp } from '../store/authSlice.js';
import AuthArt from '../components/AuthArt.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user, awaitingOtp, pendingEmail, devOtp } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // Leaving the page resets any half-finished OTP flow.
  useEffect(() => () => dispatch(resetOtp()), [dispatch]);

  const submitDetails = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(register(form));
  };

  const submitOtp = (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(verifyOtp({ email: pendingEmail, otp }));
  };

  return (
    <div className="flex min-h-screen">
      <AuthArt />

      <div className="flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2">
        <div className="reveal w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="font-display text-2xl font-bold tracking-[0.2em]">
              <span className="gradient-text">MEMOKEEP</span>
            </p>
            <div className="mx-auto mt-3 rule-gold" />
            <h1 className="mt-6 text-3xl font-bold text-ink-900">
              {awaitingOtp ? 'Verify your email' : 'Create your account'}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {awaitingOtp ? (
                <>Enter the 6-digit code sent to <span className="font-medium text-ink-700">{pendingEmail}</span></>
              ) : (
                'Never lose. Never forget.'
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

          {!awaitingOtp ? (
            <form onSubmit={submitDetails} className="space-y-5">
              <div>
                <label className="label">Full name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input"
                  placeholder="At least 6 characters"
                />
              </div>
              <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
                {status === 'loading' ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-5">
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
              <button
                type="submit"
                disabled={status === 'loading' || otp.length !== 6}
                className="btn-primary w-full"
              >
                {status === 'loading' ? 'Verifying…' : 'Verify & create account'}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => dispatch(resetOtp())}
                  className="text-ink-500 transition hover:text-ink-900"
                >
                  ← Change details
                </button>
                <button
                  type="button"
                  onClick={() => dispatch(resendOtp(pendingEmail))}
                  className="link-gold"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-ink-500">
            Already have an account?{' '}
            <Link to="/login" className="link-gold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
