import { AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';

export const Spinner = () => (
  <div className="flex justify-center py-16 text-slate-400">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center px-4 py-14 text-center">
    {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300" />}
    <p className="font-medium text-slate-700">{title}</p>
    {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center px-4 py-14 text-center">
    <AlertTriangle className="mb-3 h-10 w-10 text-red-400" />
    <p className="font-medium text-slate-700">Something went wrong</p>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
    {onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Try again</Button>}
  </div>
);
