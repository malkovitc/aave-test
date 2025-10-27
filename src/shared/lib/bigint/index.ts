/**
 * BigInt utilities - modular exports
 *
 * Import specific categories for better tree-shaking:
 * - import { formatTokenAmount } from '@/shared/lib/bigint/format'
 * - import { parseTokenAmount } from '@/shared/lib/bigint/parse'
 * - import { calculatePercentage } from '@/shared/lib/bigint/math'
 *
 * Or import everything via the barrel export:
 * - import { formatTokenAmount, parseTokenAmount } from '@/shared/lib/bigint-utils'
 */

export * from './format';
export * from './parse';
export * from './math';
