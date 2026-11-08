'use strict';

/**
 * Write guards for legacy content types that only used the stock core
 * controller (album, video, tour, stream, socialpage). The Authenticated role
 * holds create/update/delete on them, and the core controller never checked
 * who owned the record, so any signed-in account could edit or delete another
 * artist's content by id.
 *
 * Each record carries the creating user in a relation (`users_permissions_user`,
 * or `users_permissions_users` on video). Create stamps the caller there;
 * update and delete require the caller to be that user and cannot reassign it.
 *
 * Spread into a createCoreController factory; the core implementation is
 * reached through the controller prototype (Strapi binds `this`).
 */

function bodyData(ctx) {
  const body = ctx.request.body || {};
  if (typeof body.data === 'string') {
    try {
      return { body, data: JSON.parse(body.data), encoded: true };
    } catch {
      return { body, data: null, encoded: true };
    }
  }
  return { body, data: body.data && typeof body.data === 'object' ? body.data : null, encoded: false };
}

function setBodyData(ctx, { body, encoded }, data) {
  ctx.request.body = { ...body, data: encoded ? JSON.stringify(data) : data };
}

function creatorIdOf(row, userField) {
  const rel = row?.[userField];
  if (Array.isArray(rel)) return rel[0]?.id ?? null;
  return rel?.id ?? null;
}

function creatorOwnedWrites(strapi, uid, userField = 'users_permissions_user') {
  // true when the caller created the record; otherwise writes the error response.
  async function isCreator(ctx) {
    const userId = ctx.state?.user?.id;
    if (!userId) {
      ctx.unauthorized();
      return false;
    }
    const row = await strapi.entityService.findOne(uid, ctx.params.id, {
      populate: { [userField]: { fields: ['id'] } },
    });
    if (!row) {
      ctx.notFound();
      return false;
    }
    if (String(creatorIdOf(row, userField)) !== String(userId)) {
      ctx.forbidden('You can only change content you created.');
      return false;
    }
    return true;
  }

  return {
    async create(ctx) {
      const userId = ctx.state?.user?.id;
      if (!userId) return ctx.unauthorized();
      const parsed = bodyData(ctx);
      if (parsed.data) setBodyData(ctx, parsed, { ...parsed.data, [userField]: userId });
      return Object.getPrototypeOf(this).create.call(this, ctx);
    },

    async update(ctx) {
      if (!(await isCreator(ctx))) return;
      const parsed = bodyData(ctx);
      if (parsed.data && userField in parsed.data) {
        const { [userField]: _ignored, ...rest } = parsed.data;
        setBodyData(ctx, parsed, rest);
      }
      return Object.getPrototypeOf(this).update.call(this, ctx);
    },

    async delete(ctx) {
      if (!(await isCreator(ctx))) return;
      return Object.getPrototypeOf(this).delete.call(this, ctx);
    },
  };
}

/** Editorial content managed in the Strapi admin panel only; the content API is read-only. */
const adminOnlyWrites = {
  async create(ctx) {
    return ctx.forbidden('This content is managed in the admin panel.');
  },
  async update(ctx) {
    return ctx.forbidden('This content is managed in the admin panel.');
  },
  async delete(ctx) {
    return ctx.forbidden('This content is managed in the admin panel.');
  },
};

module.exports = { creatorOwnedWrites, adminOnlyWrites, creatorIdOf };
