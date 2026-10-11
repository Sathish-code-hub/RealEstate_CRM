import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Home, Mail, MessageSquarePlus, Pencil, Phone } from 'lucide-react';
import api, { errMsg } from '../lib/api';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import LeadForm from '../components/LeadForm';
import BookingModal from '../components/BookingModal';
import { StageBadge } from '../components/ui/Badge';
import { ErrorState, Spinner } from '../components/ui/States';
import { Input, Select, Textarea } from '../components/ui/Field';
import { STAGES, card } from '../lib/constants';
import { fmtDate, money, toInputDate } from '../lib/format';

export default function LeadDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch(`/leads/${id}`);
  const team = useFetch(isAdmin ? '/users' : null);
  const [modal, setModal] = useState(null); // 'edit' | 'book'
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const { lead, booking } = data;
  const isBooked = lead.stage === 'Booked';

  const patch = async (body) => {
    setActionError('');
    try { await api.patch(`/leads/${id}`, body); reload(); } catch (e) { setActionError(errMsg(e)); }
  };

  const cancelBooking = async () => {
    if (!window.confirm('Cancel this booking? The unit becomes available again.')) return;
    try { await api.patch(`/bookings/${booking._id}/cancel`); reload(); } catch (e) { setActionError(errMsg(e)); }
  };

  const addNote = async (e) => {
    e.preventDefault();
    setBusy(true);
    setActionError('');
    try { await api.post(`/leads/${id}/notes`, { text: note }); setNote(''); reload(); }
    catch (err) { setActionError(errMsg(err)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Link to="/leads" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to leads
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{lead.name}</h1>
          <StageBadge stage={lead.stage} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setModal('edit')}><Pencil className="h-4 w-4" /> Edit</Button>
          {!isBooked && lead.stage !== 'Lost' && <Button onClick={() => setModal('book')}><Home className="h-4 w-4" /> Book a unit</Button>}
        </div>
      </div>

      {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p>}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className={`${card} space-y-3 p-4 text-sm`}>
            <h2 className="font-semibold">Details</h2>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {lead.phone}</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> {lead.email || '—'}</p>
            <p className="text-slate-600">Source: {lead.source} · Budget: {money(lead.budget)}</p>
            <p className="text-slate-600">Assigned to: {lead.assignedTo?.name || 'Unassigned'}</p>
          </div>

          <div className={`${card} space-y-3 p-4`}>
            <h2 className="font-semibold">Pipeline</h2>
            <Select label="Stage" value={lead.stage} disabled={isBooked} onChange={(e) => patch({ stage: e.target.value })}>
              {STAGES.filter((s) => s !== 'Booked' || isBooked).map((s) => <option key={s}>{s}</option>)}
            </Select>
            <Input label="Next follow-up" type="date" value={toInputDate(lead.followUpDate)} onChange={(e) => patch({ followUpDate: e.target.value || null })} />
            {isBooked && <p className="text-xs text-slate-500">Cancel the booking to change the stage.</p>}
          </div>

          {booking && (
            <div className={`${card} space-y-1 border-emerald-200 bg-emerald-50 p-4 text-sm`}>
              <h2 className="font-semibold text-emerald-800">Booked unit</h2>
              <p>{booking.unit.project?.name} · {booking.unit.building?.name} · {booking.unit.unitNumber}</p>
              <p>{money(booking.price)} (token {money(booking.tokenAmount)})</p>
              <p className="text-xs text-slate-500">Booked on {fmtDate(booking.bookingDate)}</p>
              <Button variant="danger" className="mt-2" onClick={cancelBooking}>Cancel booking</Button>
            </div>
          )}
        </div>

        <div className={`${card} p-4 lg:col-span-2`}>
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><MessageSquarePlus className="h-4 w-4" /> Notes</h2>
          <form onSubmit={addNote} className="mb-4 space-y-2">
            <Textarea placeholder="Call summary, preferences, next steps…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button type="submit" loading={busy} disabled={!note.trim()}>Add note</Button>
          </form>

          {lead.notes.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No notes yet. Add the first one above.</p>
          ) : (
            <ul className="space-y-3">
              {[...lead.notes].reverse().map((n) => (
                <li key={n._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{n.text}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <CalendarClock className="h-3 w-3" /> {n.by?.name || 'Unknown'} · {fmtDate(n.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {modal === 'edit' && (
        <Modal title="Edit lead" onClose={() => setModal(null)} wide>
          <LeadForm lead={lead} team={team.data || []} isAdmin={isAdmin} onCancel={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />
        </Modal>
      )}
      {modal === 'book' && <BookingModal lead={lead} onClose={() => setModal(null)} onBooked={() => { setModal(null); reload(); }} />}
    </>
  );
}
