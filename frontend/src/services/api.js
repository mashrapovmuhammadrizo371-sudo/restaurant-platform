import { createHttpClient } from './httpClient';

// Customer-facing API client — attaches the customer's own token
// ('customerToken'). Used by the customer app (menu, cart, orders, profile).
const api = createHttpClient('customerToken');

export default api;
