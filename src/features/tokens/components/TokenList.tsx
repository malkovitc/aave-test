import { Card, CardContent } from '@/shared/ui/card';
import { TokenRow } from './TokenRow';
import { useTokenBalances } from '../hooks/use-token-balances';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { TokenListSkeleton } from '@/shared/components/TokenListSkeleton';

/**
 * TokenList component - Displays user's token balances
 * Matches Figma design specs:
 *
 * Layout:
 * - Section heading: "Your tokens (available to deposit)"
 * - Spacing: mb-4 between heading and cards
 * - Gap: space-y-3 between TokenRow cards
 * - Empty state card when wallet not connected
 */
export function TokenList() {
	const { isConnected } = useWallet();
	const { balances, isLoading } = useTokenBalances();

	return (
		<div>
			<div className="mb-4">
				<h2 className="mb-1">Your tokens (available to deposit)</h2>
			</div>

			{isLoading ? (
				<TokenListSkeleton />
			) : !isConnected ? (
				<Card>
					<CardContent className="py-12 text-center">
						<p className="text-muted-foreground">Connect your wallet to view balances</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-3">
					{balances.map(({ token, formatted }) => (
						<TokenRow key={token.symbol} token={token} balance={formatted} />
					))}
				</div>
			)}
		</div>
	);
}
