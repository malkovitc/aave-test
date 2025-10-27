import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { parseUnits } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useApprove } from './use-approve';
import { useDepositMethod } from './use-deposit-method';
import { useRefetchOnSuccess } from './use-refetch-on-success';
import { useDepositContextSync } from './use-deposit-context-sync';
import { useTokenAllowances } from '@/features/tokens/hooks/use-token-allowances';
import { useTokenBalances } from '@/features/tokens/hooks/use-token-balances';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';

/**
 * Orchestrates deposit flow: validation → approval (if needed) → deposit → refetch
 *
 * Simplified architecture:
 * - useDepositMethod: Abstracts permit vs traditional deposit
 * - useRefetchOnSuccess: Handles all refetch logic
 * - useDepositContextSync: Syncs state to global context
 *
 * Flow:
 * 1. User enters amount
 * 2. If needs approval: approve → auto-deposit
 * 3. If no approval needed: deposit directly
 * 4. On success: refetch all balances
 */
export function useDepositFlow(token: TokenConfig, balance: string) {
	// State
	const [amount, setAmount] = useState('');
	const hasTriggeredAutoDeposit = useRef(false);
	const previousTokenSymbol = useRef(token.symbol);

	// Data fetching
	const { allowances, poolAddress, refetch: refetchAllowances, isLoading: isAllowancesLoading } = useTokenAllowances();
	const { refetch: refetchBalances } = useTokenBalances();
	const { refetch: refetchATokens } = useATokenBalances();
	const { refetch: refetchUserTokens } = useUserTokensContext();
	const currentAllowance = allowances.find((a) => a.token.symbol === token.symbol);

	// Deposit methods (abstracted)
	const approve = useApprove(token);
	const depositMethod = useDepositMethod(token);

	// Validation
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

	const needsApproval = useMemo(() => {
		// Tokens with permit support don't need approval - they use gasless permit signatures
		if (depositMethod.usesPermit) return false;

		if (!amount) return false;
		if (!poolAddress || isAllowancesLoading) return true;
		if (!currentAllowance) return true;

		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			return (currentAllowance.raw ?? 0n) < amountBigInt;
		} catch {
			return false;
		}
	}, [amount, currentAllowance, poolAddress, depositMethod.usesPermit, isAllowancesLoading, token.decimals]);

	// Actions
	const handleApprove = useCallback(async () => {
		if (!poolAddress || !amount || !isValidAmount) return;
		await approve.approve(poolAddress, amount);
	}, [amount, approve, poolAddress, isValidAmount]);

	const handleDeposit = useCallback(async () => {
		if (!amount || !isValidAmount) return;
		await depositMethod.deposit(amount);
	}, [amount, depositMethod, isValidAmount]);

	const handleMaxClick = useCallback(() => {
		setAmount(balance);
	}, [balance]);

	// Effect 1: Auto-deposit after approval + reset flag
	useEffect(() => {
		if (approve.isSuccess && !hasTriggeredAutoDeposit.current) {
			hasTriggeredAutoDeposit.current = true;
			refetchAllowances();
			handleDeposit();
		}

		// Reset flag when approval is reset (user initiated new flow)
		if (!approve.isSuccess && hasTriggeredAutoDeposit.current) {
			hasTriggeredAutoDeposit.current = false;
		}
	}, [approve.isSuccess, refetchAllowances, handleDeposit]);

	// Effect 2: Refetch all balances after successful deposit
	useRefetchOnSuccess(depositMethod.isSuccess, [
		() => setAmount(''),
		refetchBalances,
		refetchATokens,
		refetchUserTokens,
	]);

	// Effect 3: Reset form when token changes
	useEffect(() => {
		if (previousTokenSymbol.current !== token.symbol) {
			previousTokenSymbol.current = token.symbol;
			setAmount('');
			hasTriggeredAutoDeposit.current = false;
		}
	}, [token.symbol]);

	// Effect 4: Sync state to global context (for UI loaders)
	useDepositContextSync(token.symbol, approve.isPending, depositMethod.isPending);

	return {
		// State
		amount,
		setAmount,
		balance,

		// Validation
		needsApproval,
		isValidAmount,

		// Actions
		handleApprove,
		handleDeposit,
		handleMaxClick,

		// Status
		isApproving: approve.isPending,
		isDepositing: depositMethod.isPending,
		isLoading: approve.isPending || depositMethod.isPending,
		isAllowancesLoading,

		// Success flags
		isApproveSuccess: approve.isSuccess,
		isDepositSuccess: depositMethod.isSuccess,

		// Transaction hashes
		approveTxHash: approve.hash,
		depositTxHash: depositMethod.hash,

		// Metadata
		usesPermit: depositMethod.usesPermit,
	};
}
