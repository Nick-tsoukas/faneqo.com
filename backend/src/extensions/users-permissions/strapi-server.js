// path: src/extensions/users-permissions/strapi-server.js
const { guardUserControllers } = require('../../utils/userSelfGuard');

module.exports = (plugin) => {
    plugin.policies['isAuthenticated'] = (policyContext, config, { strapi }) => {
      // returns true if logged in (ctx.state.user exists), false otherwise
      return Boolean(policyContext.state.user);
    };

    // Stock user.update edits whichever :id is in the URL, and user.find lists every
    // account. Users may only read and edit themselves (email, username, password).
    guardUserControllers(plugin.controllers.user);

    return plugin;
  };
