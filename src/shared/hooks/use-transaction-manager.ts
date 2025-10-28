import { useMemo, useSyncExternalStore } from 'react';
import { transactionManager, type TransactionType, type Transaction } from '../utils/transaction-manager';

/**
 * Return type for useTransactionManager hook
 * Provides convenient access to transaction state
 */
export interface TransactionState {
	/** Full transaction object (null if no transaction) */
	transaction: Transaction | null;
	/** Transaction hash (undefined if no transaction) */
	hash: string | undefined;
	/** Is transaction pending */
	isPending: boolean;
	/** Is transaction successful */
	isSuccess: boolean;
	/** Is transaction failed */
	isError: boolean;
	/** Error object if transaction failed */
	error: Error | undefined;
}

/**
 * React hook to access transaction state from TransactionManager
 *
 * Uses useSyncExternalStore for optimal performance and automatic re-renders
 * when transaction state changes. Returns a memoized object to prevent
 * unnecessary re-renders in consuming components.
 *
 * @param tokenSymbol - Token symbol (e.g., "USDC", "LINK")
 * @param type - Transaction type ("deposit" | "withdraw" | "approve")
 * @returns Memoized transaction state
 *
 * @example
 * ```tsx
 * const { isPending, isSuccess, hash, error } = useTransactionManager(
 *   token.symbol,
 *   'deposit'
 * );
 * ```
 */
export function useTransactionManager(
	tokenSymbol: string,
	type: TransactionType
): TransactionState {
	// Subscribe to transaction manager changes
	useSyncExternalStore(
		transactionManager.subscribe,
		transactionManager.getSnapshot,
		transactionManager.getSnapshot
	);

	// Get transaction for this token+type
	const transaction = transactionManager.getTransaction(tokenSymbol, type);

	return useMemo(
		() => deriveTransactionState(transaction),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[transaction, transaction?.status, transaction?.error, transaction?.hash]
	);
}

/**
 * Derive transaction state from transaction object
 * Pure function for easy testing
 */
function deriveTransactionState(transaction: Transaction | null): TransactionState {
	if (!transaction) {
		return {
			transaction: null,
			hash: undefined,
			isPending: false,
			isSuccess: false,
			isError: false,
			error: undefined,
		};
	}

	return {
		transaction,
		hash: transaction.hash ?? undefined,
		isPending: transaction.status === 'pending',
		isSuccess: transaction.status === 'success',
		isError: transaction.status === 'error',
		error: transaction.error,
	};
}
