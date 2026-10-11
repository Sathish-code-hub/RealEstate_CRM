import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../lib/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '../components/ui/States';
import { card } from '../lib/constants';
import { fmtDate, money } from '../lib/format';

export default function Bookings() {
  const { user, isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/bookings');
  const [actionError, setActionError] = useState('');

  const cancel = async (id) => {
    if (!window.confirm('Cancel this booking? The unit becomes available again.')) return;
    setActionError('');
    try { await api.patch(`/bookings/${id}/cancel`); reload(); } catch (e) { setActionError(errMsg(e)); }
  };

  return (
    <>
      <PageHeader title="Bookings" subtitle={isAdmin ? 'All bookings' : 'Your bookings'} />
      {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      <div className={`${card} overflow-x-auto`}>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No bookings yet" text="Open a lead and choose “Book a unit” to create the first booking." />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Price</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Booked by</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((b) => (
                <tr key={b._id}>
                  <td className="px-4 py-3">
                    <Link to={`/leads/${b.lead?._id}`} className="font-medium text-indigo-700 hover:underline">{b.lead?.name}</Link>
                    <p className="text-xs text-slate-500">{b.lead?.phone}</p>
                  </td>
                  <td className="px-4 py-3">{b.unit?.unitNumber}<p className="text-xs text-slate-500">{b.unit?.project?.name} · {b.unit?.building?.name}</p></td>
                  <td className="hidden px-4 py-3 md:table-cell">{money(b.price)}</td>
                  <td className="hidden px-4 py-3 md:table-cell">{b.bookedBy?.name}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">{fmtDate(b.bookingDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'active' && (isAdmin || b.bookedBy?._id === user._id) && (
                      <Button variant="secondary" onClick={() => cancel(b._id)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
