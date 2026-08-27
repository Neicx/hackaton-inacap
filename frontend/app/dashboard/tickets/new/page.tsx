'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function NewTicketPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    priority: 3,
    description: '',
    machine_id: '',
  });

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    fetchMachines();
  }, [token, user, router]);

  const fetchMachines = async () => {
    try {
      const response = await fetch(`${API_URL}/machines/get-all-machines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (err) {
      console.error('Error fetching machines:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/tickets/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          priority: Number(formData.priority),
          description: formData.description,
          created_by_id: user.id,
          machine_id: formData.machine_id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear ticket');
      }

      setSuccess('Ticket creado correctamente');
      setFormData({
        name: '',
        priority: 3,
        description: '',
        machine_id: '',
      });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al crear el ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8" suppressHydrationWarning>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Crear Nuevo Ticket</h1>
          <p className="text-sm text-gray-500 mt-1">Reporta un problema con una máquina</p>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {success}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <div className="p-8 space-y-6">
            {/* Nombre del ticket */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título del ticket
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Máquina no enciende"
                required
              />
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((p) => {
                  const selected = formData.priority === p;
                  const colors: Record<number, string> = {
                    1: 'bg-slate-100 text-slate-700 border-slate-300',
                    2: 'bg-sky-100 text-sky-700 border-sky-300',
                    3: 'bg-amber-100 text-amber-700 border-amber-300',
                    4: 'bg-red-100 text-red-700 border-red-300',
                    5: 'bg-red-200 text-red-800 border-red-400',
                  };
                  const labels: Record<number, string> = {
                    1: 'Baja',
                    2: 'Media',
                    3: 'Alta',
                    4: 'Crítica',
                    5: 'Urgente',
                  };
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p })}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        selected
                          ? `${colors[p]} ring-2 ring-offset-2 ring-blue-500`
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {labels[p]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Máquina */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Máquina
              </label>
              <select
                value={formData.machine_id}
                onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                required
              >
                <option value="">Selecciona una máquina</option>
                {machines.map((machine: any) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} ({machine.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del problema
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                rows={5}
                placeholder="Describe detalladamente el problema..."
                required
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Creando ticket...' : 'Crear Ticket'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
