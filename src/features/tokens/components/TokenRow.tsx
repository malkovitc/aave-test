import { memo, useMemo, useCallback } from 'react';
import { type TokenConfig } from '../config/tokens';
import { Copy } from 'lucide-react';
import { TokenIcon } from '@/shared/components/TokenIcon';
import { useClipboardToast } from '@/shared/hooks/use-clipboard-toast';

interface TokenRowProps {
	token: TokenConfig;
	balance: string;
}

/**
 * TokenRow component - Displays token balance card
 * Matches Figma design: TokenBalanceCard
 *
 * Design specs from Figma:
 * - Padding: p-3 md:p-4
 * - Border radius: rounded-xl (12px)
 * - Background: var(--card) with border
 * - Token icon: 40px circular with color background
 * - Contract address with copy button
 * - Responsive layout
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Formatted address cached with useMemo
 * - Copy handler memoized with useCallback
 */
function TokenRowComponent({ token, balance }: TokenRowProps) {
	const copyAddress = useClipboardToast('Address copied to clipboard');

	// Memoize formatted address to avoid recalculating on every render
	const formattedAddress = useMemo(() => `${token.address.slice(0, 6)}...${token.address.slice(-4)}`, [token.address]);

	// Memoize click handler to prevent DepositDialog re-renders
	const handleCopyClick = useCallback(() => {
		copyAddress(token.address);
	}, [copyAddress, token.address]);

	return (
		<div className="p-3 md:p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-2">
			<div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
				<TokenIcon symbol={token.symbol} size={40} className="flex-shrink-0" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<span className="font-medium text-foreground">{token.symbol}</span>
						<span className="text-sm md:text-base text-muted-foreground">{token.name}</span>
					</div>
					<div className="text-sm md:text-base text-foreground">
						Available: <span className="font-medium">{balance}</span>
					</div>
					<div className="flex items-center gap-2 mt-1">
						<span className="text-xs md:text-sm truncate text-muted-foreground">Contract: {formattedAddress}</span>
						<button
							onClick={handleCopyClick}
							className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0 text-muted-foreground"
							aria-label="Copy contract address"
							type="button"
						>
							<Copy className="w-3 h-3" />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

// Export memoized version to prevent unnecessary re-renders
// Only re-render if token or balance changes
export const TokenRow = memo(TokenRowComponent);
