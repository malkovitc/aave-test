import { useCallback, useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDepositMethod } from '../use-deposit-method';
import { useRefetchOnSuccess } from '../use-refetch-on-success';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';

export function useDepositTransaction(token: TokenConfig, clearAmount: () => void) {
	const depositMethod = useDepositMethod(token);
	const [localError, setLocalError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const queryClient = useQueryClient();
	const { refetch: refetchUserTokens } = useUserTokensContext();

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['token-balances'] });
		queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
		queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
	}, [queryClient]);

	const refetchCallbacks = useMemo(
		() => [clearAmount, invalidateQueries, refetchUserTokens],
		[clearAmount, invalidateQueries, refetchUserTokens]
	);

	useRefetchOnSuccess(depositMethod.isSuccess, refetchCallbacks);

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
