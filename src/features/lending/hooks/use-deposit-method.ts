import { useMemo, useEffect } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDeposit } from './use-deposit';
import { useSupplyWithPermit } from './use-supply-with-permit';
import { useTransactionToast } from '@/shared/hooks/use-transaction-toast';
import { useDepositContext } from '../context/DepositContext';

/**
 * Abstraction over deposit methods (permit vs traditional)
 * Automatically selects the correct method based on token.supportsPermit
 *
 * Also manages toast notifications at this orchestration level to ensure
 * component-level isolation and prevent cross-token interference from wagmi's
 * global singleton state.
 */
export function useDepositMethod(token: TokenConfig) {
	const traditionalDeposit = useDeposit(token);
	const permitDeposit = useSupplyWithPermit(token);
	const { refetchBalances } = useDepositContext();

	const usesPermit = token.supportsPermit;
	const hash = usesPermit ? permitDeposit.hash : traditionalDeposit.hash;
	const isPending = usesPermit ? permitDeposit.isPending : traditionalDeposit.isPending;
	const isSuccess = usesPermit ? permitDeposit.isSuccess : traditionalDeposit.isSuccess;
	const error = usesPermit ? permitDeposit.error : traditionalDeposit.error;

	// Show transaction toast notifications
	useTransactionToast(
		hash,
		isPending,
		isSuccess,
		error,
		{
			pending: 'Confirming deposit...',
			success: `Deposited ${token.symbol} successfully!`,
			error: 'Deposit failed'
		},
		`deposit-${token.symbol}`
	);

	// Refetch balances immediately after successful deposit
	useEffect(() => {
		if (isSuccess && refetchBalances) {
			refetchBalances();
		}
	}, [isSuccess, refetchBalances]);

	return useMemo(() => {
		return {
			deposit: usesPermit ? permitDeposit.supplyWithPermit : traditionalDeposit.deposit,
			isPending,
			isSuccess,
			hash,
			error,
			usesPermit,
		};
	}, [usesPermit, permitDeposit, traditionalDeposit, isPending, isSuccess, hash, error]);
}
