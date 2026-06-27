// Consistent page header: serif title, fine gold rule, optional subtitle and
// a right-aligned action slot (e.g. an "Add Product" button).
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-ink-900">{title}</h1>
        <div className="mt-3 rule-gold" />
        {subtitle && <p className="mt-3 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
