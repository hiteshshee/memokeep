// Site-wide light backdrop: a very faint grid plus a few soft, low-opacity
// colour orbs so the page feels alive without overwhelming the white UI.
export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(20,30,80,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,30,80,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(circle at 50% 30%, black, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black, transparent 78%)',
        }}
      />

      {/* Soft colour orbs */}
      <div className="floaty absolute -left-24 top-6 h-96 w-96 rounded-full bg-blue-400/15 blur-[120px]" />
      <div
        className="floaty absolute right-[-6rem] top-1/4 h-[26rem] w-[26rem] rounded-full bg-violet-400/15 blur-[120px]"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="floaty absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-teal-400/12 blur-[120px]"
        style={{ animationDelay: '4s' }}
      />
      <div
        className="floaty absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-pink-400/12 blur-[110px]"
        style={{ animationDelay: '1s' }}
      />
    </div>
  );
}
