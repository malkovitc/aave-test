/**
 * Batch processing constants
 *
 * Centralized batch size values for parallel request processing
 *
 * @module constants/batch
 */

/**
 * Default batch size for token data fetching
 * Prevents overwhelming RPC with too many parallel requests
 */
export const TOKEN_FETCH_BATCH_SIZE = 5;
