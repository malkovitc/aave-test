import { useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { TOKENS } from '../config/tokens';
import { getChainConfig } from '../config/chains';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import aavePoolAbi from '@/features/lending/abis/AavePool.json';

/**
 * Hook to dynamically fetch aToken addresses from Aave Pool contract
 *
 * Instead of hardcoding aToken addresses, this fetches them from the blockchain
 * using pool.getReserveData(asset).aTokenAddress
 *
 * @returns Object with aToken addresses mapped by token symbol
 *
 * @example
 * const { aTokenAddresses, isLoading } = useReserveTokens()
 * const usdcAToken = aTokenAddresses['USDC']
 */
export function useReserveTokens() {
	const { chainId } = useWallet();
	const poolAddress = chainId ? getChainConfig(chainId).poolAddress : undefined;

	// Create contracts array for batch reading
	const contracts = TOKENS.map((token) => ({
		address: poolAddress as Address,
		abi: aavePoolAbi, // ABI from JSON import
		functionName: 'getReserveData' as const,
		args: [token.address] as const,
		chainId,
	}));

	// Fetch reserve data from blockchain
	const { data, isLoading, isError, refetch } = useReadContracts({
		contracts,
		query: {
			enabled: !!poolAddress && !!chainId,
			staleTime: 1000 * 60 * 5, // Cache for 5 minutes (aToken addresses don't change)
		},
	});

	// Parse results and extract aToken addresses
	const aTokenAddresses: Record<string, Address> = {};
	const reserveDataByToken: Record<string, ReserveData | null> = {};

	if (data) {
		data.forEach((result, index) => {
			const token = TOKENS[index];
			if (!token) return; // Guard against undefined token

			if (result.status === 'success' && result.result) {
				const reserveDataTuple = result.result as ReserveDataTuple;
				const parsedData = parseReserveData(reserveDataTuple);

				// Extract aToken address for quick lookup
				aTokenAddresses[token.symbol] = parsedData.aTokenAddress;

				// Store full parsed reserve data
				reserveDataByToken[token.symbol] = parsedData;
			} else {
				reserveDataByToken[token.symbol] = null;
			}
		});
	}

	return {
		aTokenAddresses,
		reserveDataByToken,
		isLoading,
		isError,
		refetch,
	};
}

/**
 * Type for Reserve Data tuple returned from getReserveData
 * Matches Aave V3 ReserveData struct
 */
type ReserveDataTuple = readonly [
	bigint, // configuration
	bigint, // liquidityIndex
	bigint, // currentLiquidityRate
	bigint, // variableBorrowIndex
	bigint, // currentVariableBorrowRate
	bigint, // currentStableBorrowRate
	bigint, // lastUpdateTimestamp
	number, // id
	Address, // aTokenAddress
	Address, // stableDebtTokenAddress
	Address, // variableDebtTokenAddress
	Address, // interestRateStrategyAddress
	bigint, // accruedToTreasury
	bigint, // unbacked
	bigint, // isolationModeTotalDebt
];

/**
 * Indices for ReserveDataTuple to avoid magic numbers
 */
const RESERVE_DATA_INDEX = {
	CONFIGURATION: 0,
	LIQUIDITY_INDEX: 1,
	CURRENT_LIQUIDITY_RATE: 2,
	VARIABLE_BORROW_INDEX: 3,
	CURRENT_VARIABLE_BORROW_RATE: 4,
	CURRENT_STABLE_BORROW_RATE: 5,
	LAST_UPDATE_TIMESTAMP: 6,
	ID: 7,
	ATOKEN_ADDRESS: 8,
	STABLE_DEBT_TOKEN_ADDRESS: 9,
	VARIABLE_DEBT_TOKEN_ADDRESS: 10,
	INTEREST_RATE_STRATEGY_ADDRESS: 11,
	ACCRUED_TO_TREASURY: 12,
	UNBACKED: 13,
	ISOLATION_MODE_TOTAL_DEBT: 14,
} as const;

/**
 * Parsed Reserve Data with useful fields
 */
export interface ReserveData {
	aTokenAddress: Address;
	stableDebtTokenAddress: Address;
	variableDebtTokenAddress: Address;
	liquidityIndex: bigint;
	currentLiquidityRate: bigint;
	variableBorrowIndex: bigint;
	currentVariableBorrowRate: bigint;
	currentStableBorrowRate: bigint;
	lastUpdateTimestamp: bigint;
}

/**
 * Parse reserve data tuple into structured object
 */
function parseReserveData(tuple: ReserveDataTuple): ReserveData {
	return {
		aTokenAddress: tuple[RESERVE_DATA_INDEX.ATOKEN_ADDRESS],
		stableDebtTokenAddress: tuple[RESERVE_DATA_INDEX.STABLE_DEBT_TOKEN_ADDRESS],
		variableDebtTokenAddress: tuple[RESERVE_DATA_INDEX.VARIABLE_DEBT_TOKEN_ADDRESS],
		liquidityIndex: tuple[RESERVE_DATA_INDEX.LIQUIDITY_INDEX],
		currentLiquidityRate: tuple[RESERVE_DATA_INDEX.CURRENT_LIQUIDITY_RATE],
		variableBorrowIndex: tuple[RESERVE_DATA_INDEX.VARIABLE_BORROW_INDEX],
		currentVariableBorrowRate: tuple[RESERVE_DATA_INDEX.CURRENT_VARIABLE_BORROW_RATE],
		currentStableBorrowRate: tuple[RESERVE_DATA_INDEX.CURRENT_STABLE_BORROW_RATE],
		lastUpdateTimestamp: tuple[RESERVE_DATA_INDEX.LAST_UPDATE_TIMESTAMP],
	};
}
