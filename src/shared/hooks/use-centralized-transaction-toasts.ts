import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { transactionManager, type Transaction, type TransactionStatus } from '../utils/transaction-manager';

/**
 * Centralized toast notification manager for all transactions
 *
 * This hook should be called ONCE at the app root level.
 * It listens to TransactionManager and shows toasts for all transactions.
 *
 * Benefits:
 * - Single source of truth for toast logic
 * - No duplicate toasts across components
 * - Automatic cleanup of stale toasts
 * - Token isolation (each token gets its own toast)
 *
 * @example
 * ```tsx
 * // In App.tsx or root component
 * function App() {
 *   useCentralizedTransactionToasts();
 *   return <YourApp />;
 * }
 * ```
 */
export function useCentralizedTransactionToasts() {
	// Track which status (pending/success/error) we've shown for each transaction hash
	const shownStatusByHash = useRef(new Map<string, Set<TransactionStatus>>());

	useEffect(() => {
		const unsubscribe = transactionManager.subscribe(() => {
			const allTransactions = transactionManager.getAllTransactions();

			// Process each transaction
			allTransactions.forEach((tx) => {
				// Only process transactions with hash
				if (!tx.hash) return;

				// Get or create status tracking set
				const statusSet = getOrCreateStatusSet(shownStatusByHash.current, tx.hash);

				// Try to show toast for current status
				tryShowToast(tx, statusSet);
			});

			// Cleanup stale hash tracking
			cleanupStaleHashes(shownStatusByHash.current, allTransactions);
		});

		return unsubscribe;
	}, []);
}

/**
 * Toast configuration for each status type
 */
type ToastConfig = {
	shouldShow: (tx: Transaction) => boolean;
	showToast: (message: string, toastKey: string) => void;
	getMessage: (tx: Transaction) => string;
};

const TOAST_CONFIGS: Record<TransactionStatus, ToastConfig | null> = {
	pending: {
		shouldShow: (tx) => tx.hasSeenPending,
		showToast: (msg, key) => toast.loading(msg, { id: key }),
		getMessage: (tx) => `Confirming ${tx.type}...`,
	},
	success: {
		shouldShow: (tx) => tx.hasSeenSuccess,
		showToast: (msg, key) => toast.success(msg, { id: key }),
		getMessage: (tx) => `${capitalize(tx.type)}ed ${tx.tokenSymbol} successfully!`,
	},
	error: {
		shouldShow: (tx) => tx.hasSeenPending,
		showToast: (msg, key) => toast.error(msg, { id: key }),
		getMessage: (tx) => `${capitalize(tx.type)} failed`,
	},
	idle: null, // No toast for idle state
};

/**
 * Get or create status tracking set for a hash
 */
function getOrCreateStatusSet(
	map: Map<string, Set<TransactionStatus>>,
	hash: string
): Set<TransactionStatus> {
	let statusSet = map.get(hash);
	if (!statusSet) {
		statusSet = new Set<TransactionStatus>();
		map.set(hash, statusSet);
	}
	return statusSet;
}

/**
 * Try to show toast for transaction's current status
 */
function tryShowToast(tx: Transaction, statusSet: Set<TransactionStatus>): void {
	const config = TOAST_CONFIGS[tx.status];

	// No config for this status (e.g., 'idle')
	if (!config) return;

	// Already shown toast for this status
	if (statusSet.has(tx.status)) return;

	// Check if we should show this toast
	if (!config.shouldShow(tx)) return;

	// Show the toast
	const toastKey = makeToastKey(tx);
	const message = config.getMessage(tx);
	config.showToast(message, toastKey);

	// Mark as shown
	statusSet.add(tx.status);
}

/**
 * Remove hash tracking for transactions that no longer exist
 */
function cleanupStaleHashes(
	map: Map<string, Set<TransactionStatus>>,
	currentTransactions: Transaction[]
): void {
	const currentHashes = new Set(
		currentTransactions.filter((tx) => tx.hash).map((tx) => tx.hash!)
	);

	map.forEach((_, hash) => {
		if (!currentHashes.has(hash)) {
			map.delete(hash);
		}
	});
}

/**
 * Make unique toast key for transaction (per token and type)
 */
function makeToastKey(tx: Transaction): string {
	return `${tx.type}-${tx.tokenSymbol}`;
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
