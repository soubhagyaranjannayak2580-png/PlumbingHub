import { useState, type FormEvent } from 'react';
import { useApi } from '../auth';
import { api } from '../../lib/api';
import { useSite } from '../../lib/site';
import { Alert, Card, PageTitle, Toggle, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../ui';
import type { Testimonial } from '../../lib/types';

type Form = Omit<Testimonial, 'id'>;
const EMPTY: Form = { name: '', projectType: '', location: '', feedback: '', rating: null, ratingVerified: false, published: false, sort: 0 };

export default function TestimonialsAdmin() {
  const { data, error, reload } = useApi<{ items: Testimonial[] }>('/api/admin/testimonials');
  const site = useSite();
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [msg, setMsg] = useState('');

  const open = (t?: Testimonial) => {
    setMsg('');
    setEditing(t ? t.id : 'new');
    setForm(t ? { ...t } : EMPTY);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api('/api/admin/testimonials', { body: form });
      else await api(`/api/admin/testimonials/${editing}`, { method: 'PUT', body: form });
      setEditing(null);
      reload();
      site.reload();
    } catch (x) {
      setMsg((x as Error).message);
    }
  };

  const remove = async (t: Testimonial) => {
    if (!window.confirm(`Delete testimonial from ${t.name}?`)) return;
    await api(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
    reload();
    site.reload();
  };

  return (
    <>
      <PageTitle title="Testimonials" sub="Publish only genuine feedback from real clients." actions={<button type="button" className={btnPrimary} onClick={() => open()}>Add testimonial</button>} />
      <div className="mb-6">
        <Alert kind="info">Star ratings appear on the website only when “Rating verified” is enabled (e.g. matched to a Google review or written client feedback).</Alert>
      </div>
      {error && <Alert>{error}</Alert>}
      {editing !== null && (
        <Card title={editing === 'new' ? 'New testimonial' : 'Edit testimonial'} className="mb-6">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
            {msg && <div className="md:col-span-3"><Alert>{msg}</Alert></div>}
            <div>
              <label className={labelCls} htmlFor="t-name">Customer name</label>
              <input id="t-name" required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="t-type">Project type</label>
              <input id="t-type" className={inputCls} value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="t-loc">Location</label>
              <input id="t-loc" className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls} htmlFor="t-fb">Feedback</label>
              <textarea id="t-fb" required rows={4} className={inputCls} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="t-rating">Rating</label>
              <select id="t-rating" className={inputCls} value={form.rating ?? ''} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })}>
                <option value="">No rating</option>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} / 5</option>)}
              </select>
            </div>
            <div className="flex flex-col justify-end gap-3 md:col-span-2 md:flex-row md:items-end">
              <Toggle checked={form.ratingVerified} onChange={(v) => setForm({ ...form, ratingVerified: v })} label="Rating verified" />
              <Toggle checked={form.published} onChange={(v) => setForm({ ...form, published: v })} label="Published" />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className={btnPrimary}>Save</button>
              <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {data?.items.length === 0 ? (
          <p className="text-sm text-slate-500">No testimonials yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(data?.items ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="max-w-2xl">
                  <p className="font-medium">
                    {t.name} {!t.published && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs text-slate-600">Hidden</span>}
                    {t.rating && <span className="ml-2 text-xs text-slate-500">{t.rating}/5 {t.ratingVerified ? '(verified)' : '(not shown – unverified)'}</span>}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{t.feedback}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={btnSecondary} onClick={() => open(t)}>Edit</button>
                  <button type="button" className={btnDanger} onClick={() => remove(t)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
