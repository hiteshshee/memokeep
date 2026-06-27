export default function Spinner({ full = false }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
  );
  if (!full) return spinner;
  return <div className="flex h-screen items-center justify-center">{spinner}</div>;
}
