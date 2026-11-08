'use strict';

/**
 * Fan-account service surface for controllers / future Inbox Phase 2.
 * Core logic: utils/fanAccount.js
 *
 * Primary claim entrypoint: claimFanRelationshipsForUser(user)
 */
const fanAccount = require('../../../utils/fanAccount');

module.exports = {
  ...fanAccount,
  claimFanRelationshipsForUser: fanAccount.claimFanRelationshipsForUser,
};
