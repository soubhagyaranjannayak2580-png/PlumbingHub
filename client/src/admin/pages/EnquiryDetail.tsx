import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi, useAuth } from '../auth';
import { api } from '../../lib/api';
import { whatsappHref } from '../../lib/site';
import { Alert, Card, PageTitle, StatusBadge, UrgencyBadge, btnDanger, btnPrimary, btnSecondary, fmtDate, fmtDateTime, inputCls, labelCls } from '../ui';
import type { Enquiry, EnquiryStatus, Technician } from '../../lib/types';

interface Detail {
  enquiry: Enquiry;
  images: { id: number; name: string | null; size: number; url: string }[];
  notes: { id: number; kind: 'note' | 'event'; body: string; author: string | null; createdAt: string }[];
}

export default function EnquiryDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi<Detail>(`/api/admin/enquiries/${id}`);
  const techs = useApi<{ items: Technician[] }>('/api/admin/technicians');
  const [form, setForm] = useState({ status: 'new' as EnquiryStatus, technicianId: '', scheduledDate: '', scheduledTime: '' });
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    const e = data.enquiry;
    setForm({ status: e.status, technicianId: e.technicianId ? String(e.technicianId) : '', scheduledDate: e.scheduledDate ?? '', scheduledTime: e.scheduledTime ?? '' });
  }, [data]);

  if (error) return <Alert>{error}</Alert>;
  if (loading || !data) return <p className="text-slate-500">Loading…</p>;
  const e = data.enquiry;

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api(`/api/admin/enquiries/${e.id}`, {
        method: 'PATCH',
        body: {
          status: form.status,
          technicianId: form.technicianId ? Number(form.technicianId) : null,
          scheduledDate: form.scheduledDate || null,
          scheduledTime: form.scheduledTime || null,
        },
      });
      setMsg({ kind: 'success', text: 'Enquiry updated.' });
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const addNote = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api(`/api/admin/enquiries/${e.id}/notes`, { body: { body: note } });
      setNote('');
      reload();
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Permanently delete enquiry ${e.reference} and its photos? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/enquiries/${e.id}`, { method: 'DELETE' });
      navigate('/admin/enquiries');
    } catch (err) {
      setMsg({ kind: 'error', text: (err as Error).message });
    }
  };

  const rows: [string, React.ReactNode][] = [
    ['Mobile', <a key="m" className="text-electric" href={`tel:${e.mobile}`}>{e.mobile}</a>],
    ['Email', e.email ? <a key="e" className="text-electric" href={`mailto:${e.email}`}>{e.email}</a> : '—'],
    ['Location', e.location ?? '—'],
    ['Address', e.address ?? '—'],
    ['Property type', e.propertyType ?? '—'],
    ['Service', e.service ?? '—'],
    ['Preferred date', fmtDate(e.preferredDate)],
    ['Preferred time', e.preferredTime ?? '—'],
    ['Submitted via', e.kind === 'booking' ? 'Service booking form' : e.kind === 'emergency' ? 'Emergency form' : 'Contact form'],
    ['Received', fmtDateTime(e.createdAt)],
    ['Email alert', e.emailNotified ? 'Sent' : 'Not sent'],
  ];

  return (
    <>
      <Link to="/admin/enquiries" className="text-sm text-electric">
        ← Back to enquiries
      </Link>
      <PageTitle
        title={e.reference}
        sub={`${e.fullName} · ${e.service ?? 'General'}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <UrgencyBadge u={e.urgency} />
            <StatusBadge s={e.status} />
            <a href={whatsappHref(e.mobile, `Hello ${e.fullName}, regarding your enquiry ${e.reference}: `)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
              WhatsApp customer
            </a>
            {user?.role === 'admin' && (
              <button type="button" onClick={remove} className={btnDanger}>
                Delete
              </button>
            )}
          </div>
        }
      />
      {msg && (
        <div className="mb-4">
          <Alert kind={msg.kind}>{msg.text}</Alert>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="Customer & request">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {rows.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                  <dd className="mt-0.5 text-sm text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-navy">{e.description}</p>
            </div>
          </Card>

          <Card title={`Photos (${data.images.length})`}>
            {data.images.length === 0 ? (
              <p className="text-sm text-slate-500">No photos were uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.images.map((img) => (
                  <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg border border-slate-200">
                    <img src={img.url} alt={img.name ?? 'Customer photo'} className="aspect-square w-full object-cover" loading="lazy" />
                  </a>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Manage">
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="st">
                  Status
                </label>
                <select id="st" className={inputCls} value={form.status} onChange={(x) => setForm({ ...form, status: x.target.value as EnquiryStatus })}>
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className={labelCls} htmlFor="tech">
                  Assigned technician
                </label>
                <select id="tech" className={inputCls} value={form.technicianId} onChange={(x) => setForm({ ...form, technicianId: x.target.value })}>
                  <option value="">Unassigned</option>
                  {(techs.data?.items ?? [])
                    .filter((t) => t.active || String(t.id) === form.technicianId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.specialization ? ` – ${t.specialization}` : ''}
                        {typeof t.openJobs === 'number' ? ` (${t.openJobs} open)` : ''}
                      </option>
                    ))}
                </select>
                {techs.data && techs.data.items.length === 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    No technicians yet. <Link className="text-electric" to="/admin/technicians">Add technicians</Link>.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="sd">
                    Appointment date
                  </label>
                  <input id="sd" type="date" className={inputCls} value={form.scheduledDate} onChange={(x) => setForm({ ...form, scheduledDate: x.target.value })} />
                </div>
                <div>
                  <label className={labelCls} htmlFor="stime">
                    Appointment time
                  </label>
                  <input id="stime" type="time" className={inputCls} value={form.scheduledTime} onChange={(x) => setForm({ ...form, scheduledTime: x.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
                Save changes
              </button>
            </form>
          </Card>

          <Card title="Internal notes & activity">
            <form onSubmit={addNote} className="space-y-2">
              <label className="sr-only" htmlFor="note">
                Add internal note
              </label>
              <textarea id="note" rows={3} className={inputCls} placeholder="Add an internal note (not visible to customer)…" value={note} onChange={(x) => setNote(x.target.value)} maxLength={2000} />
              <button type="submit" disabled={busy || !note.trim()} className={btnSecondary}>
                Add note
              </button>
            </form>
            <ol className="mt-5 space-y-3">
              {data.notes.map((n) => (
                <li key={n.id} className={`rounded-lg p-3 text-sm ${n.kind === 'note' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className={n.kind === 'event' ? 'text-slate-600' : 'whitespace-pre-wrap text-navy'}>{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.kind === 'note' ? 'Note' : 'Activity'} · {n.author ?? 'System'} · {fmtDateTime(n.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
