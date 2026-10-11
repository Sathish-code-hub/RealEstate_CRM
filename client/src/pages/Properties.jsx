import { useState } from 'react';
import { Building2, MapPin, Plus } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { ProjectForm, BuildingForm, UnitForm } from '../components/PropertyForms';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { inputClass } from '../components/ui/Field';
import { UNIT_TYPES, card } from '../lib/constants';
import { money } from '../lib/format';

export default function Properties() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({ project: '', building: '', type: '', status: '' });
  const [modal, setModal] = useState(null); 

  const projects = useFetch('/properties/projects');
  const buildings = useFetch(filters.project ? '/properties/buildings' : null, { project: filters.project });
  const units = useFetch('/properties/units', filters);

  const refresh = () => { setModal(null); projects.reload(); units.reload(); };
  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value, ...(k === 'project' ? { building: '' } : {}) });

  return (
    <>
      <PageHeader title="Properties" subtitle="Projects, buildings and units">
        {isAdmin && (
          <>
            <Button variant="secondary" onClick={() => setModal('project')}><Plus className="h-4 w-4" /> Project</Button>
            <Button variant="secondary" onClick={() => setModal('building')}><Plus className="h-4 w-4" /> Building</Button>
            <Button onClick={() => setModal('unit')}><Plus className="h-4 w-4" /> Unit</Button>
          </>
        )}
      </PageHeader>

      {projects.loading ? <Spinner /> : projects.error ? <ErrorState message={projects.error} onRetry={projects.reload} /> : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data.map((p) => (
            <button
              key={p._id}
              onClick={() => setFilters({ ...filters, project: filters.project === p._id ? '' : p._id, building: '' })}
              className={`${card} p-4 text-left ${filters.project === p._id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'hover:bg-slate-50'}`}
            >
              <p className="flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4 text-indigo-600" /> {p.name}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3 w-3" /> {p.location}</p>
              <p className="mt-3 text-sm"><span className="font-medium text-emerald-600">{p.available} available</span> · {p.booked} booked</p>
            </button>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select className={`${inputClass} w-auto`} value={filters.building} disabled={!filters.project} onChange={setFilter('building')}>
          <option value="">All buildings</option>
          {buildings.data?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filters.type} onChange={setFilter('type')}>
          <option value="">All types</option>
          {UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filters.status} onChange={setFilter('status')}>
          <option value="">Any status</option>
          <option value="available">Available</option>
          <option value="booked">Booked</option>
        </select>
      </div>

      <div className={`${card} overflow-x-auto px-5`}>
        {units.loading ? <Spinner /> : units.error ? <ErrorState message={units.error} onRetry={units.reload} /> : units.data.length === 0 ? (
          <EmptyState icon={Building2} title="No units found" text={isAdmin ? 'Add a project, a building and then units, or adjust the filters.' : 'Try changing the filters.'} />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Project / Building</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Floor</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Area</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.data.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium">{u.unitNumber}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{u.project?.name} · {u.building?.name}</td>
                  <td className="px-4 py-3">{u.type}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{u.floor ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{u.areaSqft ? `${u.areaSqft} sqft` : '—'}</td>
                  <td className="px-4 py-3">{money(u.price)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'project' && <Modal title="New project" onClose={() => setModal(null)}><ProjectForm onCancel={() => setModal(null)} onSaved={refresh} /></Modal>}
      {modal === 'building' && <Modal title="New building" onClose={() => setModal(null)}><BuildingForm projects={projects.data || []} onCancel={() => setModal(null)} onSaved={refresh} /></Modal>}
      {modal === 'unit' && <Modal title="New unit" onClose={() => setModal(null)} wide><UnitForm projects={projects.data || []} onCancel={() => setModal(null)} onSaved={refresh} /></Modal>}
    </>
  );
}
