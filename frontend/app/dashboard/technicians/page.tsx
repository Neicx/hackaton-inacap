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

const SPECIALTIES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  mecanico: { label: 'Mecánico', color: 'text-orange-700', bg: 'bg-orange-100', icon: '🔧' },
  electricista: { label: 'Electricista', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⚡' },
  maquinaria: { label: 'Maquinaria', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🏭' },
  general: { label: 'General', color: 'text-slate-700', bg: 'bg-slate-100', icon: '🛠️' },
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
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Listado de Técnicos</h1>
                <p className="text-slate-400 text-sm mt-1">Equipo de mantenimiento industrial</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Técnico
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-sm">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Buscar</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nombre o email..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad</label>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Todas</option>
                <option value="mecanico">Mecánico</option>
                <option value="electricista">Electricista</option>
                <option value="maquinaria">Maquinaria</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid de técnicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTechnicians.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center text-slate-400">
              No se encontraron técnicos
            </div>
          ) : (
            filteredTechnicians.map((tech) => {
              const spec = SPECIALTIES[tech.specialty] || SPECIALTIES.general;
              const hasTickets = tech.assigned_tickets && tech.assigned_tickets.length > 0;
              return (
                <div
                  key={tech.id}
                  onClick={() => {
                    setSelectedTech(tech);
                    setNewSpecialty(tech.specialty || 'general');
                    setEditing(false);
                  }}
                  className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                        {spec.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{tech.name}</h3>
                        <p className="text-sm text-slate-500">{tech.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${spec.bg} ${spec.color}`}>
                      {spec.label}
                    </span>
                    {hasTickets ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-slate-600 font-medium">
                          {tech.assigned_tickets!.length} ticket{tech.assigned_tickets!.length > 1 ? 's' : ''}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-slate-500">Disponible</span>
                      </span>
                    )}
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
          <div className="bg-white rounded-2xl shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Crear Técnico</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newTechData.name}
                  onChange={(e) => setNewTechData({ ...newTechData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                  placeholder="Nombre del técnico"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={newTechData.email}
                  onChange={(e) => setNewTechData({ ...newTechData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newTechData.password}
                  onChange={(e) => setNewTechData({ ...newTechData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Especialidad</label>
                <select
                  value={newTechData.specialty}
                  onChange={(e) => setNewTechData({ ...newTechData, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
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
                className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {creating ? 'Creando...' : 'Crear Técnico'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      {selectedTech && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Detalle del Técnico</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Editar especialidad"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedTech(null)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                  {SPECIALTIES[selectedTech.specialty]?.icon || '🛠️'}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{selectedTech.name}</p>
                  <p className="text-sm text-slate-500">{selectedTech.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-slate-400 uppercase">Especialidad</span>
                  {editing ? (
                    <div className="flex gap-2 mt-1">
                      <select
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                      >
                        <option value="mecanico">Mecánico</option>
                        <option value="electricista">Electricista</option>
                        <option value="maquinaria">Maquinaria</option>
                        <option value="general">General</option>
                      </select>
                      <button
                        onClick={handleUpdateSpecialty}
                        disabled={saving}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                      >
                        {saving ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-slate-900">
                      {SPECIALTIES[selectedTech.specialty]?.label || selectedTech.specialty || 'General'}
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 uppercase">Tickets activos</span>
                  <p className="font-medium text-slate-900">
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
