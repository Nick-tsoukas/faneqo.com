const { parseMultipartData } = require('@strapi/utils');
const { createCoreController } = require('@strapi/strapi').factories;
const {
  sanitizeEditorialPayload,
  resolveRequestUser,
} = require('../services/editorialShowcase');
const {
  getBandRole,
  ROLE_OWNER,
  stripOwnerOnlyBandFields,
  stripServerManagedBandFields,
} = require('../../../utils/bandRoles');
const { toPublicBand, toOwnerBand } = require('../../../utils/band/publicBandPure');
const { createFeaturedGalleryService } = require('../../../utils/galleries/featuredGalleryService');
const { applyArtistImageFramingUpdate } = require('../../../utils/band/artistImageFraming');
const { isCheckoutReady } = require('../../../utils/payments/paymentAccess');
const { sitemapEntries } = require('../../../utils/band/artistSitemap');

const populateOptions = {
  events: { populate: "image" },
  tours: { populate: "*" },
  albums: { populate: ["cover", "songs.file"] },
  singlesong: { populate: ["song", "cover"] },
  singlevideo: "*",
  bandImg: "*",
  users_permissions_user: { populate: ["username", "email"] },
  videos: { populate: "mediayoutube" },
  link_clicks: "*",
  customButtons: { populate: ["customIcon"] },
  editorialItems: { populate: ["image"] },
};

const publicPopulateOptions = {
  events: { populate: "image" },
  tours: { populate: "*" },
  albums: { populate: ["cover", "songs.file"] },
  singlesong: { populate: ["song", "cover"] },
  singlevideo: "*",
  bandImg: "*",
  members: { populate: "image" },
  videos: { populate: "mediayoutube" },
  customButtons: { populate: ["customIcon"] },
  editorialItems: { populate: ["image"] },
};

async function resolveOptionalUserId(strapi, ctx) {
  if (ctx.state?.user?.id) return ctx.state.user.id;
  const header = ctx.request?.headers?.authorization || ctx.request?.headers?.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    return payload?.id || null;
  } catch {
    return null;
  }
}

async function accessibleBandIdSet(strapi, userId) {
  if (!userId) return new Set();
  const [members, owned] = await Promise.all([
    strapi.entityService.findMany('api::band-member.band-member', {
      filters: { user: userId, status: 'active' },
      fields: ['id'],
      populate: { band: { fields: ['id'] } },
      limit: 100,
    }),
    strapi.entityService.findMany('api::band.band', {
      filters: { users_permissions_user: userId },
      fields: ['id'],
      limit: 50,
    }),
  ]);
  const ids = new Set();
  for (const row of members || []) {
    const id = row.band?.id || row.band;
    if (id) ids.add(String(id));
  }
  for (const row of owned || []) ids.add(String(row.id));
  return ids;
}

function presentPublicBand(band) {
  return toPublicBand(band);
}

function bandCreateClientMessage(error) {
  const details = Array.isArray(error?.details?.errors) ? error.details.errors : [];
  for (const item of details) {
    const path = Array.isArray(item?.path) ? item.path.join(".") : "";
    const message = String(item?.message || "");
    if (path === "name" && /unique/i.test(message)) {
      return "That artist name is already in use. Choose a different name.";
    }
    if (/integer/i.test(message) && /cybered/i.test(path)) {
      return "The photo framing could not be saved. Reset the crop and try again.";
    }
  }
  const message = String(error?.message || "");
  if (/attribute must be unique/i.test(message)) {
    return "That artist name is already in use. Choose a different name.";
  }
  return null;
}

function presentListedBand(band, ownerIds) {
  if (band?.id && ownerIds.has(String(band.id))) return toOwnerBand(band);
  return toPublicBand(band);
}

module.exports = createCoreController("api::band.band", ({ strapi }) => ({
  async find(ctx) {
    try {
      const filters = ctx.query.filters || {};
      const bands = await strapi.entityService.findMany("api::band.band", {
        filters,
        populate: publicPopulateOptions,
      });
      const userId = await resolveOptionalUserId(strapi, ctx);
      const ownerIds = await accessibleBandIdSet(strapi, userId);
      return { data: (bands || []).map((row) => presentListedBand(row, ownerIds)) };
    } catch (error) {
      console.error("Error fetching bands:", error);
      ctx.throw(500, "Internal Server Error");
    }
  },

  async findById(ctx) {
    try {
      const { id } = ctx.params;
      if (!id) return ctx.badRequest("ID parameter is required");
      const band = await strapi.entityService.findOne("api::band.band", id, {
        populate: publicPopulateOptions,
      });
      if (!band) return ctx.notFound("Band not found");
      const userId = await resolveOptionalUserId(strapi, ctx);
      const ownerIds = await accessibleBandIdSet(strapi, userId);
      return { data: presentListedBand(band, ownerIds) };
    } catch (error) {
      console.error("Error fetching band by ID:", error);
      ctx.throw(500, "Internal Server Error");
    }
  },

  // PUBLIC: slug + last update for every listed artist page (sitemap only).
  async sitemap(ctx) {
    const bands = await strapi.entityService.findMany("api::band.band", {
      fields: ["slug", "updatedAt"],
      populate: { users_permissions_user: { fields: ["blocked"] } },
      limit: -1,
    });
    ctx.set("Cache-Control", "public, max-age=3600");
    return { data: sitemapEntries(bands) };
  },

  async findBySlug(ctx) {
    try {
      const { slug } = ctx.params;
      if (!slug) return ctx.badRequest("Slug parameter is required");
      
      const band = await strapi.entityService.findMany("api::band.band", {
        filters: { slug },
        populate: publicPopulateOptions,
      });
      
      if (!band || band.length === 0) return ctx.notFound("Band not found");
      const featuredGallery = await createFeaturedGalleryService(strapi).publicForBand(band[0]);
      // The artist page shows payment buttons only when checkout would accept them.
      const paymentsEnabled = await isCheckoutReady(strapi, band[0]);
      return { data: presentPublicBand({ ...band[0], featuredGallery, paymentsEnabled }) };
    } catch (error) {
      console.error("Error fetching band by slug:", error);
      ctx.throw(500, "Internal Server Error");
    }
  },

  // PUBLIC: search bands by name (fuzzy)
  async search(ctx) {
    try {
      const { q = '', limit = 12 } = ctx.query;
      
      if (!q || q.trim().length < 2) {
        return { data: [], meta: { total: 0 } };
      }

      const searchTerm = q.trim().toLowerCase();
      
      // Search bands by name (case-insensitive contains)
      const bands = await strapi.entityService.findMany("api::band.band", {
        filters: {
          name: { $containsi: searchTerm },
        },
        populate: {
          bandImg: true,
        },
        limit: Math.min(parseInt(limit) || 12, 50),
      });

      // Return simplified band data for search results
      const results = bands.map(band => ({
        id: band.id,
        name: band.name,
        slug: band.slug,
        genre: band.genre || null,
        bio: band.bio ? band.bio.substring(0, 120) + (band.bio.length > 120 ? '...' : '') : null,
        imageUrl: band.bandImg?.url || null,
      }));

      return { 
        data: results, 
        meta: { 
          total: results.length,
          query: q,
        } 
      };
    } catch (error) {
      console.error("Error searching bands:", error);
      ctx.throw(500, "Internal Server Error");
    }
  },

  // POST method to create a new band
  async create(ctx) {
    try {
      const isMultipart = ctx.is("multipart");
      let data, files;
      
      if (isMultipart) {
        const parsed = await parseMultipartData(ctx);
        // If parsed.data is a string, then parse it into an object.
        data = typeof parsed.data === "string" ? JSON.parse(parsed.data) : parsed.data;
        files = parsed.files;
        console.log("💡 Parsed multipart data:", data);
        console.log("📦 Parsed multipart files:", files);
      } else {
        data = ctx.request.body.data;
        console.log("💡 JSON data:", data);
      }
      
      // Name and bio are required. Genre is optional on the create form.
      if (!data?.name || !data?.bio) {
        console.warn("❌ Missing required fields:", data);
        return ctx.badRequest("Missing required fields: name and bio.");
      }
      const genre = String(data.genre || "").trim();
      data.genre = genre || null;
      data = stripServerManagedBandFields(data);

      const user = await resolveRequestUser(strapi, ctx);
      sanitizeEditorialPayload(data, user);

      const framing = applyArtistImageFramingUpdate({}, data);
      if (framing.error) return ctx.badRequest(framing.error);
      data = framing.data;
      
      const createdBand = await strapi.entityService.create("api::band.band", {
        data,
        files: files || undefined,
        populate: populateOptions,
      });
      
      return { data: createdBand };
    } catch (error) {
      console.error("🔥 Error in band creation:", error);
      const clientMessage = bandCreateClientMessage(error);
      if (clientMessage) return ctx.badRequest(clientMessage);
      const errMsg = typeof error.message === "object" ? JSON.stringify(error.message) : error.message;
      ctx.throw(500, "Internal Server Error: " + errMsg);
    }
  },
// del
  async delete(ctx) {
    const { id } = ctx.params;
    if (!id) return ctx.badRequest('Missing `id` parameter');
    try {
      // remove the record
      const deleted = await strapi.entityService.delete('api::band.band', id);
      return { data: deleted };
    } catch (err) {
      console.error('Error deleting band:', err);
      ctx.throw(500, 'Internal Server Error');
    }
  },

  // PUT method to update an existing band
  async update(ctx) {
    try {
      const { id } = ctx.params;
      let { data } = ctx.request.body;
      console.log("📥 Band update - customButtons received:", JSON.stringify(data?.customButtons, null, 2));
      if (!id) {
        return ctx.badRequest("ID parameter is required");
      }
      const existingBand = await strapi.entityService.findOne("api::band.band", id);
      if (!existingBand) {
        return ctx.notFound("Band not found");
      }
      if (!data?.name || !data?.genre || !data?.bio) {
        return ctx.badRequest("Missing required fields: name, genre, bio.");
      }

      const user = await resolveRequestUser(strapi, ctx);
      const role = user?.id ? await getBandRole(strapi, id, user.id) : null;
      // Managers can edit page content but never ownership / Connect / billing fields.
      if (role && role !== ROLE_OWNER) {
        data = stripOwnerOnlyBandFields(data);
      }
      data = stripServerManagedBandFields(data);
      sanitizeEditorialPayload(data, user, { mode: 'update' });

      const framing = applyArtistImageFramingUpdate(existingBand, data);
      if (framing.error) return ctx.badRequest(framing.error);
      data = framing.data;

      const updatedBand = await strapi.entityService.update("api::band.band", id, {
        data,
        populate: populateOptions,
      });
      console.log("📤 Band update - customButtons saved:", JSON.stringify(updatedBand?.customButtons, null, 2));
      return { data: updatedBand };
    } catch (error) {
      console.error("🔥 Error updating band:", error);
      ctx.throw(500, "Internal Server Error: " + error.message);
    }
  },
}));
