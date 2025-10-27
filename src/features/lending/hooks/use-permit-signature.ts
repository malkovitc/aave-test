import { useSignTypedData } from 'wagmi';
import { type Address, type Hex } from 'viem';
import type { PermitData } from './use-token-permit-data';

/**
 * Parsed permit signature components for Aave supplyWithPermit
 */
export interface ParsedPermitSignature {
	v: number;
	r: Hex;
	s: Hex;
}

/**
 * Hook to handle EIP-2612 permit signature creation
 *
 * Responsibilities:
 * - Request signature from user (free, no gas)
 * - Parse signature into v, r, s components
 *
 * @example
 * const { signPermit } = usePermitSignature();
 * const { v, r, s } = await signPermit(permitData, userAddress, poolAddress, amount);
 */
export function usePermitSignature() {
	const { signTypedDataAsync } = useSignTypedData();

	/**
	 * Sign EIP-2612 permit message and parse signature
	 */
	const signPermit = async (
		permitData: PermitData,
		userAddress: Address,
		spender: Address,
		amount: bigint
	): Promise<ParsedPermitSignature> => {
		const message = {
			owner: userAddress,
			spender,
			value: amount,
			nonce: permitData.nonce,
			deadline: permitData.deadline,
		};

		// Request signature from user (free, no gas)
		const signature = await signTypedDataAsync({
			domain: permitData.domain,
			types: {
				Permit: [
					{ name: 'owner', type: 'address' },
					{ name: 'spender', type: 'address' },
					{ name: 'value', type: 'uint256' },
					{ name: 'nonce', type: 'uint256' },
					{ name: 'deadline', type: 'uint256' },
				],
			},
			primaryType: 'Permit',
			message,
		});

		// Split signature into v, r, s
		const r = signature.slice(0, 66) as Hex;
		const s = ('0x' + signature.slice(66, 130)) as Hex;
		const v = parseInt(signature.slice(130, 132), 16);

		return { v, r, s };
	};

	return { signPermit };
}
