// src/agent.js
// ═══════════════════════════════════════════════════════════════
// FREE AI BRAIN — Google Gemini 1.5 Flash
// Free tier: 1500 requests/day, 15 req/min — more than enough
// Uses 2-stage "think broadly → write humanized" pipeline
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ── Rotating topic pool (18 topics = new topic every day) ──────
const TOPIC_POOL = [
  "lessons learned from building a real software project",
  "how AI tools are changing developer workflows in 2025",
  "portfolio tips that actually get developers hired",
  "React or Next.js patterns every developer should know",
  "from zero to deployed — documenting a learning journey in public",
  "productivity systems that genuinely work for software engineers",
  "open source contribution experience and what it teaches you",
  "debugging war stories and what they teach about problem solving",
  "how automation saved hours in a real development workflow",
  "Flutter vs React Native — an honest real-world comparison",
  "why learning in public dramatically accelerates career growth",
  "building a personal brand as a developer in Pakistan",
  "REST vs GraphQL — when to actually use each one",
  "Git workflows that prevent chaos in team projects",
  "the mindset shift from student coder to professional developer",
  "cloud deployment basics — what I wish I knew as a beginner",
  "web performance tips that make a real user difference",
  "how to land your first tech job with no prior experience",
];

// ── Pick today's topic deterministically ──────────────────────
function getTodaysTopic() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Date.now() - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return TOPIC_POOL[dayOfYear % TOPIC_POOL.length];
}

// ═══════════════════════════════════════════════════════════════
// STAGE 1 — THINK BROADLY (multi-angle strategic reasoning)
// This is the "MCP-style" broad thinking pass
// ═══════════════════════════════════════════════════════════════
async function thinkBroadly(topic) {
  console.log(`\n🧠 [AGENT] Stage 1: Thinking broadly about "${topic}"...`);

  const prompt = `You are a strategic LinkedIn content thinker for a software developer.
Analyze the topic from 4 angles, then identify the strongest approach.

Topic: "${topic}"

Explore:
1. TECHNICAL ANGLE — specific technical insight that educates developers
2. CAREER ANGLE — how this connects to real developer career growth  
3. HUMAN ANGLE — personal struggle, failure, or win that makes it relatable
4. TREND ANGLE — connection to what's happening in tech right now (2025)

Then decide: which angle will get the MOST engagement on LinkedIn and why?

Respond in this EXACT JSON format (no markdown, no backticks):
{
  "angles": {
    "technical": "brief note",
    "career": "brief note", 
    "human": "brief note",
    "trend": "brief note"
  },
  "best_angle": "human",
  "reason": "one sentence why",
  "core_message": "the one truth this post will deliver",
  "hook_ideas": ["hook option 1", "hook option 2", "hook option 3"]
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch {
    // Fallback if JSON parsing fails
    return {
      best_angle: "human",
      reason: "personal stories resonate most on LinkedIn",
      core_message: `Real insight about ${topic}`,
      hook_ideas: [
        `I learned something hard about ${topic} last week.`,
        `Nobody tells you this about ${topic}.`,
        `${topic} changed how I work as a developer.`,
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 2 — WRITE THE POST (humanized, not AI-sounding)
// ═══════════════════════════════════════════════════════════════
async function writePost(topic, thinking) {
  console.log(`\n✍️  [AGENT] Stage 2: Writing humanized post...`);
  console.log(
    `   Angle: ${thinking.best_angle} — "${thinking.core_message}"`
  );

  const prompt = `You are ghostwriting a LinkedIn post for Azhar, a Pakistani software developer building his career in tech.

Strategic context:
- Topic: "${topic}"
- Best angle: ${thinking.best_angle}
- Core message: ${thinking.core_message}  
- Use this hook: "${thinking.hook_ideas[0]}"

WRITING RULES — follow strictly:
✅ Sound like a real 22-year-old developer talking, NOT a polished influencer
✅ Short punchy sentences mixed with occasional longer reflective ones
✅ Use "I" naturally — share specific moments and honest thoughts
✅ Max 2-3 emojis total, only where they fit naturally
✅ No buzzwords: no "leverage", "synergy", "game-changer", "actionable"
✅ Tell a micro-story with one specific real detail
✅ End with a genuine question that sparks debate or sharing
✅ 150-250 words total — LinkedIn sweet spot

POST STRUCTURE:
[Line 1: The hook — 1 punchy sentence that stops the scroll]

[Lines 2-5: The story — 2 short paragraphs, very human, specific details]

[Lines 6-7: The lesson — what actually matters here]

[Line 8: One practical thing the reader can do today]

[Line 9: Question to spark comments]

NO hashtags in the post body.
NO bullet points — flowing natural prose only.
NO generic motivational closing lines.

Respond ONLY in this JSON (no markdown):
{
  "post": "full post with real newlines as \\n",
  "hashtags": "#SoftwareEngineering #WebDevelopment #Programming #TechCareer #Developers",
  "image_search_query": "4-word Pexels search matching this post visually",
  "topic_label": "5 words max — what this post is about"
}`;

  const result = await model.generateContent(prompt);
  const raw = result.response.text().replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(raw);
  } catch {
    return {
      post: `Generation issue — please retry.`,
      hashtags: "#SoftwareEngineering #WebDevelopment #Programming",
      image_search_query: "developer coding laptop",
      topic_label: topic.substring(0, 30),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// STAGE 3 — FETCH IMAGE from Pexels (free)
// ═══════════════════════════════════════════════════════════════
async function fetchImage(searchQuery) {
  console.log(`\n🖼️  [AGENT] Stage 3: Fetching image for "${searchQuery}"...`);
  const axios = require("axios");

  if (!process.env.PEXELS_API_KEY) {
    console.warn("⚠️  No Pexels key — skipping image");
    return null;
  }

  try {
    const res = await axios.get("https://api.pexels.com/v1/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: {
        query: searchQuery,
        per_page: 8,
        orientation: "landscape",
        size: "medium",
      },
    });

    const photos = res.data.photos;
    if (!photos || photos.length === 0) return null;

    // Rotate through top results for variety
    const pick = photos[new Date().getDate() % photos.length];
    return {
      url: pick.src.large2x,
      photographer: pick.photographer,
      pexels_url: pick.url,
    };
  } catch (err) {
    console.warn("⚠️  Image fetch failed:", err.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT — Full agent pipeline
// ═══════════════════════════════════════════════════════════════
async function runAgent(customTopic = null) {
  const topic = customTopic || getTodaysTopic();

  console.log("\n🤖 ═══════════════════════════════════════════");
  console.log("   LINKEDIN AUTONOMOUS AGENT  (FREE STACK)");
  console.log("   Powered by Google Gemini 1.5 Flash");
  console.log("═══════════════════════════════════════════\n");
  console.log(`📅 ${new Date().toDateString()}`);
  console.log(`📌 Topic: ${topic}\n`);

  const thinking = await thinkBroadly(topic);
  const content = await writePost(topic, thinking);
  const image = await fetchImage(content.image_search_query);

  console.log(`\n✅ Agent complete:`);
  console.log(`   Words: ~${content.post.split(" ").length}`);
  console.log(`   Image: ${image ? "✅ found" : "❌ none"}`);

  return { topic, thinking, content, image };
}

module.exports = { runAgent, getTodaysTopic };
