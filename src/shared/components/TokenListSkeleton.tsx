import { Skeleton } from '@/shared/ui/skeleton';

/**
 * TokenListSkeleton component
 *
 * Loading placeholder for TokenList component.
 * Displays 3 skeleton rows matching the TokenRow component structure.
 *
 * Design:
 * - Matches TokenRow card dimensions (h-20)
 * - Spacing between rows (space-y-3)
 * - Provides visual feedback during data loading
 *
 * Usage:
 * ```tsx
 * <Suspense fallback={<TokenListSkeleton />}>
 *   <TokenList />
 * </Suspense>
 * ```
 */
export function TokenListSkeleton() {
	return (
		<div className="space-y-3">
			<TokenRowSkeleton />
			<TokenRowSkeleton />
			<TokenRowSkeleton />
		</div>
	);
}

/**
 * TokenRowSkeleton - Individual row skeleton
 * Matches TokenRow component structure with icon, text, and button
 */
function TokenRowSkeleton() {
	return (
		<div className="p-3 md:p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-2">
			<div className="flex items-center gap-2 md:gap-3 flex-1">
				{/* Token Icon Skeleton */}
				<Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />

				{/* Token Info Skeleton */}
				<div className="flex-1 space-y-2">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-24" />
					</div>
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-40" />
				</div>
			</div>

			{/* Button Skeleton */}
			<Skeleton className="h-9 w-20 rounded-lg" />
		</div>
	);
}
