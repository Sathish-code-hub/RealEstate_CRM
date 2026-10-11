export const STAGES = ['New', 'Contacted', 'Site Visit', 'Interested', 'Negotiation', 'Booked', 'Lost'];
export const SOURCES = ['Website', 'Referral', 'Walk-in', 'Social Media', 'Broker', 'Other'];
export const UNIT_TYPES = ['1BHK', '2BHK', '3BHK', 'Villa', 'Shop', 'Plot'];

export const STAGE_COLORS = Object.fromEntries(
  STAGES.map((s) => [s, s === 'Booked' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'])
);

export const card = 'rounded-xl border border-slate-200 bg-white';
