import { Suspense, useRef, useCallback } from 'react';
import { Providers } from './providers';
import { Layout } from '@/shared/components/Layout';
import { InfoBanner } from '@/shared/components/InfoBanner';
import { DepositFormCard, type DepositFormCardRef } from '@/features/lending/components/DepositFormCard';
import { WithdrawFormCard, type WithdrawFormCardRef } from '@/features/lending/components/WithdrawFormCard';
import { PositionsTable } from '@/features/lending/components/PositionsTable';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { PositionsTableSkeleton } from '@/shared/components/PositionsTableSkeleton';
import { TokenBalanceCardSkeleton } from '@/shared/components/TokenBalanceCardSkeleton';
import { TokenBalanceCard } from '@/features/tokens/components/TokenBalanceCard';
import { ConditionalWethWrapper } from '@/features/tokens/components/WethWrapper';
import { Card, CardContent } from '@/shared/ui/card';
import { type TokenConfig } from '@/features/tokens/config/tokens';
import { useUserTokensContext } from '@/features/tokens/context/UserTokensContext';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { useDepositContext } from '@/features/lending/context/DepositContext';
import { SCROLL_ANIMATION_DELAY_MS } from '@/shared/constants/timing';

function AppContent() {
	const { isConnected } = useWallet();
	const { tokens: allTokens, isLoading: isLoadingTokens } = useUserTokensContext();
	const { focusDepositInput, focusWithdrawInput } = useDepositContext();

	const tokens = allTokens.filter((t) => t.balance > 0n);

	const depositFormRef = useRef<DepositFormCardRef>(null);
	const withdrawFormRef = useRef<WithdrawFormCardRef>(null);
	const depositCardRef = useRef<HTMLDivElement>(null);
	const withdrawCardRef = useRef<HTMLDivElement>(null);

	const handleTokenDeposit = useCallback(
		(token: TokenConfig) => {
			depositFormRef.current?.selectToken(token.symbol);
			setTimeout(() => {
				depositCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				focusDepositInput();
			}, SCROLL_ANIMATION_DELAY_MS);
		},
		[focusDepositInput]
	);

	const handleTokenWithdraw = useCallback(
		(token: TokenConfig) => {
			withdrawFormRef.current?.selectToken(token.symbol);
			setTimeout(() => {
				withdrawCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				focusWithdrawInput();
			}, SCROLL_ANIMATION_DELAY_MS);
		},
		[focusWithdrawInput]
	);

	return (
		<Layout>
			{/* Info Banner - Testnet notice */}
			<InfoBanner className="mb-4 md:mb-6" />

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-6">
				{/* Left Column - 60% (7 cols) */}
				<div className="lg:col-span-7 space-y-6 md:space-y-6">
					{/* Token Balance Section */}
					<div>
						<div className="mb-4">
							<h2 className="text-xl font-medium text-foreground mb-1">Your tokens</h2>
							<p className="text-sm text-muted-foreground">Tokens in your wallet that can be deposited</p>
						</div>

						{isLoadingTokens ? (
							// Show skeleton only when loading
							<div className="space-y-3">
								<TokenBalanceCardSkeleton />
								<TokenBalanceCardSkeleton />
								<TokenBalanceCardSkeleton />
							</div>
						) : !isConnected ? (
							<Card>
								<CardContent className="py-12 text-center">
									<p className="text-muted-foreground">Connect your wallet to view balances</p>
								</CardContent>
							</Card>
						) : tokens.length > 0 ? (
							<div className="space-y-3">
								{tokens.map((token) => (
									<TokenBalanceCard
										key={token.symbol}
										token={token}
										balance={'balanceFormatted' in token ? token.balanceFormatted : '0'}
										onDeposit={() => handleTokenDeposit(token)}
									/>
								))}
							</div>
						) : (
							<Card>
								<CardContent className="py-12 text-center">
									<p className="text-muted-foreground">No tokens with balance found in your wallet</p>
									<p className="text-sm text-muted-foreground mt-2">
										Get test tokens from Aave faucet to start depositing
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Deposit Form */}
					<div ref={depositCardRef}>
						<DepositFormCard ref={depositFormRef} />
					</div>
				</div>

				{/* Right Column - 40% (5 cols) */}
				<div className="lg:col-span-5 space-y-6 md:space-y-6">
					{/* WETH Wrapper - Only show when user has ETH but no WETH */}
					<ConditionalWethWrapper />
					<Suspense fallback={<PositionsTableSkeleton />}>
						<PositionsTable onWithdraw={handleTokenWithdraw} />
					</Suspense>

					{/* Withdraw Form */}
					<div ref={withdrawCardRef}>
						<WithdrawFormCard ref={withdrawFormRef} />
					</div>
				</div>
			</div>
		</Layout>
	);
}

function App() {
	return (
		<ErrorBoundary>
			<Providers>
				<AppContent />
			</Providers>
		</ErrorBoundary>
	);
}

export default App;
