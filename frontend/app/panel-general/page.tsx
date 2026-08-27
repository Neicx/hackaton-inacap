'use client';

import { useMemo } from 'react';
import { useApi } from '@/hooks/useApi';

type Ticket = {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: 'pendiente' | 'en_progreso' | 'resuelto' | 'cerrado';
  created_at: string;
  updated_at: string;
  machine?: { name: string; type?: string };
  assigned_to?: { id: string; name: string } | null;
};

const PRIORITY_META: Record<number, { label: string; color: string }> = {
  1: { label: 'Baja', color: '#94a3b8' },
  2: { label: 'Media', color: '#0ea5e9' },
  3: { label: 'Alta', color: '#f59e0b' },
  4: { label: 'Crítica', color: '#ef4444' },
};

type DaySeries = {
  day: string;
  label: string;
  byPriority: Record<string, number>;
};

type Summary = {
  total: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
  sinAsignar: number;
  avgHours: number | null;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  last7Days: DaySeries[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function buildLast7Days(tickets: Ticket[]): DaySeries[] {
  const days: DaySeries[] = [];
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(startOfToday - i * DAY_MS);
    const label = dayStart.toLocaleDateString('es-ES', { weekday: 'short' });
    days.push({ day: dayStart.toISOString(), label, byPriority: {} });
  }

  tickets.forEach((t) => {
    const created = new Date(t.created_at);
    if (isNaN(created.getTime())) return;
    const tStamp = new Date(
      created.getFullYear(),
      created.getMonth(),
      created.getDate()
    ).getTime();
    const idx = Math.round((startOfToday - tStamp) / DAY_MS);
    if (idx >= 0 && idx < 7) {
      const day = days[6 - idx];
      day.byPriority[t.priority] = (day.byPriority[t.priority] ?? 0) + 1;
    }
  });

  return days;
}

function buildSummary(tickets: Ticket[]): Summary {
  const byStatus: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  tickets.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
    byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
  });

  const resolutions = tickets
    .filter((t) => t.status === 'resuelto' || t.status === 'cerrado')
    .map((t) => {
      const start = new Date(t.created_at).getTime();
      const end = new Date(t.updated_at).getTime();
      return isNaN(start) || isNaN(end) ? null : (end - start) / (1000 * 60 * 60);
    })
    .filter((n): n is number => n !== null && n >= 0);

  const avgHours =
    resolutions.length > 0
      ? resolutions.reduce((a, b) => a + b, 0) / resolutions.length
      : null;

  const asignados = tickets.filter(
    (t) => t.status === 'pendiente' && t.assigned_to
  ).length;

  return {
    total: tickets.length,
    pendientes: byStatus['pendiente'] ?? 0,
    enProgreso: byStatus['en_progreso'] ?? 0,
    resueltos: (byStatus['resuelto'] ?? 0) + (byStatus['cerrado'] ?? 0),
    sinAsignar: (byStatus['pendiente'] ?? 0) - asignados,
    avgHours,
    byStatus,
    byPriority,
    last7Days: buildLast7Days(tickets),
  };
}

function formatHours(h: number | null) {
  if (h === null || h <= 0) return 'Sin datos';
  if (h < 24) return `${h.toFixed(1)} h`;
  const days = Math.floor(h / 24);
  const hours = Math.round(h % 24);
  return days > 0 ? `${days} d ${hours} h` : `${hours} h`;
}

export default function PanelGeneral() {
  const { data: tickets, loading, error } = useApi<Ticket[]>('/tickets/get-all-tickets');

  const summary = useMemo(
    () => buildSummary(tickets ?? []),
    [tickets]
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Panel General</h1>
        <p className="text-sm text-gray-500 mt-1">
          Resumen general de las solicitudes de mantenimiento del sistema.
        </p>
      </div>

      {loading && (
        <div className="text-center text-gray-400 py-10">Cargando panel...</div>
      )}

      {error && (
        <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-lg py-4">
          {error}
        </div>
      )}

      {!loading && !error && <Content summary={summary} />}
    </div>
  );
}

function Content({ summary }: { summary: Summary }) {
  const priorityRows: [string, number][] = Object.entries(summary.byPriority);
  const priorityMax = Math.max(1, ...priorityRows.map(([, v]) => v));

  const cards = [
    { label: 'Total solicitudes', value: summary.total, accent: 'border-l-slate-500' },
    { label: 'Pendientes', value: summary.pendientes, accent: 'border-l-slate-400' },
    { label: 'En proceso', value: summary.enProgreso, accent: 'border-l-amber-500' },
    { label: 'Resueltos + Cerrados', value: summary.resueltos, accent: 'border-l-emerald-500' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-lg border border-gray-200 border-l-4 ${c.accent} p-4 shadow-sm`}
          >
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">
            Solicitudes por criticidad — últimos 7 días
          </h2>
          <StackedBarChart series={summary.last7Days} />
        </div>
        <BarChartCard
          title="Solicitudes por prioridad"
          rows={priorityRows}
          max={priorityMax}
          meta={PRIORITY_META}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-white rounded-lg border border-gray-200 border-l-4 border-l-emerald-500 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Tiempo promedio de resolución
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatHours(summary.avgHours)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Basado en solicitudes resueltas y cerradas.
          </p>
        </div>
      </div>
    </>
  );
}

function BarChartCard({
  title,
  rows,
  max,
  meta,
}: {
  title: string;
  rows: [string, number][];
  max: number;
  meta: Record<string, { label: string; color?: string }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin datos</p>
      ) : (
        <div className="space-y-3">
          {rows.map(([key, value]) => {
            const info = meta[key] ?? { label: key };
            const pct = Math.round((value / max) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-gray-600">{info.label}</span>
                  <span className="text-gray-500">{value}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: info.color ?? '#6366f1' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StackedBarChart({ series }: { series: DaySeries[] }) {
  const maxTotal = Math.max(
    1,
    ...series.map((d) => Object.values(d.byPriority).reduce((a, b) => a + b, 0))
  );

  return (
    <div>
      <div className="flex items-end gap-3 h-48">
        {series.map((d) => {
          const total = Object.values(d.byPriority).reduce((a, b) => a + b, 0);
          const height = total > 0 ? Math.max(6, (total / maxTotal) * 100) : 0;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs font-semibold text-gray-600 mb-1">{total}</span>
              <div className="w-full rounded-t-md overflow-hidden flex flex-col-reverse" style={{ height: `${height}%` }}>
                {Object.entries(d.byPriority)
                  .sort((a, b) => Number(b[0]) - Number(a[0]))
                  .map(([p, v]) => {
                    const seg = (v / maxTotal) * 100;
                    return (
                      <div
                        key={p}
                        style={{
                          height: `${seg}%`,
                          backgroundColor: PRIORITY_META[Number(p)]?.color ?? '#9ca3af',
                        }}
                      />
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-3">
        {series.map((d) => (
          <div key={d.day} className="flex-1 text-center">
            <span className="text-[11px] font-medium text-gray-400 capitalize">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-gray-100">
        {Object.entries(PRIORITY_META).map(([p, meta]) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: meta.color }} />
            <span className="text-xs text-gray-600">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
