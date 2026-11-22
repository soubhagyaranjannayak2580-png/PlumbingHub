import { useEffect, useState, type FormEvent } from 'react';
import { useApi } from '../auth';
import { api, ApiError } from '../../lib/api';
import { useSite } from '../../lib/site';
import { Alert, Card, PageTitle, Toggle, btnPrimary, inputCls, labelCls } from '../ui';
import type { Business } from '../../lib/types';

export default function SettingsAdmin() {
  const { data, error } = useApi<{ business: Business; system: { emailConfigured: boolean; notifyEmailEnv: boolean } }>('/api/admin/settings');
  const site = useSite();
  const [b, setB] = useState<Business | null>(null);
  const [areas, setAreas] = useState('');
  const [msg, setMsg] = useState<{ kind: 'success' | 'error'; text: string; fields?: Record<string, string> } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data) {
      setB(data.business);
      setAreas(data.business.serviceAreas.join('\n'));
    }
  }, [data]);

  if (error) return <Alert>{error}</Alert>;
  if (!b) return <p className="text-slate-500">Loading…</p>;

  const set = <K extends keyof Business>(k: K, v: Business[K]) => setB({ ...b, [k]: v });
  const text = (k: 'companyName' | 'legalName' | 'tagline' | 'phone' | 'whatsapp' | 'email' | 'mapEmbedQuery' | 'workingHours' | 'notificationEmail', label: string, hint?: string) => (
    <div>
      <label className={labelCls} htmlFor={`b-${k}`}>{label}</label>
      <input id={`b-${k}`} className={inputCls} value={(b[k] as string) ?? ''} onChange={(e) => set(k, e.target.value)} />
      {msg?.fields?.[k] && <p className="mt-1 text-xs text-red-600">{msg.fields[k]}</p>}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await api('/api/admin/settings', { method: 'PUT', body: { ...b, serviceAreas: areas.split('\n').map((a) => a.trim()).filter(Boolean) } });
      setMsg({ kind: 'success', text: 'Business information saved. The website is updated.' });
      site.reload();
    } catch (x) {
      const ae = x as ApiError;
      setMsg({ kind: 'error', text: ae.message, fields: ae.fields });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save}>
      <PageTitle title="Business Info" sub="Verified company details shown across the website, structured data and call/WhatsApp buttons." actions={<button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving…' : 'Save changes'}</button>} />
      {msg && <div className="mb-4"><Alert kind={msg.kind}>{msg.text}</Alert></div>}
      {!data?.system.emailConfigured && (
        <div className="mb-4"><Alert kind="warn">SMTP is not configured on the server, so enquiry emails are not sent. Add SMTP settings to <code>.env</code> and restart the server.</Alert></div>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Company">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('companyName', 'Brand name')}
            {text('legalName', 'Full / legal name')}
            <div className="sm:col-span-2">{text('tagline', 'Tagline')}</div>
          </div>
        </Card>
        <Card title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            {text('phone', 'Business phone', 'Enables Call buttons. Leave empty to hide them.')}
            {text('whatsapp', 'WhatsApp number', 'Include country code, e.g. +91 98XXXXXXXX.')}
            {text('email', 'Public business email')}
            {text('notificationEmail', 'Enquiry notification email', 'Internal – receives new enquiry alerts. Never shown publicly.')}
            <div className="sm:col-span-2">{text('workingHours', 'Working hours', 'e.g. Mon–Sat, 9:00 AM – 7:00 PM')}</div>
          </div>
        </Card>
        <Card title="Office address">
          <div className="grid gap-4 sm:grid-cols-2">
            {(['line1', 'line2', 'city', 'state', 'postalCode'] as const).map((k) => (
              <div key={k} className={k === 'line1' || k === 'line2' ? 'sm:col-span-2' : ''}>
                <label className={labelCls} htmlFor={`a-${k}`}>{{ line1: 'Address line 1', line2: 'Address line 2', city: 'City', state: 'State', postalCode: 'PIN code' }[k]}</label>
                <input id={`a-${k}`} className={inputCls} value={b.address[k]} onChange={(e) => set('address', { ...b.address, [k]: e.target.value })} />
              </div>
            ))}
            <div className="sm:col-span-2">{text('mapEmbedQuery', 'Google Maps search (optional)', 'Business name or address used for the embedded map. Defaults to the address above.')}</div>
          </div>
        </Card>
        <Card title="Emergency service">
          <div className="space-y-4">
            <Toggle checked={b.emergency.available24x7} onChange={(v) => set('emergency', { ...b.emergency, available24x7: v })} label="We provide 24/7 emergency service (only enable if confirmed)" />
            <div>
              <label className={labelCls} htmlFor="em-note">Emergency note</label>
              <input id="em-note" className={inputCls} placeholder="e.g. Emergency visits within city limits only" value={b.emergency.note} onChange={(e) => set('emergency', { ...b.emergency, note: e.target.value })} />
            </div>
            <div>
              <label className={labelCls} htmlFor="areas">Service areas (one per line)</label>
              <textarea id="areas" rows={5} className={inputCls} value={areas} onChange={(e) => setAreas(e.target.value)} />
            </div>
          </div>
        </Card>
        <Card title="Statistics (Why Choose Us)">
          <p className="mb-4 text-xs text-slate-500">Enter only verified figures. Leave a value empty to show “—”.</p>
          <div className="space-y-3">
            {b.stats.map((s, i) => (
              <div key={s.key} className="grid grid-cols-[1fr_110px_60px] gap-2">
                <input aria-label="Label" className={inputCls} value={s.label} onChange={(e) => set('stats', b.stats.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
                <input aria-label="Value" type="number" min={0} className={inputCls} value={s.value ?? ''} onChange={(e) => set('stats', b.stats.map((x, k) => (k === i ? { ...x, value: e.target.value === '' ? null : Number(e.target.value) } : x)))} />
                <input aria-label="Suffix" className={inputCls} value={s.suffix} maxLength={4} onChange={(e) => set('stats', b.stats.map((x, k) => (k === i ? { ...x, suffix: e.target.value } : x)))} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Social profiles">
          <div className="grid gap-4 sm:grid-cols-2">
            {(['facebook', 'instagram', 'linkedin', 'youtube'] as const).map((k) => (
              <div key={k}>
                <label className={labelCls} htmlFor={`so-${k}`}>{k}</label>
                <input id={`so-${k}`} type="url" className={inputCls} placeholder="https://" value={b.social[k]} onChange={(e) => set('social', { ...b.social, [k]: e.target.value })} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </form>
  );
}
