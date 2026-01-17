// Slower seed script to avoid workflow rate limits
const BASE_URL = process.env.BASE_URL || "http://localhost:8787";
const COUNT = Number(process.env.SEED_COUNT || 50);
const DELAY = Number(process.env.DELAY_MS || 1000); // 1 second between items

// Use the same seed data from seed.mjs
import { readFileSync } from 'fs';
const seedScript = readFileSync(new URL('./seed.mjs', import.meta.url), 'utf-8');

// Extract just the data generation part
const baseFeedback = [
  // Cluster 1: Cache purging issues
  { title: "Cache purge is too slow", text: "Purging cache takes 5+ minutes even for a single URL. We need quicker invalidation for hotfixes and urgent content updates." },
  { title: "Cache invalidation delay", text: "Cache purge takes way too long - sometimes 6-7 minutes for a single URL. This blocks our hotfix deployments." },
  { title: "Slow cache clearing", text: "Cache clearing is too slow, takes over 5 minutes per URL. Need faster invalidation for production fixes." },
  // Cluster 2: WAF false positives
  { title: "WAF blocking valid requests", text: "Our login form is being blocked by a WAF rule after the last update. It flags valid POST bodies as XSS attacks." },
  { title: "False positive WAF blocks", text: "WAF is incorrectly blocking our login form. Valid POST requests are flagged as XSS attempts after recent changes." },
  // Cluster 3: Analytics UI confusion
  { title: "Analytics dashboard confusing", text: "The analytics view is hard to interpret. The chart labels are unclear and the time range resets constantly." },
  { title: "Analytics hard to understand", text: "Analytics dashboard is confusing - chart labels aren't clear and time range keeps resetting. Needs better UX." },
  // Cluster 4: Workers deployment errors
  { title: "Workers deployment fails silently", text: "Deployment fails with an opaque error in wrangler. There is no hint on which binding is missing or what went wrong." },
  { title: "Deployment error unclear", text: "Wrangler deployment fails with cryptic error. Can't tell which binding is missing or what the actual problem is." },
  // Single items
  { title: "Docs outdated for AI Search", text: "The documentation for AI Search mentions a configuration format that does not match the actual dashboard UI. Very confusing." },
  { title: "Image optimization bug in Safari", text: "Polish format breaks on Safari when the origin image is a progressive JPEG. Images appear corrupted." },
  { title: "R2 multipart upload timeout", text: "Multipart uploads to R2 stall at around 80% and time out with large files (over 1GB). This breaks our backup process." },
  { title: "Workers AI latency too high", text: "Workers AI inference takes 3-5 seconds for simple text generation. This is too slow for real-time chat applications." },
  { title: "Love the performance!", text: "Workers are incredibly fast - sub-10ms response times. This is exactly what we needed. Keep up the great work!" }
];

const sources = ["support_ticket", "discord", "github", "email", "forum", "twitter"];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateAuthor() {
  const names = ["john.doe", "sarah.chen", "mike.williams", "lisa.zhang", "alex.kumar"];
  return pick(names) + (Math.random() > 0.7 ? `@company${Math.floor(Math.random() * 5)}.com` : "");
}

function generateTimestamp() {
  const now = Date.now();
  const days = Math.random() * 30;
  const offset = days * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

async function ingestOne(index) {
  const base = baseFeedback[index % baseFeedback.length];
  const payload = {
    source: pick(sources),
    title: base.title,
    text: base.text,
    author: generateAuthor(),
    source_url: `https://example.com/${1000 + index}`,
    timestamp: generateTimestamp()
  };

  try {
    const response = await fetch(`${BASE_URL}/api/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    throw new Error(`Ingest failed: ${error.message}`);
  }
}

async function run() {
  console.log(`🌱 Seeding ${COUNT} feedback items (slow mode: ${DELAY}ms delay)...`);
  console.log(`   This will take approximately ${(COUNT * DELAY / 1000 / 60).toFixed(1)} minutes\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < COUNT; i++) {
    try {
      const id = await ingestOne(i);
      successCount++;
      
      console.log(`   ✓ ${i + 1}/${COUNT} - ID: ${id}`);
      
      // Wait before next item (except for last)
      if (i < COUNT - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY));
      }
    } catch (error) {
      errorCount++;
      console.error(`   ✗ Item ${i + 1} failed:`, error.message);
      
      // Wait even on error to avoid hammering the API
      if (i < COUNT - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY));
      }
    }
  }
  
  console.log(`\n✅ Seed complete!`);
  console.log(`   Successful: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log(`\n⏳ Wait 3-5 minutes for workflows to process all items`);
  console.log(`   Then visit: ${BASE_URL}`);
}

run().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
