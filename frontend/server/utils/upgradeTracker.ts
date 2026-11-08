/**
 * SEO Upgrade Tracker
 * 
 * Lightweight storage for tracking SEO upgrades over time.
 * File-based for local/dev use.
 * 
 * TODO: Replace with database storage in production (Strapi entity).
 */

import { readFile, writeFile, access, mkdir } from 'fs/promises'
import { join } from 'path'

const STORAGE_DIR = './.corvana-data'
const UPGRADES_FILE = 'upgrades.json'

export interface UpgradeRecord {
  id: string
  page: string
  upgradeType: 'TITLE_META_REWRITE' | 'ARTICLE_REFRESH' | 'INTERNAL_LINKING' | 'PILLAR_STRENGTHENING' | 'REDIRECT_MERGE' | 'HOMEPAGE_SEO_UPGRADE'
  notes: string
  changedFields: string[]
  upgradeDate: string
  beforeMetrics: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    days: number
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  afterMetrics?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    days: number
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  delta?: {
    clicksChange: number
    impressionsChange: number
    positionChange: number
    ctrChange: number
    percentChange: number
  }
  assessment?: string
  daysSinceUpgrade?: number
}

/**
 * Ensure storage directory exists
 */
async function ensureStorage(): Promise<void> {
  try {
    await access(STORAGE_DIR)
  } catch {
    await mkdir(STORAGE_DIR, { recursive: true })
  }
}

/**
 * Read all upgrades from file
 */
export async function readUpgrades(): Promise<UpgradeRecord[]> {
  await ensureStorage()
  
  try {
    const filePath = join(STORAGE_DIR, UPGRADES_FILE)
    const data = await readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return []
  }
}

/**
 * Write upgrades to file
 */
async function writeUpgrades(upgrades: UpgradeRecord[]): Promise<void> {
  await ensureStorage()
  const filePath = join(STORAGE_DIR, UPGRADES_FILE)
  await writeFile(filePath, JSON.stringify(upgrades, null, 2), 'utf-8')
}

/**
 * Add a new upgrade record
 */
export async function addUpgrade(
  page: string,
  upgradeType: UpgradeRecord['upgradeType'],
  notes: string,
  changedFields: string[],
  beforeMetrics: UpgradeRecord['beforeMetrics']
): Promise<UpgradeRecord> {
  const upgrades = await readUpgrades()
  
  const record: UpgradeRecord = {
    id: `upgrade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    page,
    upgradeType,
    notes,
    changedFields,
    upgradeDate: new Date().toISOString(),
    beforeMetrics
  }
  
  upgrades.push(record)
  await writeUpgrades(upgrades)
  
  console.log(`[Corvana] Upgrade recorded: ${page} - ${upgradeType}`)
  return record
}

/**
 * Get all upgrades for a page
 */
export async function getUpgradesForPage(page: string): Promise<UpgradeRecord[]> {
  const upgrades = await readUpgrades()
  return upgrades.filter(u => u.page === page)
}

/**
 * Get all upgrades
 */
export async function getAllUpgrades(): Promise<UpgradeRecord[]> {
  return readUpgrades()
}

/**
 * Update upgrade with after metrics
 */
export async function updateUpgradeWithResults(
  upgradeId: string,
  afterMetrics: UpgradeRecord['afterMetrics']
): Promise<UpgradeRecord | null> {
  const upgrades = await readUpgrades()
  const index = upgrades.findIndex(u => u.id === upgradeId)
  
  if (index === -1) return null
  
  const upgrade = upgrades[index]
  upgrade.afterMetrics = afterMetrics
  
  // Calculate delta
  const before = upgrade.beforeMetrics
  upgrade.delta = {
    clicksChange: afterMetrics.clicks - before.clicks,
    impressionsChange: afterMetrics.impressions - before.impressions,
    positionChange: parseFloat((before.position - afterMetrics.position).toFixed(1)), // Lower is better
    ctrChange: parseFloat(((afterMetrics.ctr - before.ctr) * 100).toFixed(2)),
    percentChange: before.clicks > 0 
      ? parseFloat((((afterMetrics.clicks - before.clicks) / before.clicks) * 100).toFixed(1))
      : (afterMetrics.clicks > 0 ? 100 : 0)
  }
  
  // Calculate days since upgrade
  const upgradeDate = new Date(upgrade.upgradeDate)
  const now = new Date()
  upgrade.daysSinceUpgrade = Math.floor((now.getTime() - upgradeDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate assessment
  const days = upgrade.daysSinceUpgrade
  const delta = upgrade.delta
  
  if (days < 14) {
    upgrade.assessment = 'TOO_EARLY: Wait at least 14 days for Google to process changes'
  } else if (days < 28) {
    if (delta.clicksChange > 0) {
      upgrade.assessment = 'EARLY_POSITIVE: Early signs positive, continue monitoring for 28+ days'
    } else if (delta.positionChange > 2) {
      upgrade.assessment = 'EARLY_IMPROVING: Position improving, clicks should follow'
    } else {
      upgrade.assessment = 'EARLY_NEUTRAL: No significant change yet, give it more time'
    }
  } else {
    if (delta.percentChange >= 50) {
      upgrade.assessment = 'SUCCESS: Significant improvement, document learnings'
    } else if (delta.percentChange > 0) {
      upgrade.assessment = 'MODERATE_SUCCESS: Improvement observed, consider further optimization'
    } else if (delta.percentChange === 0) {
      upgrade.assessment = 'NEUTRAL: No change, review if changes were sufficient'
    } else {
      upgrade.assessment = 'NEEDS_REVIEW: Negative trend, consider different approach or revert'
    }
  }
  
  upgrades[index] = upgrade
  await writeUpgrades(upgrades)
  
  return upgrade
}

/**
 * Clear all upgrades (for testing)
 */
export async function clearAllUpgrades(): Promise<void> {
  await writeUpgrades([])
}
