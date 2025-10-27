import * as React from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Typography utility components
 * Following DRY principle - centralized text styling
 *
 * These components eliminate repetitive className strings like:
 * - "text-sm text-muted-foreground" (40+ occurrences)
 * - "text-xs text-muted-foreground" (repeated in many places)
 * - "text-sm text-destructive" (error messages)
 *
 * Benefits:
 * - Single source of truth for text styles
 * - Easy to update globally
 * - Better maintainability
 * - Type-safe props
 */

/**
 * SecondaryText component
 * For muted/secondary information text
 *
 * Usage: Balance labels, descriptions, hints
 * Replaces: "text-sm text-muted-foreground"
 *
 * @example
 * <SecondaryText>Available: {balance} ETH</SecondaryText>
 */
export const SecondaryText = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
	({ className, children, ...props }, ref) => (
		<span ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>
			{children}
		</span>
	)
);
SecondaryText.displayName = 'SecondaryText';

/**
 * HintText component
 * For small hints, helper text, captions
 *
 * Usage: Field hints, additional info, metadata
 * Replaces: "text-xs text-muted-foreground"
 *
 * @example
 * <HintText>Contract: {formatAddress(address)}</HintText>
 */
export const HintText = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
	({ className, children, ...props }, ref) => (
		<span ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props}>
			{children}
		</span>
	)
);
HintText.displayName = 'HintText';

/**
 * ErrorText component
 * For validation errors and error messages
 *
 * Usage: Form validation errors, critical messages
 * Replaces: "text-sm text-destructive"
 *
 * Accessibility:
 * - Includes role="alert" by default
 * - Accepts id prop for aria-describedby linkage
 *
 * @example
 * <ErrorText id="amount-error">Invalid amount or insufficient balance</ErrorText>
 */
export const ErrorText = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement> & {
		/**
		 * ID for aria-describedby linkage from form inputs
		 */
		id?: string;
	}
>(({ className, children, id, ...props }, ref) => (
	<p ref={ref} id={id} role="alert" className={cn('text-sm text-destructive', className)} {...props}>
		{children}
	</p>
));
ErrorText.displayName = 'ErrorText';

/**
 * LargeLabel component
 * For prominent labels and headings
 *
 * Usage: Section labels, emphasized text
 * Replaces: "text-lg font-medium"
 *
 * @example
 * <LargeLabel>Available Balance</LargeLabel>
 */
export const LargeLabel = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
	({ className, children, ...props }, ref) => (
		<span ref={ref} className={cn('text-lg font-medium', className)} {...props}>
			{children}
		</span>
	)
);
LargeLabel.displayName = 'LargeLabel';

/**
 * InfoText component (paragraph version of SecondaryText)
 * For longer secondary text blocks
 *
 * Usage: Descriptions, instructions, info paragraphs
 * Replaces: <p className="text-sm text-muted-foreground">
 *
 * @example
 * <InfoText>No tokens with balance in your wallet</InfoText>
 */
export const InfoText = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
	({ className, children, ...props }, ref) => (
		<p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>
			{children}
		</p>
	)
);
InfoText.displayName = 'InfoText';
