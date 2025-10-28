import { useEffect, useRef } from 'react';
import { useDepositContext } from '../context/DepositContext';

export function useDepositContextSync(
	tokenSymbol: string,
	isApproving: boolean,
	isDepositing: boolean,
	isSuccess: boolean,
	amount?: string,
	isError?: boolean
) {
	const { startApproving, startDepositing, completeTransaction } = useDepositContext();
	const hasStartedTransaction = useRef(false);

	useEffect(() => {
		if (isApproving) {
			startApproving(tokenSymbol, amount || '');
			hasStartedTransaction.current = true;
			return;
		}

		if (isDepositing) {
			startDepositing(tokenSymbol, amount || '');
			hasStartedTransaction.current = true;
			return;
		}

		const shouldComplete =
			hasStartedTransaction.current &&
			(isError || (!isApproving && !isDepositing));

		if (shouldComplete) {
			completeTransaction();
			hasStartedTransaction.current = false;
		}

		return () => {
			if (hasStartedTransaction.current) {
				completeTransaction();
				hasStartedTransaction.current = false;
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isApproving, isDepositing, isSuccess, isError, tokenSymbol, amount]);
}
