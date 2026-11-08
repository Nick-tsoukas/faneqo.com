'use strict';

/**
 * Shared HTML/text builders for band → fan campaign email.
 * Extracted from show-message so Fan List / announcements can reuse.
 */

function siteUrl() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  return `https://${process.env.PUBLIC_HOSTNAME || 'faneqo.com'}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function noteToHtml(note) {
  return escapeHtml(note)
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function buildUnsubscribeHeaders(unsubscribeUrl) {
  return {
    'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@faneqo.com>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** CAN-SPAM physical postal address shown in band → fan footers. */
function physicalMailingAddress() {
  const fromEnv = String(process.env.FANEQO_PHYSICAL_ADDRESS || '').trim();
  if (fromEnv) return fromEnv;
  return '1122 Holiday Drive, Somonauk, IL 60552';
}

function complianceFooterLines(unsubscribeUrl) {
  const address = physicalMailingAddress();
  return {
    address,
    textLines: [address, `Unsubscribe: ${unsubscribeUrl}`],
    htmlBlock: `
  <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">${escapeHtml(address)}</p>
  <p style="margin:0;color:#6b7280;font-size:12px;">
    <a href="${unsubscribeUrl}" style="color:#6b7280;">Unsubscribe</a>
  </p>`.trim(),
  };
}

function showLabel(recap) {
  const parts = [recap?.venue, recap?.city]
    .map((part) => String(part || '').trim())
    .filter(Boolean);

  if (parts.length) return parts.join(' · ');

  const title = String(recap?.showTitle || '').trim();
  return title || 'the show';
}

function showDateLabel(recap) {
  const raw = recap?.showStartedAt || recap?.showEndedAt;
  if (!raw) return '';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: recap.timezone || 'UTC',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (err) {
    return '';
  }
}

function buildShowMessageEmail({ recap, bandName, subject, note, unsubscribeUrl, fan, defaultSubject }) {
  const greeting = fan.firstName ? `Hi ${fan.firstName},` : 'Hi,';
  const place = showLabel(recap);
  const dateLabel = showDateLabel(recap);
  const attended = dateLabel ? `${place} on ${dateLabel}` : place;

  const finalSubject = String(subject || '').trim() || defaultSubject;
  const footer = `You're getting this because you checked in at ${attended}.`;

  const compliance = complianceFooterLines(unsubscribeUrl);
  const text = [
    greeting,
    '',
    note.trim(),
    '',
    '—',
    `${bandName}`,
    '',
    footer,
    ...compliance.textLines,
  ].join('\n');

  const html = `
<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.6;color:#111827;max-width:520px;">
  <p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
  ${noteToHtml(note.trim())}
  <p style="margin:24px 0 0;color:#111827;font-weight:600;">${escapeHtml(bandName)}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 14px;">
  <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">${escapeHtml(footer)}</p>
  ${compliance.htmlBlock}
</div>`.trim();

  return { subject: finalSubject, text, html };
}

function buildFanListEmail({ bandName, subject, note, unsubscribeUrl, fan }) {
  const greeting = fan.firstName ? `Hi ${fan.firstName},` : 'Hi,';
  const finalSubject = String(subject || '').trim() || `A note from ${bandName}`;
  const footer = `You're getting this because you joined the ${bandName} fan list on Faneqo.`;
  const compliance = complianceFooterLines(unsubscribeUrl);

  const text = [
    greeting,
    '',
    note.trim(),
    '',
    '—',
    `${bandName}`,
    '',
    footer,
    ...compliance.textLines,
  ].join('\n');

  const html = `
<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.6;color:#111827;max-width:520px;">
  <p style="margin:0 0 14px;">${escapeHtml(greeting)}</p>
  ${noteToHtml(note.trim())}
  <p style="margin:24px 0 0;color:#111827;font-weight:600;">${escapeHtml(bandName)}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 14px;">
  <p style="margin:0 0 6px;color:#6b7280;font-size:12px;">${escapeHtml(footer)}</p>
  ${compliance.htmlBlock}
</div>`.trim();

  return { subject: finalSubject, text, html };
}

module.exports = {
  siteUrl,
  escapeHtml,
  noteToHtml,
  buildUnsubscribeHeaders,
  physicalMailingAddress,
  buildShowMessageEmail,
  buildFanListEmail,
  showLabel,
  showDateLabel,
};
