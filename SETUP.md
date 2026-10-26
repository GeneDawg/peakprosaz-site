# Arizona site setup (Peak 301 Pros AZ)

Cloned from the Georgia site and made specific to Arizona. Jobs are tracked inside this site (Netlify Blobs), not in a CRM.
When the new operator CRM is ready, jobs can be exported from here and the dashboard pointed at it.

## Before the partner login and job form work
Set these in Netlify (Site configuration > Environment variables). They are secrets and are never stored in this repo:

- PORTAL_SESSION_SECRET: a long random string
- PORTAL_ADMIN_CODE: the Peak 301 Pros admin access code (sees every contractor and can update jobs)
- PORTAL_ACCOUNTS: the contractor list, as a JSON list of {key,name,prefix,contact,code}. Optional per contractor: emailDomains, contactNames (used to match jobs sent without signing in)
- PORTAL_APPLICATOR_NAME (optional): name printed on warranty letters (default: Peak 301 Pros Arizona)

## How it works
- A signed-in contractor submits a job on /login.html. It appears on their dashboard (/partners/) as "Awaiting service".
- Admin signs in with the admin code, sees all contractors, and uses "Update job" to set the fulfillment date, invoice and payment. The warranty unlocks for the contractor when the amount paid equals the invoice amount.
- A job sent without a valid sign-in is saved as "Needs review" for admin to assign.

## Pricing
Partner pricing is not published on any public page. Share the partner rate sheet with approved partners only.

## Open items
- Confirm the contact email and phone shown on the page (info@peakprosusa.com).
- Existing partners need new access codes in PORTAL_ACCOUNTS before this goes live.
