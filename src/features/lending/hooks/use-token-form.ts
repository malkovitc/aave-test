import { useState, useEffect, useCallback, useMemo } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { sanitizeAmountInput } from '@/shared/lib/amount';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { DEBOUNCE_DELAY_MS } from '@/shared/constants/timing';

/**
 * Shared form logic for Deposit and Withdraw forms.
 * Uncontrolled - manages state internally, exposes imperative selectToken() API.
 */
export function useTokenForm(filterTokens?: (tokens: TokenConfig[]) => TokenConfig[]) {
	const { tokens: allTokens, isLoading: isLoadingTokens } = useUserTokensContext();
	const { isConnected } = useWallet();

	const tokens = useMemo(() => (filterTokens ? filterTokens(allTokens) : allTokens), [allTokens, filterTokens]);
	const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);
	const [localAmount, setLocalAmount] = useState('');
	const debouncedAmount = useDebouncedValue(localAmount, DEBOUNCE_DELAY_MS);

	useEffect(() => {
		if (!isConnected) {
			setSelectedToken(null);
			setLocalAmount('');
		}
	}, [isConnected]);

	// Auto-select first token if no token selected OR selected token is no longer in the list
	useEffect(() => {
		if (tokens.length === 0) return;

		// If no token selected, select first
		if (!selectedToken) {
			setSelectedToken(tokens[0]!);
			return;
		}

		// If selected token is no longer in the filtered list (e.g., balance became 0), select first
		const isSelectedTokenInList = tokens.some((t) => t.symbol === selectedToken.symbol);
		if (!isSelectedTokenInList) {
			setSelectedToken(tokens[0]!);
		}
	}, [tokens, selectedToken]);
	const safeToken = selectedToken ||
		tokens[0] || {
			symbol: '',
			name: '',
			address: '0x0000000000000000000000000000000000000000' as const,
			decimals: 18,
			supportsPermit: false,
		};

	const handleAmountChange = useCallback(
		(value: string) => {
			if (!selectedToken) return;
			const sanitized = sanitizeAmountInput(value, selectedToken.decimals);
			if (sanitized !== null) {
				setLocalAmount(sanitized);
			}
		},
		[selectedToken]
	);

	const handleMaxClick = useCallback(
		(balanceFormatted: string, onSet: (amount: string) => void) => {
			if (!selectedToken) return;
			const sanitized = sanitizeAmountInput(balanceFormatted, selectedToken.decimals);
			const maxAmount = sanitized ?? balanceFormatted;
			setLocalAmount(maxAmount);
			onSet(maxAmount);
		},
		[selectedToken]
	);

	const clearAmount = useCallback(() => {
		setLocalAmount('');
	}, []);

	const selectToken = useCallback(
		(symbol: string) => {
			const token = tokens.find((t) => t.symbol === symbol);
			if (token) {
				setSelectedToken(token);
				setLocalAmount('');
			}
		},
		[tokens]
	);

	return {
		tokens,
		isLoadingTokens,
		selectedToken,
		setSelectedToken,
		safeToken,
		localAmount,
		debouncedAmount,
		handleAmountChange,
		handleMaxClick,
		clearAmount,
		selectToken,
	};
}
