// src/mailer.js
// ═══════════════════════════════════════════════════════════════
// Gmail SMTP — completely free
// Sends mobile-optimized approval email to Azhar
// One tap = post goes live on LinkedIn
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendApprovalEmail({ postId, postText, hashtags, image, topic, approvalUrl, rejectUrl }) {
  console.log(`\n📧 [EMAIL] Sending to ${process.env.APPROVAL_EMAIL}...`);

  const imageSection = image
    ? `<img src="${image.url}" style="width:100%;border-radius:12px;margin:16px 0;" alt="post image" />`
    : `<div style="height:120px;background:#1a2540;border-radius:12px;margin:16px 0;display:flex;align-items:center;justify-content:center;color:#3d5a80;font-size:13px;">No image this time</div>`;

  const postFormatted = postText
    .split("\n")
    .map((l) => (l.trim() === "" ? "<br>" : `<p style="margin:4px 0;color:#cdd5e0;font-size:15px;line-height:1.7;">${l}</p>`))
    .join("");

  const tagBadges = hashtags
    .split(" ")
    .map((t) => `<span style="display:inline-block;padding:3px 12px;background:#0d2137;color:#4da3d4;border-radius:20px;font-size:12px;margin:2px;">${t}</span>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080f1e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:20px 14px;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0d2137 0%,#142942 100%);border-radius:20px;padding:30px 24px;text-align:center;margin-bottom:16px;">
    <div style="font-size:36px;margin-bottom:8px;">🤖</div>
    <h1 style="color:#4da3d4;font-size:20px;margin:0 0 6px;">Daily Post Ready</h1>
    <p style="color:#5a7a9a;font-size:13px;margin:0;">${new Date().toDateString()}</p>
    <p style="color:#3d5a80;font-size:12px;margin:4px 0 0;font-style:italic;">"${topic}"</p>
  </div>

  <!-- LinkedIn Post Preview -->
  <div style="background:#0f1e30;border:1px solid #1e3550;border-radius:16px;padding:22px;margin-bottom:16px;">

    <!-- Author line -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0077b5,#00a0dc);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px;flex-shrink:0;">A</div>
      <div>
        <div style="color:#e0e8f0;font-weight:600;font-size:14px;">Azhar</div>
        <div style="color:#3d5a80;font-size:11px;">Software Developer · Now</div>
      </div>
    </div>

    <!-- Post content -->
    ${postFormatted}
    ${imageSection}
    <div style="margin-top:10px;">${tagBadges}</div>
  </div>

  <!-- CTA Buttons -->
  <div style="text-align:center;padding:8px 0 20px;">
    <p style="color:#5a7a9a;font-size:13px;margin:0 0 18px;">Your agent did the work. Just say yes. 👇</p>

    <a href="${approvalUrl}"
      style="display:block;background:linear-gradient(135deg,#0077b5,#00a0dc);color:#fff;padding:18px 0;border-radius:14px;font-size:18px;font-weight:800;text-decoration:none;margin-bottom:12px;letter-spacing:0.5px;">
      ✅ APPROVE &amp; PUBLISH NOW
    </a>

    <a href="${rejectUrl}"
      style="display:block;background:#0a1628;color:#e05c5c;padding:12px 0;border-radius:12px;font-size:14px;font-weight:600;text-decoration:none;border:1px solid #3d1515;">
      ✖ Skip today's post
    </a>
  </div>

  <!-- Footer -->
  <p style="text-align:center;color:#1e3040;font-size:11px;margin:0;">
    Approval link expires in 24 hours · Post ID: ${postId.substring(0, 8)}...
  </p>
</div>
</body></html>`;

  const info = await transporter.sendMail({
    from: `"LinkedIn Agent 🤖" <${process.env.GMAIL_USER}>`,
    to: process.env.APPROVAL_EMAIL,
    subject: `✅ Approve today's LinkedIn post — ${new Date().toLocaleDateString("en-PK", { weekday: "long" })}`,
    html,
  });

  console.log(`   ✅ Email sent! (${info.messageId})`);
}

module.exports = { sendApprovalEmail };
