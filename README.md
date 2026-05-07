# Peak Pros Houston

Contractor platform for roof rejuvenation, maintenance, and repair opportunities across the Houston, Texas market. Houston counterpart to [peakprosga-site](https://github.com/GeneDawg/peakprosga-site).

## Files

- `index.html` — Public landing page (hero, how it works, earnings, partner application)
- `login.html` — Contractor access-code login (sessionStorage-gated)
- `portal.html` — Authenticated assignment-submission form

## Authentication

Simple sessionStorage gate (not security — restricts the form, not the URL):

- Access code: `PEAKTX2026`
- Session key: `pptx_auth`

## Form routing

Both the partner application (`index.html`) and the job-assignment form (`portal.html`) post to [formsubmit.co](https://formsubmit.co/) and route to `assignment@peakprosusa.com`. There is no Stripe or payment integration in this site.

## Deploy

Designed for Netlify (Drop or GitHub integration), same workflow as `peakprosga.com`. No build step — pure static HTML.
