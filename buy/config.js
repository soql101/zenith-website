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
  licenceApi: 'https://zcx-licence-sandbox.zenith-tryon.workers.dev', // sandbox licence server
  paypalClientId: 'BAAu-VJVSKx1AV_ATT7nOKgGvyK1G9q4OnQ4XnAtbXTd5QJ-jk65MjU9MHz1a6Qp4bnes4LqYBBWifOdQ0', // sandbox app "ZCX Licence Server"
};
