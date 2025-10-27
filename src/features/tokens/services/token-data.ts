import type { PublicClient, Address } from 'viem';
import { formatUnits } from 'viem';
import aavePoolAbi from '@/features/lending/abis/AavePool.json';
import { ERC20_ABI } from '@/shared/contracts/erc20';

/**
 * Complete token data including metadata and balances
 */
export interface TokenData {
	symbol: string;
	name: string;
	decimals: number;
	balance: bigint;
	balanceFormatted: string;
	aTokenAddress: Address;
}

/**
 * ERC20 contract function names
 */
type ERC20Function = 'symbol' | 'name' | 'decimals' | 'balanceOf';


/**
 * Reads data from an ERC20 token contract
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - ERC20 token address
 * @param functionName - Name of the function to call
 * @param args - Optional function arguments
 * @returns Promise with the function result
 */
async function readERC20<T>(
	publicClient: PublicClient,
	tokenAddress: Address,
	functionName: ERC20Function,
	args?: readonly [`0x${string}`]
): Promise<T> {
	return publicClient.readContract({
		address: tokenAddress,
		abi: ERC20_ABI,
		functionName,
		args,
	}) as Promise<T>;
}

/**
 * Fetches ERC20 token symbol
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @returns Token symbol (e.g., 'USDC')
 */
function fetchTokenSymbol(publicClient: PublicClient, tokenAddress: Address): Promise<string> {
	return readERC20<string>(publicClient, tokenAddress, 'symbol');
}

/**
 * Fetches ERC20 token name
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @returns Token name (e.g., 'USD Coin')
 */
function fetchTokenName(publicClient: PublicClient, tokenAddress: Address): Promise<string> {
	return readERC20<string>(publicClient, tokenAddress, 'name');
}

/**
 * Fetches ERC20 token decimals
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @returns Token decimals (e.g., 6 for USDC, 18 for LINK)
 */
function fetchTokenDecimals(publicClient: PublicClient, tokenAddress: Address): Promise<number> {
	return readERC20<number>(publicClient, tokenAddress, 'decimals');
}

/**
 * Fetches user's balance for an ERC20 token
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - Token contract address
 * @param userAddress - User wallet address
 * @returns Balance in wei (raw bigint)
 */
function fetchTokenBalance(publicClient: PublicClient, tokenAddress: Address, userAddress: Address): Promise<bigint> {
	return readERC20<bigint>(publicClient, tokenAddress, 'balanceOf', [userAddress]);
}

/**
 * Fetches Aave reserve data for a token
 *
 * @param publicClient - Viem public client
 * @param poolAddress - Aave Pool contract address
 * @param tokenAddress - Token address
 * @returns Reserve data including aToken address
 */
async function fetchReserveData(
	publicClient: PublicClient,
	poolAddress: Address,
	tokenAddress: Address
): Promise<{ aTokenAddress: Address }> {
	return publicClient.readContract({
		address: poolAddress,
		abi: aavePoolAbi,
		functionName: 'getReserveData',
		args: [tokenAddress],
	}) as Promise<{ aTokenAddress: Address }>;
}

/**
 * Formats raw balance to human-readable string
 *
 * @param balance - Raw balance in wei
 * @param decimals - Token decimals
 * @returns Formatted balance string
 *
 * @example
 * formatBalance(1000000n, 6)  // '1.0' (USDC)
 * formatBalance(1000000000000000000n, 18)  // '1.0' (ETH)
 */
function formatBalance(balance: bigint, decimals: number): string {
	return formatUnits(balance, decimals);
}

/**
 * Builds TokenData object from fetched data
 *
 * @param symbol - Token symbol
 * @param name - Token name
 * @param decimals - Token decimals
 * @param balance - Raw balance
 * @param aTokenAddress - aToken contract address
 * @returns Complete TokenData object
 */
function buildTokenData(
	symbol: string,
	name: string,
	decimals: number,
	balance: bigint,
	aTokenAddress: Address
): TokenData {
	return {
		symbol,
		name,
		decimals,
		balance,
		balanceFormatted: formatBalance(balance, decimals),
		aTokenAddress,
	};
}

/**
 * Fetch comprehensive token data including ERC20 metadata, user balance, and reserve data
 *
 * Features:
 * - Parallel fetching for optimal performance
 * - Type-safe contract reads
 * - Automatic balance formatting
 * - Error handling with null return
 *
 * Fetched data:
 * 1. ERC20 metadata (symbol, name, decimals)
 * 2. User balance (raw and formatted)
 * 3. Aave reserve data (aToken address)
 *
 * @param publicClient - Viem public client
 * @param tokenAddress - ERC20 token address
 * @param userAddress - User wallet address
 * @param poolAddress - Aave Pool contract address
 * @returns Token data or null if fetch fails
 *
 * @example
 * const tokenData = await fetchTokenData(
 *   publicClient,
 *   '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // USDC on Sepolia
 *   userAddress,
 *   poolAddress
 * );
 *
 * if (tokenData) {
 *   console.log(tokenData.symbol);  // 'USDC'
 *   console.log(tokenData.balanceFormatted);  // '100.5'
 * }
 */
export async function fetchTokenData(
	publicClient: PublicClient,
	tokenAddress: Address,
	userAddress: Address,
	poolAddress: Address
): Promise<TokenData | null> {
	try {
		// Fetch all data in parallel for optimal performance
		const [symbol, name, decimals, balance, reserveData] = await Promise.all([
			fetchTokenSymbol(publicClient, tokenAddress),
			fetchTokenName(publicClient, tokenAddress),
			fetchTokenDecimals(publicClient, tokenAddress),
			fetchTokenBalance(publicClient, tokenAddress, userAddress),
			fetchReserveData(publicClient, poolAddress, tokenAddress),
		]);

		// Build complete token data object
		return buildTokenData(symbol, name, decimals, balance, reserveData.aTokenAddress);
	} catch (error) {
		console.error(`❌ Error fetching token data for ${tokenAddress}:`, error);
		return null;
	}
}
