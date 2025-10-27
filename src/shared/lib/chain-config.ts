/**
 * Chain-specific configuration
 *
 * Provides chain-specific URLs and settings to avoid hardcoding
 * Makes it easier to support multiple chains in the future
 *
 * @module chain-config
 */

import type { Chain } from 'viem';
import type { Hex } from 'viem';

/**
 * Get block explorer URL for a transaction
 *
 * @param chain - Chain object from viem
 * @param txHash - Transaction hash
 * @returns Full URL to view transaction on block explorer
 */
export function getTransactionUrl(chain: Chain, txHash: Hex): string {
	const explorerUrl = chain.blockExplorers?.default?.url;
	if (!explorerUrl) {
		throw new Error(`No block explorer configured for chain ${chain.name}`);
	}
	return `${explorerUrl}/tx/${txHash}`;
}

/**
 * Get faucet URL for a chain
 *
 * @param chain - Chain object from viem
 * @returns Faucet URL or null if not available
 */
export function getFaucetUrl(chain: Chain): string | null {
	// Chain-specific faucet mappings
	const faucetMap: Record<number, string> = {
		11155111: 'https://www.alchemy.com/faucets/ethereum-sepolia', // Sepolia
		80002: 'https://faucet.polygon.technology/', // Polygon Amoy
		421614: 'https://bridge.arbitrum.io/', // Arbitrum Sepolia
		11155420: 'https://app.optimism.io/faucet', // Optimism Sepolia
	};

	return faucetMap[chain.id] ?? null;
}

/**
 * Get block explorer name for display
 *
 * @param chain - Chain object from viem
 * @returns Explorer name (e.g., "Etherscan", "Polygonscan")
 */
export function getExplorerName(chain: Chain): string {
	return chain.blockExplorers?.default?.name ?? 'Block Explorer';
}
