import { useEffect, useRef } from 'react';
import { transactionManager, type TransactionType } from '../utils/transaction-manager';

/**
 * Wagmi transaction state
 */
export interface WagmiState {
	hash: string | undefined;
	isPending: boolean;
	isSuccess: boolean;
	error: Error | null | undefined;
}

/**
 * Detected state changes between renders
 */
interface StateChanges {
	hashChanged: boolean;
	transactionStarted: boolean;
	successOccurred: boolean;
	errorOccurred: boolean;
	transactionCleared: boolean;
}

/**
 * Reusable hook to sync Wagmi transaction state to TransactionManager
 *
 * This hook bridges Wagmi's global state to our centralized TransactionManager,
 * ensuring correct toast notifications and UI state across token switches.
 *
 * @param tokenSymbol - Token symbol (e.g., "USDC", "LINK")
 * @param type - Transaction type ("deposit" | "withdraw" | "approve")
 * @param wagmiState - Current Wagmi transaction state
 *
 * @example
 * ```tsx
 * useWagmiTransactionSync(token.symbol, 'deposit', {
 *   hash: deposit.hash,
 *   isPending: deposit.isPending,
 *   isSuccess: deposit.isSuccess,
 *   error: deposit.error,
 * });
 * ```
 */
export function useWagmiTransactionSync(
	tokenSymbol: string,
	type: TransactionType,
	wagmiState: WagmiState
) {
	const { hash, isPending, isSuccess, error } = wagmiState;

	const prevState = useRef<WagmiState>({
		hash: undefined,
		isPending: false,
		isSuccess: false,
		error: null,
	});

	useEffect(() => {
		const prev = prevState.current;
		const changes = detectStateChanges(wagmiState, prev);

		handleTransactionLifecycle(tokenSymbol, type, wagmiState, changes);

		prevState.current = { hash, isPending, isSuccess, error };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hash, isPending, isSuccess, error, tokenSymbol, type]);
}

/**
 * Detect what changed between renders
 */
function detectStateChanges(current: WagmiState, previous: WagmiState): StateChanges {
	return {
		hashChanged: current.hash !== previous.hash,
		transactionStarted: current.isPending && !previous.isPending && !current.hash,
		successOccurred: current.isSuccess && !previous.isSuccess,
		errorOccurred: !!current.error && !previous.error,
		transactionCleared: !current.hash && !!previous.hash,
	};
}

/**
 * Handle transaction lifecycle events
 */
function handleTransactionLifecycle(
	tokenSymbol: string,
	type: TransactionType,
	current: WagmiState,
	changes: StateChanges
): void {
	if (changes.transactionStarted) {
		transactionManager.startTransaction(tokenSymbol, type, null);
		return;
	}

	if (changes.transactionCleared) {
		transactionManager.clearTransaction(tokenSymbol, type);
		return;
	}

	if (!current.hash) return;

	if (changes.hashChanged) {
		handleHashChange(tokenSymbol, type, current.hash);
	}

	if (changes.successOccurred) {
		transactionManager.markSuccessSeen(current.hash);
		transactionManager.updateStatus(tokenSymbol, type, 'success');
	}

	if (changes.errorOccurred && current.error) {
		transactionManager.updateStatus(tokenSymbol, type, 'error', current.error);
	}
}

/**
 * Handle hash appearance or change
 */
function handleHashChange(tokenSymbol: string, type: TransactionType, newHash: string): void {
	const existingTx = transactionManager.getTransaction(tokenSymbol, type);

	if (!existingTx) {
		transactionManager.startTransaction(tokenSymbol, type, newHash);
		return;
	}

	if (!existingTx.hash) {
		transactionManager.updateHash(tokenSymbol, type, newHash);
		return;
	}

	if (existingTx.hash !== newHash) {
		transactionManager.startTransaction(tokenSymbol, type, newHash);
	}
}
