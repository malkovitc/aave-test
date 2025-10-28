import { useEffect, useState, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, type Address, type Chain } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import { fetchTokenPermitData } from './use-token-permit-data';
import { usePermitSignature } from './use-permit-signature';
import { useSupplyTransaction } from './use-supply-transaction';
import { useTransactionMonitor } from './use-transaction-monitor';
import { useDepositContext } from '../context/DepositContext';
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
	const { executeSupplyWithPermit, hash, isPending, error: writeError } = useSupplyTransaction();
	const { isConfirming, isSuccess, receiptError, receiptStatus, manualReceiptError, txError } =
		useTransactionMonitor(hash);
	const { refetchBalances } = useDepositContext();

	const [isSigning, setIsSigning] = useState(false);
	const transactionTokenSymbol = useRef<string | null>(null);

	const shouldShowToasts = hash === undefined || transactionTokenSymbol.current === token.symbol;

	const toastId = useMemo(() => `supply-permit-${token.symbol}`, [token.symbol]);

	const combinedError = writeError || txError;

	// Memoize error message to avoid recalculating on every render
	const errorMessage = useMemo(() => {
		return getSupplyErrorMessage(combinedError, receiptStatus, manualReceiptError, chain, token.symbol);
	}, [combinedError, receiptStatus, manualReceiptError, chain, token.symbol]);

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

			setIsSigning(true);
			toast.loading('Please sign the permit message...', { id: toastId });
			const signature = await signPermit(permitData, userAddress, poolAddress, amountBigInt);
			setIsSigning(false);

			transactionTokenSymbol.current = token.symbol;

			toast.loading('Please confirm transaction in wallet...', { id: toastId });
			executeSupplyWithPermit(poolAddress, token.address, amountBigInt, userAddress, permitData.deadline, signature);
		} catch (err: unknown) {
			console.error('🔴 SupplyWithPermit error:', err);
			setIsSigning(false);

			// Show appropriate error message
			const errorMessage = isUserRejection(err) ? 'Signature cancelled' : 'Failed to deposit with permit';
			toast.error(errorMessage, { id: toastId });
		}
	};

	// Effect 1: Show confirming toast when transaction is being mined
	useEffect(() => {
		if (shouldShowToasts && hash && isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: toastId });
		}
	}, [shouldShowToasts, hash, isConfirming, isSuccess, toastId]);

	// Effect 2: Handle success toast
	useEffect(() => {
		if (shouldShowToasts && hash && isSuccess) {
			toast.success(`Deposited ${token.symbol} successfully!`, { id: toastId });
		}
	}, [shouldShowToasts, hash, isSuccess, token.symbol, toastId]);

	// Effect 2.5: Refetch balances immediately after successful transaction
	useEffect(() => {
		if (shouldShowToasts && hash && isSuccess && refetchBalances) {
			refetchBalances();
		}
	}, [shouldShowToasts, hash, isSuccess, refetchBalances]);

	// Effect 3: Handle failure toast
	useEffect(() => {
		if (!shouldShowToasts || isSuccess) return;

		// Show error if writeContract failed OR if transaction was sent but failed
		const hasFailed = writeError || txError || receiptStatus === 'error';
		if (hasFailed) {
			toast.error(errorMessage, { id: toastId });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [shouldShowToasts, writeError, isSuccess, errorMessage, toastId]);

	return {
		supplyWithPermit,
		hash,
		isPending: isSigning || (isPending && !writeError) || (isConfirming && !writeError),
		isSuccess,
		error: combinedError,
		receiptError,
		receiptStatus,
		manualReceiptError,
	};
}
