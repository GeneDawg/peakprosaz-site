# Peak Pros AZ

Contractor platform for roof rejuvenation, maintenance, and repair opportunities across Scottsdale, Phoenix, and the greater Arizona market. Arizona counterpart to [peakproshouston-site](https://github.com/GeneDawg/peakproshouston-site) and [peakprosga-site](https://github.com/GeneDawg/peakprosga-site).

Live site: [peakprosaz.com](https://peakprosaz.com)

## Files

- `index.html` — Public landing page (hero, how it works, earnings, partner application)
- `login.html` — Contractor access-code login (sessionStorage-gated)
- `portal.html` — Authenticated assignment-submission form

## Pricing model

- Contractor fulfillment cost: **$85 / square** (paid by partner to Peak Pros AZ)
- Suggested retail to homeowner: **$120–$130 / square** (avg $125)
- Contractor spread: **$40 / square** ($125 − $85)
- Standard 25-square roof: contractor pays $2,125, charges $3,125, keeps **$1,000 gross profit**
- 4–8 jobs/month per active partner = $4,000–$8,000 monthly gross

## Portal authentication

Simple sessionStorage gate (not security — restricts the form, not the URL):

- Access code: `PEAKAZ2026`
- Session key: `ppaz_auth`

## Forms (Netlify Forms)

Two forms, both submitted via Netlify Forms (`data-netlify="true"`) with bot-field honeypot:

| Form name             | Location      | Should notify              |
| --------------------- | ------------- | -------------------------- |
| `partner-application` | `index.html`  | info@peakprosusa.com       |
| `job-assignment`      | `portal.html` | assignment@peakprosusa.com |

**Email notification routing is configured in the Netlify dashboard, not in the HTML.** After connecting this repo to Netlify:

1. Netlify dashboard → **Forms** → select each form
2. **Settings & usage** → **Form notifications** → **Add notification** → **Email notification**
3. Set the recipient email per the table above

## Deploy

Designed for Netlify (Drop or GitHub integration), same workflow as `peakproshouston.com` and `peakprosga.com`. No build step — pure static HTML.

1. Create the Netlify site, connect this repo (or drag-drop the folder)
2. Set the custom domain to `peakprosaz.com` and enable HTTPS
3. Configure the two form notifications in the Netlify dashboard (see above)
