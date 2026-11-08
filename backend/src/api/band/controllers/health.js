'use strict';

module.exports = {
  async check(ctx) {
    ctx.set('Cache-Control', 'no-store');
    ctx.body = { ok: true, service: 'qrserver' };
  },
};
