import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../store/authSlice.js';
import AuthArt from '../components/AuthArt.jsx';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const submit = (e) => {
    e.preventDefault();
    dispatch(register(form));
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
            <h1 className="mt-6 text-3xl font-bold text-ink-900">Create your account</h1>
            <p className="mt-1 text-sm text-ink-500">Never lose. Never forget.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
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
              {status === 'loading' ? 'Creating…' : 'Create Account'}
            </button>
          </form>

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
