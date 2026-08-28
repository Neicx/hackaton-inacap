'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Technician = {
  id: string;
  name: string;
  email: string;
  specialty: string;
};

type Ticket = {
  id: string;
  name: string;
  description: string;
  priority: number;
  status: string;
  created_at: string;
  machine?: { name: string; type?: string };
  assigned_to?: { id: string; name: string } | null;
  created_by?: { name: string; email: string };
};

export default function AdminTicketsPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [token, user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ticketsRes, techRes] = await Promise.all([
        fetch(`${API_URL}/tickets/get-pending-tickets`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${API_URL}/users/get-technicians`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data);
      }
      if (techRes.ok) {
        const data = await techRes.json();
        setTechnicians(data);
      }
    } catch (err) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (ticketId: string) => {
    if (!selectedTechnician) return;
    
    setAssigning(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/tickets/assign-ticket/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_to_id: selectedTechnician }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al asignar');
      }

      setSelectedTicket(null);
      setSelectedTechnician('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al asignar ticket');
    } finally {
      setAssigning(false);
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) return;

    setDeleting(ticketId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/tickets/delete-ticket/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al eliminar ticket');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar ticket');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="p-8" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Asignar Tickets</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {tickets.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">
              No hay tickets pendientes por asignar
            </div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ticket.machine?.name || 'Sin máquina'}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                    Prioridad: {ticket.priority}
                  </span>
                </div>

                <div className="text-xs text-gray-400 mb-4">
                  Creado por: {ticket.created_by?.name || 'Desconocido'} • {new Date(ticket.created_at).toLocaleDateString('es-CL')}
                </div>

                {selectedTicket === ticket.id ? (
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Seleccionar técnico
                    </label>
                    <div className="flex gap-3">
                      <select
                        value={selectedTechnician}
                        onChange={(e) => setSelectedTechnician(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="">Selecciona un técnico</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} - {tech.specialty}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssign(ticket.id)}
                        disabled={!selectedTechnician || assigning}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {assigning ? 'Asignando...' : 'Asignar'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTicket(null);
                          setSelectedTechnician('');
                        }}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTicket(ticket.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Asignar Técnico
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      disabled={deleting === ticket.id}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleting === ticket.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

