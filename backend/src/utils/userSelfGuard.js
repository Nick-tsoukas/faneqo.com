'use strict';

/**
 * Self-only guards for the users-permissions content API user controller.
 *
 * Strapi 4.24 ships PUT /api/users/:id, GET /api/users and GET /api/users/:id
 * without an ownership check, so any signed-in account could edit or list
 * every other account. Admin-side user management (admin panel, the secret-
 * guarded /user-admin routes, server code using entityService) is unaffected.
 */

// The only fields a user may change on their own record (pages/account.vue).
const USER_SELF_EDITABLE_FIELDS = ['email', 'username', 'password'];

function isSelf(ctx) {
  const me = ctx.state?.user?.id;
  return me != null && String(ctx.params?.id) === String(me);
}

function guardUserControllers(userController) {
  const originalUpdate = userController.update;
  const originalFindOne = userController.findOne;

  userController.update = async (ctx, ...rest) => {
    if (!ctx.state?.user) return ctx.unauthorized();
    if (!isSelf(ctx)) return ctx.forbidden('You can only update your own account.');

    const body = ctx.request.body || {};
    const picked = {};
    for (const key of USER_SELF_EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, key)) picked[key] = body[key];
    }
    ctx.request.body = picked;
    return originalUpdate(ctx, ...rest);
  };

  userController.find = async (ctx) => ctx.forbidden('Listing users is not allowed.');
  // Not granted to any role today; refuse outright so a stray grant cannot delete accounts.
  userController.destroy = async (ctx) => ctx.forbidden('Deleting users is not allowed.');

  userController.findOne = async (ctx, ...rest) => {
    if (!ctx.state?.user) return ctx.unauthorized();
    if (!isSelf(ctx)) return ctx.notFound();
    return originalFindOne(ctx, ...rest);
  };

  return userController;
}

module.exports = { USER_SELF_EDITABLE_FIELDS, guardUserControllers, isSelf };
