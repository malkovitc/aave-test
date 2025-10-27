import { useAccount, useConnect, useDisconnect, useBalance, useSwitchChain } from 'wagmi';
import { DEFAULT_CHAIN } from '@/features/tokens/config/chains';
import { formatAddress } from '@/shared/lib/format-address';

export function useWallet() {
	const { address, isConnected, chain, chainId } = useAccount();
	const { connect, connectors, isPending: isConnecting } = useConnect();
	const { disconnect } = useDisconnect();
	const { switchChain } = useSwitchChain();

	const { data: balance } = useBalance({
		address,
		query: { enabled: !!address },
	});

	const isWrongNetwork = isConnected && chain?.id !== DEFAULT_CHAIN.id;

	const switchToSupportedNetwork = () => {
		if (switchChain) {
			switchChain({ chainId: DEFAULT_CHAIN.id });
		}
	};

	return {
		address,
		isConnected,
		chain,
		chainId,
		balance,
		formattedAddress: formatAddress(address),
		connect,
		disconnect,
		connectors,
		isConnecting,
		isWrongNetwork,
		switchToSupportedNetwork,
	};
}
