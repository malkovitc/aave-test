import { memo } from 'react';
import { WalletButton } from '@/features/wallet/components/WalletButton';
import { WrongNetworkAlert } from '@/features/wallet/components/WrongNetworkAlert';

interface LayoutProps {
	children: React.ReactNode;
}

/**
 * Layout component - Main app layout with header
 * Matches Figma design specs:
 *
 * Header:
 * - Height: h-16
 * - Padding: px-4 md:px-20
 * - Border bottom: var(--border)
 * - Logo: 32px rounded square with primary background
 * - Title: "Aave Lite" with "(Testnet)" label hidden on mobile
 *
 * Main:
 * - Padding: px-4 md:px-20, py-4 md:py-8
 * - Background: var(--bg)
 *
 * Accessibility:
 * - Semantic HTML tags (header, nav, main)
 * - Proper heading hierarchy
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Only re-renders when children change
 */
function LayoutComponent({ children }: LayoutProps) {
	return (
		<div className="min-h-screen bg-bg">
			{/* Header with Navigation */}
			<header className="border-b border-border">
				<nav className="mx-auto px-4 md:px-20" aria-label="Main navigation">
					<div className="flex items-center justify-between h-16">
						{/* Logo and Title */}
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center" aria-hidden="true">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
									<path
										d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
										stroke="white"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M12 12L22 7M12 12L2 7M12 12V22"
										stroke="white"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
							<h1 className="font-semibold text-sm md:text-base text-foreground">
								Aave Lite <span className="hidden sm:inline text-muted-foreground">(Testnet)</span>
							</h1>
						</div>

						{/* Right: Wallet Button */}
						<div className="flex items-center gap-2 md:gap-4">
							<WalletButton />
						</div>
					</div>
				</nav>
			</header>

			{/* Main Content */}
			<main className="mx-auto px-4 md:px-20 py-4 md:py-8">
				<WrongNetworkAlert />
				{children}
			</main>
		</div>
	);
}

// Export memoized version to prevent unnecessary re-renders
export const Layout = memo(LayoutComponent);
