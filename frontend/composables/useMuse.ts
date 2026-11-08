// Uses Nuxt Strapi client so calls go to STRAPI_URL, not the Nuxt server.
// NOTE: Pass paths WITHOUT /api — the module prefixes /api for you.

export function useMuse() {
  // @ts-ignore - Nuxt auto-import
  const client = useStrapiClient();

  const getRollups = (bandId: number, range = '30d') =>
    client('/analytics/rollups', {
      params: { bandId, range },
    });

  const getGeo = (bandId: number, range = '30d') =>
    client('/analytics/geo', {
      params: { bandId, range },
    });

  const getTransitions = (bandId: number, range = '30d') =>
    client('/analytics/transitions', {
      params: { bandId, range },
    });


  const getMuseSummary = (bandId: number, range = '7d') =>
    client('/muse/aggregate', { params: { bandId, range } });

  const getFollows = (bandId: number, range = '30d') =>
    client('/analytics/follows', { params: { bandId, range } });

  return { getRollups, getGeo, getTransitions, getMuseSummary, getFollows };
}
