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

function PositionsTableComponent({ onWithdraw }: PositionsTableProps) {
	const { positions, isLoading } = useATokenBalances();
	const copyAddress = useClipboardToast('Address copied to clipboard');
	const { isWithdrawing, withdrawingTokenSymbol } = useDepositContext();

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
								{positions.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
											No positions yet. Deposit tokens to start earning interest.
										</TableCell>
									</TableRow>
								) : (
									<>
										{positions.map(({ token, aTokenAddress, formatted, raw, isOptimistic }) => {
										const isThisTokenWithdrawing = isWithdrawing && withdrawingTokenSymbol === token.symbol;

										return (
											<TableRow key={token.symbol} className={isOptimistic ? 'opacity-70' : ''}>
												<TableCell>
													<div>
														<span className="font-medium text-foreground">a{token.symbol}</span>
														<div className="md:hidden flex items-center gap-1 mt-1">
															<span className="text-xs text-muted-foreground">{formatAddress(aTokenAddress)}</span>
															<button
																type="button"
																onClick={() => copyAddress(aTokenAddress)}
																className="p-0.5 hover:opacity-70 transition-opacity text-muted-foreground"
																aria-label="Copy aToken address"
																disabled={isOptimistic}
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
															disabled={isOptimistic}
														>
															<Copy className="w-3 h-3" aria-hidden="true" />
														</button>
													</div>
												</TableCell>
												<TableCell className="text-right">
													<span className="text-foreground">{formatted}</span>
													{isOptimistic && (
														<span className="ml-1 text-xs text-muted-foreground">(pending)</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Button
														type="button"
														size="sm"
														variant="outline"
														onClick={() => handleWithdrawClick(token)}
														disabled={raw === 0n || isWithdrawing || isOptimistic}
														aria-label={`Withdraw ${token.symbol}`}
													>
														{isThisTokenWithdrawing ? (
															<>
																<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
																Withdrawing...
															</>
														) : isOptimistic ? (
															<>
																<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
																Depositing...
															</>
														) : (
															'Withdraw'
														)}
													</Button>
												</TableCell>
											</TableRow>
										);
									})}
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
