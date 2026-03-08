// src/pipeline.js
// ═══════════════════════════════════════════════════════════════
// Standalone pipeline — used by:
//   1. GitHub Actions (cron job, completely free)
//   2. Manual trigger via server
// Run: node src/pipeline.js
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { runAgent } = require("./agent");
const { sendApprovalEmail } = require("./mailer");

// In GitHub Actions mode, we store the pending post in a temp file
// so the approval server (Koyeb) can retrieve it
const fs = require("fs");
const path = require("path");

async function runPipeline() {
  try {
    // Step 1: Generate content
    const { topic, content, image } = await runAgent();

    // Step 2: Create unique post ID
    const postId = uuidv4();

    // Step 3: Build approval URLs (pointing to your free Koyeb server)
    const baseUrl = process.env.BASE_URL || "http://localhost:3000";
    const approvalUrl = `${baseUrl}?action=approve&id=${postId}`;
    const rejectUrl = `${baseUrl}?action=reject&id=${postId}`;

    // Step 4: Save pending post to file (persists on server)
    const pendingDir = path.join(__dirname, "../pending");
    if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });

    const postData = {
      postId,
      topic,
      content,
      image,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      status: "pending",
    };

    fs.writeFileSync(
      path.join(pendingDir, `${postId}.json`),
      JSON.stringify(postData, null, 2)
    );

    // Step 5: Send approval email
    await sendApprovalEmail({
      postId,
      postText: content.post,
      hashtags: content.hashtags,
      image,
      topic,
      approvalUrl,
      rejectUrl,
    });

    console.log(`\n✅ ═══════════════════════════════════════`);
    console.log(`   PIPELINE COMPLETE`);
    console.log(`   Post ID: ${postId}`);
    console.log(`   Approval URL: ${approvalUrl}`);
    console.log(`   Check your email: ${process.env.APPROVAL_EMAIL}`);
    console.log(`═══════════════════════════════════════\n`);

    process.exit(0);
  } catch (err) {
    console.error("\n❌ PIPELINE FAILED:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

runPipeline();
