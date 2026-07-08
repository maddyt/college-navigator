# Day 1 Setup — Manual Steps

The code scaffold is done and committed. These four steps need your own accounts
and can't be done for you — they take about 15 minutes total.

## 1. Create your GitHub repo
```bash
cd college-navigator
# create a new empty repo on github.com first (no README/license), then:
git remote add origin https://github.com/<your-username>/college-navigator.git
git push -u origin master
```

## 2. Create a Supabase project
1. Go to https://supabase.com → New project.
2. Pick any name/region, set a database password (save it somewhere).
3. Once it's provisioned: Project Settings → API.
4. Copy the **Project URL** and the **anon public key**.

## 3. Set your local env vars
```bash
cp .env.local.example .env.local
```
Paste the Supabase URL + anon key into `.env.local`. Leave
`COLLEGE_SCORECARD_API_KEY` for Day 2 — grab it free at https://api.data.gov/signup/.

Run it locally to confirm:
```bash
npm install
npm run dev
```
Visit http://localhost:3000 — you should see the "Day 1 skeleton is live" page.

## 4. Deploy the skeleton to Vercel
1. Go to https://vercel.com → New Project → import the GitHub repo you just pushed.
2. Under Environment Variables, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same values as your `.env.local`).
3. Deploy. You'll get a live URL — that's your deployed skeleton, confirming the
   full pipeline (code → GitHub → Vercel → live) works before Day 2's real data lands.

---
Once all four are done, Day 1 is complete. Day 2 starts the College Scorecard data pull.
