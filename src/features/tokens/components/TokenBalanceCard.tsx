import { memo, useCallback } from 'react';
import { Button } from '@/shared/ui/button';
import { TokenIcon } from '@/shared/components/TokenIcon';
import { Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatAddress } from '@/shared/lib/format-address';
import { useDepositContext } from '@/features/lending/context/DepositContext';
import type { TokenConfig } from '../config/tokens';

interface TokenBalanceCardProps {
	token: TokenConfig;
	balance: string;
	onDeposit: () => void;
}

/**
 * TokenBalanceCard component
 *
 * Matches Figma design exactly:
 * - Rounded card with border
 * - TokenIcon (40px) on left
 * - Token info (symbol, name, balance, contract address)
 * - Copy button for contract address
 * - Deposit button on right
 *
 * Design specs from Figma:
 * - Container: rounded-xl, border, p-3 md:p-4
 * - Layout: flex items-center justify-between
 * - Gap: gap-2 md:gap-3
 */
function TokenBalanceCardComponent({ token, balance, onDeposit }: TokenBalanceCardProps) {
	const { isDepositing, depositingTokenSymbol } = useDepositContext();

	// Check if THIS specific token is being deposited
	const isThisTokenDepositing = isDepositing && depositingTokenSymbol === token.symbol;

	const copyAddress = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(token.address);
			toast.success('Address copied to clipboard');
		} catch {
			// Fallback for browsers without clipboard API
			const textArea = document.createElement('textarea');
			textArea.value = token.address;
			textArea.style.position = 'fixed';
			textArea.style.left = '-999999px';
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				toast.success('Address copied to clipboard');
			} catch {
				toast.error('Failed to copy address');
			}
			document.body.removeChild(textArea);
		}
	}, [token.address]);

	return (
		<div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
			{/* Left Side: Icon + Info */}
			<div className="flex items-center gap-3 min-w-0 flex-1">
				<TokenIcon symbol={token.symbol} size={40} className="flex-shrink-0" />

				<div className="min-w-0 flex-1">
					{/* Symbol + Name */}
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-lg font-medium text-foreground">{token.symbol}</span>
						<span className="text-sm md:text-base text-muted-foreground truncate max-w-[120px] sm:max-w-[180px] md:max-w-none">
							{token.name}
						</span>
					</div>

					{/* Available Balance */}
					<div className="text-sm md:text-base text-foreground">
						Available: <span className="font-medium">{balance}</span>
					</div>

					{/* Contract Address */}
					<div className="flex items-center gap-2 mt-1">
						<span className="text-xs md:text-sm truncate text-muted-foreground">
							Contract: {formatAddress(token.address)}
						</span>
						<button
							onClick={copyAddress}
							className="p-0.5 hover:opacity-70 transition-opacity flex-shrink-0 text-muted-foreground"
							aria-label="Copy contract address"
						>
							<Copy className="w-3 h-3" />
						</button>
					</div>
				</div>
			</div>

			{/* Right Side: Deposit Button */}
			<Button
				size="sm"
				onClick={onDeposit}
				disabled={isDepositing}
				className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4"
			>
				{isThisTokenDepositing ? (
					<>
						<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
						<span className="hidden sm:inline">Depositing...</span>
						<span className="sm:hidden">...</span>
					</>
				) : (
					'Deposit'
				)}
			</Button>
		</div>
	);
}

// Export memoized version to prevent unnecessary re-renders
export const TokenBalanceCard = memo(TokenBalanceCardComponent);
