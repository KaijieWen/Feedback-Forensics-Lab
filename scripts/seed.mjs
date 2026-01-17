const BASE_URL = process.env.BASE_URL || "http://localhost:8787";
const COUNT = Number(process.env.SEED_COUNT || 120);

const sources = [
  "support_ticket",
  "discord",
  "github",
  "email",
  "forum",
  "twitter"
];

const baseFeedback = [
  {
    title: "Cache purge slow",
    text:
      "Purging cache takes 5+ minutes even for a single URL. We need quicker invalidation for hotfixes."
  },
  {
    title: "WAF rule false positives",
    text:
      "Our login form is being blocked by a WAF rule after the last update. It flags valid POST bodies as XSS."
  },
  {
    title: "Analytics dashboard confusing",
    text:
      "The analytics view is hard to interpret. The chart labels are unclear and the time range resets constantly."
  },
  {
    title: "Workers deployment error",
    text:
      "Deployment fails with an opaque error in wrangler. There is no hint on which binding is missing."
  },
  {
    title: "Rate limiting feature request",
    text:
      "Please add per-endpoint rate limiting rules. We need different thresholds for login vs public pages."
  },
  {
    title: "Docs outdated",
    text:
      "The docs for AI Search mention a config format that does not match the dashboard UI."
  },
  {
    title: "Image optimization bug",
    text:
      "Polish format breaks on Safari when the origin image is progressive JPEG."
  },
  {
    title: "R2 upload performance",
    text:
      "Multipart uploads stall at ~80% and time out with large files (>1GB)."
  }
];

const variations = [
  "Happens mostly on mobile.",
  "Seeing this across multiple accounts.",
  "We noticed it after enabling a new feature flag.",
  "This impacts a paid customer.",
  "Support tickets are piling up."
];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

async function ingestOne(index) {
  const base = baseFeedback[index % baseFeedback.length];
  const variant = Math.random() > 0.6 ? ` ${pick(variations)}` : "";
  const payload = {
    source: pick(sources),
    title: base.title,
    text: `${base.text}${variant}`,
    author: `user_${Math.floor(Math.random() * 50)}`,
    source_url: `https://example.com/${index}`,
    timestamp: new Date(Date.now() - Math.random() * 1e9).toISOString()
  };

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
}

async function run() {
  console.log(`Seeding ${COUNT} feedback items into ${BASE_URL}...`);
  for (let i = 0; i < COUNT; i += 1) {
    const id = await ingestOne(i);
    if (i % 10 === 0) {
      console.log(`Seeded ${i + 1}/${COUNT} (last id: ${id})`);
    }
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  console.log("Seed complete.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
