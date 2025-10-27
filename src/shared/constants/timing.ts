/**
 * Timing constants
 *
 * Centralized timing values to avoid magic numbers throughout the codebase
 *
 * @module constants/timing
 */

/**
 * Debounce delay for user input (ms)
 * Used for amount inputs to reduce validation calls
 */
export const DEBOUNCE_DELAY_MS = 300;

/**
 * Transaction monitoring timeout (ms)
 * Time to wait before manually checking transaction receipt
 */
export const TX_MONITOR_TIMEOUT_MS = 10000;

/**
 * Scroll animation delay (ms)
 * Time to wait before scrolling to form after token selection
 */
export const SCROLL_ANIMATION_DELAY_MS = 100;

/**
 * Scroll + focus delay (ms)
 * Time to wait for scroll animation to complete before focusing input
 * Calculation: 100ms scroll delay + 300ms animation = 400ms total
 */
export const SCROLL_WITH_FOCUS_DELAY_MS = 400;

/**
 * Permit signature deadline (seconds)
 * Duration for which a permit signature remains valid
 * 20 minutes = 1200 seconds
 */
export const PERMIT_DEADLINE_SECONDS = 1200;

/**
 * Balance refetch interval (ms)
 * How often to automatically refetch token balances
 * 30 seconds = 30000 milliseconds
 */
export const BALANCE_REFETCH_INTERVAL_MS = 30000;
