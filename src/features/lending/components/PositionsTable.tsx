import { memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Copy } from 'lucide-react';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { PositionsTableSkeleton } from '@/shared/components/PositionsTableSkeleton';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useClipboardToast } from '@/shared/hooks/use-clipboard-toast';
import { formatAddress } from '@/shared/lib/format-address';

interface PositionsTableProps {
	onWithdraw?: (token: TokenConfig) => void;
}

/**
 * PositionsTable component
 *
 * Displays user's aToken positions (deposited assets earning interest).
 * Shows balance and allows withdrawal.
 *
 * Features:
 * - Responsive table layout
 * - Copy aToken address functionality
 * - Withdraw callback integration (scrolls to WithdrawFormCard)
 * - Loading and empty states
 *
 * Accessibility:
 * - Proper button types and aria-labels
 * - Table semantics for screen readers
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Callbacks memoized with useCallback
 */
function PositionsTableComponent({ onWithdraw }: PositionsTableProps) {
	const { isConnected } = useWallet();
	const { positions, isLoading } = useATokenBalances();
	const copyAddress = useClipboardToast('Address copied to clipboard');

	// Memoize withdraw click handler
	const handleWithdrawClick = useCallback(
		(token: TokenConfig): void => {
			if (onWithdraw) {
				onWithdraw(token);
			}
		},
		[onWithdraw]
	);

	// Show skeleton during loading OR when not connected (prevents flash during reconnection)
	if (isLoading || !isConnected) {
		return <PositionsTableSkeleton />;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your positions (aTokens)</CardTitle>
				<CardDescription>View your deposited assets and interest-bearing aTokens</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Asset</TableHead>
								<TableHead className="hidden md:table-cell">aToken Address</TableHead>
								<TableHead className="text-right">Balance</TableHead>
								<TableHead className="text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{positions.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
										No positions yet. Deposit tokens to start earning interest.
									</TableCell>
								</TableRow>
							) : (
								positions.map(({ token, aTokenAddress, formatted, raw }) => (
									<TableRow key={token.symbol}>
										<TableCell>
											<div>
												<span className="font-medium text-foreground">a{token.symbol}</span>
												{/* Mobile: show address below */}
												<div className="md:hidden flex items-center gap-1 mt-1">
													<span className="text-xs text-muted-foreground">{formatAddress(aTokenAddress)}</span>
													<button
														type="button"
														onClick={() => copyAddress(aTokenAddress)}
														className="p-0.5 hover:opacity-70 transition-opacity text-muted-foreground"
														aria-label="Copy aToken address"
													>
														<Copy className="w-3 h-3" aria-hidden="true" />
													</button>
												</div>
											</div>
										</TableCell>
										<TableCell className="hidden md:table-cell">
											<div className="flex items-center gap-2">
												<span className="text-muted-foreground">{formatAddress(aTokenAddress)}</span>
												<button
													type="button"
													onClick={() => copyAddress(aTokenAddress)}
													className="p-0.5 hover:opacity-70 transition-opacity text-muted-foreground"
													aria-label="Copy aToken address"
												>
													<Copy className="w-3 h-3" aria-hidden="true" />
												</button>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<span className="text-foreground">{formatted}</span>
										</TableCell>
										<TableCell className="text-right">
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() => handleWithdrawClick(token)}
												disabled={raw === 0n}
												aria-label={`Withdraw ${token.symbol}`}
											>
												Withdraw
											</Button>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

// Export memoized version to prevent unnecessary re-renders
export const PositionsTable = memo(PositionsTableComponent);
