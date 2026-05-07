# Demo_MTTQ

## Deploy on Vercel

Project is configured for static deployment with `vercel.json`.

### Option 1: Deploy from Vercel Dashboard

1. Push project to GitHub/GitLab/Bitbucket.
2. Import repository in Vercel.
3. Framework preset: `Other`.
4. Build command: leave empty.
5. Output directory: leave empty (root).
6. Deploy.

### Option 2: Deploy with Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```