// src/server.js
// ═══════════════════════════════════════════════════════════════
// Lightweight approval server
// Deployed FREE on Koyeb.com (always-on free tier)
// GitHub Actions triggers the pipeline daily
// This server just handles approve/reject webhooks
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { publishToLinkedIn } = require("./linkedin");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PENDING_DIR = path.join(__dirname, "../pending");
const HISTORY_FILE = path.join(__dirname, "../history.json");

if (!fs.existsSync(PENDING_DIR)) fs.mkdirSync(PENDING_DIR, { recursive: true });

// ── Helpers ───────────────────────────────────────────────────
function loadPost(postId) {
  const file = path.join(PENDING_DIR, `${postId}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function savePost(postId, data) {
  fs.writeFileSync(path.join(PENDING_DIR, `${postId}.json`), JSON.stringify(data, null, 2));
}

function deletePost(postId) {
  const file = path.join(PENDING_DIR, `${postId}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function addToHistory(entry) {
  let history = [];
  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  }
  history.unshift(entry);
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 50), null, 2));
}

// ── APPROVE endpoint ──────────────────────────────────────────
app.get("/approve/:postId", async (req, res) => {
  const { postId } = req.params;
  const post = loadPost(postId);

  if (!post) {
    return res.send(mobilePage("❌ Not Found", "This link is invalid or already used.", "#ef4444", "🔍"));
  }
  if (Date.now() > post.expiresAt) {
    deletePost(postId);
    return res.send(mobilePage("⏱ Expired", "This link expired. New post generates tomorrow.", "#f59e0b", "⏰"));
  }
  if (post.status !== "pending") {
    return res.send(mobilePage("Already Done", `Post was already ${post.status}.`, "#94a3b8", "✓"));
  }

  // Lock immediately to prevent double-publish
  post.status = "publishing";
  savePost(postId, post);

  // Respond to phone immediately
  res.send(mobilePage(
    "🚀 Publishing Now!",
    "Your post is going live on LinkedIn. Check your feed in 10 seconds! 🎉",
    "#22c55e", "✅"
  ));

  // Publish async
  try {
    console.log(`\n✅ APPROVED — Publishing ${postId}...`);
    const linkedInId = await publishToLinkedIn(
      post.content.post,
      post.content.hashtags,
      post.image
    );
    addToHistory({
      postId,
      topic: post.topic,
      linkedInId,
      publishedAt: new Date().toISOString(),
      excerpt: post.content.post.substring(0, 120),
    });
    deletePost(postId);
    console.log(`🎉 Published! LinkedIn ID: ${linkedInId}`);
  } catch (err) {
    console.error(`❌ Publish failed:`, err.message);
    post.status = "failed";
    post.error = err.message;
    savePost(postId, post);
  }
});

// ── REJECT endpoint ───────────────────────────────────────────
app.get("/reject/:postId", (req, res) => {
  const post = loadPost(req.params.postId);
  if (post) deletePost(req.params.postId);
  console.log(`🚫 Rejected: ${req.params.postId}`);
  res.send(mobilePage("Post Skipped", "No problem. A fresh post generates tomorrow automatically.", "#64748b", "🚫"));
});

// ── STATUS dashboard ──────────────────────────────────────────
app.get("/", (req, res) => {
  const pendingFiles = fs.existsSync(PENDING_DIR)
    ? fs.readdirSync(PENDING_DIR).map((f) => {
        const d = JSON.parse(fs.readFileSync(path.join(PENDING_DIR, f)));
        return { id: d.postId, topic: d.topic, status: d.status, created: d.createdAt };
      })
    : [];

  const history = fs.existsSync(HISTORY_FILE)
    ? JSON.parse(fs.readFileSync(HISTORY_FILE)).slice(0, 10)
    : [];

  res.json({
    status: "🟢 LinkedIn Agent Running",
    stack: "Google Gemini + Pexels + Gmail + Koyeb — 100% FREE",
    uptime: `${Math.floor(process.uptime() / 60)}m`,
    pendingApprovals: pendingFiles.length,
    pending: pendingFiles,
    recentPosts: history,
  });
});

// ── Manual trigger (for testing) ─────────────────────────────
app.post("/trigger", (req, res) => {
  if (req.body?.secret !== process.env.SECRET_TOKEN) {
    return res.status(403).json({ error: "Wrong secret" });
  }
  res.json({ ok: true, message: "Triggering pipeline..." });
  const { execSync } = require("child_process");
  setTimeout(() => {
    try {
      execSync("node src/pipeline.js", {
        cwd: path.join(__dirname, ".."),
        stdio: "inherit",
        timeout: 60000,
      });
    } catch (e) {
      console.error("Manual trigger failed:", e.message);
    }
  }, 100);
});

// Health check for Koyeb
app.get("/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`\n🟢 Approval server running on :${PORT}`);
  console.log(`   Dashboard: ${process.env.BASE_URL || "http://localhost:" + PORT}`);
});
