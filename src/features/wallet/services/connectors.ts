import { http, createConfig } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors';
import { familyAccountsConnector } from 'family';
import { env } from '@/shared/lib/env';

/**
 * Wagmi configuration for wallet connections
 *
 * Multi-provider setup matching Aave interface modal design:
 * 1. Family (official familyAccountsConnector)
 * 2. MetaMask (injected with metaMask target)
 * 3. Coinbase Wallet
 * 4. WalletConnect (for "Other Wallets" option)
 */
export const config = createConfig({
	chains: [sepolia],
	connectors: [
		// Family wallet - official connector from 'family' package
		familyAccountsConnector(),
		// MetaMask
		injected({
			shimDisconnect: true,
			target: 'metaMask',
		}),
		// Coinbase Wallet
		coinbaseWallet({
			appName: 'Aave Lite v2',
		}),
		// WalletConnect - for "Other Wallets" option
		// showQrModal is disabled because ConnectKit handles the WalletConnect UI
		// Using optionalChains instead of requiredChains to support wallets like Trust
		// that don't support Sepolia via WalletConnect v2
		walletConnect({
			projectId: env.VITE_WALLETCONNECT_PROJECT_ID || '',
			showQrModal: false,
			metadata: {
				name: 'Aave Lite',
				description: 'Aave Lite dApp - Deposit and Withdraw',
				url: typeof window !== 'undefined' ? window.location.origin : 'https://aave-lite.dev',
				icons: ['https://aave.com/favicon.ico'],
			},
			qrModalOptions: {
				themeMode: 'dark',
			},
		}),
	],
	transports: {
		[sepolia.id]: http(env.VITE_RPC_URL),
	},
});
