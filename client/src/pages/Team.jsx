import { useState } from 'react';
import { Plus, UserCog } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Form from '../components/ui/Form';
import { Input, Select } from '../components/ui/Field';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { card } from '../lib/constants';

function UserForm({ onSaved, onCancel }) {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'sales' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Form onSubmit={async () => { await api.post('/users', f); onSaved(); }} onCancel={onCancel} submitLabel="Add user">
      <Input label="Full name" required value={f.name} onChange={set('name')} />
      <Input label="Email" type="email" required value={f.email} onChange={set('email')} />
      <Input label="Temporary password" type="password" required minLength={6} value={f.password} onChange={set('password')} />
      <Select label="Role" value={f.role} onChange={set('role')}>
        <option value="sales">Sales employee</option>
        <option value="admin">Admin</option>
      </Select>
    </Form>
  );
}

export default function Team() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/users');
  const [show, setShow] = useState(false);
  const [actionError, setActionError] = useState('');

  const toggle = async (u) => {
    setActionError('');
    try { await api.patch(`/users/${u._id}`, { active: !u.active }); reload(); } catch (e) { setActionError(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Team" subtitle="Manage who can sign in">
        <Button onClick={() => setShow(true)}><Plus className="h-4 w-4" /> Add user</Button>
      </PageHeader>
      {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      <div className={`${card} overflow-x-auto`}>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState icon={UserCog} title="No users" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u._id}>
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">{u.active ? 'Active' : <span className="text-slate-400">Disabled</span>}</td>
                  <td className="px-4 py-3 text-right">
                    {u._id !== user._id && <Button variant="secondary" onClick={() => toggle(u)}>{u.active ? 'Disable' : 'Enable'}</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {show && <Modal title="Add user" onClose={() => setShow(false)}><UserForm onCancel={() => setShow(false)} onSaved={() => { setShow(false); reload(); }} /></Modal>}
    </>
  );
}
