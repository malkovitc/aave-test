import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface ToastMessages {
	pending: string;
	success: string;
	error: string;
}

/**
 * Transaction state for toast tracking
 */
interface TransactionState {
	currentHash: string | undefined;
	hasShownSuccess: boolean;
	hasShownError: boolean;
	previousIsError: boolean;
}

/**
 * Global registry with automatic cleanup to prevent memory leaks
 * Tracks shown success toasts to prevent duplicates across hook instances
 */
class SuccessHashRegistry {
	private hashes = new Set<string>();
	private readonly MAX_SIZE = 100;

	has(hash: string): boolean {
		return this.hashes.has(hash);
	}

	add(hash: string): void {
		// Automatic cleanup if registry grows too large (FIFO)
		if (this.hashes.size >= this.MAX_SIZE) {
			const firstHash = this.hashes.values().next().value;
			if (firstHash) {
				this.hashes.delete(firstHash);
			}
		}
		this.hashes.add(hash);
	}

	clear(): void {
		this.hashes.clear();
	}
}

const globalSuccessRegistry = new SuccessHashRegistry();

/**
 * Generic hook to show toast notifications for any transaction
 *
 * Features:
 * - Automatic toast lifecycle management (pending → success/error)
 * - Prevents duplicate toasts across multiple hook instances
 * - Memory-safe with automatic cleanup
 * - Handles hash changes and state transitions correctly
 *
 * @param hash - Transaction hash from wagmi
 * @param isPending - Transaction is pending (confirming on chain)
 * @param isSuccess - Transaction completed successfully
 * @param isError - Transaction failed
 * @param messages - Custom messages for each state
 * @param toastId - Unique toast ID (e.g., `deposit-${token.symbol}`)
 *
 * @example
 * ```tsx
 * useTransactionToast(
 *   depositFlow.hash,
 *   depositFlow.isPending,
 *   depositFlow.isSuccess,
 *   depositFlow.isError,
 *   {
 *     pending: 'Confirming deposit...',
 *     success: 'Deposited USDC successfully!',
 *     error: 'Deposit failed'
 *   },
 *   `deposit-${token.symbol}`
 * );
 * ```
 */
export function useTransactionToast(
	hash: string | undefined,
	isPending: boolean,
	isSuccess: boolean,
	isError: boolean,
	messages: ToastMessages,
	toastId: string
) {
	const state = useRef<TransactionState>({
		currentHash: undefined,
		hasShownSuccess: false,
		hasShownError: false,
		previousIsError: false,
	});

	useEffect(() => {
		const s = state.current;

		// Handle hash changes (new transaction or cleared transaction)
		if (hash !== s.currentHash) {
			resetState(state.current, hash);
			if (!hash) return; // Transaction cleared, nothing to do
		}

		// No transaction in progress
		if (!hash) return;

		// Show pending toast
		if (shouldShowPending(isPending, isSuccess)) {
			toast.loading(messages.pending, { id: toastId });
			s.previousIsError = isError;
			return;
		}

		// Show success toast
		if (shouldShowSuccess(hash, isSuccess, s.hasShownSuccess)) {
			toast.success(messages.success, { id: toastId });
			s.hasShownSuccess = true;
			globalSuccessRegistry.add(hash);
			s.previousIsError = isError;
			return;
		}

		// Show error toast
		if (shouldShowError(isError, s.previousIsError, s.hasShownError, isPending, isSuccess)) {
			toast.error(messages.error, { id: toastId });
			s.hasShownError = true;
		}

		// Update previous error state
		s.previousIsError = isError;
	}, [hash, isPending, isSuccess, isError, toastId, messages.pending, messages.success, messages.error]);
}

/**
 * Reset transaction state for new transaction
 */
function resetState(state: TransactionState, newHash: string | undefined): void {
	state.currentHash = newHash;
	state.hasShownSuccess = false;
	state.hasShownError = false;
	state.previousIsError = false;
}

/**
 * Check if should show pending toast
 */
function shouldShowPending(isPending: boolean, isSuccess: boolean): boolean {
	return isPending && !isSuccess;
}

/**
 * Check if should show success toast
 */
function shouldShowSuccess(
	hash: string,
	isSuccess: boolean,
	hasShownSuccess: boolean
): boolean {
	return isSuccess && !hasShownSuccess && !globalSuccessRegistry.has(hash);
}

/**
 * Check if should show error toast
 * Only shows for NEW errors (not stale ones)
 */
function shouldShowError(
	isError: boolean,
	previousIsError: boolean,
	hasShownError: boolean,
	isPending: boolean,
	isSuccess: boolean
): boolean {
	const isNewError = isError && !previousIsError;
	return isNewError && !hasShownError && !isPending && !isSuccess;
}
