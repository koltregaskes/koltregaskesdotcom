# Next Session Handoff

This file is a short, session-specific handoff for the next Codex session after the local folder rename.

## Current State

- GitHub repo rename has been completed and verified.
- `origin` now points to `https://github.com/koltregaskes/kols-korner.git`.
- The local folder has not been renamed yet. The current working path is still `W:\Websites\sites\koltregaskesdotcom`.
- The user plans to rename the local folder next and then start a new Codex session.
- Domain work is intentionally deferred for now. The focus is finishing the site and the news system first.
- This workspace runs on a Windows mini PC that is on 24/7.
- The repo lives on a NAS that is also on 24/7.
- Local scheduled jobs are allowed and preferred where useful.

## What We Did In This Session

- Verified the GitHub repo rename by checking both the old and new GitHub URLs.
- Updated the local git remote from the old repo name to the new one.
- Rebuilt and improved the repo-local news pipeline in commit `19ef055` (`feat: catch up news digests and automate refreshes`).
- Added `scripts/backfill-digests.mjs` to publish missing raw digests from `news-digests/` into `content/`.
- Updated `scripts/generate-daily-digest.mjs` so it can parse multiple legacy digest formats, including older January digest files.
- Changed `.github/workflows/daily-digest.yml` to run twice daily at `06:00` and `18:00` UTC.
- Backfilled the missing digest posts from January and early February 2026 and rebuilt `site/`.
- Pushed the news pipeline work to `main`.

## Important Commits

- `19ef055` `feat: catch up news digests and automate refreshes`
- `8f4fd62` `chore: prepare launch cleanup and domain switch`

## What Needs Doing Next

1. Rename the local folder from `W:\Websites\sites\koltregaskesdotcom` to match the new repo name.
2. Start the next Codex session in the renamed folder.
3. Continue the website cleanup and launch polish before returning to domain cutover.
4. Replace the current stopgap news fetcher with the real shared news gatherer.
5. Build the Supabase-backed version of the news system.
6. Set up local scheduling on Windows for any long-running or recurring jobs instead of relying only on GitHub Actions.

## News Gatherer Status

- The current scheduled news job exists and runs twice daily, but it still uses the repo-local stopgap fetcher in `scripts/fetch-news.mjs`.
- The long-term plan is a shared news gatherer used by multiple websites, with site-specific filters or tags per website.
- This repo does not contain the real 60-70 source list.
- This repo also does not contain the real Supabase news schema or ingestion code.
- There is no `.env` file in this repo containing Supabase credentials.
- The handoff doc `NEWS-GATHERER-HANDOFF.md` says the source list previously lived in `SOURCE-TESTING-TRACKER.md`.
- Because this machine is always on, the real gatherer should probably run as a local Windows Scheduled Task once the shared scraper exists.
- The user explicitly wants Codex to handle recurring jobs if possible rather than delegating that work elsewhere.

## What The Next Session Will Need From The User

- The 60-70 source tracker file, ideally `SOURCE-TESTING-TRACKER.md`, or an equivalent source list with URLs, categories, and notes.
- Access to the Supabase credentials for the news system, either via a local `.env` path or by providing the relevant values.
- Any old scraper prototype, extraction notes, or per-site parsing rules if they still exist in the old workspace.

## Repo Notes

- The canonical long-form project handoff is still `CODEX-HANDOFF.md`.
- The news-specific long-form brief is `NEWS-GATHERER-HANDOFF.md`.
- The repo is now named `kols-korner`, but some local filesystem paths may still use the old folder name until the user renames the folder.

## Scheduling Note

- Do not create the permanent local scheduled task until after the folder rename, otherwise the task will point at the wrong path.
- After the rename, create the recurring local jobs directly on Windows if the next session needs them.
- The most likely first local scheduled job is the shared news gatherer running twice daily, followed by digest generation and site rebuild/publish steps.

## Dirty Working Tree Note

At the end of this session, `git status` showed local modifications in:

- `site/feed.xml`
- `site/styles.css`

These were not part of the repo rename check and were not changed by the handoff work in this step. The next session should inspect them before making unrelated edits.
