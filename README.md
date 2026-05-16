# Smart Health AI

A secure, AI-powered health record system designed for migrant workers. Access your medical records anytime, anywhere — even offline.

---

## Features

| Feature | Status |
|---|---|
| 🔐 Email/password authentication via Supabase | ✅ |
| 📋 Personal health profile (blood group, allergies, conditions) | ✅ |
| 🆘 Emergency QR card (works offline via localStorage cache) | ✅ |
| 🤖 AI health report summarisation (Gemini Pro API) | ✅ |
| 📊 ML-based health risk prediction (TensorFlow.js) | ✅ |
| 🎙️ Voice navigation (Hindi, Kannada, English) | ✅ |
| 📁 Medical records management | ✅ |
| 📶 Offline mode with localStorage fallback | ✅ |

---

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no framework)
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL + Auth)
- **AI**: Google Gemini Pro API (via REST)
- **ML**: TensorFlow.js (client-side inference)
- **Voice**: Web Speech API
- **QR**: qrcode.js
- **Deploy**: Netlify

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-health-ai.git
cd smart-health-ai
```

### 2. Configure Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL editor to create tables
3. Copy your **Project URL** and **Anon Key** from *Project Settings → API*

### 3. Set your credentials
Open `js/main.js` and replace the placeholder values:
```js
const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
```

> ⚠️ **Never commit real keys to a public repo.** For production, use a build tool with `.env` files.

### 4. Set your Gemini API key
Open `js/ai-handler.js` and replace the placeholder:
```js
const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
```

> ⚠️ **Moving the Gemini API call to a Netlify serverless function is strongly recommended** before going live. Client-side API keys are visible to anyone who opens DevTools.

### 5. Run locally
Open `index.html` directly in your browser, or serve with any static file server:
```bash
npx serve .
```

---

## Database Schema

See [`supabase/schema.sql`](supabase/schema.sql) for the full schema.

**Tables:**
- `profiles` — user health profile (blood group, allergies, conditions, language)
- `medical_records` — diagnoses, prescriptions, and AI summaries

**Security:**
- Row Level Security (RLS) is enabled on `profiles`
- RLS policies for `medical_records` should be added before going to production

---

## Project Structure

```
smart-health-ai/
├── index.html              # Landing page
├── auth.html               # Login / Register
├── dashboard.html          # User dashboard
├── emergency-card.html     # Offline-ready emergency QR card
├── ai-insights.html        # AI summary + ML risk analysis
├── records.html            # Medical records list
├── css/
│   ├── style.css           # Global styles + design tokens
│   ├── components.css      # Shared components (voice button, modal, QR)
│   ├── auth.css            # Auth page styles
│   ├── ai.css              # AI insights page styles
│   └── emergency.css       # Emergency card styles
├── js/
│   ├── main.js             # Supabase client init, session management
│   ├── auth.js             # Registration and login logic
│   ├── ai-handler.js       # Gemini API call for health summarisation
│   ├── ml-predict.js       # TensorFlow.js risk prediction
│   ├── voice-engine.js     # Web Speech API voice navigation
│   ├── qr-logic.js         # QR code generation + offline data fetch
│   └── offline-sync.js     # localStorage cache helpers
├── models/
│   └── risk-model.json     # TensorFlow.js model topology
├── supabase/
│   └── schema.sql          # Database schema + RLS policies
└── netlify.toml            # Deployment and security headers config
```

---

## Deploy to Netlify

1. Push the repo to GitHub
2. Connect the repo to [Netlify](https://netlify.com)
3. Set `publish directory` to `/` (or leave blank)
4. Deploy — no build step required

---

## Known Limitations / Future Work

- [ ] Move Gemini API call to a Netlify serverless function (hide API key)
- [ ] Add RLS INSERT/SELECT policies for `medical_records` table
- [ ] Add Service Worker + `manifest.json` for true PWA offline support
- [ ] Add i18n — apply the stored `primary_language` to translate the UI
- [ ] Add route guards to all protected pages (dashboard, emergency, AI, records)
- [ ] Add unit tests for ML fallback logic and auth flows
- [ ] File upload support for medical report PDFs/images (OCR via Gemini Vision)
