# zenitherps.com

The marketing website for Zenith ERP, jewellery shop software made in India. One page, plain
HTML + CSS + JS, no build step. Hosted on GitHub Pages at **https://zenitherps.com**.

## Files

| File | What it is |
|---|---|
| `index.html` | The page. All copy lives here. |
| `styles.css` | Every style, read from the Claude Design handoff (v2). |
| `site.js` | Header shadow on scroll, scroll reveals, the call-back and download forms. |
| `common.js` | Every page: cookie choice, Google Analytics, error reports. |
| `assets/` | Logo mark (SVG + PNG), the hero screenshot and the free calculator (`zenith-gold-billing-calculator.xlsx`). |
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

## The free download (lead magnet)

The "Free download" section offers the Gold Billing Calculator, an Excel file at
`assets/zenith-gold-billing-calculator.xlsx`. The visitor enters name, mobile and email. The lead
is sent the same way as the call-back form (Web3Forms to **info@zenitherps.com**, or WhatsApp when
`WEB3FORMS_KEY` is empty), and only then does the file download start. Call every lead within a
day; that call is the point of the download.

To change the file, replace the `.xlsx` in `assets/` and keep the same name. GA4 events:
`calculator_sent` and `calculator_error`.

## Analytics, cookie choice and error reports

All in `common.js`, loaded on every page. Nothing is sent from a local copy, only from zenitherps.com.

- **Google Analytics 4** (`GA_MEASUREMENT_ID`): loaded only after the visitor presses Accept. The
  choice is kept in their browser; *Cookie settings* in the footer changes it.
- **Sentry** (`SENTRY_DSN`): error reports, always on, no cookies. Off while the DSN is empty. To
  switch on: Sentry > create a project (platform *Browser JavaScript*, name `website`), skip the
  install steps, *Project settings > Client Keys (DSN)*, paste it, commit, push. Then in Sentry:
  *Security & Privacy > Prevent Storing of IP Addresses* on, *Client Keys > Allowed Domains*
  `zenitherps.com`, and the same email alerts as the licence server.

Never pass an email address, phone number, licence key or form value to `zenith.track` or
`zenith.report`. If you change what is collected, change `privacy/index.html` too.

Besides page views, GA4 gets these events (Reports > Engagement > Events):

| Event | When | Detail |
|---|---|---|
| `call_click`, `whatsapp_click`, `email_click` | A phone, WhatsApp or email link is tapped | `place` |
| `store_click` | A Chrome Web Store link is tapped | `place` |
| `buy_page_click` | A link to a buy page is tapped | `place`, `product` |
| `callback_sent`, `calculator_sent` | A form went through | `method`: `email` or `whatsapp` |
| `callback_error`, `calculator_error` | A form failed to send | |
| `section_view` | A home page section scrolls into view, once per visit | `section` |
| `view_item`, `begin_checkout`, `purchase` | Buy page: prices shown, PayPal order made, key shown | GA4 e-commerce fields |
| `buy_cancel`, `buy_declined`, `buy_pending` | Buy page: closed PayPal, card declined, PayPal is checking | `product` |
| `buy_error` | Buy page: something failed (also sent to Sentry) | `product`, `step` |
| `key_copied` | The copy button was pressed | `product` |

To see `place`, `product`, `step`, `method` and `section` as columns, register each once: Admin >
Custom definitions > Create custom dimension, scope Event.

## Buy pages for the Chrome extensions

`buy/<product>/index.html` (for example https://zenitherps.com/buy/account-switcher/) sells a
Pro licence with PayPal. The extensions' "Upgrade" button opens these pages.

| File | What it is |
|---|---|
| `buy/config.js` | The licence server address and the PayPal Client ID (both public). |
| `buy/buy.js` | Loads prices from the server, shows the PayPal button, shows the key. |
| `buy/buy.css` | Styles on top of `styles.css`. |

Prices are NOT in this repo: they come from the licence server (`ZCX-extensions/licence-server`,
`src/products.ts`). While `buy/config.js` still has `PASTE_` values, the page shows
"WhatsApp us to buy" instead of the PayPal button. Setup steps: the licence server's README.

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
