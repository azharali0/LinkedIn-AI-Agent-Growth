// src/linkedin.js
// ═══════════════════════════════════════════════════════════════
// Posts text + image to LinkedIn using the official LinkedIn API
// The LinkedIn API itself is FREE — just needs a developer app
// ═══════════════════════════════════════════════════════════════

require("dotenv").config();
const axios = require("axios");

const API = "https://api.linkedin.com/v2";
const TOKEN = () => process.env.LINKEDIN_ACCESS_TOKEN;
const PERSON_URN = () => process.env.LINKEDIN_PERSON_URN;

const headers = () => ({
  Authorization: `Bearer ${TOKEN()}`,
  "Content-Type": "application/json",
  "X-Restli-Protocol-Version": "2.0.0",
});

// ── Upload image from URL to LinkedIn ─────────────────────────
async function uploadImage(imageUrl) {
  // Step 1: Register upload
  const regRes = await axios.post(
    `${API}/assets?action=registerUpload`,
    {
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: PERSON_URN(),
        serviceRelationships: [
          { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
        ],
      },
    },
    { headers: headers() }
  );

  const uploadUrl =
    regRes.data.value.uploadMechanism[
      "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
    ].uploadUrl;
  const assetUrn = regRes.data.value.asset;

  // Step 2: Download image and upload binary
  const imgBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" });
  await axios.put(uploadUrl, imgBuffer.data, {
    headers: {
      Authorization: `Bearer ${TOKEN()}`,
      "Content-Type": "image/jpeg",
    },
  });

  return assetUrn;
}

// ── Publish post to LinkedIn feed ─────────────────────────────
async function publishToLinkedIn(postText, hashtags, imageData) {
  console.log("\n🚀 [LINKEDIN] Publishing to feed...");

  const fullText = `${postText}\n\n${hashtags}`;
  let shareContent;

  if (imageData?.url) {
    try {
      console.log("   Uploading image...");
      const assetUrn = await uploadImage(imageData.url);
      shareContent = {
        shareCommentary: { text: fullText },
        shareMediaCategory: "IMAGE",
        media: [{ status: "READY", description: { text: "" }, media: assetUrn }],
      };
      console.log("   ✅ Image uploaded");
    } catch (imgErr) {
      console.warn("   ⚠️  Image failed, posting text only:", imgErr.message);
      shareContent = { shareCommentary: { text: fullText }, shareMediaCategory: "NONE" };
    }
  } else {
    shareContent = { shareCommentary: { text: fullText }, shareMediaCategory: "NONE" };
  }

  const body = {
    author: PERSON_URN(),
    lifecycleState: "PUBLISHED",
    specificContent: { "com.linkedin.ugc.ShareContent": shareContent },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const res = await axios.post(`${API}/ugcPosts`, body, { headers: headers() });
  const postId = res.data.id;
  console.log(`   ✅ LIVE on LinkedIn! Post ID: ${postId}`);
  return postId;
}

module.exports = { publishToLinkedIn };
