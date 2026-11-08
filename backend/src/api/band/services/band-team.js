'use strict';

/**
 * Band Team Access — invite lifecycle + owner team management (V1).
 *
 * Owner-only management. Invite email uses the Strapi email plugin
 * (mail.faneqo.com / EMAIL_DEFAULT_FROM). Never uses resendMailer / shows domain.
 *
 * Product permissions for managers/viewers live in `utils/bandRoles.js`
 * (`resolveBandAccess`) and are enforced on band/show-mode/event/QR routes.
 */

const crypto = require('crypto');
const {
  ROLE_OWNER,
  ROLE_MANAGER,
  ROLE_VIEWER,
  getBandRole,
  resolveBandAccess,
  ensureOwnerMemberRow,
} = require('../../../utils/bandRoles');

const INVITE_TTL_DAYS = 14;
const INVITABLE_ROLES = [ROLE_MANAGER, ROLE_VIEWER];
/** Minimum gap between resend emails for the same pending invite. */
const RESEND_COOLDOWN_MS = 60 * 1000;

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  return email.trim().toLowerCase();
}

function siteUrl() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  return `https://${process.env.PUBLIC_HOSTNAME || 'faneqo.com'}`;
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateRawToken() {
  return crypto.randomBytes(32).toString('hex');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function serializeMember(member) {
  const user = member.user || {};
  return {
    id: member.id,
    role: member.role,
    status: member.status,
    acceptedAt: member.acceptedAt || null,
    email: user.email || null,
    username: user.username || null,
  };
}

function serializeInvite(invite) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt || null,
    createdAt: invite.createdAt || null,
  };
}

async function assertOwner(strapi, bandId, userId) {
  const role = await getBandRole(strapi, bandId, userId);
  if (role !== ROLE_OWNER) {
    return { ok: false, error: 'forbidden', message: 'Only the band owner can manage Team Access.' };
  }
  return { ok: true };
}

async function getTeam({ strapi, bandId, userId }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  // Ensure legacy owners appear in the members list after first team view.
  await ensureOwnerMemberRow(strapi, bandId, userId);

  const [members, invites] = await Promise.all([
    strapi.entityService.findMany('api::band-member.band-member', {
      filters: { band: bandId, status: 'active' },
      populate: { user: { fields: ['id', 'email', 'username'] } },
      sort: { createdAt: 'asc' },
      limit: 200,
    }),
    strapi.entityService.findMany('api::band-invite.band-invite', {
      filters: { band: bandId, status: 'pending' },
      sort: { createdAt: 'desc' },
      limit: 200,
    }),
  ]);

  const now = Date.now();
  const pending = [];
  for (const invite of invites) {
    const exp = invite.expiresAt ? new Date(invite.expiresAt).getTime() : null;
    if (!exp || Number.isNaN(exp) || exp < now) {
      await strapi.entityService.update('api::band-invite.band-invite', invite.id, {
        data: { status: 'expired' },
      });
      continue;
    }
    pending.push(serializeInvite(invite));
  }

  const serializedMembers = members.map(serializeMember);
  const managerCount = serializedMembers.filter((m) => m.role === ROLE_MANAGER).length;
  const viewerCount = serializedMembers.filter((m) => m.role === ROLE_VIEWER).length;

  return {
    ok: true,
    data: {
      members: serializedMembers,
      pendingInvites: pending,
      summary: {
        memberCount: serializedMembers.length,
        managerCount,
        viewerCount,
        pendingInviteCount: pending.length,
      },
    },
  };
}

async function sendInviteEmail({ strapi, to, bandName, role, inviteUrl, inviterEmail }) {
  const from = process.env.EMAIL_DEFAULT_FROM || 'Faneqo <noreply@mail.faneqo.com>';
  const replyTo = process.env.EMAIL_DEFAULT_REPLY_TO || from;
  const safeBand = escapeHtml(bandName || 'an artist page');
  const safeRole = escapeHtml(role);
  const subject = `You're invited to help manage ${bandName || 'an artist page'} on Faneqo`;

  const text = [
    `You've been invited to join the team for ${bandName || 'an artist page'} on Faneqo as a ${role}.`,
    '',
    'This invite does not include a password.',
    `1) Open the link below`,
    `2) Sign up (or log in) using exactly this email: ${to}`,
    `3) Choose your own password when you create the account`,
    `4) We'll finish adding you to the team`,
    '',
    'Accept your invite:',
    inviteUrl,
    '',
    inviterEmail ? `Invited by: ${inviterEmail}` : '',
    '',
    'This link expires in 14 days. If you were not expecting this, you can ignore this email.',
    '',
    '— Faneqo',
  ]
    .filter(Boolean)
    .join('\n');

  const html = `
<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.6;color:#111827;max-width:520px;">
  <h2 style="margin:0 0 12px;font-size:20px;">Team Access invite</h2>
  <p style="margin:0 0 14px;">You've been invited to help manage <strong>${safeBand}</strong> on Faneqo as a <strong>${safeRole}</strong>.</p>
  <p style="margin:0 0 14px;color:#374151;font-size:14px;">
    This invite does <strong>not</strong> include a password. Use the invited email
    (<strong>${escapeHtml(to)}</strong>) to sign up or log in, then accept.
  </p>
  <p style="margin:0 0 20px;">
    <a href="${inviteUrl}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
      Accept invite
    </a>
  </p>
  <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Or paste this link into your browser:<br>${escapeHtml(inviteUrl)}</p>
  ${inviterEmail ? `<p style="margin:0 0 8px;color:#6b7280;font-size:13px;">Invited by ${escapeHtml(inviterEmail)}</p>` : ''}
  <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">This link expires in 14 days. If you were not expecting this, ignore this email.</p>
</div>`.trim();

  await strapi.plugin('email').service('email').send({
    to,
    from,
    replyTo,
    reply_to: replyTo,
    subject,
    text,
    html,
  });
}

async function createInvite({ strapi, bandId, userId, email, role, inviterEmail }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  const normalized = normalizeEmail(email);
  // Lightweight shape check — Strapi `email` type also validates on write.
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'invalid_email', message: 'A valid email is required.' };
  }

  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
  if (!INVITABLE_ROLES.includes(normalizedRole)) {
    return { ok: false, error: 'invalid_role', message: 'Role must be manager or viewer.' };
  }

  if (normalizeEmail(inviterEmail) === normalized) {
    return {
      ok: false,
      error: 'self_invite',
      message: 'You already own this artist page — you cannot invite yourself.',
    };
  }

  const band = await strapi.entityService.findOne('api::band.band', bandId, {
    fields: ['id', 'name'],
    populate: { users_permissions_user: { fields: ['id', 'email'] } },
  });
  if (!band) {
    return { ok: false, error: 'not_found', message: 'Band not found.' };
  }

  // Don't invite the legacy owner by email.
  if (normalizeEmail(band.users_permissions_user?.email) === normalized) {
    return { ok: false, error: 'already_owner', message: 'That person already owns this artist page.' };
  }

  // Already an active member?
  const existingMembers = await strapi.entityService.findMany('api::band-member.band-member', {
    filters: { band: bandId, status: 'active' },
    populate: { user: { fields: ['id', 'email'] } },
    limit: 500,
  });
  if (existingMembers.some((m) => normalizeEmail(m.user?.email) === normalized)) {
    return { ok: false, error: 'already_member', message: 'That person is already on the team.' };
  }

  // Collapse duplicate pending invites for the same email.
  const pending = await strapi.entityService.findMany('api::band-invite.band-invite', {
    filters: { band: bandId, email: normalized, status: 'pending' },
    limit: 20,
  });
  for (const old of pending) {
    await strapi.entityService.update('api::band-invite.band-invite', old.id, {
      data: { status: 'revoked' },
    });
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const invite = await strapi.entityService.create('api::band-invite.band-invite', {
    data: {
      band: bandId,
      email: normalized,
      role: normalizedRole,
      tokenHash,
      status: 'pending',
      expiresAt,
      invitedBy: userId,
    },
  });

  const inviteUrl = `${siteUrl()}/invite/accept?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendInviteEmail({
      strapi,
      to: normalized,
      bandName: band.name,
      role: normalizedRole,
      inviteUrl,
      inviterEmail: inviterEmail || null,
    });
  } catch (err) {
    strapi.log.error(`[band-team] invite email failed for invite ${invite.id}: ${err.message}`);
    // Raw token only lived in this request — revoke so the owner can retry cleanly
    // without a dead pending invite that can never be accepted.
    try {
      await strapi.entityService.update('api::band-invite.band-invite', invite.id, {
        data: { status: 'revoked' },
      });
    } catch (revokeErr) {
      strapi.log.warn(`[band-team] failed to revoke invite after email error: ${revokeErr.message}`);
    }
    return {
      ok: false,
      error: 'email_failed',
      message: 'Invite email could not be sent. Please try again shortly.',
    };
  }

  strapi.log.info('[band-team] invite created', {
    bandId,
    inviteId: invite.id,
    role: normalizedRole,
  });
  strapi.log.info('[band-team] invite email requested', {
    bandId,
    inviteId: invite.id,
  });

  return { ok: true, data: { invite: serializeInvite(invite) } };
}

async function resendInvite({ strapi, bandId, userId, inviteId, inviterEmail }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  const invite = await strapi.entityService.findOne('api::band-invite.band-invite', inviteId, {
    populate: {
      band: { fields: ['id', 'name'] },
    },
  });

  if (!invite || String(invite.band?.id || invite.band) !== String(bandId)) {
    return { ok: false, error: 'not_found', message: 'Invite not found.' };
  }

  if (invite.status !== 'pending') {
    return { ok: false, error: 'not_pending', message: 'Only pending invites can be resent.' };
  }

  const exp = invite.expiresAt ? new Date(invite.expiresAt).getTime() : null;
  if (!exp || Number.isNaN(exp) || exp < Date.now()) {
    await strapi.entityService.update('api::band-invite.band-invite', inviteId, {
      data: { status: 'expired' },
    });
    return { ok: false, error: 'expired', message: 'This invite has expired. Send a new invite.' };
  }

  const lastTouch = invite.updatedAt ? new Date(invite.updatedAt).getTime() : 0;
  if (lastTouch && Date.now() - lastTouch < RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      error: 'rate_limited',
      message: 'Please wait a minute before resending this invite.',
    };
  }

  // Rotate token so old emailed links stop working after a deliberate resend.
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const updated = await strapi.entityService.update('api::band-invite.band-invite', inviteId, {
    data: { tokenHash, expiresAt },
  });

  const inviteUrl = `${siteUrl()}/invite/accept?token=${encodeURIComponent(rawToken)}`;
  const bandName = invite.band?.name || 'an artist page';

  try {
    strapi.log.info('[band-team] invite email requested', {
      bandId,
      inviteId,
      action: 'resend',
    });
    await sendInviteEmail({
      strapi,
      to: invite.email,
      bandName,
      role: invite.role,
      inviteUrl,
      inviterEmail: inviterEmail || null,
    });
  } catch (err) {
    strapi.log.error(`[band-team] resend email failed for invite ${inviteId}: ${err.message}`);
    return {
      ok: false,
      error: 'email_failed',
      message: 'Invite email could not be sent. Please try again shortly.',
    };
  }

  return { ok: true, data: { invite: serializeInvite(updated) } };
}

async function revokeInvite({ strapi, bandId, userId, inviteId }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  const invite = await strapi.entityService.findOne('api::band-invite.band-invite', inviteId, {
    populate: { band: { fields: ['id'] } },
  });

  if (!invite || String(invite.band?.id || invite.band) !== String(bandId)) {
    return { ok: false, error: 'not_found', message: 'Invite not found.' };
  }

  if (invite.status !== 'pending') {
    return { ok: false, error: 'not_pending', message: 'Only pending invites can be revoked.' };
  }

  const updated = await strapi.entityService.update('api::band-invite.band-invite', inviteId, {
    data: { status: 'revoked' },
  });

  strapi.log.info('[band-team] invite canceled', {
    bandId,
    inviteId,
  });

  return { ok: true, data: { invite: serializeInvite(updated) } };
}

async function updateMemberRole({ strapi, bandId, userId, memberId, role }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : '';
  if (!INVITABLE_ROLES.includes(normalizedRole)) {
    return {
      ok: false,
      error: 'invalid_role',
      message: 'Role must be manager or viewer. Ownership cannot be transferred here.',
    };
  }

  const member = await strapi.entityService.findOne('api::band-member.band-member', memberId, {
    populate: {
      band: { fields: ['id'] },
      user: { fields: ['id', 'email', 'username'] },
    },
  });

  if (!member || String(member.band?.id || member.band) !== String(bandId)) {
    return { ok: false, error: 'not_found', message: 'Team member not found.' };
  }

  if (member.role === ROLE_OWNER) {
    return {
      ok: false,
      error: 'cannot_change_owner',
      message: 'The owner role cannot be changed through Team Access.',
    };
  }

  if (member.status !== 'active') {
    return { ok: false, error: 'not_active', message: 'Only active members can change roles.' };
  }

  if (member.role === normalizedRole) {
    return {
      ok: true,
      data: {
        member: serializeMember(member),
      },
    };
  }

  const updated = await strapi.entityService.update('api::band-member.band-member', memberId, {
    data: { role: normalizedRole },
  });

  strapi.log.info('[band-team] membership role changed', {
    bandId,
    memberId,
    from: member.role,
    to: normalizedRole,
  });

  return {
    ok: true,
    data: {
      member: serializeMember({
        ...updated,
        user: member.user,
      }),
    },
  };
}

async function removeMember({ strapi, bandId, userId, memberId }) {
  const gate = await assertOwner(strapi, bandId, userId);
  if (!gate.ok) return gate;

  const member = await strapi.entityService.findOne('api::band-member.band-member', memberId, {
    populate: {
      band: { fields: ['id'] },
      user: { fields: ['id', 'email'] },
    },
  });

  if (!member || String(member.band?.id || member.band) !== String(bandId)) {
    return { ok: false, error: 'not_found', message: 'Team member not found.' };
  }

  if (member.role === ROLE_OWNER) {
    return { ok: false, error: 'cannot_remove_owner', message: 'The owner cannot be removed from the team.' };
  }

  if (member.status !== 'active') {
    return { ok: true, data: { member: serializeMember(member) } };
  }

  const updated = await strapi.entityService.update('api::band-member.band-member', memberId, {
    data: { status: 'removed' },
  });

  strapi.log.info('[band-team] membership revoked', {
    bandId,
    memberId,
    removedUserId: member.user?.id || null,
  });

  return {
    ok: true,
    data: {
      member: serializeMember({
        ...updated,
        user: member.user,
      }),
    },
  };
}

async function acceptInvite({ strapi, user, rawToken }) {
  if (!user?.id) {
    return { ok: false, error: 'unauthorized', message: 'You must be logged in to accept an invite.' };
  }

  // Raw tokens are always 32 bytes → 64 hex chars from generateRawToken().
  if (!rawToken || typeof rawToken !== 'string' || !/^[a-f0-9]{64}$/i.test(rawToken)) {
    return { ok: false, error: 'invalid_token', message: 'This invite link is invalid.' };
  }

  const tokenHash = hashToken(rawToken);
  const matches = await strapi.entityService.findMany('api::band-invite.band-invite', {
    filters: { tokenHash },
    populate: {
      band: { fields: ['id', 'name', 'slug'] },
    },
    limit: 1,
  });

  const invite = matches[0];
  if (!invite) {
    return { ok: false, error: 'invalid_token', message: 'This invite link is invalid or has already been used.' };
  }

  // Idempotent success if this user already accepted this invite.
  if (invite.status === 'accepted') {
    const existing = await strapi.entityService.findMany('api::band-member.band-member', {
      filters: {
        band: invite.band?.id || invite.band,
        user: user.id,
        status: 'active',
      },
      limit: 1,
    });
    if (existing.length) {
      return {
        ok: true,
        data: {
          alreadyAccepted: true,
          band: invite.band
            ? { id: invite.band.id, name: invite.band.name, slug: invite.band.slug }
            : null,
          role: existing[0].role,
        },
      };
    }
    return { ok: false, error: 'invalid_token', message: 'This invite link is no longer valid.' };
  }

  if (invite.status === 'revoked') {
    return { ok: false, error: 'revoked', message: 'This invite was revoked.' };
  }

  if (invite.status === 'expired') {
    return { ok: false, error: 'expired', message: 'This invite has expired.' };
  }

  if (invite.status !== 'pending') {
    return { ok: false, error: 'invalid_token', message: 'This invite link is no longer valid.' };
  }

  const exp = invite.expiresAt ? new Date(invite.expiresAt).getTime() : null;
  if (!exp || Number.isNaN(exp)) {
    // expiresAt is required for invite safety — treat missing as invalid.
    return { ok: false, error: 'invalid_token', message: 'This invite link is invalid.' };
  }
  if (exp < Date.now()) {
    await strapi.entityService.update('api::band-invite.band-invite', invite.id, {
      data: { status: 'expired' },
    });
    return { ok: false, error: 'expired', message: 'This invite has expired.' };
  }

  const userEmail = normalizeEmail(user.email);
  if (!userEmail || userEmail !== normalizeEmail(invite.email)) {
    return {
      ok: false,
      error: 'wrong_email',
      message: `This invitation was sent to ${invite.email}. Please sign in with that account.`,
      data: { invitedEmail: invite.email },
    };
  }

  const bandId = invite.band?.id || invite.band;
  if (!bandId) {
    return { ok: false, error: 'invalid_token', message: 'This invite link is invalid.' };
  }

  // Revive or create membership.
  const existingRows = await strapi.entityService.findMany('api::band-member.band-member', {
    filters: { band: bandId, user: user.id },
    limit: 1,
  });

  const invitedById = invite.invitedBy?.id || invite.invitedBy || null;
  const memberPayload = {
    role: invite.role,
    status: 'active',
    acceptedAt: new Date().toISOString(),
    invitedBy: invitedById,
  };

  let member;
  if (existingRows.length) {
    member = await strapi.entityService.update('api::band-member.band-member', existingRows[0].id, {
      data: memberPayload,
    });
  } else {
    try {
      member = await strapi.entityService.create('api::band-member.band-member', {
        data: {
          band: bandId,
          user: user.id,
          ...memberPayload,
        },
      });
    } catch (createErr) {
      // Concurrent double-accept: another request may have created the row first.
      const raced = await strapi.entityService.findMany('api::band-member.band-member', {
        filters: { band: bandId, user: user.id },
        limit: 1,
      });
      if (!raced.length) throw createErr;
      member = await strapi.entityService.update('api::band-member.band-member', raced[0].id, {
        data: memberPayload,
      });
    }
  }

  // Keep tokenHash so a double-click / retry can resolve idempotently;
  // status=accepted makes the invite single-use for creating memberships.
  await strapi.entityService.update('api::band-invite.band-invite', invite.id, {
    data: {
      status: 'accepted',
      acceptedBy: user.id,
      acceptedAt: new Date().toISOString(),
    },
  });

  strapi.log.info('[band-team] invite accepted', {
    bandId,
    inviteId: invite.id,
    userId: user.id,
    role: invite.role,
  });

  return {
    ok: true,
    data: {
      alreadyAccepted: false,
      role: member.role,
      band: invite.band
        ? { id: invite.band.id, name: invite.band.name, slug: invite.band.slug }
        : { id: bandId },
    },
  };
}

/**
 * Safe list of bands this user owns or has accepted team access to.
 * Includes the permission matrix so the dashboard can gate owner-only UI.
 */
async function getMyAccess({ strapi, userId }) {
  if (!userId) {
    return { ok: false, error: 'unauthorized', message: 'Authentication required.' };
  }

  const owned = await strapi.entityService.findMany('api::band.band', {
    filters: { users_permissions_user: userId },
    fields: ['id', 'name', 'slug'],
    limit: 50,
  });

  const memberships = await strapi.entityService.findMany('api::band-member.band-member', {
    filters: { user: userId, status: 'active' },
    populate: { band: { fields: ['id', 'name', 'slug'] } },
    limit: 100,
  });

  const ownedIds = new Set(owned.map((b) => String(b.id)));

  const teamAccess = [];
  for (const m of memberships) {
    if (!m.band?.id || ownedIds.has(String(m.band.id)) || m.role === ROLE_OWNER) continue;
    const access = await resolveBandAccess(strapi, userId, m.band.id);
    teamAccess.push({
      bandId: m.band.id,
      name: m.band.name,
      slug: m.band.slug,
      role: m.role,
      status: m.status,
      permissions: access.permissions,
    });
  }

  return {
    ok: true,
    data: {
      owned: await Promise.all(
        owned.map(async (b) => {
          const access = await resolveBandAccess(strapi, userId, b.id);
          return {
            bandId: b.id,
            name: b.name,
            slug: b.slug,
            role: ROLE_OWNER,
            permissions: access.permissions,
          };
        })
      ),
      teamAccess,
    },
  };
}

module.exports = {
  INVITE_TTL_DAYS,
  INVITABLE_ROLES,
  getTeam,
  createInvite,
  resendInvite,
  revokeInvite,
  updateMemberRole,
  removeMember,
  acceptInvite,
  getMyAccess,
  normalizeEmail,
  hashToken,
};
