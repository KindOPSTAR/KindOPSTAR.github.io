# He Albert Zhang — Academic website

A responsive academic portfolio based on the existing he-zhang.com website and the September 2026 CV. The current version includes 40 existing works, one clearly marked under-review research project, and 37 research-development relationships retained from the original site.

## Research atlas

The interactive atlas supports separate dependency-path and chronological layouts, theme filters, title/author/venue search, zoom, focus on a selected branch, a readable list alternative (the mobile default), persistent work details, and directional ancestor/descendant highlighting. A side sheet opens full details with keyboard focus management. Direct predecessor/successor links are distinguished from the transitive lineage. Connections describe thematic research trajectories, not bibliographic citations. The new VBC-Bench project has no invented edges. Each map node joins to a work using its stable ID.

- `data/profile.json`: publications, projects, biography paragraphs, themes, news, education, industry experience, mentoring, teaching, service, awards, and verified profile links.
- `data/research-map.json`: short labels, contribution categories, tags, and directed relationships.
- `data/scholar.json`: last successful citation snapshot, date, author identity, and source.
- `app/page.tsx`: page structure and introductory text.
- `app/globals.css`: responsive visual design.

The source CV is not copied into the repository or offered as a public download. Its content was used as reference; publication titles already represented by full bibliographic records were generally preserved where the CV used abbreviated titles. Current CV updates include availability in December 2026, the reasoning project, industry experience, awards, and verified social links.

## Monthly Scholar synchronization

Author: `MgxFi7QAAAAJ`. The workflow runs at 09:17 UTC on the first of each month and can also be run manually. It reads the public Google Scholar profile directly by default, without an API key or paid service. A verified snapshot on 2026-09-18 UTC contained 1,203 citations, h-index 15, and i10-index 19. `data/scholar.json` is the single source of truth for displayed metrics.

The public-page parser checks the canonical author ID, the profile marker, named metric rows, numeric values, and consistency. It uses the All column, not the recent-citation column. It rejects challenge pages, incomplete results, and citation drops greater than 20%. A successful response is atomically persisted with its timestamp and source; failures preserve the last verified values and date. No proxy rotation, CAPTCHA bypass, or repeated retries are performed. Public access may be limited from GitHub runners; failures are reported in the workflow log.

If desired, an existing SerpApi account can be used by adding the optional repository Actions secret `SERPAPI_API_KEY`. This selects its Google Scholar Author API instead. Never place a credential in source or client code. No key is needed for the default public-profile method.

A successful monthly refresh commits the snapshot and rebuilds the site. Branch protection must permit the Actions bot to commit this file, otherwise an approved alternative workflow is required. The website displays the last successful verification date in UTC. Scholar itself can change between monthly checks.

## CV updates

This version was updated from the supplied September 2026 PDF. It does not watch files on the user's computer. Update the structured profile data and research-map records when the CV changes; pushes trigger a new website build. Automatic PDF-to-profile extraction still requires an agreed CV storage location and a review process for changed research claims.

## Develop and verify

Use Node.js 22.13 or later. Run `npm ci`, `npm run dev`, `npx tsc --noEmit`, `node --experimental-strip-types --test tests/*.test.mjs`, and `npm run build`. Static output is `dist/client/`.

## GitHub hosting

The existing `KindOPSTAR/KindOPSTAR.github.io` repository contains a prior WordPress export. Keep that content intact. Place this application's source under `website-source/` and copy `.github/workflows/pages.yml` to the repository root. The workflow intentionally uses `website-source` as its working directory. On pull requests, it validates only; after merge to main it can publish with GitHub Pages once Settings → Pages → Source is changed to GitHub Actions.

The initial public URL is https://kindopstar.github.io/. Existing exported pages remain in Git history/source but are not included in this new deployment; decide which legacy URLs need redirects before switching the custom domain. After reviewing the new site and mapping any required old URLs, set `he-zhang.com` as the GitHub Pages custom domain and configure DNS using GitHub's current guidance. Preserve email-related DNS. Domain registration remains at GoDaddy; do not cancel it. Back up WordPress before cancelling its hosting.

Cloudflare Pages can also host the same static output. The private Sites preview is a separate deployment for review.
