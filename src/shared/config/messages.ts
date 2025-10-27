export const ERROR_MESSAGES = {
	INVALID_AMOUNT: 'Invalid amount or insufficient balance',
	WRONG_NETWORK_DEPOSIT: 'Please switch to the supported network before depositing.',
	WRONG_NETWORK_WITHDRAW: 'Please switch to the supported network before withdrawing.',
	COPY_FAILED: 'Failed to copy address',
	WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
	TRANSACTION_REJECTED: 'Transaction was rejected',
	TRANSACTION_FAILED: 'Transaction failed. Please try again.',
} as const;

export const SUCCESS_MESSAGES = {
	ADDRESS_COPIED: 'Address copied to clipboard',
	ETH_WRAPPED: 'Successfully wrapped ETH to WETH!',
	ETH_UNWRAPPED: 'Successfully unwrapped WETH to ETH!',
	DEPOSIT_SUCCESS: 'Successfully deposited tokens!',
	WITHDRAW_SUCCESS: 'Successfully withdrawn tokens!',
	APPROVAL_SUCCESS: 'Token spending approved successfully!',
	NETWORK_SWITCHED: 'Network switched successfully',
} as const;

export const INFO_MESSAGES = {
	NO_TOKENS_WITH_BALANCE: 'No tokens with balance in your wallet',
	NO_POSITIONS: 'No positions yet. Deposit tokens to start earning interest.',
	NO_POSITIONS_WITHDRAW: 'No deposited positions. Deposit tokens first to withdraw.',
	MIN_ETH_FOR_GAS: (amount: string) => `💡 Tip: Keep at least ${amount} ETH for gas fees`,
	LOADING: 'Loading...',
	PROCESSING: 'Processing transaction...',
} as const;

export const ACTION_LABELS = {
	CONNECT_WALLET: 'Connect Wallet',
	DISCONNECT: 'Disconnect',
	SWITCH_NETWORK: 'Switch to supported network',
	APPROVE: 'Approve',
	APPROVING: 'Approving...',
	DEPOSIT: 'Deposit',
	DEPOSITING: 'Depositing...',
	WITHDRAW: 'Withdraw',
	WITHDRAWING: 'Withdrawing...',
	WRAP: 'Wrap ETH → WETH',
	WRAPPING: 'Wrapping...',
	UNWRAP: 'Unwrap WETH → ETH',
	UNWRAPPING: 'Unwrapping...',
	MAX: 'Max',
	VIEW_EXPLORER: 'View on Explorer',
} as const;

export type ErrorMessage = (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES];
export type SuccessMessage = (typeof SUCCESS_MESSAGES)[keyof typeof SUCCESS_MESSAGES];
export type InfoMessage =
	| (typeof INFO_MESSAGES)[keyof typeof INFO_MESSAGES]
	| ReturnType<typeof INFO_MESSAGES.MIN_ETH_FOR_GAS>;
export type ActionLabel = (typeof ACTION_LABELS)[keyof typeof ACTION_LABELS];
