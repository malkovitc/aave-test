import { memo } from 'react';
import { Badge } from '@/shared/ui/badge';
import { useWallet } from '../hooks/use-wallet';
import { DEFAULT_CHAIN } from '@/features/tokens/config/chains';

/**
 * NetworkBadge component
 *
 * Displays the current network with visual indication of correctness.
 * Shows default badge for correct network, destructive for wrong network.
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders
 * - Only re-renders when wallet connection state changes
 */
function NetworkBadgeComponent() {
	const { chain, isConnected } = useWallet();

	if (!isConnected || !chain) return null;

	const isCorrectNetwork = chain.id === DEFAULT_CHAIN.id;

	return <Badge variant={isCorrectNetwork ? 'default' : 'destructive'}>{chain.name}</Badge>;
}

// Export memoized version to prevent unnecessary re-renders
export const NetworkBadge = memo(NetworkBadgeComponent);
