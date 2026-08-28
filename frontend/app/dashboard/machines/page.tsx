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

const TYPE_COLORS: Record<string, string> = {
  Torno: 'bg-sky-100 text-sky-700',
  Fresadora: 'bg-blue-100 text-blue-700',
  Compresor: 'bg-amber-100 text-amber-700',
  Excavadora: 'bg-orange-100 text-orange-700',
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
    fetch(`${API_URL}/machines/get-all-machines`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then((res) =>
        res.ok ? res.json() : Promise.reject(new Error('Error al cargar máquinas'))
      )
      .then((data) => setMachines(data))
      .catch(() => setError('Error al cargar máquinas'))
      .finally(() => setLoading(false));
  }, [token, user, router]);

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
      setLoading(true);
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
      setLoading(true);
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
      setLoading(true);
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
    return <div className="flex items-center justify-center h-full">Cargando...</div>;
  }

  const openEdit = (m: Machine) => {
    setSelected(m);
    setEditData({ name: m.name, type: m.type, brand: m.brand || '' });
    setEditing(false);
  };

  return (
    <div className="p-8" suppressHydrationWarning>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Maquinarias</h1>

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
                placeholder="Nombre o marca..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              + Crear Máquina
            </button>
          </div>
        </div>

        {/* Lista de máquinas */}
        <div className="space-y-3">
          {filteredMachines.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400">
              No se encontraron máquinas
            </div>
          ) : (
            filteredMachines.map((m) => (
              <div
                key={m.id}
                onClick={() => openEdit(m)}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{m.name}</h3>
                      <p className="text-sm text-gray-500">
                        {m.brand ? `${m.brand} · ` : ''}{m.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${TYPE_COLORS[m.type] || 'bg-slate-100 text-slate-600'}`}>
                      {m.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-600 font-medium">
                        {m._count?.tickets ?? 0} ticket{(m._count?.tickets ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de crear máquina */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Crear Máquina</h2>
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
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={newData.name}
                  onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  placeholder="Ej. Excavadora CAT 320"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
                <select
                  value={newData.type}
                  onChange={(e) => setNewData({ ...newData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                >
                  <option value="">Selecciona un tipo</option>
                  {MACHINE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Marca</label>
                <select
                  value={newData.brand}
                  onChange={(e) => setNewData({ ...newData, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
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
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
          <div className="bg-white rounded-lg shadow-xl w-96 max-w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Detalle de Máquina</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditing(!editing); if (!editing) setEditData({ name: selected.name, type: selected.type, brand: selected.brand || '' }); }}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Editar"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  title="Cerrar"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {editing ? (
              <div className="px-6 py-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
                  <select
                    value={editData.type}
                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
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
                  <label className="block text-xs font-medium text-gray-500 mb-1">Marca</label>
                  <select
                    value={editData.brand}
                    onChange={(e) => setEditData({ ...editData, brand: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
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
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 space-y-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-400 uppercase">Nombre</span>
                    <p className="font-medium text-gray-900">{selected.name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 uppercase">Tipo</span>
                    <p className="font-medium text-gray-900">{selected.type}</p>
                  </div>
                  {selected.brand && (
                    <div>
                      <span className="text-xs text-gray-400 uppercase">Marca</span>
                      <p className="font-medium text-gray-900">{selected.brand}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-400 uppercase">Tickets asociados</span>
                    <p className="font-medium text-gray-900">{selected._count?.tickets ?? 0}</p>
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
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
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
