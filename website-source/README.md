# He Albert Zhang — Academic website

A responsive academic portfolio based on the existing he-zhang.com website and the September 2026 CV. The current version includes 40 existing works, one clearly marked under-review research project, and 37 research-development relationships retained from the original site.

## Research atlas

The interactive atlas supports theme filters, title/author/venue search, zoom, a readable list alternative, persistent work details, and directional ancestor/descendant highlighting. Connections describe thematic research trajectories, not bibliographic citations. The new VBC-Bench project has no invented edges. Each map node joins to a work using its stable ID.

- `data/profile.json`: publications, projects, biography paragraphs, themes, news, education, industry experience, mentoring, teaching, service, awards, and verified profile links.
- `data/research-map.json`: short labels, contribution categories, tags, and directed relationships.
- `data/scholar.json`: last successful citation snapshot, date, author identity, and source.
- `app/page.tsx`: page structure and introductory text.
- `app/globals.css`: responsive visual design.

The source CV is not copied into the repository or offered as a public download. Its content was used as reference; publication titles already represented by full bibliographic records were generally preserved where the CV used abbreviated titles. Current CV updates include 1,170+ citations, h-index 14, availability in December 2026, the reasoning project, industry experience, awards, and verified social links.

## Monthly Scholar synchronization

Author: `MgxFi7QAAAAJ`. The workflow runs at 09:17 UTC on the first of each month; it can also be run manually. It uses the Google Scholar Author API from SerpApi, whose free plan listed 250 searches/month when checked on September 17, 2026. One refresh uses one API search. No paid plan is required at that allowance.

Add a free-account key as the repository Actions secret `SERPAPI_API_KEY`. Never put it in source files or client-side code. Until configured, the website explicitly shows the dated September 2026 CV snapshot, not a claimed live count. The old August i10 value is not presented as current.

A successful update validates the author identity and all three metrics, writes the snapshot atomically, commits it, and builds the site. Network failures, quota errors, incomplete data, and unexpected drops greater than 20% retain the previous snapshot/date. A suspicious legitimate drop needs manual review. GitHub Actions logs show sync failures; the previous data remains on the page. A successful sync remains stored in the repository even if a later run fails. Branch protection must permit the Actions bot to commit the snapshot, or this persistence step must use a separately approved automation identity.

Provider documentation: https://serpapi.com/google-scholar-author-api

## CV updates

This version was updated from the supplied September 2026 PDF. It does not watch files on the user's computer. Update the structured profile data and research-map records when the CV changes; pushes trigger a new website build. Automatic PDF-to-profile extraction still requires an agreed CV storage location and a review process for changed research claims.

## Develop and verify

Use Node.js 22.13 or later. Run `npm ci`, `npm run dev`, `npx tsc --noEmit`, `node --experimental-strip-types --test tests/*.test.mjs`, and `npm run build`. Static output is `dist/client/`.

## GitHub hosting

The existing `KindOPSTAR/KindOPSTAR.github.io` repository contains a prior WordPress export. Keep that content intact. Place this application's source under `website-source/` and copy `.github/workflows/pages.yml` to the repository root. The workflow intentionally uses `website-source` as its working directory. On pull requests, it validates only; after merge to main it can publish with GitHub Pages once Settings → Pages → Source is changed to GitHub Actions.

The initial public URL is https://kindopstar.github.io/. Existing exported pages remain in Git history/source but are not included in this new deployment; decide which legacy URLs need redirects before switching the custom domain. After reviewing the new site and mapping any required old URLs, set `he-zhang.com` as the GitHub Pages custom domain and configure DNS using GitHub's current guidance. Preserve email-related DNS. Domain registration remains at GoDaddy; do not cancel it. Back up WordPress before cancelling its hosting.

Cloudflare Pages can also host the same static output. The private Sites preview is a separate deployment for review.
