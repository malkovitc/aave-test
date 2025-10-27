import * as React from 'react';
import { cn } from '@/shared/lib/cn';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Status message variants with their styling
 * Following Open/Closed Principle - easy to extend with new variants
 */
const STATUS_VARIANTS = {
	success: {
		container: 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200',
		icon: CheckCircle2,
		iconColor: 'text-green-600 dark:text-green-400',
	},
	error: {
		container: 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200',
		icon: AlertCircle,
		iconColor: 'text-red-600 dark:text-red-400',
	},
	info: {
		container: 'bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200',
		icon: Info,
		iconColor: 'text-blue-600 dark:text-blue-400',
	},
	warning: {
		container: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200',
		icon: AlertCircle,
		iconColor: 'text-yellow-600 dark:text-yellow-400',
	},
} as const;

export type StatusType = keyof typeof STATUS_VARIANTS;

export interface StatusMessageProps extends React.HTMLAttributes<HTMLDivElement> {
	/**
	 * Visual variant of the status message
	 * @default 'success'
	 */
	type?: StatusType;

	/**
	 * Optional link to display at the end (e.g., "View on Explorer")
	 */
	link?: {
		href: string;
		text: string;
	};

	/**
	 * Show icon before the message
	 * @default true
	 */
	showIcon?: boolean;
}

/**
 * StatusMessage component
 * Displays success, error, info, or warning messages
 *
 * Replaces repeated patterns like:
 * - WethWrapper.tsx:128-141 (success message)
 * - WethWrapper.tsx:144-157 (success message)
 * - Inline success/error notifications throughout the app
 *
 * Features:
 * - Consistent styling across all status messages
 * - Optional icon
 * - Optional action link
 * - Dark mode support
 * - Accessibility: proper color contrast
 *
 * Benefits:
 * - DRY: Single source of truth for status messages
 * - Easy to update styling globally
 * - Type-safe variants
 * - Extensible with new variants
 *
 * @example
 * // Success message with link
 * <StatusMessage
 *   type="success"
 *   link={{ href: txUrl, text: 'View on Explorer' }}
 * >
 *   Successfully wrapped ETH to WETH!
 * </StatusMessage>
 *
 * @example
 * // Error message without icon
 * <StatusMessage type="error" showIcon={false}>
 *   Transaction failed. Please try again.
 * </StatusMessage>
 *
 * @example
 * // Info message
 * <StatusMessage type="info">
 *   Your transaction is being processed...
 * </StatusMessage>
 */
export const StatusMessage = React.forwardRef<HTMLDivElement, StatusMessageProps>(
	({ type = 'success', link, showIcon = true, className, children, ...props }, ref) => {
		const variant = STATUS_VARIANTS[type];
		const Icon = variant.icon;

		return (
			<div
				ref={ref}
				className={cn('p-3 rounded-lg text-sm flex items-start gap-2', variant.container, className)}
				{...props}
			>
				{/* Icon */}
				{showIcon && <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', variant.iconColor)} aria-hidden="true" />}

				{/* Content */}
				<div className="flex-1 min-w-0">
					<span>{children}</span>

					{/* Optional Link */}
					{link && (
						<a
							href={link.href}
							target="_blank"
							rel="noopener noreferrer"
							className="ml-2 underline hover:opacity-80 transition-opacity"
						>
							{link.text}
						</a>
					)}
				</div>
			</div>
		);
	}
);
StatusMessage.displayName = 'StatusMessage';

/**
 * Pre-configured variants for common use cases
 * Convenience exports for better DX
 */
export const SuccessMessage = React.forwardRef<
	HTMLDivElement,
	Omit<StatusMessageProps, 'type'> & { type?: 'success' }
>((props, ref) => <StatusMessage ref={ref} type="success" {...props} />);
SuccessMessage.displayName = 'SuccessMessage';

export const ErrorMessage = React.forwardRef<HTMLDivElement, Omit<StatusMessageProps, 'type'> & { type?: 'error' }>(
	(props, ref) => <StatusMessage ref={ref} type="error" {...props} />
);
ErrorMessage.displayName = 'ErrorMessage';

export const InfoMessage = React.forwardRef<HTMLDivElement, Omit<StatusMessageProps, 'type'> & { type?: 'info' }>(
	(props, ref) => <StatusMessage ref={ref} type="info" {...props} />
);
InfoMessage.displayName = 'InfoMessage';

export const WarningMessage = React.forwardRef<HTMLDivElement, Omit<StatusMessageProps, 'type'> & { type?: 'warning' }>(
	(props, ref) => <StatusMessage ref={ref} type="warning" {...props} />
);
WarningMessage.displayName = 'WarningMessage';
