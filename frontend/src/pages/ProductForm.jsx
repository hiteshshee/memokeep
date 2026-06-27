import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../api/client.js';
import Spinner from '../components/Spinner.jsx';
import { CATEGORIES } from '../utils/format.js';

const empty = {
  name: '', category: 'Other', brand: '', model: '', serialNumber: '',
  purchaseDate: '', purchasePrice: '', purchasedFrom: '', warrantyMonths: '', notes: '',
};

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    api
      .get(`/products/${id}`)
      .then(({ data }) => {
        const p = data.product;
        setForm({
          name: p.name || '', category: p.category || 'Other', brand: p.brand || '',
          model: p.model || '', serialNumber: p.serialNumber || '',
          purchaseDate: toDateInput(p.purchaseDate), purchasePrice: p.purchasePrice || '',
          purchasedFrom: p.purchasedFrom || '', warrantyMonths: p.warrantyMonths || '',
          notes: p.notes || '',
        });
      })
      .catch(() => setError('Failed to load product'))
      .finally(() => setLoading(false));
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice) || 0,
      warrantyMonths: Number(form.warrantyMonths) || 0,
      purchaseDate: form.purchaseDate || undefined,
    };
    try {
      if (editing) {
        await api.put(`/products/${id}`, payload);
        navigate(`/products/${id}`);
      } else {
        const { data } = await api.post('/products', payload);
        navigate(`/products/${data.product._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={editing ? `/products/${id}` : '/products'} className="link-gold text-sm">
        ← Back
      </Link>
      <h1 className="mb-2 mt-3 text-3xl font-bold text-ink-900">
        {editing ? 'Edit Product' : 'Add Product'}
      </h1>
      <div className="mb-6 rule-gold" />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="card space-y-5 p-6">
        <div>
          <label className="label">Product name *</label>
          <input required value={form.name} onChange={set('name')} className="input" placeholder="e.g. Samsung Refrigerator" />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Category</label>
            <select value={form.category} onChange={set('category')} className="input">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Brand</label>
            <input value={form.brand} onChange={set('brand')} className="input" />
          </div>
          <div>
            <label className="label">Model</label>
            <input value={form.model} onChange={set('model')} className="input" />
          </div>
          <div>
            <label className="label">Serial number</label>
            <input value={form.serialNumber} onChange={set('serialNumber')} className="input" />
          </div>
          <div>
            <label className="label">Purchase date</label>
            <input type="date" value={form.purchaseDate} onChange={set('purchaseDate')} className="input" />
          </div>
          <div>
            <label className="label">Purchase price (₹)</label>
            <input type="number" min="0" value={form.purchasePrice} onChange={set('purchasePrice')} className="input" />
          </div>
          <div>
            <label className="label">Purchased from</label>
            <input value={form.purchasedFrom} onChange={set('purchasedFrom')} className="input" placeholder="Amazon, local store…" />
          </div>
          <div>
            <label className="label">Warranty (months)</label>
            <input type="number" min="0" value={form.warrantyMonths} onChange={set('warrantyMonths')} className="input" />
          </div>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea rows={3} value={form.notes} onChange={set('notes')} className="input" />
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
