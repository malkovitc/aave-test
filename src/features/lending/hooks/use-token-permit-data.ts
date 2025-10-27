import { useMemo } from 'react';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { PERMIT_DEADLINE_SECONDS } from '@/shared/constants/timing';

/**
 * EIP-2612 Permit Domain and Message Data
 */
export interface PermitData {
	domain: {
		name: string;
		version: string;
		chainId: bigint;
		verifyingContract: Address;
	};
	nonce: bigint;
	deadline: bigint;
}

/**
 * Hook to fetch token metadata required for EIP-2612 permit signature
 *
 * Responsibilities:
 * - Fetch token name from contract
 * - Fetch current nonce for permit
 * - Create EIP-2612 domain object
 * - Calculate deadline (20 minutes from now)
 *
 * @param token - Token configuration
 * @param userAddress - User's wallet address
 * @param chainId - Current chain ID
 */
export async function fetchTokenPermitData(
	token: TokenConfig,
	userAddress: Address,
	chainId: number
): Promise<PermitData> {
	const publicClient = createPublicClient({
		chain: sepolia,
		transport: http(),
	});

	// Fetch token name from contract (important for EIP-2612)
	const tokenName = (await publicClient.readContract({
		address: token.address,
		abi: [
			{
				name: 'name',
				type: 'function',
				stateMutability: 'view',
				inputs: [],
				outputs: [{ type: 'string' }],
			},
		],
		functionName: 'name',
	})) as string;

	// Fetch current nonce for permit
	const nonce = (await publicClient.readContract({
		address: token.address,
		abi: [
			{
				name: 'nonces',
				type: 'function',
				stateMutability: 'view',
				inputs: [{ name: 'owner', type: 'address' }],
				outputs: [{ type: 'uint256' }],
			},
		],
		functionName: 'nonces',
		args: [userAddress],
	})) as bigint;

	// Set deadline to 20 minutes from now
	const deadline = BigInt(Math.floor(Date.now() / 1000) + PERMIT_DEADLINE_SECONDS);

	// Create EIP-2612 domain
	const domain = {
		name: tokenName,
		version: '1',
		chainId: BigInt(chainId),
		verifyingContract: token.address,
	};

	return { domain, nonce, deadline };
}

/**
 * Hook to get EIP-2612 typed data structure
 */
export function usePermitTypedData() {
	return useMemo(
		() => ({
			types: {
				Permit: [
					{ name: 'owner', type: 'address' },
					{ name: 'spender', type: 'address' },
					{ name: 'value', type: 'uint256' },
					{ name: 'nonce', type: 'uint256' },
					{ name: 'deadline', type: 'uint256' },
				],
			},
			primaryType: 'Permit' as const,
		}),
		[]
	);
}
