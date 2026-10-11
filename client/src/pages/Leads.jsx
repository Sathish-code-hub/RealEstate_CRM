import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LeadForm from '../components/LeadForm';
import { StageBadge } from '../components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { inputClass } from '../components/ui/Field';
import { STAGES, card } from '../lib/constants';
import { fmtDate, isOverdue, money } from '../lib/format';

export default function Leads() {
  const { isAdmin } = useAuth();
  const [text, setText] = useState('');
  const [filters, setFilters] = useState({ search: '', stage: '', followUp: '', assignedTo: '' });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => { setFilters((f) => ({ ...f, search: text })); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [text]);

  const { data, loading, error, reload } = useFetch('/leads', { ...filters, page });
  const team = useFetch(isAdmin ? '/users' : null);

  const setFilter = (k) => (e) => { setFilters({ ...filters, [k]: e.target.value }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Leads" subtitle={data ? `${data.total} total` : ''}>
        <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New lead</Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-50 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input className={`${inputClass} pl-9`} placeholder="Search name, phone or email" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <select className={`${inputClass} w-auto`} value={filters.stage} onChange={setFilter('stage')}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className={`${inputClass} w-auto`} value={filters.followUp} onChange={setFilter('followUp')}>
          <option value="">Any follow-up</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
        </select>
        {isAdmin && (
          <select className={`${inputClass} w-auto`} value={filters.assignedTo} onChange={setFilter('assignedTo')}>
            <option value="">All employees</option>
            {team.data?.filter((u) => u.role === 'sales').map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
      </div>

      <div className={`${card} overflow-x-auto`}>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title={hasFilters ? 'No leads match your filters' : 'No leads yet'}
            text={hasFilters ? 'Try clearing a filter or searching something else.' : 'Add your first lead to start tracking your pipeline.'}
            action={!hasFilters && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> New lead</Button>}
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Assigned to</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Budget</th>
                <th className="px-4 py-3 font-medium">Follow-up</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((l) => (
                <tr key={l._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${l._id}`} className="font-medium text-indigo-700 hover:underline">{l.name}</Link>
                    <p className="text-xs text-slate-500">{l.phone}</p>
                  </td>
                  <td className="px-4 py-3"><StageBadge stage={l.stage} /></td>
                  <td className="hidden px-4 py-3 md:table-cell">{l.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{money(l.budget)}</td>
                  <td className={`px-4 py-3 ${isOverdue(l.followUpDate) && !['Booked', 'Lost'].includes(l.stage) ? 'font-medium text-red-600' : ''}`}>{fmtDate(l.followUpDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-slate-500">Page {data.page} of {data.pages}</span>
          <Button variant="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {showForm && (
        <Modal title="New lead" onClose={() => setShowForm(false)} wide>
          <LeadForm team={team.data || []} isAdmin={isAdmin} onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); reload(); }} />
        </Modal>
      )}
    </>
  );
}
