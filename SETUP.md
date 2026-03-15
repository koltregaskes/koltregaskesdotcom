# Setup

Setup instructions for local development and GitHub Pages deployment.

## Prerequisites

- Node.js 18+
- GitHub repository with Pages enabled
- Optional Supabase project for the newsletter form

## Local Build

```bash
node scripts/build.mjs
```

Optional environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-key
CUSTOM_DOMAIN=koltregaskes.com
```

## Local Preview

```bash
node scripts/build.mjs
cd site
npx http-server -p 8080
```

Visit `http://localhost:8080/`.

## GitHub Repository Setup

### 1. Enable GitHub Pages

In GitHub:

1. Open the repository settings
2. Go to Pages
3. Set the source to GitHub Actions

### 2. Configure Secrets

Only needed if you want the newsletter form to post to Supabase.

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

### 3. Configure the Domain

This repo now includes a committed [`CNAME`](/W:/Websites/sites/koltregaskesdotcom/CNAME) file for `koltregaskes.com`.

If you prefer variables-driven configuration, you can also set:

- Repository variable: `CUSTOM_DOMAIN=koltregaskes.com`

After deployment, point the domain in GitHub Pages settings to the same hostname and update DNS accordingly.

## Deployment Flow

Push to `main` and GitHub Actions will:

1. Build the site with `node scripts/build.mjs`
2. Upload `site/`
3. Deploy to GitHub Pages

## Troubleshooting

### Old pages still showing up

The build now clears generated output before rebuilding. Run `node scripts/build.mjs` again and redeploy.

### Newsletter form is not working

The committed site builds without real Supabase credentials unless `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set.

### Custom domain mismatch

Make sure the committed `CNAME`, the GitHub Pages custom domain setting, and your DNS records all use the same hostname.
