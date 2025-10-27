import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { parseUnits } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useApprove } from './use-approve';
import { useDeposit } from './use-deposit';
import { useSupplyWithPermit } from './use-supply-with-permit';
import { useTokenAllowances } from '@/features/tokens/hooks/use-token-allowances';
import { useTokenBalances } from '@/features/tokens/hooks/use-token-balances';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';
import { useDepositContext } from '../context/DepositContext';

export function useDepositFlow(token: TokenConfig, balance: string) {
	const [amount, setAmount] = useState('');
	const { setIsDepositing, setDepositingTokenSymbol } = useDepositContext();
	const hasTriggeredAutoDeposit = useRef(false);
	const previousTokenSymbol = useRef(token.symbol);

	const { allowances, poolAddress, refetch: refetchAllowances, isLoading: isAllowancesLoading } = useTokenAllowances();
	const { refetch: refetchBalances } = useTokenBalances();
	const { refetch: refetchATokens } = useATokenBalances();
	const { refetch: refetchUserTokens } = useUserTokensContext();
	const currentAllowance = allowances.find((a) => a.token.symbol === token.symbol);

	const approve = useApprove(token);
	const deposit = useDeposit(token);
	const supplyWithPermit = useSupplyWithPermit(token);

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
		if (token.supportsPermit) return false;

		if (!amount) return false;
		if (!poolAddress || isAllowancesLoading) return true;
		if (!currentAllowance) return true;

		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			return (currentAllowance.raw ?? 0n) < amountBigInt;
		} catch {
			return false;
		}
	}, [amount, currentAllowance, poolAddress, token.decimals, token.supportsPermit, isAllowancesLoading]);

	const handleApprove = useCallback(async () => {
		if (!poolAddress || !amount) return;
		// Validate amount before approval
		if (!isValidAmount) return;
		await approve.approve(poolAddress, amount);
	}, [amount, approve, poolAddress, isValidAmount]);

	const handleDeposit = useCallback(async () => {
		if (!amount) return;
		// Validate amount before deposit
		if (!isValidAmount) return;

		// Use permit-based deposit for tokens that support it (USDC, USDT)
		if (token.supportsPermit) {
			await supplyWithPermit.supplyWithPermit(amount);
		} else {
			// Use traditional deposit for tokens without permit (WETH)
			await deposit.deposit(amount);
		}
	}, [amount, token.supportsPermit, deposit, supplyWithPermit, isValidAmount]);

	const handleMaxClick = useCallback(() => {
		setAmount(balance);
	}, [balance]);

	// Refetch allowances after approval and auto-trigger deposit
	useEffect(() => {
		if (approve.isSuccess && !hasTriggeredAutoDeposit.current) {
			hasTriggeredAutoDeposit.current = true;
			refetchAllowances();
			// Auto-trigger deposit after successful approval
			handleDeposit();
		}
	}, [approve.isSuccess, refetchAllowances, handleDeposit]);

	// Reset auto-deposit flag when approval is reset
	useEffect(() => {
		if (!approve.isSuccess && hasTriggeredAutoDeposit.current) {
			hasTriggeredAutoDeposit.current = false;
		}
	}, [approve.isSuccess]);

	// Reset form and refetch balances after successful deposit
	useEffect(() => {
		// Check success from either traditional deposit or permit-based deposit
		const isDepositSuccess = token.supportsPermit ? supplyWithPermit.isSuccess : deposit.isSuccess;

		if (isDepositSuccess) {
			setAmount('');

			// Transaction is confirmed in blockchain, safe to refetch
			// Refetch all balance sources:
			// 1. Token balances (ERC20 balances - will show decreased LINK balance)
			// 2. aToken balances (Aave positions - will show increased aLINK balance)
			// 3. User tokens (for dropdown - will show updated LINK balance)
			refetchBalances();
			refetchATokens();
			refetchUserTokens();
		}
	}, [
		deposit.isSuccess,
		supplyWithPermit.isSuccess,
		token.supportsPermit,
		refetchBalances,
		refetchATokens,
		refetchUserTokens,
	]);

	// Reset amount when token changes (user switched from failed token to new token)
	useEffect(() => {
		if (previousTokenSymbol.current !== token.symbol) {
			previousTokenSymbol.current = token.symbol;
			setAmount('');
			hasTriggeredAutoDeposit.current = false;
		}
	}, [token.symbol]);

	// Sync deposit/approve pending state to context to disable all deposit buttons
	useEffect(() => {
		const isCurrentlyDepositing = token.supportsPermit ? supplyWithPermit.isPending : deposit.isPending;
		const isCurrentlyApproving = approve.isPending;
		const isPending = isCurrentlyApproving || isCurrentlyDepositing;

		// Set isDepositing to true if either approving or depositing
		setIsDepositing(isPending);

		// Track which token is being deposited (for UI to show loader on specific token)
		setDepositingTokenSymbol(isPending ? token.symbol : null);
	}, [approve.isPending, deposit.isPending, supplyWithPermit.isPending, token.supportsPermit, token.symbol, setIsDepositing, setDepositingTokenSymbol]);

	return {
		amount,
		setAmount,
		balance,
		needsApproval,
		isValidAmount,
		handleApprove,
		handleDeposit,
		handleMaxClick,
		isApproving: approve.isPending,
		// For tokens with permit, show permit+deposit progress; otherwise show traditional deposit
		isDepositing: token.supportsPermit ? supplyWithPermit.isPending : deposit.isPending,
		approveTxHash: approve.hash,
		// For tokens with permit, return permit+deposit hash; otherwise return traditional deposit hash
		depositTxHash: token.supportsPermit ? supplyWithPermit.hash : deposit.hash,
		// Loading includes both approve and deposit (permit or traditional)
		isLoading: approve.isPending || (token.supportsPermit ? supplyWithPermit.isPending : deposit.isPending),
		isAllowancesLoading,
		isApproveSuccess: approve.isSuccess,
		// Success from either permit-based or traditional deposit
		isDepositSuccess: token.supportsPermit ? supplyWithPermit.isSuccess : deposit.isSuccess,
		// Expose whether this token uses permit (useful for UI messages)
		usesPermit: token.supportsPermit,
	};
}
