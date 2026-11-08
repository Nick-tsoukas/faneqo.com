import { computed, onMounted } from "vue";
import { useAnalytics } from "@/composables/useAnalytics";

const STORAGE_KEY = "mbq_saved_bands_v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

export const useSavedBands = () => {
  const { trackEvent } = useAnalytics();

  const bandsState = useState("mbq_saved_bands_state_v1", () => []);
  const hydratedState = useState("mbq_saved_bands_hydrated_v1", () => false);

  const readFromStorage = () => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = safeParse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(Boolean)
      .map((x) => ({
        bandSlug: String(x.bandSlug || ""),
        bandName: String(x.bandName || ""),
        bandImageUrl: x.bandImageUrl ? String(x.bandImageUrl) : null,
        savedAt: String(x.savedAt || ""),
      }))
      .filter((x) => !!x.bandSlug);
  };

  const writeToStorage = (next) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next || []));
    } catch {
      // ignore
    }
  };

  const hydrate = () => {
    if (typeof window === "undefined") return;
    if (hydratedState.value) return;
    bandsState.value = readFromStorage();
    hydratedState.value = true;
  };

  onMounted(() => {
    hydrate();
  });

  const savedBands = computed(() => {
    const list = Array.isArray(bandsState.value) ? bandsState.value : [];
    return [...list].sort((a, b) => {
      const at = Date.parse(a.savedAt || "") || 0;
      const bt = Date.parse(b.savedAt || "") || 0;
      return bt - at;
    });
  });

  const count = computed(() => savedBands.value.length);

  const isSaved = (bandSlug) => {
    if (!bandSlug) return false;
    return (bandsState.value || []).some((b) => b?.bandSlug === bandSlug);
  };

  const saveBand = ({ bandSlug, bandName, bandImageUrl }) => {
    if (typeof window === "undefined") return false;
    hydrate();

    const slug = String(bandSlug || "").trim();
    if (!slug) return false;

    const name = String(bandName || "").trim();
    const img = bandImageUrl ? String(bandImageUrl) : null;

    const existing = (bandsState.value || []).filter((b) => b?.bandSlug !== slug);

    const next = [
      {
        bandSlug: slug,
        bandName: name,
        bandImageUrl: img,
        savedAt: nowIso(),
      },
      ...existing,
    ];

    bandsState.value = next;
    writeToStorage(next);
    trackEvent("band_saved", { bandSlug: slug });

    // Soft account prompt — never blocks anonymous save.
    try {
      const { onSaveAttempt } = useFanAccountConversion();
      onSaveAttempt({
        bandName: name || undefined,
        saveAttempt: true,
        trigger: "save_attempt",
      }).catch(() => {});
    } catch {
      /* conversion module optional at boot */
    }

    return true;
  };

  const unsaveBand = (bandSlug) => {
    if (typeof window === "undefined") return false;
    hydrate();

    const slug = String(bandSlug || "").trim();
    if (!slug) return false;

    const next = (bandsState.value || []).filter((b) => b?.bandSlug !== slug);
    bandsState.value = next;
    writeToStorage(next);
    trackEvent("band_unsaved", { bandSlug: slug });
    return true;
  };

  const toggleSaveBand = (payload) => {
    const slug = String(payload?.bandSlug || "").trim();
    if (!slug) return false;

    if (isSaved(slug)) {
      unsaveBand(slug);
      return false;
    }

    saveBand(payload || {});
    return true;
  };

  return {
    savedBands,
    isSaved,
    saveBand,
    unsaveBand,
    toggleSaveBand,
    count,
  };
};
