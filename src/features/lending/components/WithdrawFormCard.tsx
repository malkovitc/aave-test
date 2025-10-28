import { forwardRef } from 'react';
import { TokenFormCard, type TokenFormCardRef } from './TokenFormCard';

export type { TokenFormCardRef as WithdrawFormCardRef };

/**
 * Withdraw form - wrapper around TokenFormCard with mode="withdraw"
 * Handles withdrawal from Aave positions.
 */
export const WithdrawFormCard = forwardRef<TokenFormCardRef>((_props, ref) => {
	return <TokenFormCard mode="withdraw" ref={ref} />;
});

WithdrawFormCard.displayName = 'WithdrawFormCard';
