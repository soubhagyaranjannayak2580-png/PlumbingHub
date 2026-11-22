import { useState, type FormEvent } from 'react';
import { useApi, useAuth } from '../auth';
import { api } from '../../lib/api';
import { Alert, Card, PageTitle, Toggle, btnDanger, btnPrimary, btnSecondary, inputCls, labelCls } from '../ui';
import type { Technician } from '../../lib/types';

const EMPTY = { name: '', phone: '', specialization: '', active: true };

export default function Technicians() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data, error, reload } = useApi<{ items: Technician[] }>('/api/admin/technicians');
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');

  const open = (t?: Technician) => {
    setMsg('');
    setEditing(t ? t.id : 'new');
    setForm(t ? { name: t.name, phone: t.phone ?? '', specialization: t.specialization ?? '', active: t.active } : EMPTY);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editing === 'new') await api('/api/admin/technicians', { body: form });
      else await api(`/api/admin/technicians/${editing}`, { method: 'PUT', body: form });
      setEditing(null);
      reload();
    } catch (err) {
      setMsg((err as Error).message);
    }
  };

  const remove = async (t: Technician) => {
    if (!window.confirm(`Remove ${t.name}? Their enquiries will become unassigned.`)) return;
    await api(`/api/admin/technicians/${t.id}`, { method: 'DELETE' }).catch((err) => setMsg(err.message));
    reload();
  };

  return (
    <>
      <PageTitle
        title="Technicians"
        sub="Field technicians that enquiries can be assigned to."
        actions={isAdmin && <button type="button" className={btnPrimary} onClick={() => open()}>Add technician</button>}
      />
      {error && <Alert>{error}</Alert>}
      {editing !== null && (
        <Card title={editing === 'new' ? 'New technician' : 'Edit technician'} className="mb-6">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
            {msg && <div className="md:col-span-3"><Alert>{msg}</Alert></div>}
            <div>
              <label className={labelCls} htmlFor="tn">Name</label>
              <input id="tn" required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="tp">Phone</label>
              <input id="tp" className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="ts">Specialization</label>
              <input id="ts" className={inputCls} placeholder="e.g. Drainage, Bathroom fit-outs" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            </div>
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} label="Active" />
            <div className="flex gap-2 md:col-span-3">
              <button type="submit" className={btnPrimary}>Save</button>
              <button type="button" className={btnSecondary} onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        {!data ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-slate-500">No technicians added yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.items.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    {t.name} {!t.active && <span className="ml-1 rounded bg-slate-200 px-1.5 text-xs text-slate-600">Inactive</span>}
                  </p>
                  <p className="text-xs text-slate-500">{[t.phone, t.specialization, `${t.openJobs ?? 0} open jobs`].filter(Boolean).join(' · ')}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button type="button" className={btnSecondary} onClick={() => open(t)}>Edit</button>
                    <button type="button" className={btnDanger} onClick={() => remove(t)}>Remove</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
