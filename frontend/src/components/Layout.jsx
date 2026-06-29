import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, Package, PlusCircle, LogOut, Sparkles, FolderLock, CreditCard,
  Smartphone, Laptop, Tv, Refrigerator, Settings as SettingsIcon, Menu, X,
} from 'lucide-react';
import { logout } from '../store/authSlice.js';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/vault', label: 'Documents', icon: FolderLock },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/products/new', label: 'Add Product', icon: PlusCircle },
];

// Quick-filter shortcuts — each opens Products pre-filtered to that category.
const categoryNav = [
  { to: '/products?category=Mobile', label: 'Mobile', icon: Smartphone, tile: 'tile-purple' },
  { to: '/products?category=Computer', label: 'Computers', icon: Laptop, tile: 'tile-indigo' },
  { to: '/products?category=Electronics', label: 'Electronics', icon: Tv, tile: 'tile-blue' },
  { to: '/products?category=Appliances', label: 'Appliances', icon: Refrigerator, tile: 'tile-cyan' },
];

// Sidebar contents, shared by the desktop rail and the mobile drawer.
function SidebarContent({ onLogout, onNavigate }) {
  return (
    <>
      <div className="mb-1 px-2">
        <span className="font-display text-xl font-bold tracking-[0.18em]">
          <span className="gradient-text">MEMOKEEP</span>
        </span>
      </div>
      <div className="mb-8 ml-2 rule-gold" />

      <nav className="flex flex-1 flex-col gap-1">
        <p className="mb-1 px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-400">Menu</p>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold transition ${
                isActive ? 'bg-gold-50 text-ink-900' : 'text-ink-500 hover:bg-ivory-100 hover:text-ink-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                    isActive ? 'icon-tile' : 'bg-ivory-100 text-ink-500 group-hover:text-ink-900'
                  }`}
                >
                  <l.icon size={17} strokeWidth={2} />
                </span>
                {l.label}
              </>
            )}
          </NavLink>
        ))}

        <p className="mb-1 mt-6 px-2.5 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-ink-400">Categories</p>
        {categoryNav.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-ink-500 transition hover:bg-ivory-100 hover:text-ink-900"
          >
            <span className={`icon-tile ${c.tile} flex h-9 w-9 shrink-0 items-center justify-center`}>
              <c.icon size={16} strokeWidth={2} />
            </span>
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="relative mt-4 overflow-hidden rounded-2xl p-4 text-center text-white shadow-[0_14px_30px_-16px_rgba(47,107,255,0.7)]" style={{ background: 'linear-gradient(140deg, #2f6bff, #7c3aed)' }}>
        <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Sparkles size={17} strokeWidth={2} />
        </div>
        <p className="text-sm font-semibold">Need to add something?</p>
        <p className="mt-0.5 text-xs text-white/75">Keep your collection complete.</p>
        <Link to="/products/new" onClick={onNavigate} className="mt-3 block w-full rounded-xl bg-white py-2 text-xs font-bold text-gold-600 transition hover:bg-ivory-100">
          Add Product
        </Link>
      </div>

      <button
        onClick={() => { onNavigate?.(); onLogout(); }}
        className="mt-3 flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-ink-500 transition hover:bg-ivory-100 hover:text-ink-900"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ivory-100 text-ink-500">
          <LogOut size={17} strokeWidth={2} />
        </span>
        Logout
      </button>
    </>
  );
}

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-line bg-cream px-4 py-6 md:flex">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-line bg-cream px-4 py-6 md:hidden"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 text-ink-400 transition hover:text-ink-900">
                <X size={20} />
              </button>
              <SidebarContent onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-cream/80 px-4 py-3.5 backdrop-blur sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-600 transition hover:border-gold-300 hover:text-ink-900 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} strokeWidth={2} />
          </button>
          <div className="font-display text-lg font-bold tracking-[0.16em] md:hidden">
            <span className="gradient-text">MEMOKEEP</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-500 sm:inline">
              Hi, <span className="font-medium text-ink-800">{user?.name?.split(' ')[0]}</span>
            </span>
            <Link
              to="/settings"
              title="Settings"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink-500 transition hover:border-gold-300 hover:text-ink-900"
            >
              <SettingsIcon size={17} strokeWidth={2} />
            </Link>
            <Link
              to="/settings"
              title="Account settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-300 bg-gold-50 font-display font-semibold text-gold-700 transition hover:brightness-95"
            >
              {user?.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
