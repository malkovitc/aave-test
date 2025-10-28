import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import { fetchTokenPermitData } from './use-token-permit-data';
import { usePermitSignature } from './use-permit-signature';
import { useSupplyTransaction } from './use-supply-transaction';
import { useTransactionMonitor } from './use-transaction-monitor';
import { transactionManager } from '@/shared/utils/transaction-manager';

const USER_REJECTED_ERROR_CODE = 4001;

function isUserRejection(error: unknown): boolean {
	const err = error as { message?: string; code?: number };
	return err.message?.includes('User rejected') || err.code === USER_REJECTED_ERROR_CODE;
}

export function useSupplyWithPermit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { signPermit } = usePermitSignature();
	const { executeSupplyWithPermit, hash, isPending, error: writeError } = useSupplyTransaction();
	const { isConfirming, isSuccess, txError } = useTransactionMonitor(hash);

	const [isSigning, setIsSigning] = useState(false);

	useEffect(() => {
		if (txError && hash) {
			transactionManager.updateStatus(token.symbol, 'deposit', 'error', txError);
		}
	}, [txError, hash, token.symbol]);

	const supplyWithPermit = async (amount: string) => {
		if (!userAddress || !chainId) {
			throw new Error('No wallet connected');
		}

		if (!token.supportsPermit) {
			throw new Error('Token does not support permit');
		}

		const { poolAddress } = getChainConfig(chainId);
		const amountBigInt = parseUnits(amount, token.decimals);
		const permitData = await fetchTokenPermitData(token, userAddress, chainId);

		const toastId = `permit-sign-${token.symbol}`;

		try {
			setIsSigning(true);
			toast.loading('Please sign the permit message...', { id: toastId });

			const signature = await signPermit(permitData, userAddress, poolAddress, amountBigInt);

			toast.dismiss(toastId);
			setIsSigning(false);

			executeSupplyWithPermit(
				poolAddress,
				token.address,
				amountBigInt,
				userAddress,
				permitData.deadline,
				signature
			);
		} catch (err: unknown) {
			toast.dismiss(toastId);
			setIsSigning(false);

			if (isUserRejection(err)) {
				toast.error('Signature cancelled');
			}

			throw err;
		}
	};

	const hasError = writeError || txError;
	const isTransactionPending =
		isSigning ||
		isPending ||
		isConfirming ||
		(hash && !isSuccess && !hasError);

	return {
		supplyWithPermit,
		hash,
		isPending: isTransactionPending,
		isSuccess,
		error: writeError || txError,
		isSigning,
	};
}
