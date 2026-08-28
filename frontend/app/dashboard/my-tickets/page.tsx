'use client';

import { useState, useEffect } from 'react';
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
  assigned_to?: { id: string; name: string; specialty?: string } | null;
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

export default function MyTicketsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    fetchMyTickets();
  }, [token, user, router]);

  const fetchMyTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tickets/get-my-created-tickets`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        setError('Error al cargar tus tickets');
      }
    } catch (err) {
      setError('Error al cargar tus tickets');
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-100" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Mis Tickets</h1>
                <p className="text-slate-400 text-sm mt-1">Seguimiento de tus solicitudes</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/tickets/new')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Ticket
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Filtro */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="en_progreso">En Progreso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>

        {/* Lista de tickets */}
        {filteredTickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-slate-500 font-medium">No tienes tickets</p>
            <p className="text-slate-400 text-sm mt-1">Crea tu primer ticket para reportar un problema</p>
            <button
              onClick={() => router.push('/dashboard/tickets/new')}
              className="mt-6 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Crear Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const status = STATUS_STYLES[ticket.status] || STATUS_STYLES.pendiente;
              const priority = PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES[3];
              return (
                <div key={ticket.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{ticket.machine?.name || 'Sin máquina'}</h3>
                      <p className="text-sm text-slate-500 mt-1">{ticket.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text} flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mb-4">
                    <span className={`px-2 py-1 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                      Prioridad: {priority.label}
                    </span>
                    <span>
                      Creado: {new Date(ticket.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    {ticket.assigned_to ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                          {ticket.assigned_to.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{ticket.assigned_to.name}</p>
                          <p className="text-xs text-slate-400">
                            {ticket.assigned_to.specialty || 'Técnico asignado'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Sin técnico asignado</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
