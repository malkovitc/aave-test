import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface ToastMessages {
	pending: string;
	success: string;
	error: string;
}

// Global registry to track which transaction hashes have already shown success toasts
// This prevents duplicate toasts when multiple hook instances exist (e.g., deposit + withdraw flows)
const globalSuccessHashRegistry = new Set<string>();

/**
 * Generic hook to show toast notifications for any transaction
 *
 * This hook should be called in COMPONENTS, not in custom hooks.
 * Each component instance will have its own isolated toast logic,
 * preventing cross-token interference from wagmi's global state.
 *
 * @param hash - Transaction hash from wagmi
 * @param isPending - Transaction is pending (confirming on chain)
 * @param isSuccess - Transaction completed successfully
 * @param isError - Transaction failed (from wagmi's error state)
 * @param messages - Custom messages for each state
 * @param toastId - Unique toast ID (e.g., `deposit-${token.symbol}`)
 *
 * @example
 * ```tsx
 * const depositFlow = useDepositFlow(token, balance);
 *
 * useTransactionToast(
 *   depositFlow.hash,
 *   depositFlow.isPending,
 *   depositFlow.isSuccess,
 *   depositFlow.isError,
 *   {
 *     pending: 'Confirming deposit...',
 *     success: `Deposited ${token.symbol} successfully!`,
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
	const hasShownSuccess = useRef(false);
	const hasShownError = useRef(false);
	const currentHash = useRef<string>();
	const previousIsError = useRef(false); // Track previous error state to detect NEW errors only

	// Reset flags when transaction hash changes (new transaction started)
	useEffect(() => {
		if (hash && hash !== currentHash.current) {
			// New transaction started - reset all flags
			console.log(`[Toast ${toastId}] 🔄 NEW HASH detected: ${hash?.slice(0,8)} (prev: ${currentHash.current?.slice(0,8)})`);
			currentHash.current = hash;
			hasShownSuccess.current = false;
			hasShownError.current = false;
			previousIsError.current = false; // Reset error tracking for new transaction
		}
		// Also clear currentHash when hash becomes undefined (transaction cleared)
		if (!hash && currentHash.current) {
			console.log(`[Toast ${toastId}] 🧹 CLEARING hash (was: ${currentHash.current?.slice(0,8)})`);
			currentHash.current = undefined;
			hasShownSuccess.current = false;
			hasShownError.current = false;
			previousIsError.current = false;
		}
	}, [hash, toastId]);

	// Show appropriate toast based on transaction state
	useEffect(() => {
		// No transaction in progress
		if (!hash) return;

		// Only show toasts for the current transaction hash
		// This prevents showing old errors when a new transaction starts
		if (hash !== currentHash.current) return;

		console.log(`[Toast ${toastId}] hash=${hash?.slice(0,8)}, pending=${isPending}, success=${isSuccess}, error=${isError}, prevError=${previousIsError.current}, hasShownError=${hasShownError.current}`);

		// Pending state - transaction is being mined
		if (isPending && !isSuccess) {
			console.log(`[Toast ${toastId}] Showing pending toast`);
			toast.loading(messages.pending, { id: toastId });
			previousIsError.current = isError; // Update previous error state
			return;
		}

		// Success state - show once per transaction globally
		// Use global registry to prevent duplicate toasts across multiple hook instances
		if (isSuccess && !hasShownSuccess.current && !globalSuccessHashRegistry.has(hash)) {
			console.log(`[Toast ${toastId}] Showing success toast`);
			toast.success(messages.success, { id: toastId });
			hasShownSuccess.current = true;
			globalSuccessHashRegistry.add(hash);
			previousIsError.current = isError; // Update previous error state
			return;
		}

		// Error state - show once per transaction
		// IMPORTANT: Only show error if it's a NEW error (wasn't error before)
		// This prevents showing old/stale errors when new transaction starts
		const isNewError = isError && !previousIsError.current;
		if (isNewError && !hasShownError.current && !isPending && !isSuccess) {
			console.log(`[Toast ${toastId}] Showing error toast (NEW error detected)`);
			toast.error(messages.error, { id: toastId });
			hasShownError.current = true;
		}

		// Always update previous error state at the end
		previousIsError.current = isError;
	}, [hash, isPending, isSuccess, isError, messages, toastId]);
}
