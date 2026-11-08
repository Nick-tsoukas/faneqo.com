'use strict';

/**
 * Upload.file is an internal persistence detail for Faneqo media.
 * Public pages receive sanitized media through their owning DTOs; callers must
 * never enumerate Upload.file rows (especially protected metadata/object keys).
 */
module.exports = () => async (ctx, next) => {
  const method = String(ctx.method || ctx.request?.method || '').toUpperCase();
  const path = String(ctx.path || '');
  const isContentApiFileRead = method === 'GET'
    && /^\/api\/upload\/files(?:\/|$)/.test(path);

  if (isContentApiFileRead) {
    ctx.status = 404;
    ctx.body = {
      error: {
        status: 404,
        name: 'NotFoundError',
        message: 'Not Found',
      },
    };
    return;
  }

  await next();
};
