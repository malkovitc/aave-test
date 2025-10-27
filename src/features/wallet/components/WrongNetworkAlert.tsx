import { memo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { useWallet } from '../hooks/use-wallet';
import { DEFAULT_CHAIN } from '@/features/tokens/config/chains';
import { useSwitchChain } from 'wagmi';

/**
 * WrongNetworkAlert component
 *
 * Displays a warning when the user is connected to the wrong network
 * and provides a button to switch to the correct network.
 *
 * This is especially important for wallets like Trust Wallet that may
 * connect via WalletConnect on a different network than Sepolia.
 */
function WrongNetworkAlertComponent() {
	const { chain, isConnected } = useWallet();
	const { switchChain, isPending } = useSwitchChain();

	if (!isConnected || !chain) return null;

	const isCorrectNetwork = chain.id === DEFAULT_CHAIN.id;
	if (isCorrectNetwork) return null;

	const handleSwitchNetwork = () => {
		switchChain({ chainId: DEFAULT_CHAIN.id });
	};

	return (
		<Alert variant="destructive" className="mb-6">
			<AlertTitle>Wrong Network</AlertTitle>
			<AlertDescription className="flex flex-col gap-3">
				<p>
					You're connected to <strong>{chain.name}</strong>, but this app requires <strong>{DEFAULT_CHAIN.name}</strong>
					.
				</p>
				<Button onClick={handleSwitchNetwork} disabled={isPending} variant="outline" className="w-full sm:w-auto">
					{isPending ? 'Switching...' : `Switch to ${DEFAULT_CHAIN.name}`}
				</Button>
			</AlertDescription>
		</Alert>
	);
}

export const WrongNetworkAlert = memo(WrongNetworkAlertComponent);
