import { STAGE_COLORS } from '../../lib/constants';

export const StageBadge = ({ stage }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}>{stage}</span>
);

export const StatusBadge = ({ status }) => {
  const ok = status === 'available' || status === 'active';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ok ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
};
