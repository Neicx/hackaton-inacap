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

const PRIORITY_META: Record<number, { label: string; color: string; bg: string; text: string }> = {
  1: { label: 'Baja', color: '#94a3b8', bg: 'bg-slate-50', text: 'text-slate-700' },
  2: { label: 'Media', color: '#0ea5e9', bg: 'bg-sky-50', text: 'text-sky-700' },
  3: { label: 'Alta', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
  4: { label: 'Crítica', color: '#ef4444', bg: 'bg-red-50', text: 'text-red-700' },
  5: { label: 'Urgente', color: '#b91c1c', bg: 'bg-red-100', text: 'text-red-800' },
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
    <div className="min-h-screen w-full bg-slate-100" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Panel General</h1>
              <p className="text-slate-400 text-sm mt-1">Sistema de gestión de mantenimiento industrial</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center text-slate-400 py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
            Cargando panel...
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4">
            {error}
          </div>
        )}

        {!loading && !error && <Content summary={summary} />}
      </div>
    </div>
  );
}

function Content({ summary }: { summary: Summary }) {
  const priorityRows: [string, number][] = Object.entries(summary.byPriority);
  const priorityMax = Math.max(1, ...priorityRows.map(([, v]) => v));

  const cards = [
    {
      label: 'Total Solicitudes',
      value: summary.total,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      accent: 'border-l-slate-500',
      iconBg: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'Pendientes',
      value: summary.pendientes,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'En Proceso',
      value: summary.enProgreso,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      accent: 'border-l-blue-500',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Resueltos',
      value: summary.resueltos,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'border-l-emerald-500',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
  ];

  return (
    <>
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-xl border border-slate-200 border-l-4 ${c.accent} p-5 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
                {c.icon}
              </div>
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-6">
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

      {/* Tiempo de resolución */}
      <div className="mt-6">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-100 uppercase tracking-wide">
                Tiempo promedio de resolución
              </p>
              <p className="text-3xl font-bold text-white mt-1">
                {formatHours(summary.avgHours)}
              </p>
              <p className="text-xs text-emerald-200 mt-1">
                Basado en solicitudes resueltas y cerradas
              </p>
            </div>
          </div>
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
  meta: Record<string, { label: string; color?: string; bg?: string; text?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-800 mb-6">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Sin datos</p>
      ) : (
        <div className="space-y-5">
          {rows.map(([key, value]) => {
            const info = meta[key] ?? { label: key };
            const pct = Math.round((value / max) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-medium text-slate-600">{info.label}</span>
                  <span className={`font-bold ${info.text || 'text-slate-500'}`}>{value}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
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
              <span className="text-xs font-bold text-slate-700 mb-1">{total}</span>
              <div className="w-full rounded-t-lg overflow-hidden flex flex-col-reverse" style={{ height: `${height}%` }}>
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
            <span className="text-[11px] font-medium text-slate-400 capitalize">{d.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100">
        {Object.entries(PRIORITY_META).map(([p, meta]) => (
          <div key={p} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: meta.color }} />
            <span className="text-xs text-slate-600">{meta.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
