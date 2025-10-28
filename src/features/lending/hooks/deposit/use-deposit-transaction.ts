import { useCallback, useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDepositMethod } from '../use-deposit-method';
import { useRefetchOnSuccess } from '../use-refetch-on-success';

export function useDepositTransaction(token: TokenConfig, clearAmount: () => void) {
	const depositMethod = useDepositMethod(token);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['token-balances'] });
	}, [queryClient]);

	const refetchCallbacks = useMemo(
		() => [clearAmount, invalidateQueries],
		[clearAmount, invalidateQueries]
	);

	useRefetchOnSuccess(depositMethod.isSuccess, refetchCallbacks);

	// Refetch user-tokens after deposit success with delay to avoid table flicker
	// Longer delay (1500ms) ensures aToken data is fully loaded before token list updates
	useEffect(() => {
		if (depositMethod.isSuccess) {
			setTimeout(() => {
				queryClient.refetchQueries({ queryKey: ['user-tokens'] });
			}, 1500);
		}
	}, [depositMethod.isSuccess, queryClient]);

	const handleDeposit = useCallback(async (amount: string) => {
		if (!amount) return;

		try {
			setLocalError(null);
			setIsSubmitting(true);
			await depositMethod.deposit(amount);
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Deposit failed');
			setLocalError(error);
			setIsSubmitting(false);
			throw error;
		}
	}, [depositMethod]);

	useEffect(() => {
		const shouldClearSubmitting =
			depositMethod.hash ||
			depositMethod.isSuccess ||
			depositMethod.error ||
			localError;

		if (shouldClearSubmitting) {
			setIsSubmitting(false);
		}
	}, [depositMethod.hash, depositMethod.isSuccess, depositMethod.error, localError]);

	const retry = useCallback(() => {
		setLocalError(null);
	}, []);

	return {
		handleDeposit,
		retry,
		isDepositing: isSubmitting || depositMethod.isPending,
		isDepositSuccess: depositMethod.isSuccess,
		depositTxHash: depositMethod.hash,
		error: localError,
		hasError: !!localError || depositMethod.hasValidError,
		hasRawError: !!localError || !!depositMethod.error,
		usesPermit: depositMethod.usesPermit,
	};
}
