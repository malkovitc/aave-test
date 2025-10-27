import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';
import { Skeleton } from '@/shared/ui/skeleton';

/**
 * PositionsTableSkeleton component
 *
 * Loading placeholder for PositionsTable component.
 * Displays table structure with skeleton rows during data loading.
 *
 * Design:
 * - Matches PositionsTable card structure
 * - Shows 3 skeleton rows in table format
 * - Responsive column visibility (hidden on mobile for aToken Address)
 * - Provides visual feedback during loading
 * - Fixed minimum height to prevent CLS (Cumulative Layout Shift)
 *
 * Usage:
 * ```tsx
 * <Suspense fallback={<PositionsTableSkeleton />}>
 *   <PositionsTable />
 * </Suspense>
 * ```
 */
export function PositionsTableSkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Your positions (aTokens)</CardTitle>
				<CardDescription>View your deposited assets and interest-bearing aTokens</CardDescription>
			</CardHeader>
			<CardContent>
				{/* Fixed min-height to prevent layout shift when content loads */}
				<div className="overflow-x-auto min-h-[280px]">
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
							<PositionRowSkeleton />
							<PositionRowSkeleton />
							<PositionRowSkeleton />
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * PositionRowSkeleton - Individual table row skeleton
 * Matches PositionsTable row structure
 */
function PositionRowSkeleton() {
	return (
		<TableRow>
			{/* Asset column */}
			<TableCell>
				<Skeleton className="h-5 w-16" />
			</TableCell>

			{/* aToken Address column (hidden on mobile) */}
			<TableCell className="hidden md:table-cell">
				<div className="flex items-center gap-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-4 w-4" />
				</div>
			</TableCell>

			{/* Balance column */}
			<TableCell className="text-right">
				<Skeleton className="h-5 w-20 ml-auto" />
			</TableCell>

			{/* Action column */}
			<TableCell className="text-right">
				<Skeleton className="h-8 w-20 ml-auto rounded-md" />
			</TableCell>
		</TableRow>
	);
}
