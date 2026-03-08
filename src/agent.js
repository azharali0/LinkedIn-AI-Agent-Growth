// src/agent.js
require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const TOPICS = [
  "lessons learned building a real software project",
  "how AI tools are changing developer workflows in 2025",
  "portfolio tips that actually get developers hired",
  "React or Next.js patterns every developer should know",
  "documenting your learning journey in public",
  "productivity systems that genuinely work for engineers",
  "what open source contribution really teaches you",
  "debugging stories and what they reveal about problem solving",
  "how automation saved hours in a real dev workflow",
  "Flutter vs React Native — honest real-world comparison",
  "why learning in public accelerates your career",
  "building a developer personal brand in Pakistan",
  "REST vs GraphQL — when to actually use each",
  "Git workflows that prevent team project chaos",
  "mindset shift from student coder to professional developer",
  "cloud deployment basics for first-time deployers",
  "web performance tips with real user impact",
  "landing your first tech job with no prior experience",
];

function getTodaysTopic() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return process.env.CUSTOM_TOPIC || TOPICS[dayOfYear % TOPICS.length];
}

async function askGroq(prompt) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.9,
  });
  return res.choices[0].message.content;
}

async function thinkBroadly(topic) {
  console.log(`\n🧠 [AGENT] Stage 1: Thinking broadly about "${topic}"...`);

  const raw = await askGroq(`
You are a LinkedIn content strategist for a software developer.
Analyze this topic and pick the strongest angle for LinkedIn engagement.

Topic: "${topic}"

Respond ONLY in valid JSON (no markdown, no backticks, no extra text):
{
  "best_angle": "human",
  "core_message": "the single truth this post delivers",
  "hook": "one punchy opening line that stops the scroll"
}`);

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return {
      best_angle: "human",
      core_message: `Real developer insight about ${topic}`,
      hook: `Nobody tells you this about ${topic}.`,
    };
  }
}

async function writePost(topic, thinking) {
  console.log(`\n✍️  [AGENT] Stage 2: Writing post...`);

  const raw = await askGroq(`
You are ghostwriting a LinkedIn post for Azhar, a Pakistani software developer.

Topic: "${topic}"
Core message: "${thinking.core_message}"
Opening hook: "${thinking.hook}"

RULES:
- Sound like a real 22-year-old developer, NOT a polished influencer
- Short punchy sentences, use "I" naturally
- Max 3 emojis placed naturally
- No buzzwords like leverage, synergy, game-changer
- End with a question that sparks replies
- 150-250 words total
- NO hashtags in the post body
- NO bullet points, flowing prose only

Respond ONLY in valid JSON (no markdown, no backticks, no extra text):
{
  "post": "full post text with newlines as \\n",
  "hashtags": "#SoftwareEngineering #WebDevelopment #Programming #TechCareer #Developers",
  "image_search_query": "4 words for a Pexels image search",
  "topic_label": "4 word summary"
}`);

  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return {
      post: "Post generation issue — please retry.",
      hashtags: "#SoftwareEngineering #WebDevelopment #Programming",
      image_search_query: "developer coding at desk",
      topic_label: topic.substring(0, 30),
    };
  }
}

async function fetchImage(query) {
  console.log(`\n🖼️  [AGENT] Stage 3: Fetching image for "${query}"...`);
  if (!process.env.PEXELS_API_KEY) return null;
  const axios = require("axios");
  try {
    const res = await axios.get("https://api.pexels.com/v1/search", {
      headers: { Authorization: process.env.PEXELS_API_KEY },
      params: { query, per_page: 8, orientation: "landscape" },
    });
    const photos = res.data.photos;
    if (!photos?.length) return null;
    const pick = photos[new Date().getDate() % photos.length];
    return { url: pick.src.large2x, credit: pick.photographer };
  } catch {
    return null;
  }
}

async function runAgent(customTopic = null) {
  const topic = customTopic || getTodaysTopic();

  console.log("\n🤖 ═══════════════════════════════════════════");
  console.log("   LINKEDIN AGENT — FREE STACK");
  console.log("   Powered by Groq + Llama 3.3 70B");
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
