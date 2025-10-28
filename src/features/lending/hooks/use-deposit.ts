import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';

export function useDeposit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	// Log state changes
	console.log(`[useDeposit ${token.symbol}] hash=${hash?.slice(0,8)}, isPending=${isPending}, isConfirming=${isConfirming}, isSuccess=${isSuccess}, error=${!!error}`);

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
