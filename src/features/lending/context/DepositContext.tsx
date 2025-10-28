import { createContext, useContext, useReducer, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { SCROLL_WITH_FOCUS_DELAY_MS } from '@/shared/constants/timing';
import { depositContextReducer } from './deposit-context-reducer';
import { initialTransactionState, isDepositing, isWithdrawing } from './deposit-context-types';

interface DepositContextValue {
	// State Machine (replaces 5 useState with 1 useReducer)
	isDepositing: boolean;
	depositingTokenSymbol: string | null;
	depositingAmount: string | null;
	isWithdrawing: boolean;
	withdrawingTokenSymbol: string | null;

	// Actions (dispatch functions)
	startApproving: (tokenSymbol: string, amount: string) => void;
	startDepositing: (tokenSymbol: string, amount: string) => void;
	startWithdrawing: (tokenSymbol: string) => void;
	completeTransaction: () => void;
	reset: () => void;

	// Refs for auto-focus after scroll
	depositInputRef: React.RefObject<HTMLInputElement>;
	withdrawInputRef: React.RefObject<HTMLInputElement>;
	focusDepositInput: () => void;
	focusWithdrawInput: () => void;

	// Balance refetch
	refetchBalances: (() => void) | null;
	setRefetchBalances: (refetch: () => void) => void;
}

const DepositContext = createContext<DepositContextValue | undefined>(undefined);

/**
 * DepositProvider - Manages global deposit and withdraw state using State Machine
 *
 * Architecture (useReducer Pattern):
 * - Replaced 5 useState with 1 useReducer
 * - State machine prevents invalid states
 * - Reducer has 0 dependencies (pure function)
 * - useMemo has 3 dependencies (down from 7!)
 *
 * Purpose:
 * - Share `isDepositing`/`isWithdrawing` state to disable all buttons during transactions
 * - Track which specific token is being deposited/withdrawn for better UX
 * - Provide shared refs for auto-focusing amount inputs after scroll
 */
export function DepositProvider({ children }: { children: ReactNode }) {
	// State Machine (1 useReducer replaces 5 useState)
	const [state, dispatch] = useReducer(depositContextReducer, initialTransactionState);

	const depositInputRef = useRef<HTMLInputElement>(null);
	const withdrawInputRef = useRef<HTMLInputElement>(null);

	// Store refetch callback from useATokenBalances
	const refetchBalancesRef = useRef<(() => void) | null>(null);

	const setRefetchBalances = useCallback((refetch: () => void) => {
		refetchBalancesRef.current = refetch;
	}, []);

	// Action creators (stable references, no dependencies)
	const startApproving = useCallback((tokenSymbol: string, amount: string) => {
		dispatch({ type: 'START_APPROVING', payload: { tokenSymbol, amount } });
	}, []);

	const startDepositing = useCallback((tokenSymbol: string, amount: string) => {
		dispatch({ type: 'START_DEPOSITING', payload: { tokenSymbol, amount } });
	}, []);

	const startWithdrawing = useCallback((tokenSymbol: string) => {
		dispatch({ type: 'START_WITHDRAWING', payload: { tokenSymbol } });
	}, []);

	const completeTransaction = useCallback(() => {
		dispatch({ type: 'COMPLETE_TRANSACTION' });
	}, []);

	const reset = useCallback(() => {
		dispatch({ type: 'RESET' });
	}, []);

	const focusDepositInput = useCallback(() => {
		// Delay to allow scroll animation to complete
		// 100ms scroll delay + 300ms smooth scroll animation = 400ms total
		setTimeout(() => {
			depositInputRef.current?.focus();
		}, SCROLL_WITH_FOCUS_DELAY_MS);
	}, []);

	const focusWithdrawInput = useCallback(() => {
		// Delay to allow scroll animation to complete
		setTimeout(() => {
			withdrawInputRef.current?.focus();
		}, SCROLL_WITH_FOCUS_DELAY_MS);
	}, []);

	// Memoize context value (3 deps instead of 7!)
	// Note: Action creators are stable (useCallback with []) and don't need to be dependencies
	const value = useMemo(
		() => ({
			// Derived state
			isDepositing: isDepositing(state),
			depositingTokenSymbol: state.tokenSymbol,
			depositingAmount: state.amount,
			isWithdrawing: isWithdrawing(state),
			withdrawingTokenSymbol: state.type === 'withdraw' ? state.tokenSymbol : null,

			// Actions
			startApproving,
			startDepositing,
			startWithdrawing,
			completeTransaction,
			reset,

			// Refs and focus functions
			depositInputRef,
			withdrawInputRef,
			focusDepositInput,
			focusWithdrawInput,

			// Balance refetch
			refetchBalances: refetchBalancesRef.current,
			setRefetchBalances,
		}),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[state, focusDepositInput, focusWithdrawInput] // Only 3 deps! Action creators are stable
	);

	return <DepositContext.Provider value={value}>{children}</DepositContext.Provider>;
}

export function useDepositContext() {
	const context = useContext(DepositContext);
	if (context === undefined) {
		throw new Error('useDepositContext must be used within DepositProvider');
	}
	return context;
}
