import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDepositMethod } from '../use-deposit-method';
import { useRefetchOnSuccess } from '../use-refetch-on-success';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';

export function useDepositTransaction(token: TokenConfig, clearAmount: () => void) {
	const depositMethod = useDepositMethod(token);
	const [localError, setLocalError] = useState<Error | null>(null);
	const queryClient = useQueryClient();
	const { refetch: refetchUserTokens } = useUserTokensContext();

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['token-balances'] });
		queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
		queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
	}, [queryClient]);

	useRefetchOnSuccess(depositMethod.isSuccess, [
		clearAmount,
		invalidateQueries,
		refetchUserTokens,
	]);

	const handleDeposit = useCallback(async (amount: string) => {
		if (!amount) return;

		try {
			setLocalError(null);
			await depositMethod.deposit(amount);
		} catch (err) {
			const error = err instanceof Error ? err : new Error('Deposit failed');
			setLocalError(error);
			throw error;
		}
	}, [depositMethod]);

	const retry = useCallback(() => {
		setLocalError(null);
	}, []);

	return {
		handleDeposit,
		retry,
		isDepositing: depositMethod.isPending,
		isDepositSuccess: depositMethod.isSuccess,
		depositTxHash: depositMethod.hash,
		error: localError,
		hasError: !!localError,
		usesPermit: depositMethod.usesPermit,
	};
}
