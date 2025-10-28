import { useMemo, useCallback } from 'react';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
import type { TokenConfig } from '@/features/tokens/config/tokens';

interface FormFlowState {
	isValidAmount: boolean;
	isLoading: boolean;
	needsApproval?: boolean;
	isApproving?: boolean;
	isDepositing?: boolean;
	isWithdrawing?: boolean;
}

interface FormStateParams {
	mode: 'deposit' | 'withdraw';
	isConnected: boolean;
	isWrongNetwork: boolean;
	tokens: TokenConfig[];
	selectedToken: TokenConfig | null;
	localAmount: string;
	debouncedAmount: string;
	balanceFormatted: string;
	safeToken: TokenConfig;
	depositFlow: FormFlowState;
	withdrawFlow: FormFlowState;
}

/**
 * Custom hook to encapsulate all form state logic and derived values
 * Reduces complexity in the main component and improves testability
 */
export function useFormState(params: FormStateParams) {
	const {
		mode,
		isConnected,
		isWrongNetwork,
		tokens,
		selectedToken,
		localAmount,
		debouncedAmount,
		balanceFormatted,
		safeToken,
		depositFlow,
		withdrawFlow,
	} = params;

	const flow = mode === 'deposit' ? depositFlow : withdrawFlow;

	// Local validation
	const isLocallyValid = useAmountValidation(debouncedAmount, balanceFormatted, safeToken.decimals);

	// Validation state (for aria-invalid and error display)
	const showValidationError = useMemo(() => {
		if (mode === 'deposit') {
			return debouncedAmount !== '' && !isLocallyValid;
		}
		return localAmount !== '' && localAmount === debouncedAmount && !flow.isValidAmount;
	}, [mode, debouncedAmount, isLocallyValid, localAmount, flow.isValidAmount]);

	// Base disabled conditions (common for all inputs/buttons)
	const hasBaseDisabledConditions = useMemo(() => {
		return !isConnected || flow.isLoading || tokens.length === 0;
	}, [isConnected, flow.isLoading, tokens.length]);

	// Input disabled: base conditions + wrong network + no token selected
	const isInputDisabled = useMemo(() => {
		return hasBaseDisabledConditions || isWrongNetwork || !selectedToken;
	}, [hasBaseDisabledConditions, isWrongNetwork, selectedToken]);

	// Primary button disabled: base conditions + invalid amount + loading state
	const isPrimaryButtonDisabled = useMemo(() => {
		return hasBaseDisabledConditions || !flow.isValidAmount || flow.isLoading;
	}, [hasBaseDisabledConditions, flow.isValidAmount, flow.isLoading]);

	// Token lookup map for O(1) access (instead of O(n) find)
	const tokensBySymbol = useMemo(() => {
		return new Map(tokens.map((token) => [token.symbol, token]));
	}, [tokens]);

	// Handle token selection (memoized for performance)
	const handleTokenSelect = useCallback(
		(symbol: string) => {
			const token = tokensBySymbol.get(symbol);
			if (token) {
				return token;
			}
			return null;
		},
		[tokensBySymbol]
	);

	// Button label configuration using state-based dictionary pattern
	const WITHDRAW_LABELS = {
		withdrawing: 'Withdrawing...',
		idle: 'Withdraw',
	} as const;

	const DEPOSIT_LABELS = {
		approving: 'Approving...',
		depositing: 'Depositing...',
		needsApproval: 'Approve',
		needsApprovalTyping: 'Approve',
		typing: 'Deposit',
		idle: 'Deposit',
	} as const;

	// Helper function to determine current deposit state and return label
	const getDepositLabel = useCallback((): string => {
		const isTyping = localAmount !== debouncedAmount && localAmount !== '';
		const { isApproving, isDepositing, needsApproval } = depositFlow;

		// State priority mapping - checked in order from highest to lowest priority
		const stateKey = [
			isApproving && 'approving',
			isDepositing && 'depositing',
			isTyping && needsApproval && 'needsApprovalTyping',
			isTyping && 'typing',
			needsApproval && 'needsApproval',
			'idle',
		].find(Boolean) as keyof typeof DEPOSIT_LABELS;

		return DEPOSIT_LABELS[stateKey];
		// DEPOSIT_LABELS is a const defined in the same function scope and never changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [localAmount, debouncedAmount, depositFlow]);

	// Helper function to determine current withdraw state and return label
	const getWithdrawLabel = useCallback((): string => {
		const stateKey = (withdrawFlow.isWithdrawing ? 'withdrawing' : 'idle') as keyof typeof WITHDRAW_LABELS;
		return WITHDRAW_LABELS[stateKey];
		// WITHDRAW_LABELS is a const defined in the same function scope and never changes
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [withdrawFlow.isWithdrawing]);

	// Single expression to get button label based on mode
	const buttonLabel = useMemo(
		() => (mode === 'withdraw' ? getWithdrawLabel() : getDepositLabel()),
		[mode, getDepositLabel, getWithdrawLabel]
	);

	return {
		showValidationError,
		isInputDisabled,
		isPrimaryButtonDisabled,
		handleTokenSelect,
		buttonLabel,
	};
}
