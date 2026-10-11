export const money = (n) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const toInputDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export const isOverdue = (d) => !!d && new Date(d) < new Date(new Date().setHours(0, 0, 0, 0));
