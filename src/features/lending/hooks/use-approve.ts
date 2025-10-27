import { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';

export function useApprove(token: TokenConfig) {
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const approve = async (spender: Address, amount: string) => {
		try {
			const amountBigInt = parseUnits(amount, token.decimals);

			writeContract({
				address: token.address,
				abi: erc20Abi,
				functionName: 'approve',
				args: [spender, amountBigInt],
			});

			toast.loading('Approving token...', { id: 'approve' });
		} catch (err) {
			console.error('🔴 Approve error:', err);
			toast.error('Failed to approve token', { id: 'approve' });
		}
	};

	useEffect(() => {
		if (!isSuccess) return;
		toast.success('Token approved successfully!', { id: 'approve' });
	}, [isSuccess, hash]);

	useEffect(() => {
		if (!error) return;
		console.error('❌ Approve FAILED:', error);
		toast.error('Approval failed', { id: 'approve' });
	}, [error]);

	return {
		approve,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
