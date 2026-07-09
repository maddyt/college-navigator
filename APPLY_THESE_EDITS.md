# Small manual edits (not full files, just append these)

## .env.local.example — add these two lines:
COLLEGE_SCORECARD_API_KEY=your-api-data-gov-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret

## .gitignore — add this line:
data/*.json

## package.json — add these two entries inside "scripts":
"fetch:colleges": "node --env-file=.env.local scripts/fetch-colleges.mjs",
"seed:colleges": "node --env-file=.env.local scripts/seed-colleges.mjs"

## package.json — add this dependency (then run `npm install`):
"dotenv": "^17.4.2"   (as a devDependency)
