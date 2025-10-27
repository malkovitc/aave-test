import { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { SCROLL_WITH_FOCUS_DELAY_MS } from '@/shared/constants/timing';

interface DepositContextValue {
	// State for disabling buttons during deposit/withdraw
	isDepositing: boolean;
	setIsDepositing: (value: boolean) => void;
	isWithdrawing: boolean;
	setIsWithdrawing: (value: boolean) => void;

	// Refs for auto-focus after scroll
	depositInputRef: React.RefObject<HTMLInputElement>;
	withdrawInputRef: React.RefObject<HTMLInputElement>;
	focusDepositInput: () => void;
	focusWithdrawInput: () => void;
}

const DepositContext = createContext<DepositContextValue | undefined>(undefined);

/**
 * DepositProvider - Manages global deposit and withdraw state
 *
 * Purpose:
 * - Share `isDepositing`/`isWithdrawing` state to disable all buttons during transactions
 * - Provide shared refs for auto-focusing amount inputs after scroll
 *
 * Architecture:
 * - Follows existing pattern (similar to UserTokensContext)
 * - Keeps transaction orchestration logic separate from UI components
 * - Enables clean communication between cards and forms
 */
export function DepositProvider({ children }: { children: ReactNode }) {
	const [isDepositing, setIsDepositing] = useState(false);
	const [isWithdrawing, setIsWithdrawing] = useState(false);
	const depositInputRef = useRef<HTMLInputElement>(null);
	const withdrawInputRef = useRef<HTMLInputElement>(null);

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

	// Memoize context value to prevent unnecessary re-renders
	const value = useMemo(
		() => ({
			isDepositing,
			setIsDepositing,
			isWithdrawing,
			setIsWithdrawing,
			depositInputRef,
			withdrawInputRef,
			focusDepositInput,
			focusWithdrawInput,
		}),
		[isDepositing, isWithdrawing, focusDepositInput, focusWithdrawInput]
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
