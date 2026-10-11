import { useState } from 'react';
import api from '../lib/api';
import Form from './ui/Form';
import { Input, Select } from './ui/Field';
import { SOURCES, STAGES } from '../lib/constants';
import { toInputDate } from '../lib/format';

// Used for both "new lead" and "edit lead"
export default function LeadForm({ lead, team = [], isAdmin, onSaved, onCancel }) {
  const [f, setF] = useState({
    name: lead?.name || '',
    phone: lead?.phone || '',
    email: lead?.email || '',
    source: lead?.source || 'Website',
    budget: lead?.budget ?? '',
    stage: lead?.stage || 'New',
    assignedTo: lead?.assignedTo?._id || '',
    followUpDate: toInputDate(lead?.followUpDate),
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isBooked = lead?.stage === 'Booked';

  const submit = async () => {
    const payload = {
      ...f,
      budget: f.budget === '' ? undefined : Number(f.budget),
      assignedTo: f.assignedTo || null,
      followUpDate: f.followUpDate || null,
    };
    if (lead) await api.patch(`/leads/${lead._id}`, payload);
    else await api.post('/leads', payload);
    onSaved();
  };

  return (
    <Form onSubmit={submit} onCancel={onCancel} submitLabel={lead ? 'Save changes' : 'Create lead'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" required value={f.name} onChange={set('name')} />
        <Input label="Phone" required value={f.phone} onChange={set('phone')} placeholder="9876543210" />
        <Input label="Email" type="email" value={f.email} onChange={set('email')} />
        <Input label="Budget (₹)" type="number" min="0" value={f.budget} onChange={set('budget')} />
        <Select label="Source" value={f.source} onChange={set('source')}>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select label="Stage" value={f.stage} onChange={set('stage')} disabled={isBooked}>
          {STAGES.filter((s) => s !== 'Booked' || isBooked).map((s) => <option key={s}>{s}</option>)}
        </Select>
        {isAdmin && (
          <Select label="Assign to" value={f.assignedTo} onChange={set('assignedTo')}>
            <option value="">Unassigned</option>
            {team.filter((u) => u.active).map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </Select>
        )}
        <Input label="Follow-up date" type="date" value={f.followUpDate} onChange={set('followUpDate')} />
      </div>
    </Form>
  );
}
