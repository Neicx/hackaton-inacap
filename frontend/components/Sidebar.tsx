'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.role === 'admin';
  const isTechnical = user?.role === 'technical';
  const isUser = user?.role === 'user';
 
 const NAV_ITEMS = [
  ...(isAdmin || isTechnical
    ? [{ label: 'Panel general', href: '/panel-general' }]
    : []),
  ...(isAdmin || isTechnical
    ? [{ label: 'Dashboard', href: '/dashboard' }]
    : []),
  { label: 'Crear Ticket', href: '/dashboard/tickets/new' },
  ...(isUser ? [{ label: 'Mis Tickets', href: '/dashboard/my-tickets' }] : []),
  ...(isAdmin ? [{ label: 'Técnicos', href: '/dashboard/technicians' }] : []),
];
  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="px-5 py-5 border-b border-slate-100">
        <span className="text-lg font-bold text-slate-900 tracking-tight">
          Inacap-Hackaton
        </span>
      </div>

      <div className="border-b border-slate-100 p-3">
        <Link
          href="/dashboard/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            pathname === '/dashboard/profile' ? 'bg-slate-100' : 'hover:bg-slate-100'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name ?? 'Usuario'}</p>
            <p className="text-xs text-slate-400 truncate">{user?.role ?? ''}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
