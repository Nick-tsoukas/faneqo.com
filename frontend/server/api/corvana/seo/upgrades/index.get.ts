/**
 * GET /api/corvana/seo/upgrades
 * 
 * Return all upgrade records.
 * 
 * Query params:
 * - page: filter by specific page URL
 * - type: filter by upgrade type
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'
import { getAllUpgrades, getUpgradesForPage } from '../../../../utils/upgradeTracker'

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, auth.status || 401)
    return auth.error
  }
  
  const query = getQuery(event)
  
  try {
    let upgrades = await getAllUpgrades()
    
    // Filter by page if specified
    if (query.page) {
      upgrades = upgrades.filter(u => u.page === query.page)
    }
    
    // Filter by type if specified
    if (query.type) {
      upgrades = upgrades.filter(u => u.upgradeType === query.type)
    }
    
    // Sort by date descending
    upgrades.sort((a, b) => new Date(b.upgradeDate).getTime() - new Date(a.upgradeDate).getTime())
    
    // Calculate summary stats
    const summary = {
      totalUpgrades: upgrades.length,
      byType: {} as Record<string, number>,
      withResults: upgrades.filter(u => u.afterMetrics).length,
      pendingResults: upgrades.filter(u => !u.afterMetrics).length
    }
    
    for (const upgrade of upgrades) {
      summary.byType[upgrade.upgradeType] = (summary.byType[upgrade.upgradeType] || 0) + 1
    }
    
    return {
      upgrades,
      summary,
      generatedAt: new Date().toISOString()
    }
    
  } catch (error: any) {
    console.error('[Corvana] Get upgrades failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to retrieve upgrades',
      message: error.message
    }
  }
})
