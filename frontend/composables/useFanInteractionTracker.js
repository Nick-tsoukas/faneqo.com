/**
 * Fan Interaction Tracker Composable (V3)
 * 
 * Tracks fan interactions with band pages for analytics and engagement scoring.
 * Sends data to POST /api/fan-interactions/track endpoint.
 * Fails silently to avoid disrupting user experience.
 */

export const useFanInteractionTracker = () => {
  const config = useRuntimeConfig();
  
  // Track an interaction
  const trackInteraction = async ({
    bandId,
    interactionType,
    eventId = null,
    interactionContext = 'normal',
    surface = 'band_page',
    campaignId = null,
    fanEmail = null,
    metadata = null,
  }) => {
    if (!bandId || !interactionType) {
      console.warn('[FanTracker] Missing required fields: bandId or interactionType');
      return false;
    }

    try {
      const response = await $fetch(`${config.public.strapiUrl}/api/fan-interactions/track`, {
        method: 'POST',
        body: {
          bandId,
          interactionType,
          eventId,
          interactionContext,
          surface,
          campaignId,
          fanEmail,
          metadata,
        },
      });

      return response?.success || false;
    } catch (error) {
      // Fail silently - tracking should never break the user experience
      console.warn('[FanTracker] Failed to track interaction:', error?.message || error);
      return false;
    }
  };

  // Convenience methods for common interactions
  const trackPageView = (bandId, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'viewed_band_page',
      ...options,
    });
  };

  const trackShowModePageView = (bandId, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'viewed_show_mode_page',
      interactionContext: 'show_mode',
      ...options,
    });
  };

  const trackFollowModalOpen = (bandId, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'opened_follow_modal',
      surface: 'follow_modal',
      ...options,
    });
  };

  const trackSpotifyClick = (bandId, targetUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_spotify',
      metadata: { targetUrl },
      ...options,
    });
  };

  const trackAppleMusicClick = (bandId, targetUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_apple_music',
      metadata: { targetUrl },
      ...options,
    });
  };

  const trackYouTubeClick = (bandId, targetUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_youtube',
      metadata: { targetUrl },
      ...options,
    });
  };

  const trackTicketClick = (bandId, targetUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_ticket_link',
      metadata: { targetUrl },
      ...options,
    });
  };

  const trackMerchClick = (bandId, targetUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_merch',
      metadata: { targetUrl },
      ...options,
    });
  };

  const trackShareClick = (bandId, shareType, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_share',
      metadata: { shareType },
      ...options,
    });
  };

  const trackFollowClick = (bandId, platform, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_follow',
      metadata: { platform },
      ...options,
    });
  };

  const trackSaveClick = (bandId, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_save',
      ...options,
    });
  };

  const trackFeaturedSongPlay = (bandId, songTitle, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'played_featured_song',
      metadata: { songTitle },
      ...options,
    });
  };

  const trackVideoClick = (bandId, videoUrl, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'clicked_video',
      metadata: { videoUrl },
      ...options,
    });
  };

  const trackShowCheckIn = (bandId, options = {}) => {
    return trackInteraction({
      bandId,
      interactionType: 'checked_in_show',
      interactionContext: 'show_mode',
      ...options,
    });
  };

  return {
    // Core method
    trackInteraction,
    
    // Convenience methods
    trackPageView,
    trackShowModePageView,
    trackFollowModalOpen,
    trackSpotifyClick,
    trackAppleMusicClick,
    trackYouTubeClick,
    trackTicketClick,
    trackMerchClick,
    trackShareClick,
    trackFollowClick,
    trackSaveClick,
    trackFeaturedSongPlay,
    trackVideoClick,
    trackShowCheckIn,
  };
};
