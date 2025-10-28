import { useEffect, useRef } from 'react';
import { useDepositContext } from '../context/DepositContext';

/**
 * Syncs deposit/approve pending state to global context (State Machine)
 * Enables UI to show loaders on correct tokens across components
 *
 * Architecture (useReducer Pattern):
 * - Uses new action-based API (startApproving/startDepositing/completeTransaction)
 * - Dispatches to state machine instead of manual setters
 * - Handles both success and error cases to prevent stuck pending states
 * - Uses cleanup function to complete transaction when unmounting or states change
 */
export function useDepositContextSync(
	tokenSymbol: string,
	isApproving: boolean,
	isDepositing: boolean,
	isSuccess: boolean,
	amount?: string
) {
	const { startApproving, startDepositing, completeTransaction } = useDepositContext();

	// Track if we started a transaction in this render cycle
	const hasStartedTransaction = useRef(false);

	useEffect(() => {
		if (isApproving) {
			startApproving(tokenSymbol, amount || '');
			hasStartedTransaction.current = true;
		} else if (isDepositing) {
			startDepositing(tokenSymbol, amount || '');
			hasStartedTransaction.current = true;
		} else if (hasStartedTransaction.current) {
			// Transaction ended (either success or error)
			completeTransaction();
			hasStartedTransaction.current = false;
		}

		// Cleanup: if component unmounts while pending, complete the transaction
		return () => {
			if (hasStartedTransaction.current && (isApproving || isDepositing)) {
				completeTransaction();
				hasStartedTransaction.current = false;
			}
		};
		// Note: Action creators are stable (useCallback with no deps)
		// We include isSuccess to re-trigger when success changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isApproving, isDepositing, isSuccess, tokenSymbol, amount]);
}
