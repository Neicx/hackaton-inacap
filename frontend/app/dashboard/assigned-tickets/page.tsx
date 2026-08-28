'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  machine?: { name: string; type?: string };
  created_by?: { id: string; name: string; email: string };
};

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pendiente: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-500' },
  en_progreso: { label: 'En Progreso', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  resuelto: { label: 'Resuelto', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cerrado: { label: 'Cerrado', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
};

const PRIORITY_STYLES: Record<number, { label: string; bg: string; text: string }> = {
  1: { label: 'Baja', bg: 'bg-slate-100', text: 'text-slate-600' },
  2: { label: 'Media', bg: 'bg-sky-100', text: 'text-sky-700' },
  3: { label: 'Alta', bg: 'bg-amber-100', text: 'text-amber-700' },
  4: { label: 'Crítica', bg: 'bg-red-100', text: 'text-red-700' },
  5: { label: 'Urgente', bg: 'bg-red-200', text: 'text-red-800' },
};

export default function AssignedTicketsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMachine, setFilterMachine] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'technical') {
      router.push('/dashboard');
      return;
    }
    fetchAssignedTickets();
  }, [token, user, router]);

  const fetchAssignedTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tickets/get-my-assigned-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      setError('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedTicket || !newStatus) return;
    setUpdating(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/tickets/update-ticket/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al actualizar');
      }

      setSelectedTicket(null);
      setNewStatus('');
      fetchAssignedTickets();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado');
    } finally {
      setUpdating(false);
    }
  };

  const machines = useMemo(() => {
    const unique = new Set(tickets.map((t) => t.machine?.name).filter(Boolean));
    return Array.from(unique) as string[];
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch = t.machine?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.created_by?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || t.priority === Number(filterPriority);
      const matchesMachine = filterMachine === 'all' || t.machine?.name === filterMachine;
      return matchesSearch && matchesStatus && matchesPriority && matchesMachine;
    });
  }, [tickets, searchTerm, filterStatus, filterPriority, filterMachine]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tickets Asignados</h1>
          <p className="text-sm text-gray-500 mt-1">Gestiona los tickets que te han sido asignados</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Máquina, descripción..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="all">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelto">Resuelto</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="all">Todas</option>
                <option value="1">Baja</option>
                <option value="2">Media</option>
                <option value="3">Alta</option>
                <option value="4">Crítica</option>
                <option value="5">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Máquina</label>
              <select
                value={filterMachine}
                onChange={(e) => setFilterMachine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
              >
                <option value="all">Todas</option>
                {machines.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Lista de tickets */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 font-medium">No se encontraron tickets</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const status = STATUS_STYLES[ticket.status] || STATUS_STYLES.pendiente;
              const priority = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[3];
              return (
                <div
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNewStatus(ticket.status);
                  }}
                  className="bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {ticket.machine?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{ticket.machine?.name || 'Sin máquina'}</h3>
                        <p className="text-xs text-gray-400">{ticket.machine?.type || '-'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text} flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                        Prioridad: {priority.label}
                      </span>
                      <span>
                        {new Date(ticket.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className="text-blue-600 font-medium">Ver detalle →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[500px] max-w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900">Detalle del Ticket</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="px-6 py-4 space-y-4">
              {/* Máquina */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-4">
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
                  {selectedTicket.machine?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedTicket.machine?.name || 'Sin máquina'}</h3>
                  <p className="text-xs text-gray-400">{selectedTicket.machine?.type || '-'}</p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <span className="text-xs text-gray-400 uppercase">Descripción</span>
                <p className="text-sm text-gray-700 mt-1">{selectedTicket.description}</p>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-xs text-gray-400">Prioridad</span>
                  <p className={`text-sm font-medium mt-1 ${PRIORITY_STYLES[selectedTicket.priority]?.text}`}>
                    {PRIORITY_STYLES[selectedTicket.priority]?.label}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-xs text-gray-400">Estado actual</span>
                  <p className={`text-sm font-medium mt-1 ${STATUS_STYLES[selectedTicket.status]?.text}`}>
                    {STATUS_STYLES[selectedTicket.status]?.label}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-xs text-gray-400">Creado por</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedTicket.created_by?.name || 'Desconocido'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <span className="text-xs text-gray-400">Fecha creación</span>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {new Date(selectedTicket.created_at).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>

              {/* Actualizar estado */}
              <div className="border-t border-gray-100 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actualizar estado
                </label>
                <div className="flex gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="resuelto">Resuelto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {updating ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
