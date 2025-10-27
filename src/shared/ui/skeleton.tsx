import { cn } from '@/shared/lib/cn';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn('relative overflow-hidden rounded-md bg-muted/40', className)} {...props}>
			<div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
		</div>
	);
}

export { Skeleton };
