import { useState } from 'react';
import api from '../lib/api';
import useFetch from '../hooks/useFetch';
import Form from './ui/Form';
import { Input, Select } from './ui/Field';
import { UNIT_TYPES } from '../lib/constants';

export function ProjectForm({ onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', location: '', description: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Form onSubmit={async () => { await api.post('/properties/projects', f); onSaved(); }} onCancel={onCancel} submitLabel="Add project">
      <Input label="Project name" required value={f.name} onChange={set('name')} />
      <Input label="Location" required value={f.location} onChange={set('location')} />
      <Input label="Description" value={f.description} onChange={set('description')} />
    </Form>
  );
}

export function BuildingForm({ projects, onSaved, onCancel }) {
  const [f, setF] = useState({ project: '', name: '', floors: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Form
      onSubmit={async () => { await api.post('/properties/buildings', { ...f, floors: f.floors || undefined }); onSaved(); }}
      onCancel={onCancel}
      submitLabel="Add building">
      <Select label="Project" required value={f.project} onChange={set('project')}>
        <option value="">Select project</option>
        {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
      </Select>
      <Input label="Building name" required value={f.name} onChange={set('name')} placeholder="Tower A" />
      <Input label="Floors" type="number" min="1" value={f.floors} onChange={set('floors')} />
    </Form>
  );
}

export function UnitForm({ projects, onSaved, onCancel }) {
  const [project, setProject] = useState('');
  const [f, setF] = useState({ building: '', unitNumber: '', type: '2BHK', floor: '', areaSqft: '', price: '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const buildings = useFetch(project ? '/properties/buildings' : null, { project });

  const submit = async () => {
    await api.post('/properties/units', {
      ...f,
      floor: f.floor === '' ? undefined : f.floor,
      areaSqft: f.areaSqft === '' ? undefined : f.areaSqft,
    });
    onSaved();
  };

  return (
    <Form onSubmit={submit} onCancel={onCancel} submitLabel="Add unit">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Project" value={project} onChange={(e) => { setProject(e.target.value); setF({ ...f, building: '' }); }}>
          <option value="">Select project</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </Select>
        <Select label="Building" required value={f.building} disabled={!project} onChange={set('building')}>
          <option value="">Select building</option>
          {buildings.data?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </Select>
        <Input label="Unit number" required value={f.unitNumber} onChange={set('unitNumber')} placeholder="A-101" />
        <Select label="Type" value={f.type} onChange={set('type')}>
          {UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Input label="Floor" type="number" value={f.floor} onChange={set('floor')} />
        <Input label="Area (sqft)" type="number" min="0" value={f.areaSqft} onChange={set('areaSqft')} />
        <Input label="Price (₹)" type="number" min="0" required value={f.price} onChange={set('price')} />
      </div>
    </Form>
  );
}
