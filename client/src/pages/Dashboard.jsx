import { Link } from 'react-router-dom';
import { AlertTriangle, Building2, CalendarClock, CalendarCheck, ClipboardCheck, Users } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import { StageBadge } from '../components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { STAGES, card } from '../lib/constants';
import { fmtDate, isOverdue, money } from '../lib/format';

const tones = {
  indigo: 'bg-indigo-50 text-indigo-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  green: 'bg-emerald-50 text-emerald-600',
};

function Stat({ icon: Icon, label, value, sub, tone = 'indigo' }) {
  return (
    <div className={`${card} p-4`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-2 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/dashboard');

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const max = Math.max(1, ...Object.values(data.stages));

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle={isAdmin ? 'Team-wide overview' : 'Your leads and bookings'} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Total leads" value={data.totalLeads} />
        <Stat icon={CalendarClock} label="Follow-ups today" value={data.followUpsToday} tone="amber" />
        <Stat icon={AlertTriangle} label="Overdue follow-ups" value={data.overdue} tone="red" />
        <Stat icon={ClipboardCheck} label="Bookings this month" value={data.bookingsThisMonth.count} sub={`Value ${money(data.bookingsThisMonth.value)}`} tone="green" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className={`${card} p-4 lg:col-span-2 lg:px-8`}>
          <h2 className="mb-3 font-semibold">Follow-ups due</h2>
          {data.followUps.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="You're all caught up" text="No follow-ups due today or overdue." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.followUps.map((l) => (
                <li key={l._id}>
                  <Link to={`/leads/${l._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-slate-500">{l.phone}{isAdmin && l.assignedTo ? ` · ${l.assignedTo.name}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StageBadge stage={l.stage} />
                      <span className={`text-xs ${isOverdue(l.followUpDate) ? 'font-medium text-red-600' : 'text-slate-500'}`}>{fmtDate(l.followUpDate)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className={`${card} p-4`}>
            <h2 className="mb-3 font-semibold">Leads by stage</h2>
            <ul className="divide-y divide-slate-100">
              {STAGES.map((s) => (
                <li key={s} className="flex items-center justify-between py-2">
                  <StageBadge stage={s} />
                  <span className="text-sm font-semibold">{data.stages[s]}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`${card} p-4`}>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Building2 className="h-4 w-4" /> Inventory</h2>
            <div className="flex gap-6 text-sm">
              <div><p className="text-2xl font-semibold text-emerald-600">{data.inventory.available}</p><p className="text-slate-500">Available</p></div>
              <div><p className="text-2xl font-semibold text-slate-600">{data.inventory.booked}</p><p className="text-slate-500">Booked</p></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
