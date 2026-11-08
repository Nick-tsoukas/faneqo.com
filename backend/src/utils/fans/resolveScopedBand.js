'use strict';

const { requireBandPermission } = require('../bandRoles');

/**
 * Fan Intelligence is explicitly band-scoped.
 *
 * The caller names the band; we authorize it against that band's permission
 * matrix. Never infer "the first band this user owns" — that ordering is
 * undefined and silently diverges from the band the dashboard is displaying,
 * so a multi-band artist reads one band's numbers next to another band's list.
 *
 * Returns `{ bandId, access }` or `{ error }` — the caller maps errors to the
 * ctx response so each route keeps its own wording.
 */
async function resolveScopedBand(strapi, ctx, rawBandId, permissionKey) {
  const user = ctx.state?.user;
  if (!user) return { error: 'unauthorized' };

  const bandId = Number.parseInt(rawBandId, 10);
  if (!Number.isInteger(bandId) || bandId <= 0) return { error: 'band_id_required' };

  const access = await requireBandPermission(strapi, user.id, bandId, permissionKey);
  if (!access) return { error: 'forbidden' };

  return { bandId, access };
}

module.exports = { resolveScopedBand };
