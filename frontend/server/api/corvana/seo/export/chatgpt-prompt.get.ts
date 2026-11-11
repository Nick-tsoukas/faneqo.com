/**
 * GET /api/corvana/seo/export/chatgpt-prompt
 * 
 * Generate a copy/paste prompt for ChatGPT with embedded data.
 * 
 * Query params:
 * - type: snapshot | upgrade | cannibalization | page | cluster | internal-links
 * - page: encoded URL (for type=page)
 * - days: 28 (default)
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'

const PROMPT_TEMPLATES: Record<string, (data: any) => string> = {
  snapshot: (data) => `Analyze this MusicBizQR Search Console + Corvana SEO snapshot. 

SITE CONTEXT:
- MusicBizQR is a SaaS tool for musicians/bands to create smart links and QR codes
- Target audience: Independent musicians, bands, artists, managers
- Goal: Increase organic traffic and signups

CURRENT PERFORMANCE:
${JSON.stringify(data.summary || {}, null, 2)}

TOP OPPORTUNITIES:
${JSON.stringify(data.easyWins?.slice(0, 10) || [], null, 2)}

HIGH-INTENT QUERIES (prioritize these):
${JSON.stringify(data.highIntentQueries?.slice(0, 10) || [], null, 2)}

CANNIBALIZATION RISKS:
${JSON.stringify(data.cannibalizationCandidates?.slice(0, 5) || [], null, 2)}

TASK:
Recommend the top 5 actions to increase organic clicks and signups. 

PRIORITIZE:
1. Homepage upgrades (if homepage ranks for high-intent terms)
2. High-intent query optimization
3. Article refreshes with easy-win potential (position 5-25)
4. Internal linking improvements
5. Cannibalization cleanup

DO NOT:
- Recommend deleting pages unless they are exact duplicates
- Suggest auto-redirects without manual review
- Ignore the zero-click issue (we have impressions but no clicks)

OUTPUT FORMAT:
1. Priority 1: [Action] - [Expected Impact] - [Effort Level]
2. Priority 2: ...
3. Priority 3: ...
4. Priority 4: ...
5. Priority 5: ...

BONUS: Suggest 3 title/meta description improvements for pages with impressions but zero clicks.`,

  upgrade: (data) => `Create a prioritized weekly SEO work plan for MusicBizQR based on this upgrade queue.

SITE CONTEXT:
- MusicBizQR: Smart links and QR codes for musicians
- Current organic clicks: ${data.summary?.totalClicks || 0}
- Current impressions: ${data.summary?.totalImpressions || 0}

UPGRADE QUEUE (TOP 15):
${JSON.stringify(data.prioritizedQueue?.slice(0, 15) || [], null, 2)}

QUICK WINS (LOW EFFORT, HIGH IMPACT):
${JSON.stringify(data.quickWins?.slice(0, 10) || [], null, 2)}

WEEK 1-4 PLAN:
Create a week-by-week plan with specific actions. For each week:
- Which pages to upgrade
- What type of upgrade (title/meta, content refresh, internal linking)
- Expected outcomes
- Time estimate

PRIORITIZATION RULES:
1. Start with HOMEPAGE_SEO_UPGRADE if present (high impact)
2. Next: TITLE_META_REWRITE for pages with impressions but 0 clicks
3. Next: ARTICLE_REFRESH for position 5-25 pages
4. Next: INTERNAL_LINKING (quick wins)
5. Last: Major CONTENT_RETARGET projects

OUTPUT:
Week 1: [Page] - [Action] - [Time] - [Expected Result]
Week 2: ...
Week 3: ...
Week 4: ...

Also include a "daily 30-minute SEO habit" routine.`,

  cannibalization: (data) => `Resolve these cannibalization conflicts for MusicBizQR SEO.

SITE CONTEXT:
- Multiple pages competing for the same Google queries
- Need to consolidate authority to one "owner" page per query
- Goal: Clear query ownership without losing content value

CANNIBALIZATION CANDIDATES (TOP 10):
${JSON.stringify(data.cannibalizationCandidates?.slice(0, 10) || [], null, 2)}

HOMEPAGE VS ARTICLE CONFLICTS:
${JSON.stringify(data.byConflictType?.['HOMEPAGE_VS_ARTICLES']?.slice(0, 5) || [], null, 2)}

DECISION FRAMEWORK:
For each query conflict, recommend:
1. OWNER PAGE: Which page should rank for this query
2. REASONING: Why this page over alternatives
3. ACTION: What to do with competing pages
   - KEEP (but reduce optimization for this query)
   - RETARGET (optimize for different query)
   - MERGE (combine unique content, redirect one)
   - REDIRECT (if truly duplicate)

QUERY OWNERSHIP RULES:
- Homepage wins: Broad product/tool queries ("music qr", "qr tool")
- Article wins: Educational/long-tail ("how to use qr codes at concerts")
- Intent match: Informational intent = article, Transactional = homepage

OUTPUT FORMAT:
For each query:
Query: [query]
Owner: [page]
Action for competitors: [KEEP/RETARGET/MERGE/REDIRECT]
Internal linking: [what links to add]

Do NOT recommend automatic redirects unless pages are exact duplicates.`,

  page: (data) => `Optimize this specific MusicBizQR page for SEO.

PAGE DETAILS:
URL: ${data.page?.url}
Title: ${data.page?.title || 'N/A'}
Cluster: ${data.page?.cluster || 'N/A'}

CURRENT PERFORMANCE:
${JSON.stringify(data.pageLevelMetrics || {}, null, 2)}

QUERIES THIS PAGE RANKS FOR:
${JSON.stringify(data.queryBreakdown?.allQueries?.slice(0, 15) || [], null, 2)}

TOP OPPORTUNITIES:
${JSON.stringify(data.opportunities || {}, null, 2)}

COMPETING PAGES (same queries):
${JSON.stringify(data.competingPages?.pages?.slice(0, 5) || [], null, 2)}

RECOMMENDATIONS ALREADY IDENTIFIED:
${JSON.stringify(data.recommendedActions || [], null, 2)}

TASK:
Provide specific, actionable recommendations:

1. TITLE TAG (max 60 chars):
   Current: [suggest new or keep]
   Proposed: [exact title]

2. META DESCRIPTION (max 155 chars):
   Proposed: [exact description with CTA]

3. H1 HEADING:
   Proposed: [exact H1]

4. INTRO PARAGRAPH (2-3 sentences):
   Proposed: [copy-ready intro targeting top query]

5. CTA SECTION:
   Proposed: [conversion-focused CTA]

6. FAQ SECTION (3-5 questions):
   Q1: [question targeting query]
   A1: [answer]

7. SCHEMA MARKUP:
   Recommended: [Article, FAQ, or other]

8. INTERNAL LINKS TO ADD:
   - Link to: [URL] with anchor: "[text]"
   - Link to: [URL] with anchor: "[text]"

9. CONTENT GAPS (vs competing pages):
   [What's missing that competitors cover]

Be specific - provide exact copy I can use.`,

  cluster: (data) => `Develop a cluster strategy for MusicBizQR SEO.

SITE CONTEXT:
- MusicBizQR has content organized into clusters (smart-links, qr-code-strategy, etc.)
- Each cluster should have: 1 pillar page + supporting articles
- Goal: Topical authority and internal linking structure

CLUSTER PERFORMANCE:
${JSON.stringify(data.clusters || [], null, 2)}

PRIORITY ACTIONS:
${JSON.stringify(data.priorityActions || [], null, 2)}

TASK:
For each cluster needing work, recommend:

1. PILLAR PAGE: Existing or new comprehensive guide
   - URL structure
   - Target queries
   - Word count goal

2. SUPPORTING ARTICLES (5-10):
   - Article titles
   - Target queries
   - Link to pillar

3. INTERNAL LINKING STRUCTURE:
   - How articles link to pillar
   - How articles link to each other
   - Anchor text strategy

4. CONTENT GAPS:
   - What topics are missing
   - Competitor content to match/exceed

5. QUICK WINS:
   - Which existing articles need minor tweaks
   - Which need major rewrites

OUTPUT:
Cluster: [name]
Status: [healthy/needs work/critical]
Pillar: [page or create new]
Supporting articles: [list]
Top priority: [specific action]

Focus on clusters with impressions but poor positions first.`,

  'internal-links': (data) => `Implement internal linking for MusicBizQR SEO.

SITE CONTEXT:
- Internal linking passes authority between pages
- Pillar pages need links from supporting articles
- New articles need links from established pages

STRATEGIC NOTES:
${JSON.stringify(data.strategicNotes || [], null, 2)}

PILLAR TARGETS:
${JSON.stringify(data.pillarTargets || {}, null, 2)}

HIGH PRIORITY RECOMMENDATIONS:
${JSON.stringify(data.highPriorityRecommendations?.slice(0, 15) || [], null, 2)}

TASK:
For each page needing internal links, provide:

1. SOURCE PAGE: [URL]
2. LINKS TO ADD:
   - Link to: [target URL]
     Anchor text: "[exact text]"
     Context: [where in page - intro, body, CTA section]
     Reason: [why this link helps]

3. EXISTING CONTENT CHECK:
   - Is there a natural place to add this?
   - Should we create a new section?

4. PRIORITY ORDER:
   - Which links to add first (highest impact)
   - Which can wait

OUTPUT FORMAT:
Source: [URL]
Add link to: [target] with anchor: "[text]"
Placement: [specific section]
Priority: [high/medium/low]

Provide at least 20 specific internal link recommendations.`
}

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, auth.status || 401)
    return auth.error
  }
  
  const query = getQuery(event)
  const { type, page, days } = query
  
  // Validate type
  const validTypes = ['snapshot', 'upgrade', 'cannibalization', 'page', 'cluster', 'internal-links']
  if (!type || !validTypes.includes(type as string)) {
    setResponseStatus(event, 400)
    return {
      error: 'Invalid or missing type parameter',
      validTypes,
      example: '/api/corvana/seo/export/chatgpt-prompt?type=snapshot&days=28'
    }
  }
  
  // For page type, page URL is required
  if (type === 'page' && !page) {
    setResponseStatus(event, 400)
    return {
      error: 'page parameter required for type=page',
      example: '/api/corvana/seo/export/chatgpt-prompt?type=page&page=https%3A%2F%2Fmusicbizqr.com%2F'
    }
  }
  
  try {
    // Fetch the appropriate data
    const daysNum = Math.min(parseInt(days as string) || 28, 90)
    let data: any = {}
    
    // Build the internal API URL to fetch data
    const baseUrl = `http://localhost:3000` // For server-side fetch
    const token = query.token as string || ''
    
    switch (type) {
      case 'snapshot':
        data = await $fetch(`${baseUrl}/api/corvana/seo/export/snapshot?days=${daysNum}&token=${token}`)
        break
      case 'upgrade':
        data = await $fetch(`${baseUrl}/api/corvana/seo/export/upgrade-queue?days=${daysNum}&token=${token}`)
        break
      case 'cannibalization':
        data = await $fetch(`${baseUrl}/api/corvana/seo/export/cannibalization?days=${daysNum}&token=${token}`)
        break
      case 'page':
        data = await $fetch(`${baseUrl}/api/corvana/seo/export/page-detail?url=${page}&days=${daysNum}&token=${token}`)
        break
      case 'cluster':
        data = await $fetch(`${baseUrl}/api/corvana/seo/report/cluster-health?days=${daysNum}&token=${token}`)
        break
      case 'internal-links':
        data = await $fetch(`${baseUrl}/api/corvana/seo/report/internal-links?days=${daysNum}&token=${token}`)
        break
    }
    
    // Generate the prompt
    const promptTemplate = PROMPT_TEMPLATES[type as string]
    const prompt = promptTemplate(data)
    
    return {
      type,
      prompt,
      dataSummary: {
        site: data.site || 'musicbizqr.com',
        generatedAt: new Date().toISOString(),
        dataSource: `Corvana SEO ${type} export`
      },
      instructions: [
        'Copy the prompt above',
        'Paste into ChatGPT (GPT-4 recommended)',
        'Include the JSON data that follows the prompt',
        'Review recommendations before implementing',
        'For page-specific prompts, provide the actual data from the export endpoint'
      ],
      copyToClipboard: prompt
    }
    
  } catch (error: any) {
    console.error('[Corvana] ChatGPT prompt generation failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to generate ChatGPT prompt',
      message: error.message,
      help: 'Ensure all required endpoints are working and OAuth is connected'
    }
  }
})
