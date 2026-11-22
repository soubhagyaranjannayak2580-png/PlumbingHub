import type { ReactNode } from 'react';
import type { EnquiryStatus, Urgency } from '../lib/types';

export const STATUS_LABEL: Record<EnquiryStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_CLS: Record<EnquiryStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
};

const URGENCY_CLS: Record<Urgency, string> = {
  emergency: 'bg-red-600 text-white',
  urgent: 'bg-orange-100 text-orange-800',
  normal: 'bg-slate-100 text-slate-700',
};

export const StatusBadge = ({ s }: { s: EnquiryStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLS[s]}`}>{STATUS_LABEL[s]}</span>
);

export const UrgencyBadge = ({ u }: { u: Urgency }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${URGENCY_CLS[u]}`}>{u}</span>
);

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          {title && <h2 className="font-display text-base font-semibold text-navy">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PageTitle({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'info' | 'success' | 'warn'; children: ReactNode }) {
  const cls = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
  }[kind];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${cls}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy outline-none focus:border-electric focus:ring-2 focus:ring-electric/20';
export const labelCls = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500';
export const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-lg bg-electric px-4 py-2 text-sm font-semibold text-white hover:bg-electric-600 disabled:opacity-60';
export const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50 disabled:opacity-60';
export const btnDanger = 'inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60';

export const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
export const fmtDate = (s: string | null) =>
  s ? new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-navy">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-electric' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
      {label}
    </label>
  );
}
