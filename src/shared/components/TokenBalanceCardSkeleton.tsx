import { Skeleton } from '@/shared/ui/skeleton';

/**
 * TokenBalanceCardSkeleton component
 *
 * Loading placeholder for TokenBalanceCard component.
 * Displays card structure with skeleton elements during token data loading.
 *
 * Design:
 * - Matches TokenBalanceCard visual structure exactly
 * - Shows skeleton for token icon, symbol, name, balance, contract address, and button
 * - Provides visual feedback during initial token loading
 * - Fixed height to prevent CLS (Cumulative Layout Shift)
 *
 * Usage:
 * ```tsx
 * {isLoadingTokens ? (
 *   <>
 *     <TokenBalanceCardSkeleton />
 *     <TokenBalanceCardSkeleton />
 *     <TokenBalanceCardSkeleton />
 *   </>
 * ) : (
 *   tokens.map(token => <TokenBalanceCard key={token.symbol} token={token} />)
 * )}
 * ```
 */
export function TokenBalanceCardSkeleton() {
	return (
		<div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
			{/* Left Side: Icon + Info */}
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{/* Token icon skeleton */}
				<Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />

				<div className="min-w-0 flex-1 space-y-1.5">
					{/* Symbol + Name (on same line) - text-lg + text-base */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-[28px] w-16" />
						<Skeleton className="h-5 w-20" />
					</div>

					{/* Available Balance - text-base */}
					<Skeleton className="h-5 w-36" />

					{/* Contract Address + Copy Button - text-sm */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-3 rounded" />
					</div>
				</div>
			</div>

			{/* Right Side: Deposit Button */}
			<Skeleton className="h-9 w-[78px] rounded-md flex-shrink-0" />
		</div>
	);
}
