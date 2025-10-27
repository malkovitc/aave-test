import { memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { Copy, Loader2 } from 'lucide-react';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { PositionsTableSkeleton } from '@/shared/components/PositionsTableSkeleton';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useClipboardToast } from '@/shared/hooks/use-clipboard-toast';
import { formatAddress } from '@/shared/lib/format-address';
import { useDepositContext } from '../context/DepositContext';

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
	const { positions, isLoading } = useATokenBalances();
	const copyAddress = useClipboardToast('Address copied to clipboard');
	const { isWithdrawing, withdrawingTokenSymbol, isDepositing, depositingTokenSymbol } = useDepositContext();

	// Calculate existing token symbols from positions
	const existingTokenSymbols = new Set(positions.map((p) => p.token.symbol));

	// Check if we should show a pending row for the token being deposited
	const shouldShowPendingRow = isDepositing && depositingTokenSymbol && !existingTokenSymbols.has(depositingTokenSymbol);

	// Memoize withdraw click handler
	const handleWithdrawClick = useCallback(
		(token: TokenConfig): void => {
			if (onWithdraw) {
				onWithdraw(token);
			}
		},
		[onWithdraw]
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Your positions (aTokens)</CardTitle>
				<CardDescription>View your deposited assets and interest-bearing aTokens</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Show skeleton during loading */}
				{isLoading ? (
					<div className="overflow-x-auto">
						<PositionsTableSkeleton />
					</div>
				) : (
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
								{positions.length === 0 && !shouldShowPendingRow ? (
									<TableRow>
										<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
											No positions yet. Deposit tokens to start earning interest.
										</TableCell>
									</TableRow>
								) : (
									<>
										{positions.map(({ token, aTokenAddress, formatted, raw }) => {
										// Check if THIS specific token is being withdrawn
										const isThisTokenWithdrawing = isWithdrawing && withdrawingTokenSymbol === token.symbol;

										return (
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
														disabled={raw === 0n || isWithdrawing}
														aria-label={`Withdraw ${token.symbol}`}
													>
														{isThisTokenWithdrawing ? (
															<>
																<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
																Withdrawing...
															</>
														) : (
															'Withdraw'
														)}
													</Button>
												</TableCell>
											</TableRow>
										);
									})}

										{/* Show pending row for new token being deposited */}
										{shouldShowPendingRow && (
											<TableRow key={`pending-${depositingTokenSymbol}`} className="animate-pulse">
												<TableCell>
													<div>
														<span className="font-medium text-muted-foreground">a{depositingTokenSymbol}</span>
													</div>
												</TableCell>
												<TableCell className="hidden md:table-cell">
													<div className="h-4 w-24 bg-muted rounded animate-pulse" />
												</TableCell>
												<TableCell className="text-right">
													<div className="flex justify-end">
														<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
													</div>
												</TableCell>
												<TableCell className="text-right">
													<Button type="button" size="sm" variant="outline" disabled>
														<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
														Pending...
													</Button>
												</TableCell>
											</TableRow>
										)}
									</>
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// Export memoized version to prevent unnecessary re-renders
export const PositionsTable = memo(PositionsTableComponent);
