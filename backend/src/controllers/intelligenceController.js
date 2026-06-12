const axios = require("axios");
const WebCache = require("../models/WebCache");

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Trigger conditions for web scraping
const shouldScrape = (emailBody = "", category = "", sentimentScore = 0, urgency = "") => {
  const body = emailBody.toLowerCase();
  if (body.includes("review") || body.includes("trustpilot") || body.includes("g2") ||
      body.includes("twitter") || body.includes("post publicly") || body.includes("tell everyone")) return true;
  if (sentimentScore < -0.6) return true;
  if (category === "Complaint" && (urgency === "High" || urgency === "Critical")) return true;
  if (body.includes("press") || body.includes("investor") || body.includes("journalist")) return true;
  return false;
};

// Check robots.txt compliance before scraping
const checkRobotsTxt = async (domain) => {
  try {
    const resp = await axios.get(`https://${domain}/robots.txt`, { timeout: 3000 });
    const txt = resp.data || "";
    // Very basic check: if User-agent: * Disallow: / then don't scrape
    if (txt.includes("Disallow: /") && txt.includes("User-agent: *")) return false;
    return true;
  } catch (_) {
    return true; // If can't fetch robots.txt, proceed cautiously
  }
};

// Fetch G2 / Capterra public page (scrape title/description for summary)
const scrapeReviewSite = async (siteName, url) => {
  const cached = await WebCache.findOne({
    source_url: url,
    expires_at: { $gt: new Date() },
  });
  if (cached) return { source: siteName, ...cached.scraped_data, fromCache: true };

  const allowed = await checkRobotsTxt(new URL(url).hostname);
  if (!allowed) {
    return { source: siteName, error: "robots.txt disallows scraping", skipped: true };
  }

  try {
    const resp = await axios.get(url, {
      timeout: 8000,
      headers: { "User-Agent": "SenAI-CRM-Intelligence/1.0 (+https://senai.io)" },
    });
    const html = resp.data;

    // Extract OG tags / title / meta description for sentiment summary
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
    const ratingMatch = html.match(/(\d+\.?\d*)\s*(out of 5|\/5|\s*stars)/i);

    const data = {
      source: siteName,
      url,
      title: titleMatch ? titleMatch[1].slice(0, 200) : null,
      description: descMatch ? descMatch[1].slice(0, 400) : null,
      ratingText: ratingMatch ? ratingMatch[0] : null,
      scrapedAt: new Date(),
    };

    await WebCache.findOneAndUpdate(
      { source_url: url },
      {
        source_url: url,
        target_entity: siteName,
        scraped_data: data,
        scraped_at: new Date(),
        expires_at: new Date(Date.now() + CACHE_TTL_MS),
      },
      { upsert: true }
    );

    return { ...data, fromCache: false };
  } catch (err) {
    return { source: siteName, error: err.message, url, skipped: false };
  }
};

// GET /intelligence/reputation
const reputationCheck = async (req, res) => {
  const targets = [
    { name: "G2", url: "https://www.g2.com/products/senai/reviews" },
    { name: "Trustpilot", url: "https://www.trustpilot.com/review/senai.io" },
  ];

  const results = await Promise.allSettled(
    targets.map((t) => scrapeReviewSite(t.name, t.url))
  );

  const intelligence = results.map((r) =>
    r.status === "fulfilled" ? r.value : { error: r.reason?.message || "unknown error" }
  );

  res.json({
    success: true,
    fetchedAt: new Date(),
    cacheExpiresIn: "6 hours",
    intelligence,
  });
};

// POST /intelligence/enrich — triggered from agent with email context
const enrichEmailContext = async (req, res) => {
  const { emailBody, category, sentimentScore, urgency } = req.body;

  const triggersScraping = shouldScrape(emailBody, category, sentimentScore, urgency);

  if (!triggersScraping) {
    return res.json({
      success: true,
      triggered: false,
      message: "No scraping trigger conditions met for this email",
    });
  }

  const targets = [
    { name: "G2", url: "https://www.g2.com/products/senai/reviews" },
    { name: "Trustpilot", url: "https://www.trustpilot.com/review/senai.io" },
  ];

  const results = await Promise.allSettled(
    targets.map((t) => scrapeReviewSite(t.name, t.url))
  );

  res.json({
    success: true,
    triggered: true,
    triggerReason: {
      hasSentimentDrop: sentimentScore < -0.6,
      hasReviewMention: (emailBody || "").toLowerCase().includes("review"),
      isComplaintHighUrgency: category === "Complaint" && (urgency === "High" || urgency === "Critical"),
    },
    marketIntelligence: results.map((r) =>
      r.status === "fulfilled" ? r.value : { error: r.reason?.message }
    ),
  });
};

module.exports = { reputationCheck, enrichEmailContext, shouldScrape };
