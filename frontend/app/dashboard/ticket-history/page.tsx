'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useApi } from '@/hooks/useApi';

type HistoryItem = {
  id: string;
  created_at: string;
  action: string;
  description: string;
  actor_id: string | null;
  actor_name: string | null;
  ticket_name: string | null;
  ticket_machine: string | null;
  ticket: {
    id: string;
    name: string;
    machine: { name: string } | null;
  } | null;
};

const ACTION_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  create: { label: 'Creación', color: 'text-sky-700', bg: 'bg-sky-50', dot: 'bg-sky-500' },
  assign: { label: 'Asignación', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  update: { label: 'Actualización', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  delete: { label: 'Eliminación', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketHistoryPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const [onlyDeletes, setOnlyDeletes] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [token, user, router]);

  const { data: history, loading, error } = useApi<HistoryItem[]>('/tickets/history');

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const items = (history ?? []).filter((h) => (onlyDeletes ? h.action === 'delete' : true));

  return (
    <div className="min-h-screen w-full bg-slate-100" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Historial de Tickets</h1>
              <p className="text-slate-400 text-sm mt-1">Trazabilidad de las acciones sobre los tickets</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm cursor-pointer">
            <input
              type="checkbox"
              checked={onlyDeletes}
              onChange={(e) => setOnlyDeletes(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Solo eliminaciones
          </label>
        </div>

        {loading && (
          <div className="text-center text-slate-400 py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
            Cargando historial...
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-slate-500 font-medium">No hay registros de trazabilidad</p>
            <p className="text-slate-400 text-sm mt-1">
              Las acciones sobre los tickets aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <ol className="relative border-l border-slate-200 ml-3 space-y-6">
              {items.map((item) => {
                const meta = ACTION_META[item.action] ?? {
                  label: item.action,
                  color: 'text-slate-700',
                  bg: 'bg-slate-50',
                  dot: 'bg-slate-400',
                };
                return (
                  <li key={item.id} className="ml-6">
                    <span
                      className={`absolute -left-[7px] mt-1.5 w-3.5 h-3.5 rounded-full ${meta.dot} ring-4 ring-white`}
                    ></span>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          {item.ticket_name ?? item.ticket?.name ?? 'Ticket'}
                        </span>
                        {(item.ticket_machine ?? item.ticket?.machine?.name) && (
                          <span className="text-xs text-slate-400">
                            {item.ticket_machine ?? item.ticket?.machine?.name}
                          </span>
                        )}
                        {!item.ticket && (
                          <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
                            Eliminado
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{formatDateTime(item.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Por: <span className="font-medium text-slate-600">{item.actor_name ?? 'Anónimo'}</span>
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
