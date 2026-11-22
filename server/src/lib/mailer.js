import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter = null;

export function emailConfigured() {
  return Boolean(config.smtp.host && config.smtp.from);
}

function getTransport() {
  if (!emailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transporter;
}

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Sends the new-enquiry notification to the company. Returns true only when the SMTP server accepted it.
 */
export async function sendEnquiryNotification(enquiry, business, imageCount) {
  const transport = getTransport();
  const to = business.notificationEmail || config.notifyEmail || business.email;
  if (!transport || !to) return false;

  const rows = [
    ['Reference', enquiry.reference],
    ['Type', enquiry.kind],
    ['Urgency', enquiry.urgency.toUpperCase()],
    ['Name', enquiry.full_name],
    ['Mobile', enquiry.mobile],
    ['Email', enquiry.email || '—'],
    ['Location', enquiry.location || '—'],
    ['Address', enquiry.address || '—'],
    ['Property type', enquiry.property_type || '—'],
    ['Service', enquiry.service || '—'],
    ['Preferred date', enquiry.preferred_date || '—'],
    ['Preferred time', enquiry.preferred_time || '—'],
    ['Photos attached', String(imageCount)],
  ];
  const urgentPrefix = enquiry.urgency === 'emergency' ? '[EMERGENCY] ' : enquiry.urgency === 'urgent' ? '[URGENT] ' : '';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px">
      <h2 style="color:#0B2239">New ${esc(enquiry.kind)} enquiry – ${esc(enquiry.reference)}</h2>
      <table style="border-collapse:collapse;width:100%">${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 10px;border:1px solid #e3e8ee;background:#F3F6F9;width:160px"><b>${esc(k)}</b></td><td style="padding:6px 10px;border:1px solid #e3e8ee">${esc(v)}</td></tr>`,
        )
        .join('')}</table>
      <h3 style="color:#0B2239">Description</h3>
      <p style="white-space:pre-wrap">${esc(enquiry.description)}</p>
      <p><a href="${esc(config.siteUrl)}/admin/enquiries/${enquiry.id}">Open in admin dashboard</a></p>
    </div>`;

  try {
    await transport.sendMail({
      from: config.smtp.from,
      to,
      replyTo: enquiry.email || undefined,
      subject: `${urgentPrefix}New enquiry ${enquiry.reference} – ${enquiry.service || enquiry.kind} (${enquiry.location || 'location n/a'})`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n') + `\n\n${enquiry.description}`,
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send enquiry notification:', err.message);
    return false;
  }
}

export async function sendCustomerAcknowledgement(enquiry, business) {
  const transport = getTransport();
  if (!transport || !enquiry.email) return false;
  const company = business.legalName || business.companyName;
  try {
    await transport.sendMail({
      from: config.smtp.from,
      to: enquiry.email,
      subject: `We received your request – ${enquiry.reference}`,
      text: `Dear ${enquiry.full_name},\n\nThank you for contacting ${company}. Your enquiry reference number is ${enquiry.reference}.\nOur team will review your request and get in touch on ${enquiry.mobile}.\n\nRegards,\n${company}`,
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send customer acknowledgement:', err.message);
    return false;
  }
}
