import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../auth';
import { Alert, Card, PageTitle, StatusBadge, UrgencyBadge, btnSecondary, fmtDate, fmtDateTime, inputCls, labelCls } from '../ui';
import type { Enquiry, Technician } from '../../lib/types';

interface ListResponse {
  items: Enquiry[];
  total: number;
  page: number;
  pageSize: number;
  facets: { services: string[]; locations: string[] };
}

const FILTER_KEYS = ['q', 'status', 'urgency', 'kind', 'service', 'location', 'technician', 'from', 'to'] as const;

export default function Enquiries() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const qs = params.toString();
  const { data, error, loading } = useApi<ListResponse>(`/api/admin/enquiries?${qs}`);
  const techs = useApi<{ items: Technician[] }>('/api/admin/technicians');

  // Debounced search box → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) update('q', q);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }

  const select = (key: string, label: string, options: [string, string][]) => (
    <div>
      <label className={labelCls} htmlFor={`f-${key}`}>
        {label}
      </label>
      <select id={`f-${key}`} className={inputCls} value={params.get(key) ?? ''} onChange={(e) => update(key, e.target.value)}>
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );

  const page = data?.page ?? 1;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const exportParams = new URLSearchParams(params);
  exportParams.delete('page');
  const active = FILTER_KEYS.some((k) => params.get(k));

  return (
    <>
      <PageTitle
        title="Enquiries"
        sub={data ? `${data.total} matching enquir${data.total === 1 ? 'y' : 'ies'}` : undefined}
        actions={
          <a href={`/api/admin/enquiries.csv?${exportParams.toString()}`} className={btnSecondary}>
            Export CSV
          </a>
        }
      />
      <Card>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div className="md:col-span-3 xl:col-span-2">
            <label className={labelCls} htmlFor="f-q">
              Search
            </label>
            <input id="f-q" className={inputCls} placeholder="Reference, name, mobile, email, text…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {select('status', 'Status', [
            ['new', 'New'],
            ['in_progress', 'In progress'],
            ['completed', 'Completed'],
            ['cancelled', 'Cancelled'],
          ])}
          {select('urgency', 'Urgency', [
            ['emergency', 'Emergency'],
            ['urgent', 'Urgent'],
            ['normal', 'Normal'],
          ])}
          {select('kind', 'Type', [
            ['booking', 'Service booking'],
            ['emergency', 'Emergency form'],
            ['contact', 'Contact form'],
          ])}
          {select('technician', 'Technician', [['unassigned', 'Unassigned'], ...(techs.data?.items ?? []).map((t) => [String(t.id), t.name] as [string, string])])}
          {select('service', 'Service', (data?.facets.services ?? []).map((s) => [s, s]))}
          {select('location', 'Location', (data?.facets.locations ?? []).map((s) => [s, s]))}
          <div>
            <label className={labelCls} htmlFor="f-from">
              From
            </label>
            <input id="f-from" type="date" className={inputCls} value={params.get('from') ?? ''} onChange={(e) => update('from', e.target.value)} />
          </div>
          <div>
            <label className={labelCls} htmlFor="f-to">
              To
            </label>
            <input id="f-to" type="date" className={inputCls} value={params.get('to') ?? ''} onChange={(e) => update('to', e.target.value)} />
          </div>
          {active && (
            <div className="flex items-end">
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setQ('');
                  setParams(new URLSearchParams(), { replace: true });
                }}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6">
        {error && <Alert>{error}</Alert>}
        {loading && !data && <p className="text-slate-500">Loading…</p>}
        {data && (
          <Card>
            {data.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No enquiries match these filters.</p>
            ) : (
              <div className="-mx-5 -my-5 overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      {['Reference', 'Customer', 'Service', 'Location', 'Appointment', 'Urgency', 'Status', 'Technician', 'Received'].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((e) => (
                      <tr key={e.id} className={`border-t border-slate-100 hover:bg-slate-50 ${e.urgency === 'emergency' && e.status === 'new' ? 'bg-red-50/60' : ''}`}>
                        <td className="px-4 py-3">
                          <Link to={`/admin/enquiries/${e.id}`} className="font-mono text-xs font-semibold text-electric">
                            {e.reference}
                          </Link>
                          {!!e.imageCount && <span className="ml-1 text-xs text-slate-400">📷{e.imageCount}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{e.fullName}</div>
                          <div className="text-xs text-slate-500">{e.mobile}</div>
                        </td>
                        <td className="px-4 py-3">{e.service ?? '—'}</td>
                        <td className="px-4 py-3">{e.location ?? '—'}</td>
                        <td className="px-4 py-3 text-xs">
                          {e.scheduledDate ? (
                            <span className="font-semibold text-emerald-700">
                              {fmtDate(e.scheduledDate)} {e.scheduledTime}
                            </span>
                          ) : e.preferredDate ? (
                            <span className="text-slate-500">
                              Pref: {fmtDate(e.preferredDate)}
                              {e.preferredTime ? `, ${e.preferredTime}` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3"><UrgencyBadge u={e.urgency} /></td>
                        <td className="px-4 py-3"><StatusBadge s={e.status} /></td>
                        <td className="px-4 py-3">{e.technicianName ?? <span className="text-slate-400">Unassigned</span>}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDateTime(e.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
        {data && pages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-2 text-sm">
            <button type="button" className={btnSecondary} disabled={page <= 1} onClick={() => update('page', String(page - 1))}>
              Previous
            </button>
            <span className="px-2 text-slate-600">
              Page {page} of {pages}
            </span>
            <button type="button" className={btnSecondary} disabled={page >= pages} onClick={() => update('page', String(page + 1))}>
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}
