import { useState } from 'react';
import Button from './Button';
import { errMsg } from '../../lib/api';

// Shared form shell: handles submit, loading and API error display
export default function Form({ onSubmit, onCancel, submitLabel = 'Save', children }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {children}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}
