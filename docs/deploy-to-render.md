# Deploying NyayaLens AI to Render

NyayaLens AI is configured for **unified deployment as a single Web Service on Render's Free Tier**. The Express server serves both the REST API (`/api/*`) and the compiled Vite frontend (`dist/`), ensuring zero CORS friction and requiring only 1 free service.

---

## Method 1: Blueprint Deployment (Recommended — 2 Minutes)

1. Push this repository to **GitHub** or **GitLab**.
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **"New"** → **"Blueprint"**.
4. Connect your repository. Render will automatically detect [`render.yaml`](file:///c:/edit%20docs/render.yaml).
5. In the environment variables prompt, enter your `GEMINI_API_KEY`:
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
6. Click **"Apply"**. Render will build and deploy your app!

---

## Method 2: Manual Web Service Setup

If you prefer manual setup without blueprints:

1. In Render Dashboard, click **"New"** → **"Web Service"**.
2. Select your repository.
3. Configure the following settings:
   - **Name**: `nyayalens-ai`
   - **Region**: Any (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install --include=dev && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **"Environment Variables"**, add:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `GEMINI_MODEL`: `gemini-3.5-flash`
   - `RATE_LIMIT_WINDOW_MS`: `60000`
   - `RATE_LIMIT_MAX_AI`: `20`
   - `CACHE_TTL_SECONDS`: `1800`
5. Click **"Create Web Service"**.

---

## Your Live URL

Render will automatically generate a free HTTPS URL for your application (e.g., `https://nyayalens-ai.onrender.com`).
