import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';

export function useDeposit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const deposit = async (amount: string) => {
		if (!userAddress || !chainId) {
			console.error('🔴 No wallet connected');
			return;
		}

		try {
			const amountBigInt = parseUnits(amount, token.decimals);

			let poolAddress: Address;
			try {
				({ poolAddress } = getChainConfig(chainId));
			} catch (configError) {
				console.error('🔴 Unsupported chain for deposit', configError);
				return;
			}

			writeContract({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'supply',
				args: [
					token.address,
					amountBigInt,
					userAddress,
					0,
				],
				gas: 500000n,
			});

			// Show immediate feedback to user
			toast.loading('Please confirm transaction in wallet...', { id: `deposit-${token.symbol}` });
		} catch (err) {
			console.error('🔴 Deposit error:', err);
		}
	};

	return {
		deposit,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
