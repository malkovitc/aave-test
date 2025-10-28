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
 * @param error - Transaction error if any
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
 *   depositFlow.error,
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
	error: Error | null,
	messages: ToastMessages,
	toastId: string
) {
	const hasShownSuccess = useRef(false);
	const hasShownError = useRef(false);
	const currentHash = useRef<string>();

	// Reset flags when transaction hash changes (new transaction started)
	useEffect(() => {
		if (hash && hash !== currentHash.current) {
			// New transaction started - reset all flags
			currentHash.current = hash;
			hasShownSuccess.current = false;
			hasShownError.current = false;
		}
		// Also clear currentHash when hash becomes undefined (transaction cleared)
		if (!hash && currentHash.current) {
			currentHash.current = undefined;
			// Also reset error flag when hash clears to prevent showing old errors
			hasShownError.current = false;
		}
	}, [hash]);

	// Show appropriate toast based on transaction state
	useEffect(() => {
		// No transaction in progress
		if (!hash) return;

		// Only show toasts for the current transaction hash
		// This prevents showing old errors when a new transaction starts
		if (hash !== currentHash.current) return;

		// Pending state - transaction is being mined
		if (isPending && !isSuccess && !error) {
			toast.loading(messages.pending, { id: toastId });
			return;
		}

		// Success state - show once per transaction globally
		// Use global registry to prevent duplicate toasts across multiple hook instances
		if (isSuccess && !hasShownSuccess.current && !globalSuccessHashRegistry.has(hash)) {
			toast.success(messages.success, { id: toastId });
			hasShownSuccess.current = true;
			globalSuccessHashRegistry.add(hash);
			return;
		}

		// Error state - show once per transaction
		if (error && !hasShownError.current) {
			toast.error(messages.error, { id: toastId });
			hasShownError.current = true;
		}
	}, [hash, isPending, isSuccess, error, messages, toastId]);
}
