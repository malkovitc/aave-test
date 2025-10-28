import { useState, useCallback, useEffect } from 'react';
import { type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useWithdraw } from './use-withdraw';
import { useDepositContext } from '../context/DepositContext';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
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
		if (withdraw.isSuccess) {
			// Clear form
			setAmount('');
			setIsMaxWithdraw(false);

			// Invalidate queries
			queryClient.invalidateQueries({ queryKey: ['token-balances'] });
			queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
			queryClient.invalidateQueries({ queryKey: ['user-tokens'] });

			// Refetch user tokens
			refetchUserTokens();

			// Refetch balances if available
			if (refetchBalances) {
				refetchBalances();
			}

			// Complete transaction after refetch to prevent double flicker
			completeTransaction();
		}
	}, [withdraw.isSuccess, refetchBalances, completeTransaction, queryClient, refetchUserTokens]);

	// Validate amount using the shared validation hook
	const isAmountValid = useAmountValidation(amount, balance, token.decimals);

	// For max withdraw, amount is always valid because we use maxUint256 in the contract call
	// For normal withdraw, validate that amount <= balance
	const isValidAmount = isMaxWithdraw ? amount !== '' : isAmountValid;

	const handleWithdraw = useCallback(async () => {
		if (!amount || !isValidAmount) return;
		await withdraw.withdraw(amount, isMaxWithdraw);
	}, [amount, withdraw, isValidAmount, isMaxWithdraw]);


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
