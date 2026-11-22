import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useApi } from '../auth';
import { Alert, Card, PageTitle, StatusBadge, UrgencyBadge, fmtDateTime } from '../ui';
import type { Enquiry } from '../../lib/types';

interface Overview {
  counts: { total: number; new: number; in_progress: number; completed: number; cancelled: number; emergency: number; emergency_open: number };
  recent: Enquiry[];
  byService: { label: string; count: number }[];
  daily: { day: string; count: number }[];
  system: { emailConfigured: boolean; database: string };
}

function TrendChart({ data }: { data: Overview['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.count));
  const W = 560;
  const H = 160;
  const bw = W / data.length;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" role="img" aria-label="Enquiries per day over the last 14 days">
        {[0.5, 1].map((g) => (
          <line key={g} x1="0" x2={W} y1={H - H * g} y2={H - H * g} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <line x1="0" x2={W} y1={H} y2={H} stroke="#cbd5e1" />
        {data.map((d, i) => {
          const h = (d.count / max) * (H - 10);
          const x = i * bw + 2;
          const w = bw - 4;
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={i * bw} y={0} width={bw} height={H} fill="transparent" />
              {d.count > 0 && (
                <path
                  d={`M${x},${H} V${H - h + 4} q0,-4 4,-4 h${w - 8} q4,0 4,4 V${H} Z`}
                  fill="#168BFF"
                  opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {(i % 2 === 0 || i === data.length - 1) && (
                <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#64748b">
                  {d.day.slice(8)}/{d.day.slice(5, 7)}
                </text>
              )}
            </g>
          );
        })}
        <text x="2" y={10} fontSize="10" fill="#64748b">
          {max}
        </text>
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-2 rounded-md bg-navy px-2 py-1 text-xs text-white shadow"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translateX(-50%)' }}
        >
          {new Date(data[hover].day).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}: <b>{data[hover].count}</b>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data, error, loading } = useApi<Overview>('/api/admin/overview');
  if (error) return <Alert>{error}</Alert>;
  if (loading || !data) return <p className="text-slate-500">Loading dashboard…</p>;
  const c = data.counts;
  const tiles = [
    { label: 'Total enquiries', value: c.total, to: '/admin/enquiries' },
    { label: 'New', value: c.new, to: '/admin/enquiries?status=new' },
    { label: 'In progress', value: c.in_progress, to: '/admin/enquiries?status=in_progress' },
    { label: 'Completed', value: c.completed, to: '/admin/enquiries?status=completed' },
    { label: 'Emergency requests', value: c.emergency, sub: `${c.emergency_open} open`, to: '/admin/enquiries?urgency=emergency', alert: c.emergency_open > 0 },
  ];
  const maxSvc = Math.max(1, ...data.byService.map((s) => s.count));

  return (
    <>
      <PageTitle title="Dashboard" sub="Overview of website enquiries and requests." />
      <div className="space-y-4">
        {!data.system.emailConfigured && (
          <Alert kind="warn">
            Email notifications are not configured (SMTP settings missing in <code>.env</code>). Enquiries are stored here, but no email alerts are being sent.
          </Alert>
        )}
        {c.emergency_open > 0 && (
          <Alert kind="error">
            <b>{c.emergency_open}</b> open emergency request{c.emergency_open > 1 ? 's' : ''} need attention.{' '}
            <Link className="font-semibold underline" to="/admin/enquiries?urgency=emergency&status=new">
              View now
            </Link>
          </Alert>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:border-electric ${t.alert ? 'border-red-300' : 'border-slate-200'}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.label}</p>
            <p className="mt-2 font-display text-3xl font-bold text-navy">{t.value}</p>
            {t.sub && <p className={`mt-1 text-xs ${t.alert ? 'font-semibold text-red-600' : 'text-slate-500'}`}>{t.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Enquiries – last 14 days">
          <TrendChart data={data.daily} />
        </Card>
        <Card title="By service">
          {data.byService.length === 0 ? (
            <p className="text-sm text-slate-500">No enquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.byService.map((s) => (
                <li key={s.label}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate text-slate-700">{s.label}</span>
                    <span className="font-semibold text-navy">{s.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-electric" style={{ width: `${(s.count / maxSvc) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        className="mt-6"
        title="Recent enquiries"
        actions={
          <Link to="/admin/enquiries" className="text-sm font-semibold text-electric">
            View all →
          </Link>
        }
      >
        {data.recent.length === 0 ? (
          <p className="text-sm text-slate-500">No enquiries have been submitted yet.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  {['Reference', 'Customer', 'Service', 'Location', 'Urgency', 'Status', 'Received'].map((h) => (
                    <th key={h} className="px-5 py-2 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recent.map((e) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-xs">
                      <Link to={`/admin/enquiries/${e.id}`} className="font-semibold text-electric">
                        {e.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{e.fullName}</td>
                    <td className="px-5 py-3">{e.service ?? '—'}</td>
                    <td className="px-5 py-3">{e.location ?? '—'}</td>
                    <td className="px-5 py-3"><UrgencyBadge u={e.urgency} /></td>
                    <td className="px-5 py-3"><StatusBadge s={e.status} /></td>
                    <td className="px-5 py-3 text-slate-500">{fmtDateTime(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
