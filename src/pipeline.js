// src/pipeline.js
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { runAgent } = require("./agent");
const axios = require("axios");

async function runPipeline() {
  try {
    // Step 1: Generate content
    const { topic, content, image } = await runAgent();

    // Step 2: Create unique post ID
    const postId = uuidv4();

    // Step 3: POST everything to Google Apps Script
    // Apps Script will save it AND send the approval email
    console.log(`\n📤 Sending to Google Apps Script...`);

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;

    if (!appsScriptUrl) {
      throw new Error("APPS_SCRIPT_URL is not set in environment/secrets!");
    }

    const payload = {
      action: "store",
      secret: process.env.SECRET_TOKEN,
      postId,
      topic,
      postText: content.post,
      hashtags: content.hashtags,
      imageUrl: image?.url || "",
      imageCredit: image?.credit || "",
    };

    const response = await axios.post(appsScriptUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });

    if (response.data?.ok) {
      console.log(`\n✅ ════════════════════════════════════`);
      console.log(`   SUCCESS!`);
      console.log(`   Post ID: ${postId}`);
      console.log(`   Email sent to: ${process.env.APPROVAL_EMAIL}`);
      console.log(`   Check your Gmail and tap APPROVE!`);
      console.log(`════════════════════════════════════\n`);
    } else {
      throw new Error("Apps Script error: " + JSON.stringify(response.data));
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ PIPELINE FAILED:", err.message);
    if (err.response) {
      console.error("Response:", JSON.stringify(err.response.data));
    }
    process.exit(1);
  }
}

runPipeline();
