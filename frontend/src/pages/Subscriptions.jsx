import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Tv, Music, Code, Gamepad2, Dumbbell, ShieldCheck, Zap, Newspaper, CreditCard,
  X, Pencil, Trash2,
} from 'lucide-react';
import api from '../api/client.js';
import { CardsSkeleton } from '../components/Skeleton.jsx';
import PageHeader from '../components/PageHeader.jsx';
import CountUp from '../components/CountUp.jsx';
import { toast } from '../components/Toast.jsx';
import { currency, formatDate, daysUntil } from '../utils/format.js';

const CATEGORIES = ['Streaming', 'Music', 'Software', 'Gaming', 'Gym', 'Insurance', 'Utility', 'News', 'Other'];
const CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];
const CAT_META = {
  Streaming: { icon: Tv, tile: 'tile-red' },
  Music: { icon: Music, tile: 'tile-green' },
  Software: { icon: Code, tile: 'tile-blue' },
  Gaming: { icon: Gamepad2, tile: 'tile-purple' },
  Gym: { icon: Dumbbell, tile: 'tile-orange' },
  Insurance: { icon: ShieldCheck, tile: 'tile-cyan' },
  Utility: { icon: Zap, tile: 'tile-orange' },
  News: { icon: Newspaper, tile: 'tile-indigo' },
  Other: { icon: CreditCard, tile: 'tile-blue' },
};
const emptyForm = { name: '', category: 'Streaming', amount: '', billingCycle: 'monthly', nextRenewal: '', isActive: true, notes: '' };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const PER_MONTH = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 };
const monthly = (s) => (s.isActive ? (s.amount || 0) * (PER_MONTH[s.billingCycle] || 1) : 0);

function RenewBadge({ date, active }) {
  if (!active) return <span className="rounded-full bg-ivory-100 px-2.5 py-0.5 text-xs font-semibold text-ink-400">Paused</span>;
  if (!date) return <span className="rounded-full bg-ivory-100 px-2.5 py-0.5 text-xs font-semibold text-ink-400">No date</span>;
  const d = daysUntil(date);
  const cls = d < 0 ? 'bg-red-100 text-red-600' : d <= 7 ? 'bg-gold-50 text-gold-600' : 'bg-emerald-50 text-emerald-600';
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{d < 0 ? 'Due' : `in ${d}d`}</span>;
}

export default function Subscriptions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/subscriptions');
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalMonthly = items.reduce((sum, s) => sum + monthly(s), 0);
  const activeCount = items.filter((s) => s.isActive).length;

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({
      name: s.name, category: s.category, amount: s.amount ?? '', billingCycle: s.billingCycle,
      nextRenewal: toDateInput(s.nextRenewal), isActive: s.isActive, notes: s.notes || '',
    });
    setModal(true);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/subscriptions/${editing._id}`, form);
        toast('Subscription updated');
      } else {
        await api.post('/subscriptions', form);
        toast('Subscription added');
      }
      setModal(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (s) => {
    await api.put(`/subscriptions/${s._id}`, { isActive: !s.isActive });
    setItems((cur) => cur.map((x) => (x._id === s._id ? { ...x, isActive: !x.isActive } : x)));
  };

  const remove = async (s) => {
    if (!confirm(`Delete "${s.name}"?`)) return;
    await api.delete(`/subscriptions/${s._id}`);
    setItems((cur) => cur.filter((x) => x._id !== s._id));
    toast('Subscription deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        subtitle="Track recurring payments & get reminded before they renew."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} strokeWidth={2.25} /> Add subscription
          </button>
        }
      />

      {/* Spend summary */}
      <div className="grid grid-cols-2 gap-5 sm:max-w-md">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Monthly spend</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">
            <CountUp value={totalMonthly} format={currency} />
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">Yearly spend</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink-900">
            <CountUp value={totalMonthly * 12} format={currency} />
          </p>
        </div>
      </div>

      {loading ? (
        <CardsSkeleton />
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <span className="icon-tile tile-red flex h-14 w-14 items-center justify-center">
            <Tv size={26} strokeWidth={1.75} />
          </span>
          <p className="text-ink-500">No subscriptions yet.</p>
          <button onClick={openAdd} className="btn-primary mt-1">
            <Plus size={16} strokeWidth={2.25} /> Add your first subscription
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-ink-500">{activeCount} active subscription{activeCount === 1 ? '' : 's'}</p>
          <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => {
              const Icon = (CAT_META[s.category] || CAT_META.Other).icon;
              const tile = (CAT_META[s.category] || CAT_META.Other).tile;
              return (
                <div key={s._id} className={`card flex flex-col p-5 ${s.isActive ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <span className={`icon-tile ${tile} flex h-11 w-11 items-center justify-center`}>
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <RenewBadge date={s.nextRenewal} active={s.isActive} />
                  </div>
                  <h3 className="mt-3 truncate font-display text-base font-semibold text-ink-900">{s.name}</h3>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{s.category}</p>
                  <p className="mt-2 font-display text-lg font-bold text-ink-900">
                    {currency(s.amount)} <span className="text-sm font-medium text-ink-400">/ {s.billingCycle}</span>
                  </p>
                  {s.nextRenewal && s.isActive && (
                    <p className="mt-1 text-xs text-ink-500">Renews {formatDate(s.nextRenewal)}</p>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                    <button onClick={() => toggleActive(s)} className="text-sm font-medium text-ink-500 transition hover:text-gold-600">
                      {s.isActive ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => openEdit(s)} className="ml-auto flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-gold-600">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => remove(s)} className="flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-600">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add / edit modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !saving && setModal(false)}
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">{editing ? 'Edit subscription' : 'Add subscription'}</h2>
                <button type="button" onClick={() => setModal(false)} className="text-ink-400 hover:text-ink-900"><X size={20} /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name *</label>
                    <input required value={form.name} onChange={set('name')} className="input" placeholder="e.g. Netflix" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select value={form.category} onChange={set('category')} className="input">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Amount (₹)</label>
                    <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className="input" />
                  </div>
                  <div>
                    <label className="label">Billing cycle</label>
                    <select value={form.billingCycle} onChange={set('billingCycle')} className="input">
                      {CYCLES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Next renewal</label>
                    <input type="date" value={form.nextRenewal} onChange={set('nextRenewal')} className="input" />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
                      <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 accent-gold-500" />
                      Active
                    </label>
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={set('notes')} className="input" />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add subscription'}
                </button>
                <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
