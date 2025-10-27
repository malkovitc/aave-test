import { useEffect } from 'react';
import { useDepositContext } from '../context/DepositContext';

/**
 * Syncs deposit/approve pending state to global context
 * Enables UI to show loaders on correct tokens across components
 */
export function useDepositContextSync(
	tokenSymbol: string,
	isApproving: boolean,
	isDepositing: boolean
) {
	const { setIsDepositing, setDepositingTokenSymbol } = useDepositContext();

	useEffect(() => {
		const isPending = isApproving || isDepositing;
		setIsDepositing(isPending);
		setDepositingTokenSymbol(isPending ? tokenSymbol : null);
	}, [isApproving, isDepositing, tokenSymbol, setIsDepositing, setDepositingTokenSymbol]);
}
