/*
 * Buy page settings. Both values are public (safe to commit).
 *
 * LIVE (now): the production licence server and the PayPal LIVE client id (app "ZCX Licence Server"
 *             at developer.paypal.com > Apps & Credentials > Live). Real money.
 * TEST MODE:  licenceApi = 'https://zcx-licence-sandbox.zenith-tryon.workers.dev' and the sandbox
 *             client id 'BAAu-VJVSKx1AV_ATT7nOKgGvyK1G9q4OnQ4XnAtbXTd5QJ-jk65MjU9MHz1a6Qp4bnes4LqYBBWifOdQ0'.
 *
 * While either value still starts with PASTE_, the page shows "WhatsApp us to buy" instead of
 * the PayPal button.
 */
window.ZCX_BUY_CONFIG = {
  licenceApi: 'https://licence.zenitherps.com', // live licence server
  paypalClientId: 'BAAwU8smglGA3QHwvsVNGEL22emfsYvouZrg9II3LBH7xbcUwkEEEKOfkhS-Z83yqteCLMl8nEp89W3W8I', // live app "ZCX Licence Server"
};
