import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

/**
 * Centralized hook for displaying transaction toasts
 *
 * Handles the standard flow:
 * 1. Confirming (transaction sent, mining in progress)
 * 2. Success (transaction mined successfully)
 * 3. Error (transaction failed)
 *
 * @param tokenSymbol - Token symbol for personalized messages
 * @param operationType - Type of operation ("deposit", "withdraw", "approve")
 * @param hash - Transaction hash (if available)
 * @param isConfirming - Whether transaction is being mined
 * @param isSuccess - Whether transaction succeeded
 * @param error - Error object if transaction failed
 */
export function useTransactionToasts(
	tokenSymbol: string,
	operationType: 'deposit' | 'withdraw' | 'approve',
	hash: string | undefined,
	isConfirming: boolean,
	isSuccess: boolean,
	error: Error | null
) {
	const toastId = useMemo(() => `${operationType}-${tokenSymbol}`, [operationType, tokenSymbol]);

	// Effect 1: Show confirming toast
	useEffect(() => {
		if (hash && isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: toastId });
		}
	}, [hash, isConfirming, isSuccess, toastId]);

	// Effect 2: Show success toast
	useEffect(() => {
		if (hash && isSuccess) {
			const messages = {
				deposit: `Deposited ${tokenSymbol} successfully!`,
				withdraw: `Withdrawn ${tokenSymbol} successfully!`,
				approve: 'Token approved successfully!',
			};
			toast.success(messages[operationType], { id: toastId });
		}
	}, [hash, isSuccess, tokenSymbol, operationType, toastId]);

	// Effect 3: Show error toast
	useEffect(() => {
		if (error && !isSuccess) {
			const messages = {
				deposit: 'Deposit failed',
				withdraw: 'Withdrawal failed',
				approve: 'Approval failed',
			};
			toast.error(messages[operationType], { id: toastId });
		}
	}, [error, isSuccess, operationType, toastId]);

	return toastId;
}
