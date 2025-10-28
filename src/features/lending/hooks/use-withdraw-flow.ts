import { useState, useCallback, useEffect, useMemo } from 'react';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useWithdraw } from './use-withdraw';
import { useDepositContext } from '../context/DepositContext';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
import { useRefetchOnSuccess } from './use-refetch-on-success';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';
import { useTransactionToast } from '@/shared/hooks/use-transaction-toast';

export function useWithdrawFlow(token: TokenConfig, balance: string, aTokenAddress?: Address) {
	const [amount, setAmount] = useState('');
	const [isMaxWithdraw, setIsMaxWithdraw] = useState(false);
	const queryClient = useQueryClient();
	const { startWithdrawing, completeTransaction, refetchBalances } = useDepositContext();
	const { refetch: refetchUserTokens } = useUserTokensContext();

	const withdraw = useWithdraw(token);

	// Show transaction toast notifications
	// Only show toast when there's an actual transaction (hash exists)
	useTransactionToast(
		withdraw.hash,
		withdraw.isPending,
		withdraw.isSuccess,
		withdraw.error,
		{
			pending: 'Confirming withdrawal...',
			success: `Withdrawn ${token.symbol} successfully!`,
			error: 'Withdrawal failed'
		},
		`withdraw-${token.symbol}`
	);

	// Refetch balances immediately after successful withdrawal
	// Then complete transaction AFTER refetch to prevent flickering
	useEffect(() => {
		if (withdraw.isSuccess && refetchBalances) {
			refetchBalances();
			// Complete transaction after refetch to prevent double flicker
			// The refetch will update the positions, then we clear the context
			completeTransaction();
		}
	}, [withdraw.isSuccess, refetchBalances, completeTransaction]);

	// For max withdraw, amount is always valid because we use maxUint256 in the contract call
	// For normal withdraw, validate that amount <= balance
	const isValidAmount = useMemo(() => {
		if (isMaxWithdraw) return amount !== ''; // Just check amount is not empty
		return useAmountValidation(amount, balance, token.decimals);
	}, [isMaxWithdraw, amount, balance, token.decimals]);

	const handleWithdraw = useCallback(async () => {
		if (!amount || !isValidAmount) return;
		await withdraw.withdraw(amount, isMaxWithdraw);
	}, [amount, withdraw, isValidAmount, isMaxWithdraw]);

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
		}
		// Only start withdrawing, don't complete here
		// Completion happens in the refetch effect above
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [withdraw.isPending, token.symbol]);

	return {
		amount,
		setAmount,
		balance,
		aTokenAddress,
		isValidAmount,
		handleWithdraw,
		setIsMaxWithdraw,
		isWithdrawing: withdraw.isPending,
		withdrawTxHash: withdraw.hash,
		isLoading: withdraw.isPending,
		isWithdrawSuccess: withdraw.isSuccess,
	};
}
