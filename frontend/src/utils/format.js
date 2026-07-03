export const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—';

export const daysUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const CATEGORIES = [
  'Electronics', 'Appliances', 'Furniture', 'Vehicle', 'Mobile',
  'Computer', 'Kitchen', 'Tools', 'Other',
];

// A distinct colour tile per category so listings feel lively, not monotonous.
export const CATEGORY_TILE = {
  Electronics: 'tile-blue',
  Appliances: 'tile-cyan',
  Furniture: 'tile-orange',
  Vehicle: 'tile-red',
  Mobile: 'tile-purple',
  Computer: 'tile-indigo',
  Kitchen: 'tile-green',
  Tools: 'tile-pink',
  Other: 'tile-blue',
};
export const categoryTile = (c) => CATEGORY_TILE[c] || 'tile-blue';

export const DOC_TYPES = ['invoice', 'warranty', 'manual', 'receipt', 'image', 'other'];
