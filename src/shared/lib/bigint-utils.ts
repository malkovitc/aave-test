/**
 * BigInt utilities for safe token amount handling
 *
 * Why bigint?
 * - Prevents precision loss with 18-decimal tokens
 * - Native support in viem/ethers
 * - Safe arithmetic operations
 *
 * This is a barrel export - re-exports from specialized modules:
 * - bigint/format: Formatting utilities
 * - bigint/parse: Parsing and validation utilities
 * - bigint/math: Math and comparison utilities
 *
 * @module bigint-utils
 */

// Formatting
export { formatTokenAmount } from './bigint/format';

// Parsing & Validation
export { parseTokenAmount, isValidTokenAmount } from './bigint/parse';
