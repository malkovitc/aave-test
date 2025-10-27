import { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, Address, maxUint256 } from 'viem';
import { toast } from 'sonner';
import { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';

export function useWithdraw(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const withdraw = async (amount: string, isMax: boolean = false) => {
		if (!userAddress || !chainId) {
			toast.error('Please connect your wallet');
			return;
		}

		try {
			let poolAddress: Address;
			try {
				({ poolAddress } = getChainConfig(chainId));
			} catch (configError) {
				console.error('Unsupported chain for withdraw', configError);
				toast.error('Unsupported network for withdraw');
				return;
			}

			// If max, use maxUint256 to withdraw all
			const amountBigInt = isMax ? maxUint256 : parseUnits(amount, token.decimals);

			writeContract({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'withdraw',
				args: [token.address, amountBigInt, userAddress],
			});

			toast.loading('Please confirm transaction in wallet...', { id: 'withdraw' });
		} catch (err) {
			console.error('Withdraw error:', err);
			toast.error('Failed to withdraw', { id: 'withdraw' });
		}
	};

	useEffect(() => {
		// Don't show toasts if there's no transaction hash
		if (!hash) return;

		// Show confirming toast when transaction is being mined
		if (isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: 'withdraw' });
		}

		if (isSuccess) {
			toast.success(`Withdrawn ${token.symbol} successfully!`, { id: 'withdraw' });
		}

		if (error) {
			toast.error('Withdraw failed', { id: 'withdraw' });
		}
	}, [hash, isConfirming, isSuccess, error, token.symbol]);

	return {
		withdraw,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
