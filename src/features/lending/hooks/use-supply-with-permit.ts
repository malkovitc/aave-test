import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import { fetchTokenPermitData } from './use-token-permit-data';
import { usePermitSignature } from './use-permit-signature';
import { useSupplyTransaction } from './use-supply-transaction';
import { useTransactionMonitor } from './use-transaction-monitor';

// Error codes
const USER_REJECTED_ERROR_CODE = 4001;

/**
 * Check if error is user rejection
 */
function isUserRejection(error: unknown): boolean {
	const err = error as { message?: string; code?: number };
	return err.message?.includes('User rejected') || err.code === USER_REJECTED_ERROR_CODE;
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
	const { address: userAddress, chainId } = useAccount();
	const { signPermit } = usePermitSignature();
	const { executeSupplyWithPermit, hash, isPending, error: writeError } = useSupplyTransaction();
	const { isConfirming, isSuccess, receiptError, receiptStatus, manualReceiptError, txError } =
		useTransactionMonitor(hash);

	const [isSigning, setIsSigning] = useState(false);

	const combinedError = writeError || txError;

	const supplyWithPermit = async (amount: string) => {
		// Early returns for validation
		if (!userAddress || !chainId) {
			console.error('🔴 No wallet connected');
			return;
		}

		if (!token.supportsPermit) {
			console.error('🔴 Token does not support permit');
			return;
		}

		// Get Pool address with error handling
		let poolAddress: Address;
		try {
			({ poolAddress } = getChainConfig(chainId));
		} catch (configError) {
			console.error('🔴 Unsupported chain for deposit', configError);
			return;
		}

		try {
			const amountBigInt = parseUnits(amount, token.decimals);
			const permitData = await fetchTokenPermitData(token, userAddress, chainId);

			setIsSigning(true);
			// Keep this toast as it's immediate user action feedback (not transaction state)
			toast.loading('Please sign the permit message...', { id: `permit-sign-${token.symbol}` });
			const signature = await signPermit(permitData, userAddress, poolAddress, amountBigInt);
			setIsSigning(false);
			toast.dismiss(`permit-sign-${token.symbol}`);

			executeSupplyWithPermit(poolAddress, token.address, amountBigInt, userAddress, permitData.deadline, signature);
		} catch (err: unknown) {
			console.error('🔴 SupplyWithPermit error:', err);
			setIsSigning(false);

			// Show appropriate error message for signature cancellation
			if (isUserRejection(err)) {
				toast.error('Signature cancelled', { id: `permit-sign-${token.symbol}` });
			}
		}
	};

	return {
		supplyWithPermit,
		hash,
		isPending: isSigning || (isPending && !writeError) || (isConfirming && !writeError),
		isSuccess,
		error: combinedError,
		receiptError,
		receiptStatus,
		manualReceiptError,
		isSigning,
	};
}
