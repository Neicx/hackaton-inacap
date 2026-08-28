'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Machine = {
  id: string;
  name: string;
  type: string;
  brand?: string | null;
  created_at?: string;
  updated_at?: string;
  _count?: { tickets: number };
};

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  Excavadora: { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🚜' },
  Camión: { bg: 'bg-slate-100', text: 'text-slate-700', icon: '🚛' },
  Grúa: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '🏗️' },
  'Cargador Frontal': { bg: 'bg-amber-100', text: 'text-amber-700', icon: '🔄' },
  Torno: { bg: 'bg-sky-100', text: 'text-sky-700', icon: '⚙️' },
  Fresadora: { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔩' },
  Compresor: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '💨' },
};

const MACHINE_TYPES = [
  'Excavadora',
  'Camión',
  'Grúa',
  'Cargador Frontal',
  'Torno',
  'Fresadora',
  'Compresor',
];

const MACHINE_BRANDS = [
  'Caterpillar',
  'Volvo',
  'Liebherr',
  'Komatsu',
  'Hitachi',
  'John Deere',
  'Kubota',
];

export default function MachinesPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newData, setNewData] = useState({ name: '', type: '', brand: '' });
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState<Machine | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ name: '', type: '', brand: '' });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/machines/get-all-machines`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setMachines(await res.json());
      } else {
        setError('Error al cargar máquinas');
      }
    } catch {
      setError('Error al cargar máquinas');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchMachines();
  }, [token, user, router, fetchMachines]);

  const handleCreate = async () => {
    if (!newData.name || !newData.type) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/machines/create-machine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newData.name,
          type: newData.type,
          brand: newData.brand,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al crear máquina');
      }
      setShowCreateModal(false);
      setNewData({ name: '', type: '', brand: '' });
      fetchMachines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear máquina');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/machines/update-machine/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al actualizar máquina');
      }
      setSelected(null);
      setEditing(false);
      fetchMachines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar máquina');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/machines/delete-machine/${selected.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al eliminar máquina');
      }
      setSelected(null);
      fetchMachines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar máquina');
    } finally {
      setDeleting(false);
    }
  };

  const types = useMemo(
    () => Array.from(new Set(machines.map((m) => m.type).filter(Boolean))),
    [machines]
  );

  const filteredMachines = useMemo(() => {
    return machines.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || m.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [machines, searchTerm, filterType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const openEdit = (m: Machine) => {
    setSelected(m);
    setEditData({ name: m.name, type: m.type, brand: m.brand || '' });
    setEditing(false);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-slate-900 text-white px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Maquinarias</h1>
                <p className="text-slate-400 text-sm mt-1">Parque de maquinaria industrial</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear Máquina
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
                placeholder="Nombre o marca..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Todos</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid de máquinas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMachines.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl shadow-sm p-12 text-center text-slate-400">
              No se encontraron máquinas
            </div>
          ) : (
            filteredMachines.map((m) => {
              const typeInfo = TYPE_COLORS[m.type] || { bg: 'bg-slate-100', text: 'text-slate-600', icon: '🔧' };
              return (
                <div
                  key={m.id}
                  onClick={() => openEdit(m)}
                  className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{m.name}</h3>
                        <p className="text-sm text-slate-500">
                          {m.brand ? `${m.brand} · ` : ''}{m.type}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${typeInfo.bg} ${typeInfo.text}`}>
                      {m.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-600 font-medium">
                        {m._count?.tickets ?? 0} ticket{(m._count?.tickets ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de crear máquina */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Crear Máquina</h2>
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
                <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newData.name}
                  onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                  placeholder="Ej. Excavadora CAT 320"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo *</label>
                <select
                  value={newData.type}
                  onChange={(e) => setNewData({ ...newData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
                >
                  <option value="">Selecciona un tipo</option>
                  {MACHINE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Marca</label>
                <select
                  value={newData.brand}
                  onChange={(e) => setNewData({ ...newData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
                >
                  <option value="">Sin marca</option>
                  {MACHINE_BRANDS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {creating ? 'Creando...' : 'Crear Máquina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle/edición */}
      {selected && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">Detalle de Máquina</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(!editing); if (!editing) setEditData({ name: selected.name, type: selected.type, brand: selected.brand || '' }); }}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Editar"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {editing ? (
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo *</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
                  >
                    {!MACHINE_TYPES.includes(editData.type) && (
                      <option value={editData.type}>{editData.type || 'Selecciona un tipo'}</option>
                    )}
                    {MACHINE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Marca</label>
                  <select
                    value={editData.brand}
                    onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm bg-white"
                  >
                    <option value="">Sin marca</option>
                    {!MACHINE_BRANDS.includes(editData.brand) && editData.brand && (
                      <option value={editData.brand}>{editData.brand}</option>
                    )}
                    {MACHINE_BRANDS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleUpdate}
                    disabled={saving}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Nombre</span>
                    <p className="font-medium text-slate-900">{selected.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Tipo</span>
                    <p className="font-medium text-slate-900">{selected.type}</p>
                  </div>
                  {selected.brand && (
                    <div>
                      <span className="text-xs text-slate-400 uppercase">Marca</span>
                      <p className="font-medium text-slate-900">{selected.brand}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-400 uppercase">Tickets asociados</span>
                    <p className="font-medium text-slate-900">{selected._count?.tickets ?? 0}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selected._count?.tickets) {
                      setError('No se puede eliminar: la máquina tiene tickets asociados');
                      return;
                    }
                    handleDelete();
                  }}
                  disabled={deleting}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar Máquina'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
