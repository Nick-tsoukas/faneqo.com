/**
 * Seed Demo Data for BurningThunder (Band ID: 5)
 * 
 * Creates: 3 events, ~28 fans, ~120 interactions, ~15 attendance records
 * All fans are marked with demo: true for easy cleanup
 * 
 * Usage: node scripts/seed-demo-data.js
 * 
 * Requires STRAPI_URL and STRAPI_WRITE_TOKEN env vars (or uses defaults below)
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://qrserver-production.up.railway.app';
const API_TOKEN = process.env.STRAPI_WRITE_TOKEN || '2db94b2cf1bcbd90b3dba406dafc1a46ae2e178dd1ba551249347064d03e20fd18af9c12a075308379151f5e5fc95affe8591ce72b42ef0be9cce04b3e44bfc27f3c9c83d4fc2e21894407c533ab30b617fc43007fb2f1298e0b7d48b589cd7d48751a9e3fc6f99a59aa8f9f440bcace0e8896cee03c24e17ec3ce9f180ac0a4';

const BAND_ID = 5;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${API_TOKEN}`,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function isoDateTime(d) {
  return d.toISOString();
}

async function apiPost(endpoint, data) {
  const url = `${STRAPI_URL}/api/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${endpoint} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.data;
}

async function apiPut(endpoint, id, data) {
  const url = `${STRAPI_URL}/api/${endpoint}/${id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PUT ${endpoint}/${id} failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.data;
}

// ── Demo Events ──────────────────────────────────────────────────────────────

const EVENTS = [
  {
    title: 'BurningThunder @ The Viper Room',
    date: isoDate(daysAgo(45)),
    time: '21:00:00',
    doorsTime: '20:00:00',
    venue: 'The Viper Room',
    city: 'Los Angeles',
    state: 'CA',
    address: '8852 Sunset Blvd, West Hollywood, CA 90069',
    band: BAND_ID,
    isApproved: true,
    slug: 'burningthunder-viper-room-demo',
  },
  {
    title: 'BurningThunder @ The Troubadour',
    date: isoDate(daysAgo(20)),
    time: '20:30:00',
    doorsTime: '19:30:00',
    venue: 'The Troubadour',
    city: 'Los Angeles',
    state: 'CA',
    address: '9081 Santa Monica Blvd, West Hollywood, CA 90069',
    band: BAND_ID,
    isApproved: true,
    slug: 'burningthunder-troubadour-demo',
  },
  {
    title: 'BurningThunder @ Hotel Cafe',
    date: isoDate(daysAgo(5)),
    time: '20:00:00',
    doorsTime: '19:00:00',
    venue: 'Hotel Cafe',
    city: 'Hollywood',
    state: 'CA',
    address: '1623 1/2 N Cahuenga Blvd, Hollywood, CA 90028',
    band: BAND_ID,
    isApproved: true,
    slug: 'burningthunder-hotel-cafe-demo',
  },
];

// ── Demo Fans ────────────────────────────────────────────────────────────────

const DEMO_FANS = [
  // Los Angeles fans — show mode captures
  { email: 'alex.rivera@gmail.com', firstName: 'Alex', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_poster', capturedDuringShowMode: true, daysAgo: 44 },
  { email: 'jasmine.chen@yahoo.com', firstName: 'Jasmine', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_merch_table', capturedDuringShowMode: true, daysAgo: 44 },
  { email: 'marcus.williams@outlook.com', firstName: 'Marcus', city: 'Santa Monica', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_poster', capturedDuringShowMode: true, daysAgo: 44 },
  { email: 'sofia.martinez@gmail.com', firstName: 'Sofia', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_stage_screen', capturedDuringShowMode: true, daysAgo: 45 },
  { email: 'tyler.johnson@proton.me', firstName: 'Tyler', city: 'Burbank', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_flyer', capturedDuringShowMode: true, daysAgo: 45 },
  { email: 'emma.davis@icloud.com', firstName: 'Emma', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_poster', capturedDuringShowMode: true, daysAgo: 19 },
  { email: 'noah.kim@gmail.com', firstName: 'Noah', city: 'Pasadena', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_merch_table', capturedDuringShowMode: true, daysAgo: 19 },
  { email: 'olivia.nguyen@hotmail.com', firstName: 'Olivia', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_poster', capturedDuringShowMode: true, daysAgo: 20 },
  { email: 'liam.patel@gmail.com', firstName: 'Liam', city: 'West Hollywood', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_stage_screen', capturedDuringShowMode: true, daysAgo: 20 },
  { email: 'ava.thompson@yahoo.com', firstName: 'Ava', city: 'Hollywood', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_poster', capturedDuringShowMode: true, daysAgo: 4 },
  { email: 'ethan.garcia@gmail.com', firstName: 'Ethan', city: 'Los Angeles', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_merch_table', capturedDuringShowMode: true, daysAgo: 4 },
  { email: 'mia.jackson@outlook.com', firstName: 'Mia', city: 'Hollywood', region: 'CA', country: 'US', source: 'show_mode', captureSurface: 'qr_flyer', capturedDuringShowMode: true, daysAgo: 5 },

  // Band page organic captures
  { email: 'isabella.wright@gmail.com', firstName: 'Isabella', city: 'San Diego', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 60 },
  { email: 'james.moore@yahoo.com', firstName: 'James', city: 'San Francisco', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 55 },
  { email: 'charlotte.lee@gmail.com', firstName: 'Charlotte', city: 'Portland', region: 'OR', country: 'US', source: 'band_page', captureSurface: 'direct_link', capturedDuringShowMode: false, daysAgo: 50 },
  { email: 'benjamin.hall@proton.me', firstName: 'Benjamin', city: 'Seattle', region: 'WA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 40 },
  { email: 'amelia.young@icloud.com', firstName: 'Amelia', city: 'Phoenix', region: 'AZ', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 35 },
  { email: 'william.king@gmail.com', firstName: 'William', city: 'Denver', region: 'CO', country: 'US', source: 'band_page', captureSurface: 'direct_link', capturedDuringShowMode: false, daysAgo: 30 },
  { email: 'harper.scott@outlook.com', firstName: 'Harper', city: 'Austin', region: 'TX', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 28 },
  { email: 'daniel.green@gmail.com', firstName: 'Daniel', city: 'Nashville', region: 'TN', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 22 },

  // Follow modal captures
  { email: 'ella.baker@yahoo.com', firstName: 'Ella', city: 'Los Angeles', region: 'CA', country: 'US', source: 'follow_modal', captureSurface: 'follow_modal', capturedDuringShowMode: false, daysAgo: 18 },
  { email: 'jack.campbell@gmail.com', firstName: 'Jack', city: 'Long Beach', region: 'CA', country: 'US', source: 'follow_modal', captureSurface: 'follow_modal', capturedDuringShowMode: false, daysAgo: 15 },
  { email: 'grace.mitchell@proton.me', firstName: 'Grace', city: 'Anaheim', region: 'CA', country: 'US', source: 'follow_modal', captureSurface: 'follow_modal', capturedDuringShowMode: false, daysAgo: 12 },
  { email: 'henry.perez@icloud.com', firstName: 'Henry', city: 'Glendale', region: 'CA', country: 'US', source: 'follow_modal', captureSurface: 'follow_modal', capturedDuringShowMode: false, daysAgo: 10 },

  // Recent organic
  { email: 'luna.roberts@gmail.com', firstName: 'Luna', city: 'Los Angeles', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 3 },
  { email: 'owen.turner@outlook.com', firstName: 'Owen', city: 'Torrance', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 2 },
  { email: 'chloe.phillips@gmail.com', firstName: 'Chloe', city: 'Irvine', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'direct_link', capturedDuringShowMode: false, daysAgo: 1 },
  { email: 'sebastian.evans@yahoo.com', firstName: 'Sebastian', city: 'Ventura', region: 'CA', country: 'US', source: 'band_page', captureSurface: 'band_page', capturedDuringShowMode: false, daysAgo: 0 },
];

// ── Interaction Templates per engagement tier ────────────────────────────────

const INTERACTION_TYPES = [
  'clicked_spotify',
  'clicked_apple_music',
  'clicked_youtube',
  'clicked_ticket_link',
  'clicked_merch',
  'clicked_share',
  'clicked_follow',
  'played_featured_song',
  'clicked_video',
];

function generateInteractions(fanId, bandId, fanData, eventIds) {
  const interactions = [];
  const baseDate = daysAgo(fanData.daysAgo);

  // Every fan gets a joined_fan_list interaction
  interactions.push({
    fan: fanId,
    band: bandId,
    interactionType: 'joined_fan_list',
    interactionContext: fanData.capturedDuringShowMode ? 'show_mode' : 'normal',
    surface: fanData.captureSurface,
    timestamp: isoDateTime(baseDate),
    city: fanData.city,
    region: fanData.region,
    country: fanData.country,
  });

  // Superfan pattern: 8-12 interactions across many types
  // Engaged pattern: 4-7 interactions
  // Warm pattern: 2-3 interactions
  // New pattern: 0-1 interactions

  let numExtra;
  if (fanData.daysAgo > 30) {
    // Older fans = more time to interact = more engaged
    numExtra = randomBetween(5, 12);
  } else if (fanData.capturedDuringShowMode) {
    // Show mode fans are more engaged
    numExtra = randomBetween(3, 8);
  } else if (fanData.daysAgo < 5) {
    // Very recent fans = new
    numExtra = randomBetween(0, 2);
  } else {
    numExtra = randomBetween(1, 5);
  }

  for (let i = 0; i < numExtra; i++) {
    const type = pick(INTERACTION_TYPES);
    const offsetDays = randomBetween(0, fanData.daysAgo);
    const ts = daysAgo(offsetDays);
    // Add some hour variation
    ts.setHours(randomBetween(10, 23), randomBetween(0, 59));

    const interaction = {
      fan: fanId,
      band: bandId,
      interactionType: type,
      interactionContext: (offsetDays <= 5 && fanData.capturedDuringShowMode) ? 'show_mode' : 'normal',
      surface: pick(['band_page', 'band_page', 'band_page', 'qr_poster', 'direct_link', 'follow_modal']),
      timestamp: isoDateTime(ts),
      city: fanData.city,
      region: fanData.region,
      country: fanData.country,
    };

    // Link to an event if interaction happened near an event date
    if (eventIds.length > 0 && Math.random() < 0.3) {
      interaction.eventId = pick(eventIds);
    }

    interactions.push(interaction);
  }

  return interactions;
}

// ── Check-In / Attendance Assignment ─────────────────────────────────────────
// Fans who checked in at shows — matches fans captured during show mode
// Plus some organic fans who came to shows later

const CHECK_IN_ASSIGNMENTS = [
  // Event 0 (Viper Room — 45 days ago): first 5 show-mode fans
  { fanIndex: 0, eventIndex: 0, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: true },
  { fanIndex: 1, eventIndex: 0, source: 'fan_capture_followup', verification: 'show_mode_live', confidence: 80, isNew: true },
  { fanIndex: 2, eventIndex: 0, source: 'qr_scan', verification: 'event_qr_scan', confidence: 90, isNew: true },
  { fanIndex: 3, eventIndex: 0, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: true },
  { fanIndex: 4, eventIndex: 0, source: 'direct_checkin_button', verification: 'self_reported', confidence: 60, isNew: true },
  // Returning fan from event 0 who also came to event 1
  { fanIndex: 0, eventIndex: 1, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: false },
  { fanIndex: 1, eventIndex: 1, source: 'qr_scan', verification: 'event_qr_scan', confidence: 90, isNew: false },

  // Event 1 (Troubadour — 20 days ago)
  { fanIndex: 5, eventIndex: 1, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: true },
  { fanIndex: 6, eventIndex: 1, source: 'fan_capture_followup', verification: 'show_mode_live', confidence: 80, isNew: true },
  { fanIndex: 7, eventIndex: 1, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: true },
  { fanIndex: 8, eventIndex: 1, source: 'qr_scan', verification: 'event_qr_scan', confidence: 90, isNew: true },
  // Organic fan who came to a show
  { fanIndex: 12, eventIndex: 1, source: 'direct_checkin_button', verification: 'self_reported', confidence: 55, isNew: false },

  // Event 2 (Hotel Cafe — 5 days ago)
  { fanIndex: 9, eventIndex: 2, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: true },
  { fanIndex: 10, eventIndex: 2, source: 'fan_capture_followup', verification: 'show_mode_live', confidence: 80, isNew: true },
  { fanIndex: 11, eventIndex: 2, source: 'qr_scan', verification: 'event_qr_scan', confidence: 90, isNew: true },
  // Repeat attendee from Viper Room
  { fanIndex: 0, eventIndex: 2, source: 'show_banner', verification: 'show_mode_live', confidence: 85, isNew: false },
  { fanIndex: 3, eventIndex: 2, source: 'direct_checkin_button', verification: 'show_mode_live', confidence: 80, isNew: false },
];

// ── Main Seed Function ───────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting demo data seed for BurningThunder (Band ID: 5)...\n');

  // ── Step 1: Create Events ──────────────────────────────────────────────────
  console.log('📅 Creating events...');
  const eventIds = [];
  for (const evt of EVENTS) {
    try {
      const created = await apiPost('events', evt);
      const id = created.id || created.attributes?.id;
      eventIds.push(id);
      console.log(`   ✓ Event ${id}: ${evt.title} (${evt.date})`);
    } catch (err) {
      // If slug conflict, try without slug
      if (err.message.includes('unique')) {
        console.log(`   ⚠ Event "${evt.title}" may already exist, skipping...`);
        eventIds.push(null);
      } else {
        console.error(`   ✗ Failed to create event: ${err.message}`);
        eventIds.push(null);
      }
    }
  }
  console.log(`   Created ${eventIds.filter(Boolean).length} events\n`);

  // ── Step 2: Create Fans ────────────────────────────────────────────────────
  console.log('👥 Creating fans...');
  const fanRecords = []; // { id, data }
  for (const fanData of DEMO_FANS) {
    const subscribedAt = daysAgo(fanData.daysAgo);
    const payload = {
      email: fanData.email,
      firstName: fanData.firstName,
      status: 'subscribed',
      source: fanData.source,
      subscribedAt: isoDateTime(subscribedAt),
      band: BAND_ID,
      city: fanData.city,
      region: fanData.region,
      country: fanData.country,
      timezone: 'America/Los_Angeles',
      firstSeenAt: isoDateTime(subscribedAt),
      lastSeenAt: isoDateTime(daysAgo(Math.max(0, fanData.daysAgo - randomBetween(0, 5)))),
      capturedDuringShowMode: fanData.capturedDuringShowMode,
      captureContext: fanData.capturedDuringShowMode ? 'show_mode' : 'normal',
      captureSurface: fanData.captureSurface,
      demo: true,
      checkedInShowCount: 0,
    };

    // Link to event if captured during show mode
    if (fanData.capturedDuringShowMode) {
      const eventIdx = fanData.daysAgo >= 40 ? 0 : fanData.daysAgo >= 15 ? 1 : 2;
      if (eventIds[eventIdx]) {
        payload.capturedAtEventId = eventIds[eventIdx];
      }
    }

    try {
      const created = await apiPost('fans', payload);
      const id = created.id || created.attributes?.id;
      fanRecords.push({ id, data: fanData });
      console.log(`   ✓ Fan ${id}: ${fanData.firstName} (${fanData.email}) — ${fanData.city}`);
    } catch (err) {
      console.error(`   ✗ Failed: ${fanData.email} — ${err.message}`);
      fanRecords.push({ id: null, data: fanData });
    }
  }
  console.log(`   Created ${fanRecords.filter(r => r.id).length} fans\n`);

  // ── Step 3: Create Interactions ────────────────────────────────────────────
  console.log('⚡ Creating interactions...');
  let interactionCount = 0;
  const checkInInteractionIds = {}; // fanId -> [interactionId]

  for (const record of fanRecords) {
    if (!record.id) continue;
    const interactions = generateInteractions(record.id, BAND_ID, record.data, eventIds.filter(Boolean));

    for (const interaction of interactions) {
      try {
        const created = await apiPost('fan-interactions', interaction);
        interactionCount++;
      } catch (err) {
        // Silently skip duplicates or errors for interactions
      }
    }
  }
  console.log(`   Created ${interactionCount} interactions\n`);

  // ── Step 4: Create Check-In Interactions + Attendance Records ──────────────
  console.log('✓ Creating check-in records and attendance...');
  let checkInCount = 0;
  let attendanceCount = 0;

  // Track check-in counts per fan for updating
  const fanCheckInCounts = {};

  for (const assignment of CHECK_IN_ASSIGNMENTS) {
    const fanRecord = fanRecords[assignment.fanIndex];
    if (!fanRecord?.id) continue;

    const eventId = eventIds[assignment.eventIndex];
    const eventData = EVENTS[assignment.eventIndex];
    if (!eventData) continue;

    const eventDate = new Date(eventData.date + 'T' + eventData.time);
    // Check-in happens 0-60 minutes after show start
    const checkInTime = new Date(eventDate.getTime() + randomBetween(0, 60) * 60 * 1000);

    // Create the check-in fan-interaction
    try {
      const interaction = await apiPost('fan-interactions', {
        fan: fanRecord.id,
        band: BAND_ID,
        eventId: eventId || undefined,
        interactionType: 'checked_in_show',
        interactionContext: 'show_mode',
        surface: assignment.source === 'qr_scan' ? 'qr_poster' : 'band_page',
        timestamp: isoDateTime(checkInTime),
        city: eventData.city,
        region: eventData.state,
        country: 'US',
        campaignId: `demo-${eventData.slug}`,
        metadata: {
          checkInSource: assignment.source,
          verificationLevel: assignment.verification,
          eventStatus: 'during_show',
          confidenceScore: assignment.confidence,
          timelineLabel: `Checked in at ${eventData.venue} — ${eventData.city}`,
        },
      });

      const interactionId = interaction.id || interaction.attributes?.id;
      checkInCount++;

      // Create the attendance record
      const attendance = await apiPost('fan-show-attendances', {
        fan: fanRecord.id,
        band: BAND_ID,
        event: eventId || undefined,
        campaignId: `demo-${eventData.slug}`,
        checkedInAt: isoDateTime(checkInTime),
        venue: eventData.venue,
        city: eventData.city,
        region: eventData.state,
        country: 'US',
        timezone: 'America/Los_Angeles',
        showTitle: eventData.title,
        showDate: eventData.date,
        verificationLevel: assignment.verification,
        checkInSource: assignment.source,
        eventStatus: 'during_show',
        confidenceScore: assignment.confidence,
        isNewFanAtCheckIn: assignment.isNew,
        fanInteraction: interactionId,
        suppressedDuplicate: false,
        badgeEligible: assignment.confidence >= 50,
        timelineLabel: `Checked in at ${eventData.venue} — ${eventData.city}`,
      });

      attendanceCount++;

      // Track counts
      fanCheckInCounts[fanRecord.id] = (fanCheckInCounts[fanRecord.id] || 0) + 1;

      console.log(`   ✓ ${fanRecord.data.firstName} checked in at ${eventData.venue} (${assignment.verification}, ${assignment.confidence}%)`);
    } catch (err) {
      console.error(`   ✗ Check-in failed for ${fanRecord.data.firstName}: ${err.message}`);
    }
  }
  console.log(`   Created ${checkInCount} check-in interactions`);
  console.log(`   Created ${attendanceCount} attendance records\n`);

  // ── Step 5: Update Fan check-in counts ─────────────────────────────────────
  console.log('📊 Updating fan check-in counts...');
  for (const [fanId, count] of Object.entries(fanCheckInCounts)) {
    try {
      await apiPut('fans', fanId, {
        checkedInShowCount: count,
        lastCheckedInAt: isoDateTime(daysAgo(0)),
      });
      console.log(`   ✓ Fan ${fanId}: checkedInShowCount = ${count}`);
    } catch (err) {
      console.error(`   ✗ Failed to update fan ${fanId}: ${err.message}`);
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 SEED COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`   Events created:        ${eventIds.filter(Boolean).length}`);
  console.log(`   Fans created:          ${fanRecords.filter(r => r.id).length} (all marked demo: true)`);
  console.log(`   Interactions created:   ${interactionCount}`);
  console.log(`   Check-in records:       ${checkInCount}`);
  console.log(`   Attendance records:     ${attendanceCount}`);
  console.log(`   Fans with check-ins:    ${Object.keys(fanCheckInCounts).length}`);
  console.log('\nTo clean up demo fans later:');
  console.log('   Filter fans where demo = true and delete them.');
  console.log('═'.repeat(60));
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
