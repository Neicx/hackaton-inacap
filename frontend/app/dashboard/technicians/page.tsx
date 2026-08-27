'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Technician = {
  id: string;
  name: string;
  email: string;
  specialty: string;
  created_at?: string;
  updated_at?: string;
  assigned_tickets?: { id: string; status: string }[];
};

const SPECIALTIES: Record<string, { label: string; color: string; bg: string }> = {
  mecanico: { label: 'Mecánico', color: 'text-orange-700', bg: 'bg-orange-100' },
  electricista: { label: 'Electricista', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  maquinaria: { label: 'Maquinaria', color: 'text-purple-700', bg: 'bg-purple-100' },
  general: { label: 'General', color: 'text-slate-700', bg: 'bg-slate-100' },
};

export default function TechniciansPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [editing, setEditing] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState('general');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTechData, setNewTechData] = useState({
    name: '',
    email: '',
    password: '',
    specialty: 'general',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchTechnicians();
  }, [token, user, router]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/get-technicians`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      }
    } catch (err) {
      setError('Error al cargar técnicos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTechnician = async () => {
    if (!newTechData.name || !newTechData.email || !newTechData.password) return;
    setCreating(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/users/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTechData.name,
          email: newTechData.email,
          password: newTechData.password,
          role: 'technical',
          specialty: newTechData.specialty,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear técnico');
      }

      setShowCreateModal(false);
      setNewTechData({ name: '', email: '', password: '', specialty: 'general' });
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Error al crear técnico');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateSpecialty = async () => {
    if (!selectedTech || !newSpecialty) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/users/update-user-by-id/${selectedTech.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ specialty: newSpecialty }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al actualizar');
      }

      setSelectedTech(null);
      setEditing(false);
      setNewSpecialty('general');
      fetchTechnicians();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar especialidad');
    } finally {
      setSaving(false);
    }
  };

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecialty = filterSpecialty === 'all' || tech.specialty === filterSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [technicians, searchTerm, filterSpecialty]);

  if (loading) {
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  return (
    <div className="p-8" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Listado de Técnicos</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Filtros y botón crear */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Especialidad</label>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todas</option>
                <option value="mecanico">Mecánico</option>
                <option value="electricista">Electricista</option>
                <option value="maquinaria">Maquinaria</option>
                <option value="general">General</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              + Crear Técnico
            </button>
          </div>
        </div>

        {/* Lista de técnicos */}
        <div className="space-y-3">
          {filteredTechnicians.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
              No se encontraron técnicos
            </div>
          ) : (
            filteredTechnicians.map((tech) => {
              const spec = SPECIALTIES[tech.specialty] || SPECIALTIES.general;
              return (
                <div
                  key={tech.id}
                  onClick={() => {
                    setSelectedTech(tech);
                    setNewSpecialty(tech.specialty || 'general');
                    setEditing(false);
                  }}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {tech.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                        <p className="text-sm text-gray-500">{tech.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${spec.bg} ${spec.color}`}>
                        {spec.label}
                      </span>
                      {tech.assigned_tickets && tech.assigned_tickets.length > 0 ? (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-gray-600 font-medium">
                            {tech.assigned_tickets.length} ticket{tech.assigned_tickets.length > 1 ? 's' : ''} asignado{tech.assigned_tickets.length > 1 ? 's' : ''}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-gray-500">Disponible</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de crear técnico */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Crear Técnico</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newTechData.name}
                  onChange={(e) => setNewTechData({ ...newTechData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  placeholder="Nombre del técnico"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  value={newTechData.email}
                  onChange={(e) => setNewTechData({ ...newTechData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newTechData.password}
                  onChange={(e) => setNewTechData({ ...newTechData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Especialidad</label>
                <select
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="mecanico">Mecánico</option>
                  <option value="electricista">Electricista</option>
                  <option value="maquinaria">Maquinaria</option>
                  <option value="general">General</option>
                </select>
              </div>
              <button
                onClick={handleCreateTechnician}
                disabled={creating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {creating ? 'Creando...' : 'Crear Técnico'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista del técnico */}
      {selectedTech && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Detalle del Técnico</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Editar especialidad"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedTech(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-400 uppercase">Nombre</span>
                  <p className="font-medium text-gray-900">{selectedTech.name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase">Email</span>
                  <p className="font-medium text-gray-900">{selectedTech.email}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase">Especialidad</span>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <select
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                      >
                        <option value="mecanico">Mecánico</option>
                        <option value="electricista">Electricista</option>
                        <option value="maquinaria">Maquinaria</option>
                        <option value="general">General</option>
                      </select>
                      <button
                        onClick={handleUpdateSpecialty}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900">
                      {SPECIALTIES[selectedTech.specialty]?.label || selectedTech.specialty || 'General'}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase">Tickets activos</span>
                  <p className="font-medium text-gray-900">
                    {selectedTech.assigned_tickets?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
