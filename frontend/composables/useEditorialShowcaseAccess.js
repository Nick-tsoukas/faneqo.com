/**
 * Client-side check for Editorial Showcase editor access.
 * Public pages use band.editorialShowcaseEnabled only — never viewer email.
 */
export function useEditorialShowcaseAccess() {
  const config = useRuntimeConfig();
  const user = useStrapiUser();
  const token = useStrapiToken();

  const hasAccess = ref(false);
  const loading = ref(true);

  async function refreshAccess() {
    loading.value = true;

    if (!user.value?.id || !token.value) {
      hasAccess.value = false;
      loading.value = false;
      return false;
    }

    if (user.value.editorialShowcaseAccess === true) {
      hasAccess.value = true;
      loading.value = false;
      return true;
    }

    try {
      const res = await fetch(`${config.public.strapiUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      });
      if (res.ok) {
        const data = await res.json();
        hasAccess.value = data.editorialShowcaseAccess === true;
      } else {
        hasAccess.value = false;
      }
    } catch {
      hasAccess.value = false;
    }

    loading.value = false;
    return hasAccess.value;
  }

  watch(
    () => [user.value?.id, token.value],
    () => {
      refreshAccess();
    },
    { immediate: true }
  );

  return { hasAccess, loading, refreshAccess };
}
