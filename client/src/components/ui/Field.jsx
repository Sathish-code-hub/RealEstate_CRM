export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

const Wrap = ({ label, children }) => (
  <label className="block text-sm">
    {label && <span className="mb-1 block font-medium text-slate-700">{label}</span>}
    {children}
  </label>
);

export const Input = ({ label, ...props }) => (
  <Wrap label={label}>
    <input className={inputClass} {...props} />
  </Wrap>
);

export const Select = ({ label, children, ...props }) => (
  <Wrap label={label}>
    <select className={inputClass} {...props}>{children}</select>
  </Wrap>
);

export const Textarea = ({ label, ...props }) => (
  <Wrap label={label}>
    <textarea rows={3} className={inputClass} {...props} />
  </Wrap>
);
