import { useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';

export function useDeposit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	// Create unique toast ID for this token to prevent cross-token toast interference
	const toastId = `deposit-${token.symbol}`;

	const deposit = async (amount: string) => {
		if (!userAddress || !chainId) {
			console.error('🔴 No wallet connected');
			toast.error('Please connect your wallet');
			return;
		}

		try {
			const amountBigInt = parseUnits(amount, token.decimals);

			let poolAddress: Address;
			try {
				({ poolAddress } = getChainConfig(chainId));
			} catch (configError) {
				console.error('🔴 Unsupported chain for deposit', configError);
				toast.error('Unsupported network for deposit');
				return;
			}

			writeContract({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'supply',
				args: [
					token.address,
					amountBigInt,
					userAddress,
					0, // referral code
				],
				gas: 500000n, // Explicit gas limit to avoid estimation issues
			});

			toast.loading('Please confirm transaction in wallet...', { id: toastId });
		} catch (err) {
			console.error('Deposit error:', err);
			toast.error('Failed to deposit', { id: toastId });
		}
	};

	useEffect(() => {
		// Don't show toasts if there's no transaction hash
		if (!hash) return;

		// Show confirming toast when transaction is being mined
		if (isConfirming && !isSuccess) {
			toast.loading('Confirming transaction...', { id: toastId });
		}

		// Handle success
		if (isSuccess) {
			toast.success(`Deposited ${token.symbol} successfully!`, { id: toastId });
		}

		// Handle error
		if (error) {
			console.error('❌ Deposit FAILED:', error);
			toast.error('Deposit failed', { id: toastId });
		}
	}, [hash, isPending, isConfirming, isSuccess, error, token.symbol, toastId]);

	return {
		deposit,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
