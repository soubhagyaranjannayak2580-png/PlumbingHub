import { useState, type FormEvent } from 'react';
import { useApi, useAuth } from '../auth';
import { api } from '../../lib/api';
import { Alert, Card, PageTitle, btnPrimary, btnSecondary, fmtDateTime, inputCls, labelCls } from '../ui';
import type { AdminUser } from '../../lib/types';

export default function UsersAdmin() {
  const { user: me } = useAuth();
  const { data, error, reload } = useApi<{ items: AdminUser[] }>('/api/admin/users');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' as 'admin' | 'staff' });
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [show, setShow] = useState(false);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/admin/users', { body: form });
      setForm({ name: '', email: '', password: '', role: 'staff' });
      setShow(false);
      setMsg({ kind: 'success', text: 'User created.' });
      reload();
    } catch (x) {
      setMsg({ kind: 'error', text: (x as Error).message });
    }
  };

  const patch = async (u: AdminUser, body: Record<string, unknown>, ok: string) => {
    try {
      await api(`/api/admin/users/${u.id}`, { method: 'PATCH', body });
      setMsg({ kind: 'success', text: ok });
      reload();
    } catch (x) {
      setMsg({ kind: 'error', text: (x as Error).message });
    }
  };

  const resetPassword = (u: AdminUser) => {
    const pw = window.prompt(`New password for ${u.email} (min 10 characters):`);
    if (pw) patch(u, { password: pw }, 'Password updated.');
  };

  return (
    <>
      <PageTitle title="Users & Access" sub="Admins manage everything. Staff can view and update enquiries only." actions={<button type="button" className={btnPrimary} onClick={() => setShow(true)}>Add user</button>} />
      {msg && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
      {error && <Alert>{error}</Alert>}
      {show && (
        <Card title="New user" className="mb-6">
          <form onSubmit={create} className="grid gap-4 md:grid-cols-4">
            <div>
              <label className={labelCls} htmlFor="u-name">Name</label>
              <input id="u-name" required className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="u-email">Email</label>
              <input id="u-email" type="email" required className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="u-pw">Temporary password</label>
              <input id="u-pw" type="password" minLength={10} required autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="u-role">Role</label>
              <select id="u-role" className={inputCls} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'staff' })}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 md:col-span-4">
              <button type="submit" className={btnPrimary}>Create user</button>
              <button type="button" className={btnSecondary} onClick={() => setShow(false)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card>
        <div className="-mx-5 -my-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {['Name', 'Email', 'Role', 'Status', 'Last login', ''].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium">{u.name}{self && <span className="ml-1 text-xs text-slate-400">(you)</span>}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <select aria-label={`Role for ${u.email}`} disabled={self} className={`${inputCls} !w-28 !py-1`} value={u.role} onChange={(e) => patch(u, { role: e.target.value }, 'Role updated.')}>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">{u.active ? <span className="text-emerald-700">Active</span> : <span className="text-slate-500">Disabled</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : 'Never'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" className={`${btnSecondary} !px-2 !py-1 text-xs`} onClick={() => resetPassword(u)}>Reset password</button>
                        {!self && (
                          <button type="button" className={`${btnSecondary} !px-2 !py-1 text-xs`} onClick={() => patch(u, { active: !u.active }, u.active ? 'User disabled.' : 'User enabled.')}>
                            {u.active ? 'Disable' : 'Enable'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
