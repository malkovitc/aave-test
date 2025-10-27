import { useState, useCallback, useEffect, useMemo } from 'react';
import { parseUnits, type Address } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useWithdraw } from './use-withdraw';
import { useTokenBalances } from '@/features/tokens/hooks/use-token-balances';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useDepositContext } from '../context/DepositContext';

/**
 * Hook for withdraw form flow
 * Manages amount state, validation, and withdraw execution
 *
 * @param token - Token configuration
 * @param balance - Available aToken balance as string
 * @param aTokenAddress - Address of the aToken contract
 * @returns Form state and handlers
 */
export function useWithdrawFlow(token: TokenConfig, balance: string, aTokenAddress?: Address) {
	const [amount, setAmount] = useState('');
	const [isMaxWithdraw, setIsMaxWithdraw] = useState(false);
	const queryClient = useQueryClient();
	const { setIsWithdrawing, setWithdrawingTokenSymbol } = useDepositContext();

	const { refetch: refetchBalances } = useTokenBalances();
	const { refetch: refetchATokens } = useATokenBalances();

	const withdraw = useWithdraw(token);

	const isValidAmount = useMemo(() => {
		if (!amount) return false;
		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			const balanceBigInt = parseUnits(balance || '0', token.decimals);
			return amountBigInt > 0n && amountBigInt <= balanceBigInt;
		} catch {
			return false;
		}
	}, [amount, balance, token.decimals]);

	const handleWithdraw = useCallback(async () => {
		if (!amount) return;
		// Validate amount before withdrawal
		if (!isValidAmount) return;
		await withdraw.withdraw(amount, isMaxWithdraw);
	}, [amount, withdraw, isValidAmount, isMaxWithdraw]);

	const handleMaxClick = useCallback(() => {
		setIsMaxWithdraw(true);
	}, []);

	// Reset form and refetch balances after successful withdrawal
	useEffect(() => {
		if (withdraw.isSuccess) {
			setAmount('');
			setIsMaxWithdraw(false);
			// Refetch token balances and aToken balances from blockchain
			refetchBalances();
			refetchATokens();
			// Invalidate queries for any React Query caches
			queryClient.invalidateQueries({ queryKey: ['token-balances'] });
			queryClient.invalidateQueries({ queryKey: ['atoken-balances'] });
			queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
		}
	}, [withdraw.isSuccess, queryClient, refetchBalances, refetchATokens]);

	// Reset isMaxWithdraw when amount changes (user manually edits)
	useEffect(() => {
		if (amount && !isMaxWithdraw) {
			setIsMaxWithdraw(false);
		}
	}, [amount, isMaxWithdraw]);

	// Sync withdraw pending state to context
	useEffect(() => {
		const isPending = withdraw.isPending;
		setIsWithdrawing(isPending);
		setWithdrawingTokenSymbol(isPending ? token.symbol : null);
	}, [withdraw.isPending, token.symbol, setIsWithdrawing, setWithdrawingTokenSymbol]);

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
