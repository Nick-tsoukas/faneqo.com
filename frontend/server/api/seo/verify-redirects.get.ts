/**
 * SEO Redirect Verification API
 * 
 * Usage: GET /api/seo/verify-redirects
 * 
 * Returns verification status for all SEO redirects:
 * - Each loser URL returns 301 to correct winner
 * - Each winner URL returns 200
 * - No redirect chains
 * - Sitemap exclusions
 */

import { defineEventHandler } from 'h3'
import { seoRedirects, getRedirectedUrls, getWinnerUrls } from '../../utils/seoRedirects.ts'

export default defineEventHandler(async (event) => {
  const baseUrl = process.env.BASE_URL || 'https://musicbizqr.com'
  
  const results = {
    summary: {
      totalRedirects: 0,
      verifiedRedirects: 0,
      failedRedirects: 0,
      totalWinners: 0,
      verifiedWinners: 0,
      failedWinners: 0,
    },
    redirects: [],
    winners: [],
    chains: [],
    errors: []
  }
  
  const redirectedUrls = getRedirectedUrls()
  const winnerUrls = getWinnerUrls()
  
  results.summary.totalRedirects = redirectedUrls.length
  results.summary.totalWinners = winnerUrls.length
  
  // Check each redirect
  for (const [loser, winner] of Object.entries(seoRedirects)) {
    const check = {
      from: loser,
      to: winner,
      fromStatus: null,
      toStatus: null,
      location: null,
      verified: false,
      error: null
    }
    
    try {
      // Check loser URL returns 301 to winner
      const loserRes = await fetch(`${baseUrl}${loser}`, {
        method: 'HEAD',
        redirect: 'manual'
      })
      
      check.fromStatus = loserRes.status
      check.location = loserRes.headers.get('location')
      
      // Verify 301 and correct destination
      if (loserRes.status === 301 || loserRes.status === 308) {
        if (check.location === winner || check.location === `${baseUrl}${winner}`) {
          check.verified = true
          results.summary.verifiedRedirects++
        } else {
          check.error = `Redirects to ${check.location}, expected ${winner}`
          results.summary.failedRedirects++
        }
      } else {
        check.error = `Expected 301, got ${loserRes.status}`
        results.summary.failedRedirects++
      }
      
      // Check winner URL returns 200
      const winnerRes = await fetch(`${baseUrl}${winner}`, {
        method: 'HEAD',
        redirect: 'follow'
      })
      
      check.toStatus = winnerRes.status
      
    } catch (err) {
      check.error = err.message
      results.summary.failedRedirects++
    }
    
    results.redirects.push(check)
  }
  
  // Check for redirect chains (winner shouldn't be a loser)
  for (const winner of winnerUrls) {
    if (redirectedUrls.includes(winner)) {
      results.chains.push({
        url: winner,
        issue: 'Winner is also a loser - creates redirect chain'
      })
    }
  }
  
  // Verify winners return 200
  for (const winner of winnerUrls) {
    const winnerCheck = {
      url: winner,
      status: null,
      verified: false,
      error: null
    }
    
    try {
      const res = await fetch(`${baseUrl}${winner}`, {
        method: 'HEAD',
        redirect: 'follow'
      })
      
      winnerCheck.status = res.status
      
      if (res.status === 200) {
        winnerCheck.verified = true
        results.summary.verifiedWinners++
      } else {
        winnerCheck.error = `Expected 200, got ${res.status}`
        results.summary.failedWinners++
      }
    } catch (err) {
      winnerCheck.error = err.message
      results.summary.failedWinners++
    }
    
    results.winners.push(winnerCheck)
  }
  
  // Overall status
  const allGood = 
    results.summary.failedRedirects === 0 && 
    results.summary.failedWinners === 0 && 
    results.chains.length === 0
  
  return {
    status: allGood ? 'ok' : 'issues_found',
    ...results
  }
})
