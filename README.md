# 🤖 LinkedIn Autonomous Agent — 100% FREE Stack

> Daily AI-generated posts → email you for approval → auto-publish to LinkedIn.
> **Zero cost. Forever.**

---

## 💰 Cost Breakdown

| Component | Service | Cost |
|-----------|---------|------|
| AI Content (ChatGPT-level) | Google Gemini 1.5 Flash | **FREE** (1500 req/day) |
| Images | Pexels API | **FREE** (200 req/hour) |
| Approval Email | Gmail SMTP | **FREE** |
| Daily Scheduler | GitHub Actions | **FREE** (2000 min/month) |
| Approval Server | Koyeb.com | **FREE** (always-on) |
| LinkedIn Posting | LinkedIn API | **FREE** |
| **TOTAL** | | **$0.00/month** |

---

## 🏗️ Architecture

```
GitHub Actions (free cron)
    runs every day at 9 AM PKT
         ↓
    node src/pipeline.js
         ↓
 Gemini generates post (free)
         ↓
 Pexels fetches image (free)
         ↓
 Gmail sends you approval email (free)
         ↓
    You tap APPROVE on phone
         ↓
 Koyeb server receives webhook (free)
         ↓
 LinkedIn API publishes post (free) ✅
```

---

## 📋 STEP-BY-STEP SETUP

---

### STEP 1 — Google Gemini API Key (FREE AI)

1. Open: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API key"**
4. Copy the key (starts with `AIza...`)
5. No billing needed. No credit card. Just free.

**Free limits:** 1500 requests/day, 15/min — you only use 2-3 per post

---

### STEP 2 — LinkedIn Developer App (Free to create)

**Part A — Create the App:**
1. Go to: **https://www.linkedin.com/developers/apps/new**
2. Log into your LinkedIn account
3. Fill in:
   - App name: `My LinkedIn Agent`
   - LinkedIn Page: select your profile or any page
   - Privacy policy URL: `https://github.com/` (temporary)
   - App logo: any image
4. Click **Create app**

**Part B — Enable required products:**
1. Go to the **"Products"** tab in your app
2. Click **"Request access"** for:
   - ✅ **Share on LinkedIn**
   - ✅ **Sign In with LinkedIn using OpenID Connect**
3. Both should show "Added" within a few minutes

**Part C — Get your credentials:**
1. Go to **"Auth"** tab
2. Copy: `Client ID` and `Client Secret`
3. Under "OAuth 2.0 settings", add redirect URL:
   `https://www.linkedin.com/developers/tools/oauth/redirect`

**Part D — Generate Access Token:**
1. Go to: **https://www.linkedin.com/developers/tools/oauth/token-generator**
2. Select your app
3. Check these scopes: `w_member_social` + `r_liteprofile` + `openid` + `profile`
4. Click **"Request access token"**
5. Copy the token (it's a long string)
6. ⚠️ This token lasts **60 days** — set a phone reminder to refresh it

**Part E — Get your Person URN:**
Open terminal and run this (replace YOUR_TOKEN):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.linkedin.com/v2/me
```
You'll get JSON like: `{"id": "abc123XYZ", "localizedFirstName": "Azhar"...}`
Your Person URN = `urn:li:person:abc123XYZ`

---

### STEP 3 — Pexels API Key (Free Images)

1. Go to: **https://www.pexels.com/api/**
2. Click **"Get Started"** — sign up free
3. After signup, your API key is on the dashboard
4. Copy it (a long alphanumeric string)

---

### STEP 4 — Gmail App Password (Free Email)

1. Log into **prog.azharexp@gmail.com**
2. Go to: **https://myaccount.google.com/security**
3. Under "How you sign in to Google" → enable **2-Step Verification** (if not already)
4. After 2FA is on, go to: **https://myaccount.google.com/apppasswords**
5. Click "Create" → name it `LinkedIn Agent`
6. Copy the **16-character password** shown (format: `xxxx xxxx xxxx xxxx`)
7. ⚠️ This is NOT your Gmail password — it's a special app-only key

---

### STEP 5 — Deploy Approval Server on Koyeb (Free Forever)

Koyeb has a free tier that never sleeps (unlike Render).

1. Go to: **https://www.koyeb.com** → sign up free
2. Click **"Create App"**
3. Choose **"GitHub"** → connect your GitHub account
4. Select your repo (we'll push it next)
5. Settings:
   - **Run command:** `node src/server.js`
   - **Port:** `3000`
6. Add environment variables (all of them from `.env.example`)
7. Deploy → copy your app URL (e.g. `https://my-agent-xyz.koyeb.app`)

---

### STEP 6 — Push to GitHub & Add Secrets

**Push code:**
```bash
git init
git add .
git commit -m "LinkedIn agent — free stack"
git remote add origin https://github.com/YOUR_USERNAME/linkedin-agent.git
git push -u origin main
```

**Add GitHub Secrets** (Settings → Secrets → Actions → New secret):

| Secret Name | Value |
|-------------|-------|
| `GEMINI_API_KEY` | Your Gemini key |
| `PEXELS_API_KEY` | Your Pexels key |
| `GMAIL_USER` | `prog.azharexp@gmail.com` |
| `GMAIL_APP_PASSWORD` | Your 16-char app password |
| `APPROVAL_EMAIL` | `prog.azharexp@gmail.com` |
| `BASE_URL` | Your Koyeb URL (e.g. `https://my-agent.koyeb.app`) |
| `LINKEDIN_ACCESS_TOKEN` | Your LinkedIn token |
| `LINKEDIN_PERSON_URN` | `urn:li:person:YOUR_ID` |
| `LINKEDIN_CLIENT_ID` | From LinkedIn app |
| `LINKEDIN_CLIENT_SECRET` | From LinkedIn app |
| `SECRET_TOKEN` | Any random string |

---

### STEP 7 — Test It!

**Test the pipeline manually:**
1. Go to your GitHub repo
2. Click **"Actions"** tab
3. Click **"Daily LinkedIn Post"**
4. Click **"Run workflow"** → **"Run workflow"**
5. Check your email in ~30 seconds
6. Tap **APPROVE** — watch your LinkedIn profile 🎉

---

## 📁 Project Structure

```
linkedin-agent-free/
├── src/
│   ├── agent.js        # Gemini AI — think broadly → write humanized post
│   ├── pipeline.js     # One-shot script (used by GitHub Actions)
│   ├── server.js       # Koyeb approval server
│   ├── linkedin.js     # LinkedIn API posting
│   └── mailer.js       # Gmail approval email
├── .github/
│   └── workflows/
│       └── daily-post.yml   # Free daily cron (9 AM PKT)
├── pending/            # Temp post storage (auto-created)
├── .env.example        # Config template
├── package.json
└── README.md
```

---

## 🔄 Refresh LinkedIn Token (Every 60 Days)

LinkedIn tokens expire every 60 days. Here's the quick refresh:
1. Go to token generator → generate new token
2. GitHub → Settings → Secrets → Update `LINKEDIN_ACCESS_TOKEN`
3. Koyeb → Environment variables → Update `LINKEDIN_ACCESS_TOKEN`

Set a recurring phone alarm for "LinkedIn Token Refresh" every 55 days.

---

## ❓ Troubleshooting

**Email not arriving?**
→ Check Gmail spam folder
→ Make sure App Password has no spaces
→ Verify 2FA is enabled

**LinkedIn 401 error?**
→ Token expired — regenerate it
→ Make sure `w_member_social` scope was selected

**GitHub Actions not running?**
→ Make sure the repo is not archived
→ Check Actions tab for error logs
→ Verify all secrets are added

**Gemini error?**
→ Check API key at aistudio.google.com
→ Make sure API is enabled in your Google Cloud console

---

*Built with ❤️ — 100% free, runs forever*
