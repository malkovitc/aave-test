import { memo } from 'react';
import { Button } from '@/shared/ui/button';
import { ConnectKitButton } from 'connectkit';

/**
 * WalletButton component - ConnectKit integration
 *
 * Uses ConnectKit for professional multi-provider wallet connection
 * with proper icons and UI matching Figma design
 */
function WalletButtonComponent() {
	return (
		<ConnectKitButton.Custom>
			{({ isConnected, show, truncatedAddress, ensName }) => {
				if (isConnected) {
					return (
						<div className="flex items-center gap-2">
							<span className="hidden sm:inline text-sm md:text-base text-foreground">
								{ensName ?? truncatedAddress}
							</span>
							<Button type="button" variant="outline" size="sm" onClick={show} aria-label="Wallet menu">
								Disconnect
							</Button>
						</div>
					);
				}

				return (
					<Button type="button" size="sm" className="md:text-base" onClick={show} aria-label="Connect wallet">
						Connect Wallet
					</Button>
				);
			}}
		</ConnectKitButton.Custom>
	);
}

// Export memoized version to prevent unnecessary re-renders
export const WalletButton = memo(WalletButtonComponent);
