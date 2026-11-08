# zenitherps.com

The marketing website for Zenith ERP, jewellery shop software made in India. One page, plain
HTML + CSS + JS, no build step. Hosted on GitHub Pages at **https://zenitherps.com**.

## Files

| File | What it is |
|---|---|
| `index.html` | The page. All copy lives here. |
| `styles.css` | Every style, read from the Claude Design handoff (v2). |
| `site.js` | Header shadow on scroll, scroll reveals, the call-back form, Google Analytics. |
| `assets/` | Logo mark (SVG + PNG) and the hero screenshot. |
| `CNAME` | The custom domain for GitHub Pages. Do not delete. |

## Editing

- **Phone number**: search for `918446297369` in `index.html` and `site.js` and replace every
  occurrence; the displayed `+91 84462 97369` in `index.html` too.
- **Email / city / year**: in `index.html`, contact section and footer.
- **Copy**: edit `index.html`. The CTAs are only ever "Call Now", "WhatsApp Us",
  "Request a Call Back". No em dashes.

## The call-back form

`site.js` has one constant, `WEB3FORMS_KEY`.

- Empty: submitting the form opens WhatsApp on 8446297369 with the name, shop,
  phone and city typed into the message, and the visitor presses Send.
- Set (as it is now): the form posts to Web3Forms and the request lands in **info@zenitherps.com**.

To switch it on: go to <https://web3forms.com>, enter `info@zenitherps.com`, copy the access key
from the confirmation email, paste it between the quotes of `WEB3FORMS_KEY`, commit, push.

## Analytics (Google Analytics 4)

`site.js` has one constant, `GA_MEASUREMENT_ID`. While it is empty nothing is loaded and nothing
is tracked.

To switch it on: go to <https://analytics.google.com>, create a property for zenitherps.com with a
**Web** data stream, copy the Measurement ID (looks like `G-XXXXXXXXXX`), paste it between the
quotes of `GA_MEASUREMENT_ID`, commit, push.

Besides page views, the site reports these events (Reports › Engagement › Events):

| Event | When | Detail |
|---|---|---|
| `call_click` | A Call Now button or phone number is tapped | `place`: `top`, `features`, `contact`, `footer`, `mobile_bar` |
| `whatsapp_click` | A WhatsApp Us button is tapped | `place`: as above |
| `email_click` | The email address is tapped | `place` |
| `callback_sent` | The call-back form went through | `method`: `email` or `whatsapp` |
| `callback_error` | The call-back form failed to send | |
| `section_view` | A section scrolls into view, once per visit | `section`: `top`, `features`, `local`, `accountant`, `why`, `contact` |

To see `place`, `method` and `section` as columns in reports, register them once as custom
dimensions: Admin › Custom definitions › Create custom dimension, scope Event, one each. No cookie
banner is used; GA4 does not store IP addresses.

## Publishing

Every push to `main` republishes the site within a minute or two (GitHub Pages, source: `main`,
root). Nothing to build.

### DNS at GoDaddy (one time)

In GoDaddy › My Products › zenitherps.com › DNS, remove the parked `A` record and any forwarding,
then add:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | @ | 185.199.108.153 | 600 |
| A | @ | 185.199.109.153 | 600 |
| A | @ | 185.199.110.153 | 600 |
| A | @ | 185.199.111.153 | 600 |
| CNAME | www | soql101.github.io | 600 |

Then in the GitHub repo › Settings › Pages, the custom domain `zenitherps.com` shows a green
tick once DNS has propagated (minutes to an hour), and *Enforce HTTPS* can be ticked.
