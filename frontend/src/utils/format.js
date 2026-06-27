export const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    n || 0
  );

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const daysUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const CATEGORIES = [
  'Electronics', 'Appliances', 'Furniture', 'Vehicle', 'Mobile',
  'Computer', 'Kitchen', 'Tools', 'Other',
];

export const DOC_TYPES = ['invoice', 'warranty', 'manual', 'receipt', 'image', 'other'];
