import { ref } from 'vue';
import { useWorkspaceBand } from '~/composables/useWorkspaceBand';

/**
 * The band Fan Intelligence surfaces (Fan Analytics, exports) operate on.
 *
 * These screens live outside the dashboard and used to let the API pick "the
 * first band this user owns" — an undefined ordering that could point at a
 * different artist than the one on screen. They now resolve through the same
 * active-workspace helper as every other artist tool, so a two-band artist
 * reads the workspace they actually opened.
 *
 * Authorization still happens on the Strapi side; this only chooses which
 * authorized band to ask for.
 */
export function usePrimaryBandId() {
  const { requireActiveBand } = useWorkspaceBand();

  const bandId = ref(null);
  const resolving = ref(false);
  const resolved = ref(false);

  async function resolve() {
    resolving.value = true;
    try {
      // Sends a multi-band user to the picker instead of guessing.
      const band = await requireActiveBand();
      bandId.value = band?.bandId ?? null;
      resolved.value = true;
      return bandId.value;
    } catch (error) {
      console.error('[PrimaryBand] Failed to resolve primary band:', error);
      return null;
    } finally {
      resolving.value = false;
    }
  }

  return { bandId, resolving, resolved, resolve };
}
