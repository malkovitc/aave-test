import { useState, useCallback } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';

export function useDepositAmount(token: TokenConfig, balance: string) {
	const [amount, setAmount] = useState('');

	const isValid = useAmountValidation(amount, balance, token.decimals);

	const handleMaxClick = useCallback(() => {
		setAmount(balance);
	}, [balance]);

	const clearAmount = useCallback(() => {
		setAmount('');
	}, []);

	return {
		amount,
		setAmount,
		isValid,
		handleMaxClick,
		clearAmount,
	};
}
