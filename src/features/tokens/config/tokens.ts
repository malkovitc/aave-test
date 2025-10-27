import { z } from 'zod';
import { type Address } from 'viem';

/**
 * Token metadata schema
 * aTokenAddress is optional - can be fetched dynamically from Pool contract
 * supportsPermit indicates if token implements EIP-2612 permit for gasless approvals
 */
export const tokenSchema = z.object({
	symbol: z.string(),
	name: z.string(),
	decimals: z.number(),
	address: z.custom<Address>(),
	aTokenAddress: z.custom<Address>().optional(), // Now optional for dynamic fetching
	icon: z.string().optional(),
	supportsPermit: z.boolean().optional().default(false), // EIP-2612 permit support
});

export type Token = z.infer<typeof tokenSchema>;
export type TokenConfig = Token;

/**
 * Supported tokens on Sepolia testnet
 * Addresses from Aave V3 Sepolia deployment
 * Matching Figma mockup: USDC, USDT, WETH
 */
export const SUPPORTED_TOKENS: Record<string, Token> = {
	USDC: {
		symbol: 'USDC',
		name: 'USD Coin',
		decimals: 6,
		address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
		aTokenAddress: '0x16dA4541aD1807f4443d92D26044C1147406EB80' as Address,
		icon: 'usdc',
		supportsPermit: true, // EIP-2612 permit supported
	},
	USDT: {
		symbol: 'USDT',
		name: 'Tether USD',
		decimals: 6,
		address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as Address,
		aTokenAddress: '0xAF0F6e8b0Dc5c913bbF4d14c22B4E78Dd14310B6' as Address,
		icon: 'usdt',
		supportsPermit: true, // EIP-2612 permit supported
	},
	WETH: {
		symbol: 'WETH',
		name: 'Wrapped Ether',
		decimals: 18,
		address: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as Address,
		aTokenAddress: '0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830' as Address,
		icon: 'weth',
		supportsPermit: false, // WETH9Mock does not support permit
	},
	LINK: {
		symbol: 'LINK',
		name: 'Chainlink',
		decimals: 18,
		address: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5' as Address,
		aTokenAddress: '0x3FfAf50D4F4E96eB78f2407c090b72e86eCaed24' as Address,
		icon: 'link',
		supportsPermit: true, // EIP-2612 permit supported, NO supply cap!
	},
} as const;

/**
 * Get token by symbol
 */
export function getToken(symbol: string): Token | undefined {
	return SUPPORTED_TOKENS[symbol];
}

/**
 * Get all supported tokens as array
 */
export function getAllTokens(): Token[] {
	return Object.values(SUPPORTED_TOKENS);
}

/**
 * Exported array of tokens for iteration
 * Used in hooks that need to batch-fetch data for all tokens
 */
export const TOKENS = getAllTokens();

/**
 * Get token by address
 */
export function getTokenByAddress(address: Address): Token | undefined {
	return Object.values(SUPPORTED_TOKENS).find((token) => token.address.toLowerCase() === address.toLowerCase());
}
