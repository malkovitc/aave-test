import { useMemo, useCallback } from 'react';
import { parseUnits } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useApprove } from '../use-approve';
import { useTokenAllowances } from '@/features/tokens/hooks/use-token-allowances';

export function useDepositApproval(token: TokenConfig, amount: string, usesPermit: boolean) {
	const { allowances, poolAddress, refetch: refetchAllowances, isLoading } = useTokenAllowances();
	const approve = useApprove(token);

	const currentAllowance = useMemo(() => {
		return allowances.find((a) => a.token.symbol === token.symbol);
	}, [allowances, token.symbol]);

	const needsApproval = useMemo(() => {
		if (usesPermit || !amount) return false;
		if (!poolAddress || isLoading || !currentAllowance) return true;

		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			return (currentAllowance.raw ?? 0n) < amountBigInt;
		} catch {
			return false;
		}
	}, [amount, currentAllowance, poolAddress, usesPermit, isLoading, token.decimals]);

	const handleApprove = useCallback(async () => {
		if (!poolAddress || !amount) return;
		await approve.approve(poolAddress, amount);
	}, [amount, approve, poolAddress]);

	return {
		needsApproval,
		poolAddress,
		isAllowancesLoading: isLoading,
		handleApprove,
		refetchAllowances,
		isApproving: approve.isPending,
		isApproveSuccess: approve.isSuccess,
		approveTxHash: approve.hash,
	};
}
