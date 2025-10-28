import { forwardRef } from 'react';
import { TokenFormCard, type TokenFormCardRef } from './TokenFormCard';

export type { TokenFormCardRef as DepositFormCardRef };

/**
 * Deposit form - wrapper around TokenFormCard with mode="deposit"
 * Handles approval + deposit flow with supplyWithPermit for supported tokens.
 */
export const DepositFormCard = forwardRef<TokenFormCardRef>((_props, ref) => {
	return <TokenFormCard mode="deposit" ref={ref} />;
});

DepositFormCard.displayName = 'DepositFormCard';
