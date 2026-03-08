require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const { runAgent } = require("./agent");
const axios = require("axios");

async function runPipeline() {
  try {
    const { topic, content, image } = await runAgent();
    const postId = uuidv4();
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;
    const secretToken = process.env.SECRET_TOKEN;

    console.log(`\n📤 Sending to Apps Script...`);
    console.log(`   APPS_SCRIPT_URL: ${appsScriptUrl ? "✅" : "❌ MISSING"}`);
    console.log(`   SECRET_TOKEN: ${secretToken ? "✅" : "❌ MISSING"}`);

    if (!appsScriptUrl) throw new Error("APPS_SCRIPT_URL is missing!");
    if (!secretToken) throw new Error("SECRET_TOKEN is missing!");

    const payload = {
      action: "store",
      secret: secretToken,
      postId,
      topic,
      postText: content.post,
      hashtags: content.hashtags,
      imageUrl: image?.url || "",
      imageCredit: image?.credit || "",
    };

    const response = await axios({
      method: "POST",
      url: appsScriptUrl,
      data: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain" },
      maxRedirects: 10,
      timeout: 30000,
    });

    console.log(`\n   Response: ${JSON.stringify(response.data)}`);

    if (response.data?.ok) {
      console.log(`\n✅ Apps Script stored post and sent email!`);
    } else {
      throw new Error("Apps Script error: " + JSON.stringify(response.data));
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
  }
}

runPipeline();
