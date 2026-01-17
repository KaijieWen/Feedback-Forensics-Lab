const BASE_URL = process.env.BASE_URL || "http://localhost:8787";
const COUNT = Number(process.env.SEED_COUNT || 150);

const sources = [
  "support_ticket",
  "discord",
  "github",
  "email",
  "forum",
  "twitter"
];

// Base feedback templates with intentional duplicates for clustering demo
const baseFeedback = [
  // Cluster 1: Cache purging issues (3-4 variations)
  {
    title: "Cache purge is too slow",
    text: "Purging cache takes 5+ minutes even for a single URL. We need quicker invalidation for hotfixes and urgent content updates."
  },
  {
    title: "Cache invalidation delay",
    text: "Cache purge takes way too long - sometimes 6-7 minutes for a single URL. This blocks our hotfix deployments."
  },
  {
    title: "Slow cache clearing",
    text: "Cache clearing is too slow, takes over 5 minutes per URL. Need faster invalidation for production fixes."
  },
  {
    title: "Cache purge performance",
    text: "Cache purging performance is unacceptable - 5+ minutes for one URL. We need faster invalidation."
  },
  
  // Cluster 2: WAF false positives (3-4 variations)
  {
    title: "WAF blocking valid requests",
    text: "Our login form is being blocked by a WAF rule after the last update. It flags valid POST bodies as XSS attacks."
  },
  {
    title: "False positive WAF blocks",
    text: "WAF is incorrectly blocking our login form. Valid POST requests are flagged as XSS attempts after recent changes."
  },
  {
    title: "WAF rule too aggressive",
    text: "The WAF is blocking legitimate login POST requests, marking them as XSS. This started after the latest update."
  },
  
  // Cluster 3: Analytics UI confusion (2-3 variations)
  {
    title: "Analytics dashboard confusing",
    text: "The analytics view is hard to interpret. The chart labels are unclear and the time range resets constantly."
  },
  {
    title: "Analytics hard to understand",
    text: "Analytics dashboard is confusing - chart labels aren't clear and time range keeps resetting. Needs better UX."
  },
  
  // Cluster 4: Workers deployment errors (3 variations)
  {
    title: "Workers deployment fails silently",
    text: "Deployment fails with an opaque error in wrangler. There is no hint on which binding is missing or what went wrong."
  },
  {
    title: "Deployment error unclear",
    text: "Wrangler deployment fails with cryptic error. Can't tell which binding is missing or what the actual problem is."
  },
  {
    title: "Worker deploy error",
    text: "Deploying worker fails with unclear error message. No indication of missing bindings or configuration issues."
  },
  
  // Cluster 5: Rate limiting feature request (2-3 variations)
  {
    title: "Need per-endpoint rate limiting",
    text: "Please add per-endpoint rate limiting rules. We need different thresholds for login vs public pages."
  },
  {
    title: "Rate limiting by endpoint",
    text: "Request: add rate limiting per endpoint. We need different limits for authentication endpoints vs public APIs."
  },
  
  // Diverse single items (no clusters)
  {
    title: "Docs outdated for AI Search",
    text: "The documentation for AI Search mentions a configuration format that does not match the actual dashboard UI. Very confusing."
  },
  {
    title: "Image optimization bug in Safari",
    text: "Polish format breaks on Safari when the origin image is a progressive JPEG. Images appear corrupted."
  },
  {
    title: "R2 multipart upload timeout",
    text: "Multipart uploads to R2 stall at around 80% and time out with large files (over 1GB). This breaks our backup process."
  },
  {
    title: "Workers AI latency too high",
    text: "Workers AI inference takes 3-5 seconds for simple text generation. This is too slow for real-time chat applications."
  },
  {
    title: "D1 query performance",
    text: "Complex D1 queries are slow, especially with JOINs. Simple queries work fine but multi-table queries take 1-2 seconds."
  },
  {
    title: "Email notifications feature",
    text: "Would love to see email notifications when Workers deployments fail. Currently have to check logs manually."
  },
  {
    title: "GraphQL API request",
    text: "Please add native GraphQL support for Workers. Currently we're building our own parser which is error-prone."
  },
  {
    title: "Mobile dashboard needed",
    text: "The dashboard doesn't work well on mobile. Would be great to have a mobile-optimized view for monitoring on the go."
  },
  {
    title: "Love the performance!",
    text: "Workers are incredibly fast - sub-10ms response times. This is exactly what we needed. Keep up the great work!"
  },
  {
    title: "Workflows saved us hours",
    text: "Cloudflare Workflows made our async processing so much simpler. The retry logic and state management is perfect."
  },
  {
    title: "AI Search confusion",
    text: "How do I configure AI Search with my R2 bucket? The docs mention wrangler.toml but I don't see that option in the dashboard."
  },
  {
    title: "KV storage limits unclear",
    text: "What are the actual limits for KV storage? The pricing page mentions 'unlimited' but I'm seeing errors at 100k keys."
  },
  {
    title: "WebSocket support missing",
    text: "Need WebSocket support in Workers for real-time features. Currently using Durable Objects but they're overkill for simple use cases."
  }
];

const variations = [
  " Happens mostly on mobile devices.",
  " Seeing this across multiple customer accounts.",
  " We noticed it after enabling a new feature flag.",
  " This impacts a high-value paid customer.",
  " Support tickets are piling up because of this.",
  " Affects about 30% of our traffic.",
  " Started happening after last week's deployment.",
  " Critical for our production environment."
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Generate author names that look realistic
function generateAuthor() {
  const names = [
    "john.doe", "sarah.chen", "mike.williams", "lisa.zhang", "alex.kumar",
    "emma.taylor", "david.kim", "priya.patel", "chris.brown", "amy.wilson",
    "kevin.martinez", "rachel.anderson", "james.thompson", "sophia.lee",
    "daniel.garcia", "olivia.davis", "matthew.moore", "isabella.jackson",
    "ryan.white", "mia.harris", "jacob.martin", "ava.rodriguez",
    "ethan.lewis", "charlotte.young", "noah.king", "harper.scott",
    "william.green", "emily.adams", "lucas.baker", "ella.nelson"
  ];
  return pick(names) + (Math.random() > 0.7 ? `@company${Math.floor(Math.random() * 10)}.com` : "");
}

// Generate realistic timestamps over the last 30 days
function generateTimestamp(daysAgo = null) {
  const now = Date.now();
  const days = daysAgo ?? Math.random() * 30;
  const offset = days * 24 * 60 * 60 * 1000;
  return new Date(now - offset).toISOString();
}

async function ingestOne(index) {
  const base = baseFeedback[index % baseFeedback.length];
  const variant = Math.random() > 0.7 ? pick(variations) : "";
  
  const payload = {
    source: pick(sources),
    title: base.title,
    text: `${base.text}${variant}`,
    author: generateAuthor(),
    source_url: index % 5 === 0 
      ? `https://github.com/cloudflare/workers/issues/${1000 + index}`
      : index % 7 === 0
      ? `https://discord.com/channels/cloudflare/support/${5000 + index}`
      : `https://support.cloudflare.com/tickets/${20000 + index}`,
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
    console.error(`Failed to ingest item ${index + 1}:`, error.message);
    throw error;
  }
}

async function run() {
  console.log(`🌱 Seeding ${COUNT} feedback items into ${BASE_URL}...`);
  console.log(`   This will create clusters and demonstrate semantic search.\n`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < COUNT; i++) {
    try {
      const id = await ingestOne(i);
      successCount++;
      
      if ((i + 1) % 10 === 0 || i === 0) {
        const progress = ((i + 1) / COUNT * 100).toFixed(0);
        console.log(`   ✓ ${i + 1}/${COUNT} (${progress}%) - Last ID: ${id}`);
      }
      
      // Small delay to avoid overwhelming the worker
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      errorCount++;
      console.error(`   ✗ Item ${i + 1} failed:`, error.message);
      // Continue with next item instead of failing completely
    }
  }
  
  console.log(`\n✅ Seed complete!`);
  console.log(`   Successful: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
  }
  console.log(`\n📊 Next steps:`);
  console.log(`   - Wait 2-3 minutes for workflows to process all items`);
  console.log(`   - Visit your dashboard to see clusters forming`);
  console.log(`   - Try the search feature to find similar feedback`);
}

run().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
