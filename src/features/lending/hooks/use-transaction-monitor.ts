import { useEffect, useState } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { createPublicClient, http, type Hex } from 'viem';
import { sepolia } from 'viem/chains';
import { TX_MONITOR_TIMEOUT_MS } from '@/shared/constants/timing';

/**
 * Hook to monitor transaction status with manual receipt checking fallback
 *
 * Responsibilities:
 * - Monitor transaction receipt via wagmi
 * - Implement fallback manual receipt check if wagmi gets stuck
 * - Determine final transaction state (success/failed)
 *
 * Wagmi sometimes gets stuck in "confirming" state even after transaction completes.
 * This hook implements a 10-second timeout fallback that manually checks the receipt.
 *
 * @param hash - Transaction hash to monitor
 */
export function useTransactionMonitor(hash: Hex | undefined) {
	const [manualReceiptChecked, setManualReceiptChecked] = useState(false);
	const [manualReceiptError, setManualReceiptError] = useState<Error | null>(null);

	const {
		isLoading: isConfirming,
		isSuccess,
		error: receiptError,
		status: receiptStatus,
	} = useWaitForTransactionReceipt({ hash });

	// Manual receipt check when wagmi gets stuck
	useEffect(() => {
		// Early returns for validation
		if (!hash || !isConfirming || manualReceiptChecked) return;

		let timeoutId: ReturnType<typeof setTimeout>;
		let isCancelled = false;

		const checkReceipt = async () => {
			// Wait before manual check
			await new Promise((resolve) => {
				timeoutId = setTimeout(resolve, TX_MONITOR_TIMEOUT_MS);
			});

			// Guard: Skip if cancelled before async operation
			if (isCancelled || !isConfirming || !hash) return;

			try {
				const publicClient = createPublicClient({
					chain: sepolia,
					transport: http(),
				});

				const receipt = await publicClient.getTransactionReceipt({ hash });

				// Guard: Component may have unmounted during async operation
				if (isCancelled) return;

				// Handle receipt status
				if (receipt.status === 'reverted') {
					setManualReceiptError(new Error('Transaction reverted'));
				}

				// Mark as checked for both success and reverted
				setManualReceiptChecked(true);
			} catch {
				// Silently ignore - transaction may not be mined yet
				// This is expected behavior for fast transactions
			}
		};

		checkReceipt();

		// Cleanup function to prevent memory leaks
		return () => {
			isCancelled = true;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [hash, isConfirming, manualReceiptChecked]);

	// Determine if transaction is complete
	const txError = receiptError || manualReceiptError;
	const isTransactionComplete = Boolean(txError || isSuccess || manualReceiptChecked || (hash && !isConfirming));

	return {
		isConfirming: isTransactionComplete ? false : isConfirming,
		isSuccess,
		receiptError,
		receiptStatus,
		manualReceiptError,
		manualReceiptChecked,
		txError,
	};
}
