import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useWithdraw } from './use-withdraw';
import { useDepositContext } from '../context/DepositContext';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';
import { useTransactionManager } from '@/shared/hooks/use-transaction-manager';
import { useWagmiTransactionSync } from '@/shared/hooks/use-wagmi-transaction-sync';

export function useWithdrawFlow(token: TokenConfig, balance: string, aTokenAddress?: Address) {
	const [amount, setAmount] = useState('');
	const [isMaxWithdraw, setIsMaxWithdraw] = useState(false);
	const queryClient = useQueryClient();
	const { startWithdrawing, completeTransaction, refetchBalances } = useDepositContext();
	const { refetch: refetchUserTokens } = useUserTokensContext();

	const withdraw = useWithdraw(token);

	const wagmiState = useMemo(
		() => ({
			hash: withdraw.hash,
			isPending: withdraw.isPending,
			isSuccess: withdraw.isSuccess,
			error: withdraw.error,
		}),
		[withdraw.hash, withdraw.isPending, withdraw.isSuccess, withdraw.error]
	);

	useWagmiTransactionSync(token.symbol, 'withdraw', wagmiState);

	const { isPending, isSuccess } = useTransactionManager(token.symbol, 'withdraw');

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['token-balances'] });
		queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
		queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
	}, [queryClient]);

	useEffect(() => {
		if (isSuccess) {
			setAmount('');
			setIsMaxWithdraw(false);
			invalidateQueries();
			refetchUserTokens();
			refetchBalances?.();
			completeTransaction();
		}
	}, [isSuccess, invalidateQueries, refetchUserTokens, refetchBalances, completeTransaction]);

	const isAmountValid = useAmountValidation(amount, balance, token.decimals);
	const isValidAmount = isMaxWithdraw ? amount !== '' : isAmountValid;

	const handleWithdraw = useCallback(async () => {
		if (!amount || !isValidAmount) return;
		await withdraw.withdraw(amount, isMaxWithdraw);
	}, [amount, withdraw, isValidAmount, isMaxWithdraw]);

	useEffect(() => {
		if (isPending) {
			startWithdrawing(token.symbol);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPending, token.symbol]);

	return {
		amount,
		setAmount,
		balance,
		aTokenAddress,
		isValidAmount,
		handleWithdraw,
		setIsMaxWithdraw,
		isWithdrawing: isPending,
		isLoading: isPending,
		withdrawTxHash: withdraw.hash,
		isWithdrawSuccess: isSuccess,
	};
}
