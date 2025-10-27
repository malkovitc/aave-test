import { memo, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useConnect, type Connector } from 'wagmi';

interface ConnectWalletDialogProps {
	trigger: React.ReactNode;
}

/**
 * Wallet button configuration
 */
interface WalletButtonConfig {
	connector: Connector;
	label: string;
	icon: string;
	variant: 'default' | 'outline';
	className?: string;
}

/**
 * Organized connectors by priority
 */
interface OrganizedConnectors {
	family?: Connector;
	metamask?: Connector;
	coinbase?: Connector;
	walletConnect?: Connector;
	other: Connector[];
}

/**
 * Wallet icons configuration
 */
const WALLET_ICONS = {
	FAMILY: '/icons/wallets/browserWallet.svg',
	METAMASK: '/icons/wallets/browserWallet.svg',
	COINBASE: '/icons/wallets/coinbase.svg',
	WALLET_CONNECT: '/icons/wallets/walletConnect.svg',
} as const;

/**
 * Button styling presets
 */
const BUTTON_STYLES = {
	PRIMARY: 'w-full h-auto py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-medium justify-between',
	OUTLINE: 'w-full justify-between text-left h-auto py-4 px-6 bg-card hover:bg-accent',
} as const;

/**
 * Finds a connector by name or ID
 *
 * @param connectors - Array of available connectors
 * @param names - Possible connector names to search for
 * @param ids - Possible connector IDs to search for
 * @returns Found connector or undefined
 */
function findConnector(connectors: readonly Connector[], names: string[], ids?: string[]): Connector | undefined {
	return connectors.find((connector) => {
		const nameLower = connector.name.toLowerCase();
		const matchesName = names.some((name) => nameLower.includes(name.toLowerCase()));
		const matchesId = ids?.some((id) => connector.id === id);
		return matchesName || matchesId;
	});
}

/**
 * Organizes connectors into priority groups
 *
 * Priority:
 * 1. Family Wallet (featured)
 * 2. MetaMask (most popular)
 * 3. Coinbase Wallet
 * 4. WalletConnect
 * 5. Other wallets
 *
 * @param connectors - Array of all available connectors
 * @returns Organized connectors by priority
 */
function organizeConnectors(connectors: readonly Connector[]): OrganizedConnectors {
	const family = findConnector(connectors, ['family']);
	const metamask = findConnector(connectors, ['metamask'], ['injected']);
	const coinbase = findConnector(connectors, ['coinbase wallet']);
	const walletConnect = findConnector(connectors, ['walletconnect']);

	// All connectors not in the priority list
	const priorityConnectors = [family, metamask, coinbase, walletConnect].filter(Boolean);
	const other = connectors.filter((c) => !priorityConnectors.includes(c));

	return {
		family,
		metamask,
		coinbase,
		walletConnect,
		other,
	};
}

/**
 * Creates wallet button configurations from organized connectors
 *
 * @param organized - Organized connectors
 * @returns Array of wallet button configurations
 */
function createWalletButtons(organized: OrganizedConnectors): WalletButtonConfig[] {
	const buttons: WalletButtonConfig[] = [];

	// Family Wallet - Primary CTA
	if (organized.family) {
		buttons.push({
			connector: organized.family,
			label: 'Continue with Family',
			icon: WALLET_ICONS.FAMILY,
			variant: 'default',
			className: BUTTON_STYLES.PRIMARY,
		});
	}

	// MetaMask
	if (organized.metamask) {
		buttons.push({
			connector: organized.metamask,
			label: 'MetaMask',
			icon: WALLET_ICONS.METAMASK,
			variant: 'outline',
			className: BUTTON_STYLES.OUTLINE,
		});
	}

	// Coinbase Wallet
	if (organized.coinbase) {
		buttons.push({
			connector: organized.coinbase,
			label: 'Coinbase Wallet',
			icon: WALLET_ICONS.COINBASE,
			variant: 'outline',
			className: BUTTON_STYLES.OUTLINE,
		});
	}

	// Other Wallets (WalletConnect or grouped)
	const otherConnector = organized.walletConnect || organized.other[0];
	if (otherConnector) {
		buttons.push({
			connector: otherConnector,
			label: 'Other Wallets',
			icon: WALLET_ICONS.WALLET_CONNECT,
			variant: 'outline',
			className: BUTTON_STYLES.OUTLINE,
		});
	}

	return buttons;
}

/**
 * Wallet button component
 * Single Responsibility: Renders a single wallet connection button
 */
interface WalletButtonProps {
	config: WalletButtonConfig;
	onClick: (connector: Connector) => void;
	disabled?: boolean;
}

function WalletButton({ config, onClick, disabled }: WalletButtonProps) {
	return (
		<Button
			variant={config.variant}
			className={config.className}
			onClick={() => onClick(config.connector)}
			disabled={disabled}
		>
			<span className="text-lg font-medium">{config.label}</span>
			<img src={config.icon} alt={config.label} className="w-6 h-6" />
		</Button>
	);
}

/**
 * Divider with text
 */
function Divider() {
	return <p className="text-center text-sm text-muted-foreground py-2">or select a wallet from the list below</p>;
}

/**
 * "I don't have a wallet" link
 */
interface NoWalletLinkProps {
	onClick: () => void;
}

function NoWalletLink({ onClick }: NoWalletLinkProps) {
	return (
		<button
			className="w-full text-center text-sm text-muted-foreground py-3 hover:text-foreground transition-colors flex items-center justify-center gap-2"
			onClick={onClick}
		>
			<span className="w-4 h-4 border border-muted-foreground rounded"></span>I don't have a wallet
		</button>
	);
}

/**
 * ConnectWalletDialog component
 * Multi-provider wallet connection modal
 *
 * Features:
 * - Prioritized wallet list (Family, MetaMask, Coinbase, Others)
 * - Automatic connector organization
 * - Responsive design matching Figma specs
 * - Loading states during connection
 *
 * Design:
 * - "Continue with Family" (primary button at top)
 * - Divider text
 * - MetaMask, Coinbase Wallet (outline buttons)
 * - Other Wallets (WalletConnect fallback)
 * - "I don't have a wallet" checkbox at bottom
 *
 * @param trigger - React node to trigger the dialog (usually a button)
 */
function ConnectWalletDialogComponent({ trigger }: ConnectWalletDialogProps) {
	const [open, setOpen] = useState(false);
	const { connect, connectors, isPending } = useConnect();

	/**
	 * Organizes and memoizes wallet buttons
	 */
	const walletButtons = useMemo(() => {
		const organized = organizeConnectors(connectors);
		return createWalletButtons(organized);
	}, [connectors]);

	/**
	 * Shows divider only if there's a primary button (Family)
	 */
	const showDivider = walletButtons.length > 0 && walletButtons[0]?.variant === 'default';

	/**
	 * Handles wallet connection and closes dialog
	 */
	const handleConnect = (connector: Connector) => {
		connect({ connector });
		setOpen(false);
	};

	/**
	 * Handles "I don't have a wallet" click
	 */
	const handleNoWallet = () => {
		setOpen(false);
		// Could add analytics or redirect to wallet education page
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-center text-2xl">Connect Wallet</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-3 py-4">
					{/* Render all wallet buttons */}
					{walletButtons.map((config, index) => (
						<>
							{/* Show divider after primary button */}
							{index === 1 && showDivider && <Divider />}

							<WalletButton key={config.connector.id} config={config} onClick={handleConnect} disabled={isPending} />
						</>
					))}

					{/* No wallet link */}
					<NoWalletLink onClick={handleNoWallet} />
				</div>
			</DialogContent>
		</Dialog>
	);
}

export const ConnectWalletDialog = memo(ConnectWalletDialogComponent);
