import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, type Address, type Chain } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import { fetchTokenPermitData } from './use-token-permit-data';
import { usePermitSignature } from './use-permit-signature';
import { useSupplyTransaction } from './use-supply-transaction';
import { useTransactionMonitor } from './use-transaction-monitor';
import { getExplorerName } from '@/shared/lib/chain-config';

// Error codes and messages
const USER_REJECTED_ERROR_CODE = 4001;
const AAVE_SUPPLY_CAP_ERROR = '51';
const INVALID_SIGNATURE_ERROR = 'INVALID_SIGNATURE';

/**
 * Check if error is user rejection
 */
function isUserRejection(error: unknown): boolean {
	const err = error as { message?: string; code?: number };
	return err.message?.includes('User rejected') || err.code === USER_REJECTED_ERROR_CODE;
}

/**
 * Get error message based on error type
 */
function getSupplyErrorMessage(
	txError: Error | null,
	receiptStatus: string | undefined,
	manualReceiptError: Error | null,
	chain: Chain | undefined,
	tokenSymbol: string
): string {
	const errorMessage = txError?.message || '';

	if (errorMessage.includes(INVALID_SIGNATURE_ERROR)) {
		return 'Invalid permit signature. Please try again.';
	}

	if (errorMessage.includes(AAVE_SUPPLY_CAP_ERROR)) {
		return `Supply cap reached for ${tokenSymbol}. Try a different asset.`;
	}

	if (manualReceiptError || receiptStatus === 'error') {
		const explorerName = chain ? getExplorerName(chain) : 'block explorer';
		return `Transaction failed. Check ${explorerName} for details.`;
	}

	return 'Deposit with permit failed';
}

/**
 * Hook for supplyWithPermit - combines EIP-2612 permit + Aave deposit in one transaction
 * Only works for tokens that support permit (USDC, USDT)
 *
 * Flow:
 * 1. User signs permit message (free, no gas)
 * 2. Single transaction calls Pool.supplyWithPermit with signature
 * 3. Pool contract calls token.permit() then executes supply()
 *
 * Composition:
 * - fetchTokenPermitData: Fetches token metadata for permit signature
 * - usePermitSignature: Handles signature creation and parsing
 * - useSupplyTransaction: Executes the supplyWithPermit transaction
 * - useTransactionMonitor: Monitors transaction with fallback receipt check
 */
export function useSupplyWithPermit(token: TokenConfig) {
	const { address: userAddress, chainId, chain } = useAccount();
	const { signPermit } = usePermitSignature();
	const { executeSupplyWithPermit, hash, isPending, error } = useSupplyTransaction();
	const { isConfirming, isSuccess, receiptError, receiptStatus, manualReceiptError, txError } =
		useTransactionMonitor(hash);

	// Track signing state separately (before transaction is sent)
	const [isSigning, setIsSigning] = useState(false);

	const supplyWithPermit = async (amount: string) => {
		// Early returns for validation
		if (!userAddress || !chainId) {
			console.error('🔴 No wallet connected');
			toast.error('Please connect your wallet');
			return;
		}

		if (!token.supportsPermit) {
			console.error('🔴 Token does not support permit');
			toast.error(`${token.symbol} does not support gasless approval`);
			return;
		}

		// Get Pool address with error handling
		let poolAddress: Address;
		try {
			({ poolAddress } = getChainConfig(chainId));
		} catch (configError) {
			console.error('🔴 Unsupported chain for deposit', configError);
			toast.error('Unsupported network for deposit');
			return;
		}

		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			const permitData = await fetchTokenPermitData(token, userAddress, chainId);

			// Request signature from user
			setIsSigning(true);
			toast.loading('Please sign the permit message...', { id: 'supply-permit' });
			const signature = await signPermit(permitData, userAddress, poolAddress, amountBigInt);
			setIsSigning(false);

			// Execute transaction
			toast.loading('Please confirm transaction in wallet...', { id: 'supply-permit' });
			executeSupplyWithPermit(poolAddress, token.address, amountBigInt, userAddress, permitData.deadline, signature);
		} catch (err: unknown) {
			console.error('🔴 SupplyWithPermit error:', err);
			setIsSigning(false);

			// Show appropriate error message
			const errorMessage = isUserRejection(err) ? 'Signature cancelled' : 'Failed to deposit with permit';
			toast.error(errorMessage, { id: 'supply-permit' });
		}
	};

	useEffect(() => {
		// Early return if no transaction hash
		if (!hash) return;

		// Show confirming toast when transaction is being mined
		if (isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: 'supply-permit' });
		}

		// Handle success
		if (isSuccess && receiptStatus === 'success') {
			toast.success(`Deposited ${token.symbol} successfully!`, { id: 'supply-permit' });
			return;
		}

		// Handle failure
		const hasFailed = txError || receiptStatus === 'error';
		if (hasFailed && !isSuccess) {
			console.error('❌ SupplyWithPermit FAILED:', {
				error: txError,
				receiptStatus,
				isSuccess,
				manualReceiptError,
			});

			const errorMessage = getSupplyErrorMessage(txError, receiptStatus, manualReceiptError, chain, token.symbol);
			toast.error(errorMessage, { id: 'supply-permit' });
		}
	}, [
		hash,
		isPending,
		isConfirming,
		isSuccess,
		error,
		receiptError,
		receiptStatus,
		token.symbol,
		manualReceiptError,
		txError,
		chain,
	]);

	return {
		supplyWithPermit,
		hash,
		isPending: isSigning || isPending || isConfirming,
		isSuccess,
		error: txError,
		receiptError,
		receiptStatus,
		manualReceiptError,
	};
}
