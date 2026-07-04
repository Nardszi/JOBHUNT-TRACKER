# Nardz Tracker

A personal 30-60-90 day job hunt tracker — plan, applications, portfolio, and interview prep notes, all stored locally in your browser (no backend/signup needed).

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new, import the repo
3. Framework preset: Next.js (auto-detected)
4. Deploy — no environment variables needed

## Notes
- All data (tasks, applications, projects, notes) is saved in your browser's localStorage — nothing is sent to a server.
- Data is per-browser/device. Clearing browser data or using a different device/browser will not carry it over.
