import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User as UserIcon, Lock, Bell } from 'lucide-react';
import { updateProfile, changePassword } from '../store/authSlice.js';
import PageHeader from '../components/PageHeader.jsx';
import { toast } from '../components/Toast.jsx';

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [name, setName] = useState(user?.name || '');
  const [remind, setRemind] = useState(!user?.reminderOptOut);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await dispatch(updateProfile({ name, reminderOptOut: !remind })).unwrap();
      toast('Profile updated');
    } catch (err) {
      toast(err || 'Update failed', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await dispatch(changePassword(pw)).unwrap();
      toast('Password changed');
      setPw({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast(err || 'Password change failed', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and preferences." />

      {/* Profile */}
      <form onSubmit={saveProfile} className="card space-y-5 p-6">
        <div className="flex items-center gap-3">
          <span className="icon-tile tile-blue flex h-10 w-10 items-center justify-center">
            <UserIcon size={18} strokeWidth={2} />
          </span>
          <h2 className="text-lg font-semibold text-ink-900">Profile</h2>
        </div>

        <div>
          <label className="label">Full name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input opacity-60" value={user?.email || ''} disabled />
          <p className="mt-1 text-xs text-ink-400">Your email can&apos;t be changed.</p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-line bg-ivory-50 p-4">
          <div className="flex items-center gap-3">
            <span className="icon-tile tile-orange flex h-9 w-9 items-center justify-center">
              <Bell size={16} strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-800">Reminder emails</p>
              <p className="text-xs text-ink-400">Get warned before warranties &amp; renewals expire.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRemind((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${remind ? 'bg-gold-500' : 'bg-ink-400/40'}`}
            aria-pressed={remind}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${remind ? 'left-[1.35rem]' : 'left-0.5'}`} />
          </button>
        </div>

        <button className="btn-primary" disabled={savingProfile}>
          {savingProfile ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className="card space-y-5 p-6">
        <div className="flex items-center gap-3">
          <span className="icon-tile tile-purple flex h-10 w-10 items-center justify-center">
            <Lock size={18} strokeWidth={2} />
          </span>
          <h2 className="text-lg font-semibold text-ink-900">Change password</h2>
        </div>

        <div>
          <label className="label">Current password</label>
          <input
            type="password"
            className="input"
            value={pw.currentPassword}
            onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            minLength={6}
            className="input"
            value={pw.newPassword}
            onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
            required
            placeholder="At least 6 characters"
          />
        </div>
        <button className="btn-primary" disabled={savingPw}>
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
