export const useAnalytics = () => {
  const trackEvent = (name, payload = {}) => {
    try {
      console.log("[analytics]", name, payload);
    } catch {
      // ignore
    }
  };

  return { trackEvent };
};
