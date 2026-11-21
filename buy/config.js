/*
 * Buy page settings. Both values are public (safe to commit).
 *
 * TEST MODE (now): the sandbox licence server and the PayPal SANDBOX client id. No real money.
 * LIVE: licenceApi = 'https://licence.zenitherps.com' and the LIVE client id from
 *       developer.paypal.com > Apps & Credentials > Live.
 *
 * While either value still starts with PASTE_, the page shows "WhatsApp us to buy" instead of
 * the PayPal button.
 */
window.ZCX_BUY_CONFIG = {
  licenceApi: 'PASTE_SANDBOX_SERVER_URL', // e.g. https://zcx-licence-sandbox.<your-subdomain>.workers.dev
  paypalClientId: 'PASTE_PAYPAL_SANDBOX_CLIENT_ID',
};
