import { createHttpClient } from './httpClient';

// Staff-facing API client — attaches the staff member's own token
// ('staffToken'). Used by the admin panel and every staff role dashboard
// (operator, courier, ofitsiant, cashier).
const staffApi = createHttpClient('staffToken');

export default staffApi;
