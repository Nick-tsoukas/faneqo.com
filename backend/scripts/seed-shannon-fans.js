/**
 * Seed 159 demo fans + interactions for Shannon Theya's band
 * Run: node scripts/seed-shannon-fans.js
 */

const STRAPI_URL = 'https://qrserver-production.up.railway.app';
const API_TOKEN = process.env.STRAPI_API_TOKEN || 'da22551d6db389c659b6757146a9eebc8b07be57071e6291afc992a376251614b660142400c67d963d7e86cf9a91039e4203c226fe2c20f06678bc5af7bbb13ac61fe2621007d16fef32980de4b4cac893fd8403b7daedb4156f75485e3bc25199c2e2092e1824814d3de95c68baf8af964b4d311c5ae798b1c98f4f48954243';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_TOKEN}`,
};

// Realistic data pools
const FIRST_NAMES = [
  'Emma','Liam','Olivia','Noah','Ava','Ethan','Sophia','Mason','Isabella','William',
  'Mia','James','Charlotte','Benjamin','Amelia','Lucas','Harper','Henry','Evelyn','Alexander',
  'Abigail','Daniel','Emily','Matthew','Ella','Jackson','Elizabeth','Sebastian','Camila','Aiden',
  'Luna','Jack','Gianna','Owen','Aria','Samuel','Chloe','Ryan','Penelope','Nathan',
  'Layla','John','Riley','Dylan','Zoey','Luke','Nora','Andrew','Lily','Isaac',
  'Hannah','Gabriel','Lillian','Anthony','Addison','Christian','Aubrey','Jaxon','Ellie','Joshua',
  'Stella','Christopher','Natalie','Ezra','Zoe','David','Leah','Carter','Hazel','Jayden',
  'Violet','Caleb','Aurora','Lincoln','Savannah','Connor','Audrey','Asher','Brooklyn','Hunter',
  'Bella','Thomas','Claire','Adrian','Skylar','Eli','Lucy','Landon','Paisley','Jonathan',
  'Anna','Nolan','Caroline','Cameron','Genesis','Grayson','Kennedy','Leo','Madelyn','Jeremiah',
  'Eliana','Aaron','Naomi','Austin','Elena','Charles','Valentina','Robert','Ivy','Cooper',
  'Sadie','Miles','Piper','Jordan','Alice','Dominic','Kinsley','Ian','Taylor','Adam',
  'Morgan','Kaylee','Brielle','Alexa','Jasmine','Mackenzie','Reagan','Quinn','Maria','Willow',
  'Madeline','Peyton','Rylee','Jade','Cora','Melody','Alina','Faith','Iris','Nicole',
  'Brooke','Paige','Reese','Sara','Keira','Dakota','Trinity','Emery','Mila','Ruby',
  'Serenity','Lauren','Gabriella','Raelynn','Autumn','Ariana','Khloe',
];

const CITIES = [
  { city: 'Los Angeles', region: 'CA', country: 'US', timezone: 'America/Los_Angeles' },
  { city: 'New York', region: 'NY', country: 'US', timezone: 'America/New_York' },
  { city: 'Nashville', region: 'TN', country: 'US', timezone: 'America/Chicago' },
  { city: 'Austin', region: 'TX', country: 'US', timezone: 'America/Chicago' },
  { city: 'Chicago', region: 'IL', country: 'US', timezone: 'America/Chicago' },
  { city: 'Atlanta', region: 'GA', country: 'US', timezone: 'America/New_York' },
  { city: 'San Francisco', region: 'CA', country: 'US', timezone: 'America/Los_Angeles' },
  { city: 'Miami', region: 'FL', country: 'US', timezone: 'America/New_York' },
  { city: 'Portland', region: 'OR', country: 'US', timezone: 'America/Los_Angeles' },
  { city: 'Denver', region: 'CO', country: 'US', timezone: 'America/Denver' },
  { city: 'Seattle', region: 'WA', country: 'US', timezone: 'America/Los_Angeles' },
  { city: 'Phoenix', region: 'AZ', country: 'US', timezone: 'America/Phoenix' },
  { city: 'Dallas', region: 'TX', country: 'US', timezone: 'America/Chicago' },
  { city: 'San Diego', region: 'CA', country: 'US', timezone: 'America/Los_Angeles' },
  { city: 'Philadelphia', region: 'PA', country: 'US', timezone: 'America/New_York' },
  { city: 'Minneapolis', region: 'MN', country: 'US', timezone: 'America/Chicago' },
  { city: 'Detroit', region: 'MI', country: 'US', timezone: 'America/Detroit' },
  { city: 'Boston', region: 'MA', country: 'US', timezone: 'America/New_York' },
  { city: 'New Orleans', region: 'LA', country: 'US', timezone: 'America/Chicago' },
  { city: 'Las Vegas', region: 'NV', country: 'US', timezone: 'America/Los_Angeles' },
];

const EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.com', 'live.com', 'msn.com',
];

const SOURCES = ['band_page', 'band_page', 'band_page', 'follow_modal', 'follow_modal', 'show_mode', 'show_mode', 'other'];
const CAPTURE_CONTEXTS = ['normal', 'normal', 'show_mode', 'show_mode', 'show_mode', 'release_mode'];
const CAPTURE_SURFACES = ['band_page', 'band_page', 'follow_modal', 'qr_poster', 'qr_merch_table', 'qr_flyer', 'direct_link'];
const INTERACTION_TYPES = [
  'joined_fan_list', 'viewed_band_page', 'viewed_show_mode_page',
  'clicked_spotify', 'clicked_apple_music', 'clicked_youtube',
  'clicked_ticket_link', 'clicked_merch', 'clicked_share',
  'clicked_follow', 'played_featured_song', 'clicked_video',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Generate a date between daysAgo and now
function randomDate(daysAgoMin, daysAgoMax) {
  const daysAgo = randInt(daysAgoMin, daysAgoMax);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(randInt(8, 23), randInt(0, 59), randInt(0, 59));
  return d.toISOString();
}

function generateEmail(firstName, index) {
  const domain = pick(EMAIL_DOMAINS);
  const suffix = randInt(10, 999);
  return `${firstName.toLowerCase()}${suffix}demo${index}@${domain}`;
}

async function findBandBySlug(slug) {
  const res = await fetch(`${STRAPI_URL}/api/bands?filters[slug][$eq]=${slug}&fields[0]=id&fields[1]=name`, { headers });
  const json = await res.json();
  if (!json.data || json.data.length === 0) throw new Error(`Band with slug "${slug}" not found`);
  return json.data[0];
}

async function createFan(data) {
  const res = await fetch(`${STRAPI_URL}/api/fans`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create fan: ${err}`);
  }
  return (await res.json()).data;
}

async function createInteraction(data) {
  const res = await fetch(`${STRAPI_URL}/api/fan-interactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.warn(`  ⚠ Interaction failed: ${err}`);
    return null;
  }
  return (await res.json()).data;
}

async function main() {
  console.log('🔍 Looking up Shannon Theya band...');
  const band = await findBandBySlug('shannontehya');
  const bandId = band.id;
  console.log(`✅ Found band: ${band.attributes?.name || band.name} (ID: ${bandId})`);

  const totalFans = 159;
  let created = 0;
  let failed = 0;

  console.log(`\n🎵 Seeding ${totalFans} demo fans...\n`);

  for (let i = 0; i < totalFans; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const location = pick(CITIES);
    const source = pick(SOURCES);
    const captureContext = pick(CAPTURE_CONTEXTS);
    const captureSurface = pick(CAPTURE_SURFACES);
    
    // Spread subscriptions across 90 days, with more recent fans being more common
    const weight = Math.random();
    const daysAgo = weight < 0.4 ? randInt(0, 14) : weight < 0.7 ? randInt(15, 45) : randInt(46, 90);
    const subscribedAt = new Date();
    subscribedAt.setDate(subscribedAt.getDate() - daysAgo);
    subscribedAt.setHours(randInt(8, 23), randInt(0, 59), randInt(0, 59));
    const subscribedISO = subscribedAt.toISOString();

    const showModeFan = captureContext === 'show_mode';

    const fanData = {
      email: generateEmail(firstName, i),
      firstName,
      status: Math.random() > 0.05 ? 'subscribed' : 'unsubscribed', // 95% subscribed
      source,
      subscribedAt: subscribedISO,
      band: bandId,
      demo: true,
      city: location.city,
      region: location.region,
      country: location.country,
      timezone: location.timezone,
      firstSeenAt: subscribedISO,
      lastSeenAt: randomDate(0, daysAgo),
      capturedDuringShowMode: showModeFan,
      captureContext,
      captureSurface,
    };

    try {
      const fan = await createFan(fanData);
      created++;

      // Create 1-5 interactions per fan for rich analytics
      const numInteractions = randInt(1, 5);
      for (let j = 0; j < numInteractions; j++) {
        const interactionType = pick(INTERACTION_TYPES);
        const interactionDate = randomDate(0, daysAgo);
        await createInteraction({
          fan: fan.id,
          band: bandId,
          interactionType,
          interactionContext: showModeFan ? 'show_mode' : 'normal',
          surface: pick(CAPTURE_SURFACES),
          timestamp: interactionDate,
          city: location.city,
          region: location.region,
          country: location.country,
          timezone: location.timezone,
        });
      }

      if (created % 10 === 0 || created === totalFans) {
        console.log(`  ✅ ${created}/${totalFans} fans created`);
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ Fan ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`\n🎉 Done! Created ${created} fans, ${failed} failed.`);
  console.log(`   All fans marked with demo: true for easy cleanup.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
