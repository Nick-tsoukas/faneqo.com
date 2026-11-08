'use strict';

/**
 * Identity keys stay in lockstep if email or band is ever written after create.
 * Current product workflows do not mutate those fields; this is a stale-key guard.
 */

const { buildFanCanonicalIdentityKey } = require('../../../../utils/integrity/canonicalIdentityKeys');

function identityTouched(data) {
  if (!data || typeof data !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(data, 'email') || Object.prototype.hasOwnProperty.call(data, 'band');
}

module.exports = {
  async beforeUpdate(event) {
    const data = event.params?.data;
    if (!identityTouched(data)) return;

    const id = event.params?.where?.id;
    if (!id) return;

    const existing = await strapi.entityService.findOne('api::fan.fan', id, {
      fields: ['id', 'email'],
      populate: { band: { fields: ['id'] } },
    });

    const email = data.email !== undefined ? data.email : existing?.email;
    const bandId = data.band !== undefined ? data.band : existing?.band?.id || existing?.band;
    data.canonicalIdentityKey = buildFanCanonicalIdentityKey({ bandId, email });
  },
};
