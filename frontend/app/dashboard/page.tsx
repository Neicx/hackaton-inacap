'use client';

import { useApi } from '@/hooks/useApi';

type Ticket = {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: 'pendiente' | 'en_progreso' | 'resuelto' | 'cerrado';
  machine?: { name: string; type?: string };
  assigned_to?: { id: string; name: string } | null;
};

const COLUMNS = [
  { key: 'pendiente', label: 'Pendiente', color: 'bg-slate-500', lightBg: 'bg-slate-50', lightBorder: 'border-slate-200', headerBg: 'bg-slate-100' },
  { key: 'asignado', label: 'Asignado', color: 'bg-blue-500', lightBg: 'bg-blue-50', lightBorder: 'border-blue-200', headerBg: 'bg-blue-100' },
  { key: 'en_progreso', label: 'En proceso', color: 'bg-amber-500', lightBg: 'bg-amber-50', lightBorder: 'border-amber-200', headerBg: 'bg-amber-100' },
  { key: 'resuelto', label: 'Resuelto', color: 'bg-emerald-500', lightBg: 'bg-emerald-50', lightBorder: 'border-emerald-200', headerBg: 'bg-emerald-100' },
  { key: 'cerrado', label: 'Cerrado', color: 'bg-purple-500', lightBg: 'bg-purple-50', lightBorder: 'border-purple-200', headerBg: 'bg-purple-100' },
] as const;

const PRIORITY: Record<number, { label: string; dot: string; text: string; bg: string }> = {
  1: { label: 'Baja', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  2: { label: 'Media', dot: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-100' },
  3: { label: 'Alta', dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
  4: { label: 'Crítica', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-100' },
};

function columnFor(t: Ticket) {
  if (t.status === 'pendiente') return t.assigned_to ? 'asignado' : 'pendiente';
  return t.status;
}

export default function TicketBoard() {
  const { data: tickets, loading, error } = useApi<Ticket[]>('/tickets/get-all-tickets');

  return (
    <div className="min-h-screen w-full bg-gray-50 px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tablero de tickets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seguimiento de tickets de mantenimiento.
        </p>
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-10">Cargando tickets...</div>
      )}

      {error && (
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg py-4">
          {error}
        </div>
      )}

      {!loading && !error && <Board tickets={tickets ?? []} />}
    </div>
  );
}

function Board({ tickets }: { tickets: Ticket[] }) {
  const byColumn: Record<string, Ticket[]> = {};
  COLUMNS.forEach((c) => (byColumn[c.key] = []));
  tickets.forEach((t) => byColumn[columnFor(t)]?.push(t));
  Object.values(byColumn).forEach((col) => col.sort((a, b) => b.priority - a.priority));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {COLUMNS.map((col) => (
        <div key={col.key} className="flex flex-col">
          <div className={`flex items-center justify-between mb-3 px-2 py-1.5 rounded-lg ${col.headerBg}`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {col.label}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {byColumn[col.key].length}
            </span>
          </div>

          <div className={`flex-1 min-h-[120px] space-y-2.5 p-1.5 rounded-xl border ${col.lightBorder} ${col.lightBg}`}>
            {byColumn[col.key].length === 0 && (
              <div className="text-center text-xs text-gray-400 py-8 italic">Sin tickets</div>
            )}

            {byColumn[col.key].map((t) => {
              const p = PRIORITY[t.priority];
              return (
                <div
                  key={t.id}
                  className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] text-gray-400">
                      OT-{t.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.text} flex items-center gap-1`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                      {p.label}
                    </span>
                  </div>

                  <div className="mb-2">
                    <div className="text-sm font-semibold text-gray-800 mb-0.5">
                      {t.machine?.name ?? 'Máquina no especificada'}
                    </div>
                    <p className="text-xs text-gray-500 leading-snug line-clamp-2">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                    <span>{t.machine?.type ?? '-'}</span>
                    {t.assigned_to ? (
                      <span className="font-medium text-gray-600">{t.assigned_to.name}</span>
                    ) : (
                      <span className="italic text-gray-300">Sin asignar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
