// Decorative panel for Login / Register — a deep gradient field with floating
// glowing orbs, a gradient wordmark and the brand promise. Pure CSS animation.
export default function AuthArt() {
  return (
    <div className="relative hidden w-1/2 overflow-hidden lg:block">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e2e] via-[#161a52] to-[#0a1b4d]" />

      {/* Floating glowing orbs */}
      <div className="floaty pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-blue-500/45 blur-3xl" />
      <div
        className="floaty pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-indigo-500/35 blur-3xl"
        style={{ animationDelay: '1.5s' }}
      />
      <div
        className="floaty pointer-events-none absolute bottom-10 left-1/4 h-64 w-64 rounded-full bg-cyan-400/25 blur-3xl"
        style={{ animationDelay: '3s' }}
      />

      {/* Fine glass frame */}
      <div className="pointer-events-none absolute inset-8 rounded-2xl border border-white/10" />

      <div className="relative flex h-full flex-col justify-between p-14">
        <p className="font-display text-xl font-bold tracking-[0.28em]">
          <span className="gradient-text">MEMOKEEP</span>
        </p>

        <div>
          <div className="mb-6 h-1 w-16 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
          <h2 className="font-display text-5xl font-bold leading-[1.05] text-white">
            Never lose.
            <br />
            <span className="gradient-text">Never forget.</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/60">
            Every product, warranty card, invoice and manual — kept safe, searchable and beautifully
            organised in one place.
          </p>
        </div>

        <p className="text-xs uppercase tracking-[0.22em] text-white/40">Your personal archive</p>
      </div>
    </div>
  );
}
