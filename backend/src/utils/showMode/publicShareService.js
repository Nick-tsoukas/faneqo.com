'use strict';

/**
 * Public Night + Gallery destinations.
 * Optional JWT enriches viewer state. Never requires login for the shell.
 */

const { jwtFailureReason } = require('../inbox/inboxLog');
const { canonicalAttendanceFilters } = require('../fans/canonicalAttendance');
const showContext = require('../artistUpdates/showContextPure');
const { createArtistUpdateService, loadViewerContext } = require('../artistUpdates/artistUpdateService');
const { resolveNightRecordingsForViewer } = require('../nightRecordings/nightRecordingService');
const share = require('./publicNightSharePure');

async function resolveOptionalUserId(strapi, ctx) {
  if (ctx.state?.user?.id) return ctx.state.user.id;
  const header = ctx.request?.headers?.authorization || ctx.request?.headers?.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    return payload?.id || null;
  } catch (err) {
    strapi.log.info(`[Faneqo Public Night] auth:failed reason=${jwtFailureReason(err)}`);
    return null;
  }
}

function cacheHeaders(userId) {
  return userId
    ? { 'Cache-Control': 'private, no-store' }
    : { 'Cache-Control': 'private, no-store' };
}

function notFound(message) {
  return { error: 'not_found', status: 404, message };
}

async function loadPublicBand(strapi, bandSlug) {
  const slug = String(bandSlug || '').trim().toLowerCase();
  if (!slug) return null;
  const rows = await strapi.entityService.findMany('api::band.band', {
    filters: { slug },
    fields: ['id', 'name', 'slug', 'cyberedImagePositionX', 'cyberedImagePositionY', 'layoutConfig'],
    populate: { bandImg: true },
    limit: 1,
  });
  return rows?.[0] || null;
}

async function loadEvent(strapi, eventId) {
  const id = Number.parseInt(eventId, 10);
  if (!Number.isInteger(id) || id <= 0) return null;
  return strapi.entityService.findOne('api::event.event', id, {
    fields: ['id', 'title', 'venue', 'city', 'state', 'country', 'date'],
    populate: { image: true },
  });
}

async function showOrdinalForFan(strapi, { fanId, eventId, campaignId }) {
  if (!fanId) return null;
  const context = {
    eventId: eventId || null,
    campaignId: campaignId || null,
  };
  if (!showContext.showContextHasNight(context)) return null;
  const rows = await strapi.entityService.findMany('api::fan-show-attendance.fan-show-attendance', {
    filters: canonicalAttendanceFilters({ fan: fanId }),
    fields: ['id', 'checkedInAt', 'campaignId', 'suppressedDuplicate'],
    populate: { event: { fields: ['id'] } },
    sort: { checkedInAt: 'asc' },
    limit: 200,
  });
  return showContext.ordinalForShow(rows, context);
}

function createPublicShareService(strapi) {
  const updates = createArtistUpdateService(strapi);

  async function buildViewer({ userId, bandId, eventId, campaignId }) {
    if (!userId) return { viewer: share.anonymousViewer(), isArtist: false, fanId: null };
    const ctx = await loadViewerContext(strapi, { userId, bandId, eventId, campaignId });
    const youWereThere = showContext.attendanceMatchesShow({
      eventId: eventId || null,
      campaignId: campaignId || null,
    }, ctx);
    const showOrdinal = youWereThere
      ? await showOrdinalForFan(strapi, { fanId: ctx.fan?.id, eventId, campaignId })
      : null;
    return {
      viewer: share.publicViewer({
        authenticated: true,
        youWereThere,
        showOrdinal,
        isArtist: !!ctx.isArtist,
      }),
      isArtist: !!ctx.isArtist,
      fanId: ctx.fan?.id || null,
    };
  }

  async function getPublicNight({ bandSlug, nightSlug, userId }) {
    const slug = String(nightSlug || '').trim();
    if (!slug) return notFound('Night not found');
    const band = await loadPublicBand(strapi, bandSlug);
    if (!band) return notFound('Night not found');

    const recaps = await strapi.entityService.findMany('api::show-recap.show-recap', {
      filters: { band: band.id, nightSlug: slug },
      populate: { coverImage: true, heroImage: true },
      limit: 3,
    });
    if (!recaps?.length || recaps.length > 1 || !recaps[0].nightSlug) {
      return notFound('Night not found');
    }
    const recap = recaps[0];
    const event = await loadEvent(strapi, recap.eventId);
    const stats = await strapi.service('api::show-recap.show-recap').getCheckInStats({
      bandId: band.id,
      campaignId: recap.campaignId,
    });
    const artist = share.publicArtist(band);
    const night = share.publicNightFields({
      recap,
      event,
      artist: band,
      attendanceCount: stats.attendanceCount,
    });
    const { viewer } = await buildViewer({
      userId,
      bandId: band.id,
      eventId: recap.eventId,
      campaignId: recap.campaignId,
    });
    const listed = await updates.listPublishedForRecap({
      recapId: recap.id,
      bandId: band.id,
      userId,
    });
    const galleries = listed.map(({ teaser }) => share.publicGalleryCard(teaser, { bandSlug: band.slug }));
    const recordings = await resolveNightRecordingsForViewer(strapi, {
      recap,
      bandId: band.id,
      userId,
      publishedOnly: true,
    });
    return {
      data: {
        artist,
        night,
        viewer,
        galleries,
        recordings,
        share: share.nightShare({ artist, night, recap, event }),
      },
    };
  }

  async function getPublicGallery({ bandSlug, gallerySlug, userId }) {
    const slug = String(gallerySlug || '').trim();
    if (!slug) return notFound('Gallery not found');
    const band = await loadPublicBand(strapi, bandSlug);
    if (!band) return notFound('Gallery not found');

    const found = await updates.getPublishedBySlug({
      bandSlug: band.slug,
      slug,
      userId,
    });
    /**
     * A gallery the artist took down still resolves to a real page so the
     * visitor gets a designed answer instead of a bare 404. No gallery fields,
     * no media, no share image.
     */
    if (found.error === 'gallery_unavailable') {
      return {
        data: {
          artist: share.publicArtist(band),
          gallery: null,
          night: null,
          viewer: share.anonymousViewer(),
          unavailable: true,
          share: {
            canonicalPath: share.galleryCanonicalPath(band.slug, slug),
            title: 'This gallery is no longer available.',
            description: null,
            image: null,
          },
        },
      };
    }
    if (found.error) return found;

    const teaser = found.data;
    const recap = found.record?.showRecap && typeof found.record.showRecap === 'object'
      ? found.record.showRecap
      : null;
    const event = found.record?.event && typeof found.record.event === 'object'
      ? found.record.event
      : null;
    if (recap && !recap.coverImage && recap.id) {
      const full = await strapi.entityService.findOne('api::show-recap.show-recap', recap.id, {
        fields: ['id', 'nightSlug', 'showTitle', 'venue', 'city', 'region', 'country', 'timezone', 'publicStory', 'performanceStartsAt', 'showStartedAt', 'performanceEndsAt', 'showEndedAt', 'eventId', 'campaignId', 'lineup'],
        populate: { coverImage: true, heroImage: true },
      });
      if (full) Object.assign(recap, full);
    }

    const artist = share.publicArtist(band);
    const night = recap?.nightSlug
      ? {
        nightSlug: recap.nightSlug,
        title: recap.showTitle || event?.title || null,
        venue: recap.venue || event?.venue || null,
        city: recap.city || event?.city || null,
        date: recap.performanceStartsAt || recap.showStartedAt || event?.date || null,
        cover: share.nightCoverImage({ recap }),
      }
      : null;
    const { viewer } = await buildViewer({
      userId,
      bandId: band.id,
      eventId: found.record?.eventId || recap?.eventId,
      campaignId: found.record?.showCampaignId || recap?.campaignId,
    });
    const gallery = share.publicGalleryCard(teaser, { bandSlug: band.slug });
    return {
      data: {
        artist,
        gallery,
        night,
        viewer,
        share: share.galleryShare({
          artist,
          gallerySlug: gallery.slug,
          visibility: gallery.visibility,
          caption: gallery.locked ? '' : gallery.caption,
          mediaFiles: found.record?.mediaFiles || [],
          recap,
          event,
        }),
      },
    };
  }

  return {
    getPublicNight,
    getPublicGallery,
  };
}

module.exports = {
  createPublicShareService,
  resolveOptionalUserId,
  cacheHeaders,
};
