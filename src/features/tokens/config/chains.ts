import { sepolia } from 'viem/chains';
import { env } from '@/shared/lib/env';

export const SUPPORTED_CHAINS = [sepolia] as const;

export const DEFAULT_CHAIN = sepolia;

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['id'];

export const CHAIN_CONFIG = {
	[sepolia.id]: {
		chainId: sepolia.id,
		name: sepolia.name,
		rpcUrl: env.VITE_RPC_URL,
		blockExplorer: sepolia.blockExplorers.default.url,
		// Aave V3 Sepolia addresses
		poolAddress: '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951' as const,
		poolDataProvider: '0x3e9708d80f7B3e43118013075F7e95CE3AB31F31' as const,
	},
} as const;

export function getChainConfig(chainId: number) {
	const config = CHAIN_CONFIG[chainId as SupportedChainId];
	if (!config) {
		throw new Error(`Unsupported chain ID: ${chainId}`);
	}
	return config;
}
