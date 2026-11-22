import { useState, type FormEvent } from 'react';
import { useApi } from '../auth';
import { api, ApiError } from '../../lib/api';
import { Alert, Card, PageTitle, Toggle, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../ui';
import ServiceIcon from '../../components/ui/ServiceIcon';
import type { Service, ServiceIcon as IconKey } from '../../lib/types';

const ICONS: IconKey[] = ['residential', 'commercial', 'industrial', 'bathroom', 'supply', 'drainage', 'maintenance', 'mep'];
const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Form = Omit<Service, 'id' | 'features'> & { features: string };
const EMPTY: Form = { slug: '', title: '', summary: '', description: '', features: '', icon: 'residential', sort: 0, published: true };

export default function ServicesAdmin() {
  const { data, error, reload } = useApi<{ items: Service[] }>('/api/admin/services');
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState<ApiError | null>(null);

  const open = (s?: Service) => {
    setErr(null);
    setEditing(s ? s.id : 'new');
    setForm(s ? { ...s, features: s.features.join('\n') } : { ...EMPTY, sort: data?.items.length ?? 0 });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = { ...form, sort: Number(form.sort) || 0, features: form.features.split('\n').map((f) => f.trim()).filter(Boolean) };
    try {
      if (editing === 'new') await api('/api/admin/services', { body });
      else await api(`/api/admin/services/${editing}`, { method: 'PUT', body });
      setEditing(null);
      reload();
    } catch (x) {
      setErr(x as ApiError);
    }
  };

  const remove = async (s: Service) => {
    if (!window.confirm(`Delete service "${s.title}"? Its public page will be removed.`)) return;
    await api(`/api/admin/services/${s.id}`, { method: 'DELETE' });
    reload();
  };

  const f = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageTitle title="Services" sub="Services shown on the website, service pages and enquiry form." actions={<button type="button" className={btnPrimary} onClick={() => open()}>Add service</button>} />
      {error && <Alert>{error}</Alert>}
      {editing !== null && (
        <Card title={editing === 'new' ? 'New service' : 'Edit service'} className="mb-6">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            {err && <div className="md:col-span-2"><Alert>{err.message}{err.fields && <ul className="mt-1 list-disc pl-5">{Object.entries(err.fields).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>}</Alert></div>}
            <div>
              <label className={labelCls} htmlFor="s-title">Title</label>
              <input id="s-title" required className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-slug">URL slug</label>
              <input id="s-slug" required className={inputCls} value={form.slug} onChange={f('slug')} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls} htmlFor="s-sum">Summary</label>
              <input id="s-sum" className={inputCls} value={form.summary} onChange={f('summary')} maxLength={300} />
            </div>
            <div className="md:col-span-2">
              <label className={labelCls} htmlFor="s-desc">Description</label>
              <textarea id="s-desc" rows={4} className={inputCls} value={form.description} onChange={f('description')} />
            </div>
            <div>
              <label className={labelCls} htmlFor="s-feat">Features (one per line)</label>
              <textarea id="s-feat" rows={5} className={inputCls} value={form.features} onChange={f('features')} />
            </div>
            <div className="space-y-4">
              <div>
                <span className={labelCls}>Icon</span>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((i) => (
                    <button key={i} type="button" title={i} onClick={() => setForm({ ...form, icon: i })} className={`grid h-12 w-12 place-items-center rounded-lg border ${form.icon === i ? 'border-electric bg-electric/10' : 'border-slate-200'}`}>
                      <ServiceIcon icon={i} className="h-8 w-8 text-navy" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div className="w-24">
                  <label className={labelCls} htmlFor="s-sort">Order</label>
                  <input id="s-sort" type="number" className={inputCls} value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} />
                </div>
                <Toggle checked={form.published} onChange={(v) => setForm({ ...form, published: v })} label="Published" />
              </div>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className={btnPrimary}>Save service</button>
              <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <ul className="divide-y divide-slate-100">
          {(data?.items ?? []).map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <ServiceIcon icon={s.icon} className="h-9 w-9 text-navy" />
                <div>
                  <p className="font-medium">
                    {s.title} {!s.published && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs text-slate-600">Hidden</span>}
                  </p>
                  <p className="text-xs text-slate-500">/services/{s.slug}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className={btnSecondary} onClick={() => open(s)}>Edit</button>
                <button type="button" className={btnDanger} onClick={() => remove(s)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
