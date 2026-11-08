/**
 * useShowRecaps composable
 * Provides methods for fetching show recaps from the API
 */
export const useShowRecaps = () => {
  const config = useRuntimeConfig();
  const token = useStrapiToken();
  const jwtCookie = useCookie('strapi_jwt');

  const baseUrl = config.public.strapiUrl || 'http://localhost:1337';

  function readJwt() {
    return String(token.value || jwtCookie.value || '').trim();
  }

  async function resolveJwt() {
    let jwt = readJwt();
    if (jwt) return jwt;
    if (import.meta.server) return '';

    // Full refresh can mount recap pages before the Strapi cookie hydrates.
    await nextTick();
    jwt = readJwt();
    if (jwt) return jwt;

    for (let i = 0; i < 20; i += 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      jwt = readJwt();
      if (jwt) return jwt;
    }

    return readJwt();
  }

  function authRequiredError() {
    const error = new Error('Authentication required');
    error.status = 401;
    error.statusCode = 401;
    return error;
  }

  async function recapHeaders() {
    const jwt = await resolveJwt();
    if (!jwt) throw authRequiredError();
    return { Authorization: `Bearer ${jwt}` };
  }

  function isAuthFailure(error) {
    const status = Number(error?.status || error?.statusCode || error?.response?.status);
    return status === 401 || status === 403;
  }

  /**
   * Latest show recap for a band.
   *
   * Always name the band when the caller knows it. Omitting it lets the API
   * fall back to "first owned band", which is the wrong Night for anyone who
   * has more than one artist. The API authorizes the id either way.
   */
  const getLatestRecap = async (bandId = null) => {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/latest/me`, {
        headers: await recapHeaders(),
        ...(bandId ? { params: { bandId } } : {}),
      });
      return response?.data || null;
    } catch (error) {
      console.error('Failed to fetch latest recap:', error);
      return null;
    }
  };

  /**
   * Get paginated list of show recaps
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default 1)
   * @param {number} params.pageSize - Items per page (default 10)
   * @param {string} params.search - Matches city, venue, or show title
   */
  const getRecaps = async (params = {}) => {
    const { page = 1, pageSize = 10, bandId = null, search = '' } = params;
    const term = String(search || '').trim();

    // Failures are rethrown rather than flattened into an empty page: the
    // archive has to tell "you haven't played a show yet" apart from "we
    // couldn't reach the server".
    const response = await $fetch(`${baseUrl}/api/show-recaps/my-recaps`, {
      headers: await recapHeaders(),
      // Name the band whenever the caller knows it; otherwise the API falls
      // back to "first owned band", which is the wrong artist's Nights.
      params: { page, pageSize, ...(bandId ? { bandId } : {}), ...(term ? { search: term } : {}) },
    });

    return {
      data: response?.data || [],
      meta: response?.meta || { pagination: { page, pageSize, pageCount: 0, total: 0 } },
    };
  };

  /**
   * Get detailed show recap by ID
   * @param {number} id - Recap ID
   */
  const getRecapDetail = async (id) => {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/${id}`, {
        headers: await recapHeaders(),
      });
      return response?.data || null;
    } catch (error) {
      if (isAuthFailure(error)) throw error;
      console.error('Failed to fetch recap detail:', error);
      return null;
    }
  };

  /**
   * Manually trigger recap generation for a campaign.
   *
   * Name the band. Omitting it lets the API fall back to "first owned band",
   * which files an empty recap for this campaign under the wrong artist.
   * @param {string} campaignId - Campaign ID to generate recap for
   * @param {number|string|null} bandId - Band the campaign belongs to
   */
  const generateRecap = async (campaignId, bandId = null) => {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/generate`, {
        method: 'POST',
        headers: await recapHeaders(),
        body: { campaignId, ...(bandId ? { bandId } : {}) },
      });
      return response?.data || null;
    } catch (error) {
      console.error('Failed to generate recap:', error);
      throw error;
    }
  };

  /**
   * How many people would receive a post-show message, and whether one can be
   * sent right now (send limit and spacing are enforced server-side).
   * @param {number} id - Recap ID
   */
  const getMessagePreview = async (id, channel = 'email') => {
    try {
      const response = await $fetch(`${baseUrl}/api/show-recaps/${id}/message`, {
        headers: await recapHeaders(),
        query: { channel },
      });
      return response?.data || null;
    } catch (error) {
      console.error('Failed to load message details:', error);
      return null;
    }
  };

  /**
   * Queue a Message the Room campaign (background delivery).
   * @param {number} id - Recap ID
   * @param {Object} message - `{ subject, note }` written by the band
   * @returns {{ campaignId, status, queued, recipientCount, skipped, sent, failed }}
   */
  const sendRecapMessage = async (id, message) => {
    const response = await $fetch(`${baseUrl}/api/show-recaps/${id}/message`, {
      method: 'POST',
      headers: await recapHeaders(),
      body: {
        subject: message?.subject,
        note: message?.note,
        channel: message?.channel || 'email',
      },
    });
    return response?.data || null;
  };

  /**
   * Poll safe campaign progress (no recipient emails).
   * @param {number|string} campaignId
   */
  const getCampaignStatus = async (campaignId) => {
    const response = await $fetch(`${baseUrl}/api/message-campaigns/${campaignId}/status`, {
      headers: await recapHeaders(),
    });
    return response?.data || null;
  };

  const getArtistNight = async (id) => {
    const response = await $fetch(`${baseUrl}/api/show-recaps/${id}/night`, {
      headers: await recapHeaders(),
    });
    return response?.data || null;
  };

  const updateNight = async (id, patch = {}) => {
    const response = await $fetch(`${baseUrl}/api/show-recaps/${id}/night`, {
      method: 'PATCH',
      headers: await recapHeaders(),
      body: patch,
    });
    return response?.data || null;
  };

  return {
    getLatestRecap,
    getRecaps,
    getRecapDetail,
    getArtistNight,
    updateNight,
    generateRecap,
    getMessagePreview,
    sendRecapMessage,
    getCampaignStatus,
  };
};
