import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { ConnectKitProvider } from 'connectkit';
import { Toaster } from 'sonner';
import { config } from '@/features/wallet/services/connectors';
import { UserTokensProvider } from '@/features/tokens/context/UserTokensContext';
import { DepositProvider } from '@/features/lending/context/DepositContext';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: true,
			retry: 3,
			retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		},
	},
});

interface ProvidersProps {
	children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<ConnectKitProvider
					options={{
						embedGoogleFonts: false,
						walletConnectName: 'Other Wallets',
					}}
				>
					<UserTokensProvider>
						<DepositProvider>
							{children}
							<Toaster position="top-right" richColors />
						</DepositProvider>
					</UserTokensProvider>
				</ConnectKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
