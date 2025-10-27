import type { PublicClient, Address } from 'viem';
import aavePoolAbi from '@/features/lending/abis/AavePool.json';

/**
 * Fetch all reserve addresses from Aave Pool contract
 *
 * @param publicClient - Viem public client
 * @param poolAddress - Aave Pool contract address
 * @returns Array of token addresses that are available as reserves
 */
export async function fetchAaveReserves(publicClient: PublicClient, poolAddress: Address): Promise<Address[]> {
	const reserves = (await publicClient.readContract({
		address: poolAddress,
		abi: aavePoolAbi,
		functionName: 'getReservesList',
	})) as Address[];

	return reserves;
}
