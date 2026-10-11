import { useState } from 'react';
import api from '../lib/api';
import useFetch from '../hooks/useFetch';
import Form from './ui/Form';
import Modal from './ui/Modal';
import { Input, Select } from './ui/Field';
import { Spinner } from './ui/States';
import { money } from '../lib/format';

// Pick project -> building -> an AVAILABLE unit, then confirm the booking
export default function BookingModal({ lead, onClose, onBooked }) {
  const [project, setProject] = useState('');
  const [building, setBuilding] = useState('');
  const [unitId, setUnitId] = useState('');
  const [token, setToken] = useState('');

  const projects = useFetch('/properties/projects');
  const buildings = useFetch(project ? '/properties/buildings' : null, { project });
  const units = useFetch(building ? '/properties/units' : null, { building, status: 'available' });

  const submit = async () => {
    if (!unitId) throw new Error('Select a unit first');
    try {
      await api.post('/bookings', { leadId: lead._id, unitId, tokenAmount: token === '' ? 0 : Number(token) });
    } catch (e) {
      // someone else may have taken the unit: refresh the list so the user can pick another
      if (e.response?.status === 409) { setUnitId(''); units.reload(); }
      throw e;
    }
    onBooked();
  };

  return (
    <Modal title={`Book a unit for ${lead.name}`} onClose={onClose} wide>
      <Form onSubmit={submit} onCancel={onClose} submitLabel="Confirm booking">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Project" value={project} onChange={(e) => { setProject(e.target.value); setBuilding(''); setUnitId(''); }}>
            <option value="">Select project</option>
            {projects.data?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.available} available)</option>)}
          </Select>
          <Select label="Building" value={building} disabled={!project} onChange={(e) => { setBuilding(e.target.value); setUnitId(''); }}>
            <option value="">Select building</option>
            {buildings.data?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </Select>
        </div>

        {building && (
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Available units</p>
            {units.loading ? <Spinner /> : units.data?.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No available units in this building.</p>
            ) : (
              <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                {units.data?.map((u) => (
                  <button type="button" key={u._id} onClick={() => setUnitId(u._id)}
                    className={`rounded-lg border p-3 text-left text-sm ${unitId === u._id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <p className="font-medium">{u.unitNumber} · {u.type}</p>
                    <p className="text-xs text-slate-500">Floor {u.floor ?? '—'} · {u.areaSqft ?? '—'} sqft</p>
                    <p className="mt-1 font-medium text-indigo-700">{money(u.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Input label="Token amount (₹, optional)" type="number" min="0" value={token} onChange={(e) => setToken(e.target.value)} />
      </Form>
    </Modal>
  );
}
