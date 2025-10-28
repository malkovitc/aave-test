import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';

export function useDeposit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContractAsync, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const deposit = async (amount: string) => {
		if (!userAddress || !chainId) {
			throw new Error('No wallet connected');
		}

		const amountBigInt = parseUnits(amount, token.decimals);

		let poolAddress: Address;
		try {
			({ poolAddress } = getChainConfig(chainId));
		} catch (configError) {
			throw new Error('Unsupported chain for deposit');
		}

		try {
			const result = await writeContractAsync({
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
			return result;
		} catch (err) {
			throw err;
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
