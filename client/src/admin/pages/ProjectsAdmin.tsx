import { useState, type FormEvent } from 'react';
import { useApi } from '../auth';
import { api, ApiError } from '../../lib/api';
import { useSite } from '../../lib/site';
import { Alert, Card, PageTitle, Toggle, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../ui';
import type { ImageRef, Project } from '../../lib/types';

const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type Form = Omit<Project, 'id' | 'scope'> & { scope: string };
const EMPTY: Form = {
  slug: '', title: '', location: '', category: 'Residential Projects', description: '', scope: '', images: [],
  beforeImage: null, afterImage: null, completedOn: '', featured: false, published: false, sort: 0,
};

async function upload(file: File): Promise<ImageRef> {
  const fd = new FormData();
  fd.append('image', file);
  const r = await api<{ src: string; thumb: string }>('/api/admin/media', { body: fd });
  return { ...r, alt: '' };
}

function ImageSlot({ label, value, onChange }: { label: string; value: ImageRef | null; onChange: (v: ImageRef | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div>
      <span className={labelCls}>{label}</span>
      {value ? (
        <div className="relative w-40">
          <img src={value.thumb ?? value.src} alt="" className="aspect-[4/3] w-40 rounded-lg object-cover" />
          <button type="button" className="absolute right-1 top-1 rounded bg-white/90 px-1.5 text-xs text-red-600" onClick={() => onChange(null)}>Remove</button>
        </div>
      ) : (
        <label className={`${btnSecondary} cursor-pointer`}>
          {busy ? 'Uploading…' : 'Upload image'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true); setErr('');
            try { onChange(await upload(file)); } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
          }} />
        </label>
      )}
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

export default function ProjectsAdmin() {
  const { data, error, reload } = useApi<{ items: Project[] }>('/api/admin/projects');
  const site = useSite();
  const categories = site.data?.options.projectCategories ?? [];
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [err, setErr] = useState<ApiError | null>(null);
  const [uploading, setUploading] = useState(false);

  const open = (p?: Project) => {
    setErr(null);
    setEditing(p ? p.id : 'new');
    setForm(p ? { ...p, scope: p.scope.join('\n') } : EMPTY);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const body = { ...form, sort: Number(form.sort) || 0, scope: form.scope.split('\n').map((s) => s.trim()).filter(Boolean) };
    try {
      if (editing === 'new') await api('/api/admin/projects', { body });
      else await api(`/api/admin/projects/${editing}`, { method: 'PUT', body });
      setEditing(null);
      reload();
      site.reload();
    } catch (x) {
      setErr(x as ApiError);
    }
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Delete project "${p.title}"?`)) return;
    await api(`/api/admin/projects/${p.id}`, { method: 'DELETE' });
    reload();
  };

  const addGallery = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const imgs: ImageRef[] = [];
      for (const f of Array.from(files)) imgs.push(await upload(f));
      setForm((x) => ({ ...x, images: [...x.images, ...imgs] }));
    } catch (x) {
      setErr(x as ApiError);
    } finally {
      setUploading(false);
    }
  };

  const f = (k: keyof Form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageTitle title="Projects" sub="Portfolio projects. Only publish real projects with genuine photos." actions={<button type="button" className={btnPrimary} onClick={() => open()}>Add project</button>} />
      {error && <Alert>{error}</Alert>}
      {editing !== null && (
        <Card title={editing === 'new' ? 'New project' : 'Edit project'} className="mb-6">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            {err && <div className="md:col-span-2"><Alert>{err.message}{err.fields && <ul className="mt-1 list-disc pl-5">{Object.entries(err.fields).map(([k, v]) => <li key={k}>{k}: {v}</li>)}</ul>}</Alert></div>}
            <div>
              <label className={labelCls} htmlFor="p-title">Project name</label>
              <input id="p-title" required className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editing === 'new' ? slugify(e.target.value) : form.slug })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-slug">URL slug</label>
              <input id="p-slug" required className={inputCls} value={form.slug} onChange={f('slug')} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-loc">Location</label>
              <input id="p-loc" className={inputCls} placeholder="e.g. Sector 54, Gurugram" value={form.location} onChange={f('location')} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-cat">Category</label>
              <select id="p-cat" className={inputCls} value={form.category} onChange={f('category')}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls} htmlFor="p-desc">Description</label>
              <textarea id="p-desc" rows={4} className={inputCls} value={form.description} onChange={f('description')} />
            </div>
            <div>
              <label className={labelCls} htmlFor="p-scope">Scope of work (one per line)</label>
              <textarea id="p-scope" rows={5} className={inputCls} value={form.scope} onChange={f('scope')} />
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls} htmlFor="p-done">Completed (optional)</label>
                <input id="p-done" className={inputCls} placeholder="e.g. March 2025" value={form.completedOn} onChange={f('completedOn')} />
              </div>
              <div className="flex flex-wrap gap-4">
                <Toggle checked={form.published} onChange={(v) => setForm({ ...form, published: v })} label="Published" />
                <Toggle checked={form.featured} onChange={(v) => setForm({ ...form, featured: v })} label="Featured" />
              </div>
            </div>
            <div className="md:col-span-2">
              <span className={labelCls}>Gallery images</span>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={img.src} className="w-36">
                    <img src={img.thumb ?? img.src} alt="" className="aspect-[4/3] w-36 rounded-lg object-cover" />
                    <input className={`${inputCls} mt-1 !py-1 text-xs`} placeholder="Alt text" value={img.alt} onChange={(e) => setForm({ ...form, images: form.images.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)) })} />
                    <button type="button" className="mt-1 text-xs text-red-600" onClick={() => setForm({ ...form, images: form.images.filter((_, k) => k !== i) })}>Remove</button>
                  </div>
                ))}
                <label className={`${btnSecondary} h-fit cursor-pointer`}>
                  {uploading ? 'Uploading…' : 'Add images'}
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => addGallery(e.target.files)} />
                </label>
              </div>
            </div>
            <ImageSlot label="Before image (for comparison)" value={form.beforeImage} onChange={(v) => setForm({ ...form, beforeImage: v })} />
            <ImageSlot label="After image (for comparison)" value={form.afterImage} onChange={(v) => setForm({ ...form, afterImage: v })} />
            <div className="flex gap-2 md:col-span-2">
              <button type="submit" className={btnPrimary}>Save project</button>
              <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {data?.items.length === 0 ? (
          <p className="text-sm text-slate-500">No projects yet. Add your first completed project with real photos.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {(data?.items ?? []).map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  {p.images[0] ? <img src={p.images[0].thumb ?? p.images[0].src} alt="" className="h-12 w-16 rounded object-cover" /> : <div className="h-12 w-16 rounded bg-slate-100" />}
                  <div>
                    <p className="font-medium">
                      {p.title} {!p.published && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs text-slate-600">Draft</span>}
                    </p>
                    <p className="text-xs text-slate-500">{[p.category, p.location].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={btnSecondary} onClick={() => open(p)}>Edit</button>
                  <button type="button" className={btnDanger} onClick={() => remove(p)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
