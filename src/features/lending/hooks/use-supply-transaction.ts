import { useWriteContract } from 'wagmi';
import { type Address } from 'viem';
import type { ParsedPermitSignature } from './use-permit-signature';
import aavePoolAbi from '../abis/AavePool.json';

/**
 * Hook to execute Aave Pool supplyWithPermit transaction
 *
 * Responsibilities:
 * - Execute supplyWithPermit transaction on Aave Pool
 * - Include permit signature (v, r, s) in transaction
 *
 * Single transaction combines:
 * 1. Pool contract calls token.permit() with signature
 * 2. Pool contract executes supply() to deposit tokens
 *
 * @example
 * const { executeSupplyWithPermit, hash, isPending, error } = useSupplyTransaction();
 * executeSupplyWithPermit(poolAddress, token.address, amount, userAddress, deadline, signature);
 */
export function useSupplyTransaction() {
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	/**
	 * Execute supplyWithPermit transaction
	 */
	const executeSupplyWithPermit = (
		poolAddress: Address,
		tokenAddress: Address,
		amount: bigint,
		userAddress: Address,
		deadline: bigint,
		signature: ParsedPermitSignature
	) => {
		writeContract({
			address: poolAddress,
			abi: aavePoolAbi,
			functionName: 'supplyWithPermit',
			args: [
				tokenAddress, // asset
				amount, // amount
				userAddress, // onBehalfOf
				0, // referralCode
				deadline, // deadline
				signature.v, // permit v
				signature.r, // permit r
				signature.s, // permit s
			],
			gas: 600000n, // Higher gas limit for permit + supply
		});
	};

	return {
		executeSupplyWithPermit,
		hash,
		isPending,
		error,
	};
}
