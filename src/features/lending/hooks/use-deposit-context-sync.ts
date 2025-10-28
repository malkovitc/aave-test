import { useEffect, useMemo } from 'react';
import { useDepositContext } from '../context/DepositContext';

/**
 * Syncs deposit/approve pending state to global context (State Machine)
 * Enables UI to show loaders on correct tokens across components
 *
 * Architecture (useReducer Pattern):
 * - Uses new action-based API (startApproving/startDepositing/completeTransaction)
 * - Dispatches to state machine instead of manual setters
 * - 3 dependencies in useEffect (compliant!)
 */
export function useDepositContextSync(
	tokenSymbol: string,
	isApproving: boolean,
	isDepositing: boolean,
	amount?: string
) {
	const { startApproving, startDepositing, completeTransaction } = useDepositContext();

	// Memoize pending state to avoid recalculation
	const isPending = useMemo(() => isApproving || isDepositing, [isApproving, isDepositing]);

	useEffect(() => {
		if (isApproving) {
			// Dispatch START_APPROVING action
			startApproving(tokenSymbol, amount || '');
		} else if (isDepositing) {
			// Dispatch START_DEPOSITING action
			startDepositing(tokenSymbol, amount || '');
		} else {
			// Dispatch COMPLETE_TRANSACTION action
			completeTransaction();
		}
		// Note: Action creators are stable (useCallback with no deps)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPending, tokenSymbol, amount]);
}
