'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Ticket = {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: string;
  created_at: string;
  updated_at: string;
  machine?: { id: string; name: string; type?: string };
  machine_id?: string;
  created_by?: { id: string; name: string };
  assigned_to?: { id: string; name: string } | null;
  assigned_to_id?: string | null;
};

type Machine = { id: string; name: string; type?: string };
type User = { id: string; name: string; email?: string; role?: string };

const STATUS: Record<string, { label: string; badge: string }> = {
  pendiente: { label: 'Pendiente', badge: 'bg-slate-100 text-slate-700' },
  en_progreso: { label: 'En proceso', badge: 'bg-amber-100 text-amber-700' },
  resuelto: { label: 'Resuelto', badge: 'bg-emerald-100 text-emerald-700' },
  cerrado: { label: 'Cerrado', badge: 'bg-purple-100 text-purple-700' },
};

const PRIORITY: Record<number, { label: string; badge: string }> = {
  1: { label: 'Baja', badge: 'bg-slate-100 text-slate-600' },
  2: { label: 'Media', badge: 'bg-sky-100 text-sky-700' },
  3: { label: 'Alta', badge: 'bg-amber-100 text-amber-700' },
  4: { label: 'Crítica', badge: 'bg-red-100 text-red-700' },
  5: { label: 'Urgente', badge: 'bg-red-100 text-red-700' },
};

const STATUS_ORDER = ['pendiente', 'en_progreso', 'resuelto', 'cerrado'];

function formatDate(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TicketTable() {
  const { data: tickets, loading, error } = useApi<Ticket[]>('/tickets/get-all-tickets');
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    machine_id: '',
    technician_id: '',
    search: '',
  });

  const filteredTickets = useMemo(() => {
    const list = tickets ?? [];
    return list.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && String(t.priority) !== filters.priority) return false;
      if (filters.machine_id && t.machine_id !== filters.machine_id && t.machine?.id !== filters.machine_id) return false;
      if (filters.technician_id && t.assigned_to_id !== filters.technician_id && t.assigned_to?.id !== filters.technician_id) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, filters]);

  const hasFilters =
    filters.status || filters.priority || filters.machine_id || filters.technician_id || filters.search;

  const clearFilters = () =>
    setFilters({ status: '', priority: '', machine_id: '', technician_id: '', search: '' });

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [mRes, uRes] = await Promise.all([
          fetch(`${API_URL}/machines/get-all-machines`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/users/get-all-users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (mRes.ok) setMachines(await mRes.json());
        if (uRes.ok) {
          const users = await uRes.json();
          setTechnicians(users.filter((u: User) => u.role === 'technical'));
        }
      } catch {
        // ignore list load errors; modal still opens
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen w-full bg-slate-100" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Tablero de tickets</h1>
              <p className="text-slate-400 text-sm mt-1">Listado de solicitudes de mantenimiento</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading && (
          <div className="text-center text-slate-400 py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900 mx-auto mb-4"></div>
            Cargando tickets...
          </div>
        )}

        {error && (
          <div className="text-center text-red-600 bg-red-50 border border-red-200 rounded-xl py-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Filtros</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Búsqueda</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Buscar por título"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Estado</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las prioridades</option>
                    {Object.entries(PRIORITY).map(([p, meta]) => (
                      <option key={p} value={p}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Máquina</label>
                  <select
                    value={filters.machine_id}
                    onChange={(e) => setFilters({ ...filters, machine_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las máquinas</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Técnico</label>
                  <select
                    value={filters.technician_id}
                    onChange={(e) => setFilters({ ...filters, technician_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los técnicos</option>
                    {technicians.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">
                  {filteredTickets.length} de {(tickets ?? []).length} solicitudes
                </span>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">OT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Máquina</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Prioridad</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Técnico</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Creado por</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Creado el</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((t) => {
                    const st = STATUS[t.status] ?? { label: t.status, badge: 'bg-slate-100 text-slate-600' };
                    const pr = PRIORITY[t.priority] ?? { label: String(t.priority), badge: 'bg-slate-100 text-slate-600' };
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">OT-{t.id.slice(0, 4).toUpperCase()}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-800">{t.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{t.description}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{t.machine?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${pr.badge}`}>{pr.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {t.assigned_to ? t.assigned_to.name : <span className="italic text-slate-300">Sin asignar</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{t.created_by?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <TicketDetailModal
          ticket={selected}
          machines={machines}
          technicians={technicians}
          token={token}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function TicketDetailModal({
  ticket,
  machines,
  technicians,
  token,
  onClose,
}: {
  ticket: Ticket;
  machines: Machine[];
  technicians: User[];
  token: string | null;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: ticket.name,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    machine_id: ticket.machine_id ?? ticket.machine?.id ?? '',
    assigned_to_id: ticket.assigned_to_id ?? ticket.assigned_to?.id ?? '',
  });

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        priority: Number(form.priority),
        status: form.status,
        machine_id: form.machine_id,
      };
      if (form.assigned_to_id) {
        body.assigned_to_id = form.assigned_to_id;
      } else {
        body.assigned_to_id = null;
      }
      const res = await fetch(`${API_URL}/tickets/update-ticket/${ticket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al actualizar ticket');
      }
      setEditing(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el ticket');
    } finally {
      setSaving(false);
    }
  };

  const st = STATUS[form.status] ?? { label: ticket.status, badge: 'bg-slate-100 text-slate-600' };
  const pr = PRIORITY[form.priority] ?? { label: String(ticket.priority), badge: 'bg-slate-100 text-slate-600' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">OT-{ticket.id.slice(0, 4).toUpperCase()}</span>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${pr.badge}`}>{pr.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="Editar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {editing ? (
            <EditFields
              form={form}
              setForm={setForm}
              machines={machines}
              technicians={technicians}
            />
          ) : (
            <dl className="space-y-4">
              <Field label="Título">
                <p className="text-slate-800 font-medium">{ticket.name}</p>
                <p className="text-xs text-slate-400">OT-{ticket.id.slice(0, 4).toUpperCase()}</p>
              </Field>
              <Field label="Descripción">
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Máquina">{ticket.machine?.name ?? '—'}</Field>
                <Field label="Prioridad">{pr.label}</Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Técnico asignado">
                  {ticket.assigned_to?.name ?? 'Sin asignar'}
                </Field>
                <Field label="Creado por">{ticket.created_by?.name ?? '—'}</Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Creado el">{formatDateTime(ticket.created_at)}</Field>
                <Field label="Última actualización">{formatDateTime(ticket.updated_at)}</Field>
              </div>
            </dl>
          )}
        </div>

        {editing && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-slate-700">{children}</dd>
    </div>
  );
}

function EditFields({
  form,
  setForm,
  machines,
  technicians,
}: {
  form: {
    name: string;
    description: string;
    priority: number;
    status: string;
    machine_id: string;
    assigned_to_id: string;
  };
  setForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      priority: number;
      status: string;
      machine_id: string;
      assigned_to_id: string;
    }>
  >;
  machines: Machine[];
  technicians: User[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Título</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Prioridad</label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 - Baja</option>
            <option value={2}>2 - Media</option>
            <option value={3}>3 - Alta</option>
            <option value={4}>4 - Crítica</option>
            <option value={5}>5 - Urgente</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Estado</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Máquina</label>
          <select
            value={form.machine_id}
            onChange={(e) => setForm({ ...form, machine_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin máquina</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} {m.type ? `(${m.type})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Técnico asignado</label>
          <select
            value={form.assigned_to_id}
            onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Sin asignar</option>
            {technicians.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
