/**
 * Payments API - Main Entry Point
 * Re-exports types, core API class, and singleton instance
 */

import { PaymentsApiImpl } from './payments-api-core';
export { PaymentsApiImpl } from './payments-api-core';
export type * from './payments-api-types';

export const paymentsApi = new PaymentsApiImpl();
