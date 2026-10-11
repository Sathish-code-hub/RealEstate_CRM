import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Building2, ClipboardCheck, LayoutDashboard, LogOut, Menu, UserCog, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/leads', label: 'Leads', icon: Users },
  { to: '/properties', label: 'Properties', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: ClipboardCheck },
  { to: '/team', label: 'Team', icon: UserCog, admin: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-4 text-lg font-semibold text-indigo-700">
        <Building2 className="h-5 w-5" /> Real_EstateCRM
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.filter((l) => !l.admin || isAdmin).map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`
            }>
            <l.icon className="h-4 w-4" /> {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="mb-3 text-xs capitalize text-slate-500">{user.role === 'admin' ? 'Admin' : 'Sales employee'}</p>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-600 hover:text-red-600">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 bg-white">{sidebar}</aside>
        </div>
      )}

      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="font-semibold text-indigo-700">EstateCRM</span>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <Outlet />
      </main>

      <Footer/>
    </div>
  );
}
