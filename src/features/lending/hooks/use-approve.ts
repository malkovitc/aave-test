import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi, parseUnits, type Address } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useTransactionToast } from '@/shared/hooks/use-transaction-toast';

export function useApprove(token: TokenConfig) {
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	// Log state changes
	console.log(`[useApprove ${token.symbol}] hash=${hash?.slice(0,8)}, isPending=${isPending}, isConfirming=${isConfirming}, isSuccess=${isSuccess}, error=${!!error}`);

	// Show transaction toast notifications
	useTransactionToast(
		hash,
		isPending || isConfirming,
		isSuccess,
		!!error,
		{
			pending: 'Approving token...',
			success: 'Token approved successfully!',
			error: 'Approval failed'
		},
		`approve-${token.symbol}`
	);

	const approve = async (spender: Address, amount: string) => {
		try {
			const amountBigInt = parseUnits(amount, token.decimals);

			writeContract({
				address: token.address,
				abi: erc20Abi,
				functionName: 'approve',
				args: [spender, amountBigInt],
			});
		} catch (err) {
			console.error('🔴 Approve error:', err);
		}
	};

	return {
		approve,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
