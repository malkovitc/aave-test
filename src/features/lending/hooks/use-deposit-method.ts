import { useMemo } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDeposit } from './use-deposit';
import { useSupplyWithPermit } from './use-supply-with-permit';
import { useTransactionManager } from '@/shared/hooks/use-transaction-manager';
import { useWagmiTransactionSync } from '@/shared/hooks/use-wagmi-transaction-sync';

/**
 * Abstraction over deposit methods (permit vs traditional)
 * Automatically selects the correct method based on token.supportsPermit
 *
 * Uses centralized TransactionManager to avoid Wagmi singleton issues.
 */
export function useDepositMethod(token: TokenConfig) {
	const traditionalDeposit = useDeposit(token);
	const permitDeposit = useSupplyWithPermit(token);

	const usesPermit = token.supportsPermit;

	// Get raw Wagmi state
	const wagmiState = useMemo(() => ({
		hash: usesPermit ? permitDeposit.hash : traditionalDeposit.hash,
		isPending: usesPermit ? !!permitDeposit.isPending : !!traditionalDeposit.isPending,
		isSuccess: usesPermit ? permitDeposit.isSuccess : traditionalDeposit.isSuccess,
		error: usesPermit ? permitDeposit.error : traditionalDeposit.error,
	}), [usesPermit, permitDeposit, traditionalDeposit]);

	// Sync Wagmi state to TransactionManager
	useWagmiTransactionSync(token.symbol, 'deposit', wagmiState);

	// Get managed transaction state from TransactionManager
	const { isPending, isSuccess, isError, error, hash } = useTransactionManager(
		token.symbol,
		'deposit'
	);

	return useMemo(() => {
		return {
			deposit: usesPermit ? permitDeposit.supplyWithPermit : traditionalDeposit.deposit,
			isPending,
			isSuccess,
			hash,
			error,
			hasValidError: isError,
			usesPermit,
		};
	}, [usesPermit, permitDeposit, traditionalDeposit, isPending, isSuccess, hash, error, isError]);
}
