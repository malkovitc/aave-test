import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

/**
 * ErrorBoundary component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 *
 * With custom fallback:
 * ```tsx
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
	public override state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error };
	}

	public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log error to error reporting service
		console.error('Uncaught error:', error, errorInfo);

		// Call optional error callback
		this.props.onError?.(error, errorInfo);
	}

	private handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	public override render() {
		if (this.state.hasError) {
			// Custom fallback provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default fallback UI
			return (
				<div className="min-h-screen bg-bg flex items-center justify-center p-4">
					<Card className="max-w-md w-full">
						<CardHeader>
							<div className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-danger" />
								<CardTitle>Something went wrong</CardTitle>
							</div>
							<CardDescription>An unexpected error occurred. Please try refreshing the page.</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{process.env.NODE_ENV === 'development' && this.state.error && (
								<div className="bg-muted p-3 rounded-md">
									<p className="text-xs font-mono text-destructive break-all">{this.state.error.toString()}</p>
								</div>
							)}
							<div className="flex gap-2">
								<Button onClick={this.handleReset} variant="outline" className="flex-1">
									Try again
								</Button>
								<Button onClick={() => window.location.reload()} className="flex-1">
									Reload page
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			);
		}

		return this.props.children;
	}
}
