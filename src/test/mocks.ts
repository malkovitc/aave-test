import { type Address } from 'viem';
import type { TokenConfig } from '@/features/tokens/config/tokens';

/**
 * Mock data for testing
 */

export const MOCK_USER_ADDRESS: Address = '0x1234567890123456789012345678901234567890';
export const MOCK_POOL_ADDRESS: Address = '0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951';

export const MOCK_USDC: TokenConfig = {
	symbol: 'USDC',
	name: 'USD Coin',
	decimals: 6,
	address: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
	aTokenAddress: '0x16dA4541aD1807f4443d92D26044C1147406EB80' as Address,
	icon: 'usdc',
	supportsPermit: true,
};

export const MOCK_USDT: TokenConfig = {
	symbol: 'USDT',
	name: 'Tether USD',
	decimals: 6,
	address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as Address,
	aTokenAddress: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as Address,
	icon: 'usdt',
	supportsPermit: true,
};

export const MOCK_WETH: TokenConfig = {
	symbol: 'WETH',
	name: 'Wrapped Ether',
	decimals: 18,
	address: '0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c' as Address,
	aTokenAddress: '0x5b071b590a59395fE4025A0Ccc1FcC931AAc1830' as Address,
	icon: 'weth',
	supportsPermit: false,
};

export const MOCK_TOKENS = [MOCK_USDC, MOCK_USDT, MOCK_WETH];

/**
 * Mock balances for testing
 */
export const MOCK_BALANCES = {
	USDC: '1000.50',
	USDT: '500.25',
	WETH: '2.5',
};

export const MOCK_ATOKEN_BALANCES_DATA = {
	USDC: '100.00',
	USDT: '50.00',
	WETH: '0.5',
};

/**
 * Mock transaction hashes
 */
export const MOCK_TX_HASH: `0x${string}` = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

/**
 * Helper to create mock contract read result
 */
export function createMockReadResult<T>(result: T, status: 'success' | 'failure' = 'success') {
	return {
		result,
		status,
	};
}

/**
 * Helper to wait for async updates in tests
 */
export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock allowance values (in BigInt format for different amounts)
 */
export const MOCK_ALLOWANCES = {
	ZERO: 0n,
	SMALL: 100_000_000n, // 100 USDC/USDT (6 decimals)
	LARGE: 1000000_000_000_000n, // 1M USDC/USDT
};
