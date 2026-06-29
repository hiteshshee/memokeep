import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, BookUser, CreditCard, ShieldCheck, Car, Fingerprint, Award, Home, FileText,
  X, Paperclip, Pencil, Trash2,
} from 'lucide-react';
import api from '../api/client.js';
import { CardsSkeleton } from '../components/Skeleton.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { toast } from '../components/Toast.jsx';
import { formatDate, daysUntil } from '../utils/format.js';

const TYPES = ['Passport', 'License', 'Insurance', 'Vehicle', 'ID Card', 'Certificate', 'Property', 'Other'];
const TYPE_META = {
  Passport: { icon: BookUser, tile: 'tile-blue' },
  License: { icon: CreditCard, tile: 'tile-purple' },
  Insurance: { icon: ShieldCheck, tile: 'tile-green' },
  Vehicle: { icon: Car, tile: 'tile-red' },
  'ID Card': { icon: Fingerprint, tile: 'tile-cyan' },
  Certificate: { icon: Award, tile: 'tile-orange' },
  Property: { icon: Home, tile: 'tile-indigo' },
  Other: { icon: FileText, tile: 'tile-blue' },
};
const emptyForm = { type: 'Passport', title: '', holder: '', identifier: '', issuedDate: '', expiryDate: '', notes: '' };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

function ExpiryBadge({ date }) {
  if (!date) return <span className="rounded-full bg-ivory-100 px-2.5 py-0.5 text-xs font-semibold text-ink-400">No expiry</span>;
  const d = daysUntil(date);
  const cls = d < 0 ? 'bg-red-100 text-red-600' : d <= 30 ? 'bg-gold-50 text-gold-600' : 'bg-emerald-50 text-emerald-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {d < 0 ? 'Expired' : `${d}d left`}
    </span>
  );
}

export default function Vault() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vault');
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setModal(true);
  };
  const openEdit = (it) => {
    setEditing(it);
    setForm({
      type: it.type, title: it.title, holder: it.holder || '', identifier: it.identifier || '',
      issuedDate: toDateInput(it.issuedDate), expiryDate: toDateInput(it.expiryDate), notes: it.notes || '',
    });
    setFile(null);
    setModal(true);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append('file', file);
    try {
      if (editing) {
        await api.put(`/vault/${editing._id}`, fd);
        toast('Document updated');
      } else {
        await api.post('/vault', fd);
        toast('Document added');
      }
      setModal(false);
      await load();
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (it) => {
    if (!confirm(`Delete "${it.title}"?`)) return;
    await api.delete(`/vault/${it._id}`);
    setItems((cur) => cur.filter((x) => x._id !== it._id));
    toast('Document deleted');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Passports, licenses, insurance & other important papers — with expiry reminders."
        action={
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} strokeWidth={2.25} /> Add document
          </button>
        }
      />

      {loading ? (
        <CardsSkeleton />
      ) : items.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <span className="icon-tile tile-blue flex h-14 w-14 items-center justify-center">
            <FileText size={26} strokeWidth={1.75} />
          </span>
          <p className="text-ink-500">No documents yet.</p>
          <button onClick={openAdd} className="btn-primary mt-1">
            <Plus size={16} strokeWidth={2.25} /> Add your first document
          </button>
        </div>
      ) : (
        <div className="reveal-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const Icon = (TYPE_META[it.type] || TYPE_META.Other).icon;
            const tile = (TYPE_META[it.type] || TYPE_META.Other).tile;
            return (
              <div key={it._id} className="card group flex flex-col p-5">
                <div className="flex items-start justify-between">
                  <span className={`icon-tile ${tile} flex h-11 w-11 items-center justify-center`}>
                    <Icon size={20} strokeWidth={2} />
                  </span>
                  <ExpiryBadge date={it.expiryDate} />
                </div>
                <h3 className="mt-3 truncate font-display text-base font-semibold text-ink-900">{it.title}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{it.type}</p>
                <div className="mt-3 space-y-0.5 text-sm text-ink-600">
                  {it.holder && <p className="truncate">👤 {it.holder}</p>}
                  {it.identifier && <p className="truncate">🔖 {it.identifier}</p>}
                  {it.expiryDate && <p className="text-ink-500">Expires {formatDate(it.expiryDate)}</p>}
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3">
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noreferrer" className="link-gold flex items-center gap-1 text-sm">
                      <Paperclip size={14} /> File
                    </a>
                  )}
                  <button onClick={() => openEdit(it)} className="ml-auto flex items-center gap-1 text-sm font-medium text-ink-500 transition hover:text-gold-600">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => remove(it)} className="flex items-center gap-1 text-sm font-medium text-red-500 transition hover:text-red-600">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / edit modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && setModal(false)}
          >
            <motion.form
              onSubmit={submit}
              onClick={(e) => e.stopPropagation()}
              className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink-900">{editing ? 'Edit document' : 'Add document'}</h2>
                <button type="button" onClick={() => setModal(false)} className="text-ink-400 hover:text-ink-900">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <select value={form.type} onChange={set('type')} className="input">
                      {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Title *</label>
                    <input required value={form.title} onChange={set('title')} className="input" placeholder="e.g. My Passport" />
                  </div>
                  <div>
                    <label className="label">Holder name</label>
                    <input value={form.holder} onChange={set('holder')} className="input" placeholder="Name on document" />
                  </div>
                  <div>
                    <label className="label">Document / policy no.</label>
                    <input value={form.identifier} onChange={set('identifier')} className="input" />
                  </div>
                  <div>
                    <label className="label">Issued date</label>
                    <input type="date" value={form.issuedDate} onChange={set('issuedDate')} className="input" />
                  </div>
                  <div>
                    <label className="label">Expiry date</label>
                    <input type="date" value={form.expiryDate} onChange={set('expiryDate')} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={set('notes')} className="input" />
                </div>
                <div>
                  <label className="label">Attach file (image / PDF)</label>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="input py-2 text-sm" />
                  {editing?.url && !file && <p className="mt-1 text-xs text-ink-400">A file is already attached — choose a new one to replace it.</p>}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : editing ? 'Save changes' : 'Add document'}
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
