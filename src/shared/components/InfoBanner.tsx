import { Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Card } from '@/shared/ui/card';
import { getFaucetUrl } from '@/shared/lib/chain-config';

interface InfoBannerProps {
	className?: string;
}

/**
 * InfoBanner component displays important testnet information
 *
 * Figma spec: Card with info icon and faucet link
 * Positioned at top of main content, above token list
 */
export function InfoBanner({ className }: InfoBannerProps) {
	const { chain } = useAccount();
	const faucetUrl = chain ? getFaucetUrl(chain) : null;

	// Only show banner on testnets with faucet support
	if (!faucetUrl) return null;

	return (
		<Card className={`p-3 md:p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 ${className || ''}`}>
			<div className="flex items-start gap-3">
				<Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
				<p className="text-sm text-foreground break-words">
					This interface works on testnets. Use{' '}
					<a
						href={faucetUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary hover:underline font-medium"
					>
						Faucet
					</a>{' '}
					to get test tokens.
				</p>
			</div>
		</Card>
	);
}
