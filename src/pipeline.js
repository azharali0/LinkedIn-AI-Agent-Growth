// src/pipeline.js
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { runAgent } = require("./agent");
const axios = require("axios");

async function runPipeline() {
  try {
    // Step 1: Generate content
    const { topic, content, image } = await runAgent();
    const postId = uuidv4();

    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const secretToken   = process.env.SECRET_TOKEN;

    console.log(`\n📤 Sending post to Google Apps Script...`);
    console.log(`   Post ID: ${postId}`);
    console.log(`   Apps Script URL: ${appsScriptUrl ? "✅ Set" : "❌ MISSING!"}`);
    console.log(`   Secret Token: ${secretToken ? "✅ Set" : "❌ MISSING!"}`);

    if (!appsScriptUrl) throw new Error("APPS_SCRIPT_URL secret is missing!");
    if (!secretToken)   throw new Error("SECRET_TOKEN secret is missing!");

    const payload = {
      action:      "store",
      secret:      secretToken,
      postId,
      topic,
      postText:    content.post,
      hashtags:    content.hashtags,
      imageUrl:    image?.url   || "",
      imageCredit: image?.credit || "",
    };

    // Use text/plain to avoid CORS preflight redirect issues with Apps Script
    const response = await axios({
      method: "POST",
      url: appsScriptUrl,
      data: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" },
      maxRedirects: 10,
      timeout: 30000,
    });

    console.log(`\n   Apps Script response: ${JSON.stringify(response.data)}`);

    if (response.data?.ok) {
      console.log(`\n✅ SUCCESS!`);
      console.log(`   Post stored in Apps Script`);
      console.log(`   Approval email sent to: ${process.env.APPROVAL_EMAIL}`);
      console.log(`   Check your Gmail and tap APPROVE!`);
    } else {
      throw new Error("Apps Script returned: " + JSON.stringify(response.data));
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ PIPELINE FAILED:", err.message);
    if (err.response) {
      console.error("   Status:", err.response.status);
      console.error("   Data:",   JSON.stringify(err.response.data));
    }
    process.exit(1);
  }
}

runPipeline();
