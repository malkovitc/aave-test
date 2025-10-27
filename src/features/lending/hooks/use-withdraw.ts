import { useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, Address, maxUint256 } from 'viem';
import { toast } from 'sonner';
import { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';
import { useTransactionMonitor } from './use-transaction-monitor';

export function useWithdraw(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isConfirming, isSuccess, receiptError, receiptStatus, manualReceiptError, txError } =
		useTransactionMonitor(hash);

	// Create unique toast ID for this token to prevent cross-token toast interference
	const toastId = `withdraw-${token.symbol}`;

	const withdraw = async (amount: string, isMax: boolean = false) => {
		if (!userAddress || !chainId) {
			toast.error('Please connect your wallet');
			return;
		}

		try {
			let poolAddress: Address;
			try {
				({ poolAddress } = getChainConfig(chainId));
			} catch (configError) {
				console.error('Unsupported chain for withdraw', configError);
				toast.error('Unsupported network for withdraw');
				return;
			}

			// If max, use maxUint256 to withdraw all
			const amountBigInt = isMax ? maxUint256 : parseUnits(amount, token.decimals);

			writeContract({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'withdraw',
				args: [token.address, amountBigInt, userAddress],
			});

			toast.loading('Please confirm transaction in wallet...', { id: toastId });
		} catch (err) {
			console.error('Withdraw error:', err);
			toast.error('Failed to withdraw', { id: toastId });
		}
	};

	useEffect(() => {
		// Early return if no transaction hash
		if (!hash) return;

		// Show confirming toast when transaction is being mined
		if (isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: toastId });
		}

		// Handle success - isSuccess is enough, receiptStatus might lag behind
		if (isSuccess) {
			toast.success(`Withdrawn ${token.symbol} successfully!`, { id: toastId });
			return;
		}

		// Handle failure - only if not successful
		const hasFailed = txError || receiptStatus === 'error';
		if (hasFailed && !isSuccess) {
			console.error('❌ Withdraw FAILED:', {
				error: txError,
				receiptStatus,
				isSuccess,
				manualReceiptError,
			});

			const errorMessage = 'Transaction failed. Check block explorer for details.';
			toast.error(errorMessage, { id: toastId });
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
		toastId,
	]);

	return {
		withdraw,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error: txError,
		receiptError,
		receiptStatus,
		manualReceiptError,
	};
}
