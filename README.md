<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/90eaa158-6bf5-4c67-93d6-dbcc68e54879

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying the frontend on Netlify

This project is not frontend-only. The React app depends on the Express API in `server.ts` for signup, login, cards, leads, analytics, and QR-linked public profiles.

If you upload only the `dist/` folder to Netlify, Netlify will serve the static frontend but it will not run `dist/server.cjs`. That means `/api/...` requests will fail.

To deploy successfully:

1. Deploy the frontend to Netlify.
2. Deploy the backend (`server.ts`) to a Node host such as Render, Railway, Fly.io, or a VPS.
3. Set `VITE_API_BASE_URL` in Netlify to your backend origin, for example:
   `https://your-backend.example.com`
4. Rebuild and redeploy the frontend.
