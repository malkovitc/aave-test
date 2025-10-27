import { useMemo } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDeposit } from './use-deposit';
import { useSupplyWithPermit } from './use-supply-with-permit';

/**
 * Abstraction over deposit methods (permit vs traditional)
 * Automatically selects the correct method based on token.supportsPermit
 */
export function useDepositMethod(token: TokenConfig) {
	const traditionalDeposit = useDeposit(token);
	const permitDeposit = useSupplyWithPermit(token);

	return useMemo(() => {
		const usesPermit = token.supportsPermit;

		return {
			deposit: usesPermit ? permitDeposit.supplyWithPermit : traditionalDeposit.deposit,
			isPending: usesPermit ? permitDeposit.isPending : traditionalDeposit.isPending,
			isSuccess: usesPermit ? permitDeposit.isSuccess : traditionalDeposit.isSuccess,
			hash: usesPermit ? permitDeposit.hash : traditionalDeposit.hash,
			usesPermit,
		};
	}, [token.supportsPermit, traditionalDeposit, permitDeposit]);
}
