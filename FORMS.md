# Form handling (Vercel)

The Webflow export's forms originally posted to Webflow's hosted endpoint
(`webflow.com/api/v1/form/…`), which stops working off Webflow hosting. They now
post to a Vercel serverless function instead:

- `api/form.js` — receives every submission, sends a notification email (Resend)
  and forwards the data to the form's Zapier catch-hook.
- `js/site-forms.js` — front-end interceptor loaded on every page with a form;
  reuses the existing Webflow success/error message blocks.

## Forms on the site

| Form (data-name) | Where | Delivery | Fields |
| --- | --- | --- | --- |
| `Contact Us Form` | Footer panel on 10 pages + contact-us.html | Email only | First-Name, Last-Name, Email-Address, Phone-Number, Callback, Message, Marketing |
| `mp-send-form` | write-to-your-mp.html | Zapier (unused) | User-Name, User-Email-Address, MP-Email-Address |
| `spread-word-form` | spread-the-word.html | Zapier (unused) | User-Name, User-Email-Address, Colleague-1…9 |

The two campaign forms are only reachable from the retired campaign homepage
(`home-campaign.html`), so they are effectively unused. Their Zapier support is
kept in the handler but needs no configuration unless the campaign launches.

## Environment variables (set in Vercel → Project → Settings → Environment Variables)

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | API key from resend.com (verify your sending domain there first) |
| `FORM_FROM` | Sender, e.g. `Website <forms@schoolimprovementsolutions.co.uk>` |
| `FORM_TO` | Comma-separated notification recipients |
| `ZAPIER_HOOK_MP_SEND` | Optional — catch-hook URL for the MP form (unused campaign) |
| `ZAPIER_HOOK_SPREAD_WORD` | Optional — catch-hook URL for the spread-the-word form (unused campaign) |

Only the first three are needed for the live site. A form with no delivery
configured returns an error to the visitor.

## If the campaign forms are ever needed

The existing zaps use Webflow's form-submission trigger, which stops firing once
the site leaves Webflow. To revive them:

1. Change each zap's trigger to **Webhooks by Zapier → Catch Hook**.
2. Copy the generated hook URL into the matching env var above.
3. The webhook payload is flat JSON: `form`, `page`, plus every field name from
   the table above — re-map the zap's action steps to these fields.

## Notes

- The handler drops any submission that fills a field named `website`
  (honeypot). Optionally add a visually-hidden `<input name="website">` to the
  forms for spam protection.
- Recipient addresses for the original notifications live in the old Webflow
  project → Site settings → Forms, if you need to check who was on the list.
- `vercel.json` enables `cleanUrls`, so the live site's URL structure
  (`/blog/the-national-send-audit`, `/contact-us`, …) keeps working without
  `.html` suffixes.
