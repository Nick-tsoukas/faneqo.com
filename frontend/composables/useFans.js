export function useFans() {
  const config = useRuntimeConfig();
  const token = useStrapiToken();

  const baseUrl = `${config.public.strapiUrl}/api/fans`;

  /**
   * Every Fan Intelligence call is explicitly band-scoped. The band the caller
   * is displaying must be the band the API reads, so a missing id is a caller
   * bug rather than an invitation for the server to pick a band.
   */
  function requireBandId(bandId) {
    const id = Number(bandId);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('bandId is required for Fan Intelligence requests');
    }
    return id;
  }

  // Get fans list with pagination, sorting, filtering (V3 enhanced)
  async function getFans({
    bandId,
    page = 1,
    pageSize = 25,
    sortField = 'subscribedAt',
    sortOrder = 'desc',
    search = '',
    source = '',
    status = '',
    // V3 filters
    captureContext = '',
    captureSurface = '',
    city = '',
    region = '',
    country = '',
    capturedDuringShowMode = null,
    capturedAtEventId = '',
    captureCampaignId = '',
    engagementTier = '',
    dateJoinedFrom = '',
    dateJoinedTo = '',
  } = {}) {
    const params = new URLSearchParams();
    params.set('bandId', requireBandId(bandId));
    params.set('page', page);
    params.set('pageSize', pageSize);
    params.set('sortField', sortField);
    params.set('sortOrder', sortOrder);
    if (search) params.set('search', search);
    if (source) params.set('source', source);
    if (status) params.set('status', status);
    // V3 filters
    if (captureContext) params.set('captureContext', captureContext);
    if (captureSurface) params.set('captureSurface', captureSurface);
    if (city) params.set('city', city);
    if (region) params.set('region', region);
    if (country) params.set('country', country);
    if (capturedDuringShowMode !== null) params.set('capturedDuringShowMode', capturedDuringShowMode);
    if (capturedAtEventId) params.set('capturedAtEventId', capturedAtEventId);
    if (captureCampaignId) params.set('captureCampaignId', captureCampaignId);
    if (engagementTier) params.set('engagementTier', engagementTier);
    if (dateJoinedFrom) params.set('dateJoinedFrom', dateJoinedFrom);
    if (dateJoinedTo) params.set('dateJoinedTo', dateJoinedTo);

    const response = await fetch(`${baseUrl}/my-fans?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fans');
    }

    return response.json();
  }

  // Get fan analytics (V3 enhanced) — same band as getFans, always
  async function getAnalytics(bandId) {
    const response = await fetch(`${baseUrl}/my-fans-analytics?bandId=${requireBandId(bandId)}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fan analytics');
    }

    return response.json();
  }

  // Get detailed fan profile (V3)
  async function getFanDetail(fanId, bandId) {
    const response = await fetch(`${baseUrl}/${fanId}/detail?bandId=${requireBandId(bandId)}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fan detail');
    }

    return response.json();
  }

  // Legacy alias
  async function getFanAnalytics(bandId) {
    return getAnalytics(bandId);
  }

  // Import fans from parsed CSV data
  async function importFans(fans, bandId) {
    const response = await fetch(`${baseUrl}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ fans, bandId: requireBandId(bandId) }),
    });

    if (!response.ok) {
      throw new Error('Failed to import fans');
    }

    return response.json();
  }

  // Export fans
  async function exportFans(bandId) {
    const response = await fetch(`${baseUrl}/export?bandId=${requireBandId(bandId)}`, {
      headers: {
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export fans');
    }

    return response.json();
  }

  // Add a single fan manually
  async function addFan({ email, notes, bandId }) {
    const response = await fetch(`${baseUrl}/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({ email, notes, bandId: requireBandId(bandId) }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error?.error?.message || 'Failed to add fan');
    }

    return response.json();
  }

  /**
   * Soft-remove a fan from this band's active Fan List.
   * Does not hard-delete or globally suppress the email.
   */
  async function removeFromFanList(fanId) {
    const response = await fetch(`${baseUrl}/${fanId}/remove-from-list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      let message = 'Failed to remove fan from Fan List';
      try {
        const error = await response.json();
        message = error?.error?.message || error?.message || message;
      } catch {
        /* ignore parse errors */
      }
      throw new Error(message);
    }

    return response.json();
  }

  // Parse CSV text to array of fan objects
  function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length === 0) return [];

    // Check if first line is header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('email');
    const startIndex = hasHeader ? 1 : 0;

    const fans = [];
    const seenEmails = new Set();

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle CSV with commas (take first column as email)
      const parts = line.split(',');
      const email = parts[0].trim().toLowerCase().replace(/^["']|["']$/g, '');

      if (!email) continue;
      if (seenEmails.has(email)) continue;

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

      seenEmails.add(email);
      fans.push({ email });
    }

    return fans;
  }

  // Generate CSV from fans data
  function generateCSV(fans) {
    const headers = ['Email', 'Source', 'Status', 'Date Joined'];
    const rows = fans.map(fan => [
      fan.email,
      fan.source,
      fan.status,
      fan.subscribedAt ? new Date(fan.subscribedAt).toLocaleDateString() : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  // Download CSV file
  function downloadCSV(csvContent, filename = 'fans.csv') {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Format source for display
  function formatSource(source) {
    const sourceLabels = {
      band_page: 'Band Page',
      follow_modal: 'Follow Modal',
      import: 'Import',
      manual: 'Manual',
      other: 'Other',
    };
    return sourceLabels[source] || source;
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return {
    getFans,
    getFanDetail,
    getAnalytics,
    getFanAnalytics,
    importFans,
    exportFans,
    addFan,
    removeFromFanList,
    parseCSV,
    generateCSV,
    downloadCSV,
    formatSource,
    formatDate,
  };
}
