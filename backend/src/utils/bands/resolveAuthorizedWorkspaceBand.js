'use strict';

/**
 * V1 workspace band for "me" endpoints that do not take a recap id.
 *
 * Same order as GET /api/me/band-access and frontend resolveWorkspaceBand:
 * first owned band, then first accepted team band. No account switcher.
 *
 * Hinted bandId (query) is optional and is always verified with
 * requireBandPermission — never trusted from the client.
 */

const { requireBandPermission } = require('../bandRoles');
const { getMyAccess } = require('../../api/band/services/band-team');

/** Night history / latest / detail are reads — same gate as GET /night. */
const VIEW_NIGHT_HISTORY_PERMISSION = 'viewShowMode';

function parseBandId(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const bandId = Number.parseInt(raw, 10);
  if (!Number.isInteger(bandId) || bandId <= 0) return { error: 'band_id_invalid' };
  return { bandId };
}

async function resolveAuthorizedWorkspaceBand(
  strapi,
  userId,
  permissionKey = VIEW_NIGHT_HISTORY_PERMISSION,
  rawBandId = undefined
) {
  if (!userId) return { error: 'unauthorized' };

  const hinted = parseBandId(rawBandId);
  if (hinted?.error) return hinted;
  if (hinted?.bandId) {
    const access = await requireBandPermission(strapi, userId, hinted.bandId, permissionKey);
    if (!access) return { error: 'forbidden' };
    return { bandId: hinted.bandId, access };
  }

  const result = await getMyAccess({ strapi, userId });
  if (!result.ok) return { error: 'unauthorized' };

  const owned = Array.isArray(result.data?.owned) ? result.data.owned : [];
  const team = Array.isArray(result.data?.teamAccess) ? result.data.teamAccess : [];

  for (const row of [...owned, ...team]) {
    const bandId = row?.bandId;
    if (!bandId) continue;
    const access = await requireBandPermission(strapi, userId, bandId, permissionKey);
    if (access) return { bandId, access };
  }

  return { error: 'none' };
}

module.exports = {
  VIEW_NIGHT_HISTORY_PERMISSION,
  resolveAuthorizedWorkspaceBand,
};
