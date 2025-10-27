import { useMemo } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { erc20Abi } from 'viem';
import { getAllTokens, type TokenConfig } from '../config/tokens';
import { getChainConfig } from '../config/chains';

export interface TokenAllowance {
	token: TokenConfig;
	raw: bigint;
	hasAllowance: boolean;
}

/**
 * Dynamic hook for reading token allowances for the Aave Pool
 * Uses useReadContracts for efficient batch fetching
 * Automatically scales with SUPPORTED_TOKENS - no hardcoded limits
 */
export function useTokenAllowances() {
	const { address, chainId } = useAccount();
	const tokens = useMemo(() => getAllTokens(), []);

	const poolAddress = useMemo(() => {
		if (typeof chainId !== 'number') return undefined;
		try {
			return getChainConfig(chainId).poolAddress;
		} catch {
			return undefined;
		}
	}, [chainId]);

	// Build contracts array dynamically based on tokens
	const contracts = useMemo(
		() =>
			tokens.map((token) => ({
				address: token.address,
				abi: erc20Abi,
				functionName: 'allowance' as const,
				args: [address!, poolAddress!],
			})),
		[tokens, address, poolAddress]
	);

	const { data, isLoading, error, refetch } = useReadContracts({
		contracts,
		query: {
			enabled: !!address && !!poolAddress && contracts.length > 0,
		},
	});

	const allowances = useMemo(
		() =>
			tokens.map((token, index) => {
				const result = data?.[index];
				const rawAllowance = (result?.status === 'success' ? result.result : 0n) as bigint;

				return {
					token,
					raw: rawAllowance,
					hasAllowance: rawAllowance > 0n,
				};
			}),
		[tokens, data]
	);

	return {
		allowances,
		isLoading,
		error,
		refetch,
		poolAddress,
	};
}
