import { useState, useCallback, useEffect } from 'react';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useWithdraw } from './use-withdraw';
import { useDepositContext } from '../context/DepositContext';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
import { useRefetchOnSuccess } from './use-refetch-on-success';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';

export function useWithdrawFlow(token: TokenConfig, balance: string, aTokenAddress?: Address) {
	const [amount, setAmount] = useState('');
	const [isMaxWithdraw, setIsMaxWithdraw] = useState(false);
	const queryClient = useQueryClient();
	const { startWithdrawing, completeTransaction } = useDepositContext();
	const { refetch: refetchUserTokens } = useUserTokensContext();

	const withdraw = useWithdraw(token);

	const isValidAmount = useAmountValidation(amount, balance, token.decimals);

	const handleWithdraw = useCallback(async () => {
		if (!amount || !isValidAmount) return;
		await withdraw.withdraw(amount, isMaxWithdraw);
	}, [amount, withdraw, isValidAmount, isMaxWithdraw]);

	const handleMaxClick = useCallback(() => {
		setIsMaxWithdraw(true);
	}, []);

	const clearForm = useCallback(() => {
		setAmount('');
		setIsMaxWithdraw(false);
	}, []);

	const invalidateQueries = useCallback(() => {
		queryClient.invalidateQueries({ queryKey: ['token-balances'] });
		queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
		queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
	}, [queryClient]);

	useRefetchOnSuccess(withdraw.isSuccess, [
		clearForm,
		invalidateQueries,
		refetchUserTokens,
	]);

	useEffect(() => {
		if (amount && !isMaxWithdraw) {
			setIsMaxWithdraw(false);
		}
	}, [amount, isMaxWithdraw]);

	useEffect(() => {
		if (withdraw.isPending) {
			startWithdrawing(token.symbol);
		} else {
			completeTransaction();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [withdraw.isPending, token.symbol]);

	return {
		amount,
		setAmount,
		balance,
		aTokenAddress,
		isValidAmount,
		handleWithdraw,
		handleMaxClick,
		setIsMaxWithdraw,
		isWithdrawing: withdraw.isPending,
		withdrawTxHash: withdraw.hash,
		isLoading: withdraw.isPending,
		isWithdrawSuccess: withdraw.isSuccess,
	};
}
