import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, type Address } from 'viem';
import { toast } from 'sonner';
import { useRef, useEffect } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import { useTransactionToasts } from '@/shared/hooks/use-transaction-toasts';
import { useDepositContext } from '../context/DepositContext';
import aavePoolAbi from '../abis/AavePool.json';

export function useDeposit(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending, error } = useWriteContract();
	const { refetchBalances } = useDepositContext();

	const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
		hash,
	});

	const transactionTokenSymbol = useRef<string | null>(null);
	const shouldShowToasts = hash === undefined || transactionTokenSymbol.current === token.symbol;
	const toastId = useTransactionToasts(
		token.symbol,
		'deposit',
		shouldShowToasts ? hash : undefined,
		isConfirming,
		isSuccess,
		shouldShowToasts ? error : null
	);

	// Refetch balances immediately after successful transaction
	useEffect(() => {
		if (shouldShowToasts && hash && isSuccess && refetchBalances) {
			refetchBalances();
		}
	}, [shouldShowToasts, hash, isSuccess, refetchBalances]);

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

			transactionTokenSymbol.current = token.symbol;

			writeContract({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'supply',
				args: [
					token.address,
					amountBigInt,
					userAddress,
					0,
				],
				gas: 500000n,
			});

			toast.loading('Please confirm transaction in wallet...', { id: toastId });
		} catch (err) {
			console.error('Deposit error:', err);
			toast.error('Failed to deposit', { id: toastId });
		}
	};

	return {
		deposit,
		hash,
		isPending: isPending || isConfirming,
		isSuccess,
		error,
	};
}
