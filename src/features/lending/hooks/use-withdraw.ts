import { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';
import { useTransactionMonitor } from './use-transaction-monitor';

export function useWithdraw(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContractAsync, data: hash, isPending } = useWriteContract();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { isConfirming, isSuccess, txError } = useTransactionMonitor(hash);

	const withdraw = async (amount: string, isMax: boolean = false) => {
		if (!userAddress || !chainId) {
			throw new Error('No wallet connected');
		}

		const { poolAddress } = getChainConfig(chainId);
		const amountBigInt = isMax ? maxUint256 : parseUnits(amount, token.decimals);

		setIsSubmitting(true);

		try {
			await writeContractAsync({
				address: poolAddress,
				abi: aavePoolAbi,
				functionName: 'withdraw',
				args: [token.address, amountBigInt, userAddress],
			});
		} catch (err) {
			setIsSubmitting(false);
			throw err;
		}
	};

	useEffect(() => {
		const shouldClearSubmitting = hash || isConfirming || isSuccess || txError;

		if (shouldClearSubmitting) {
			setIsSubmitting(false);
		}
	}, [hash, isConfirming, isSuccess, txError]);

	return {
		withdraw,
		hash,
		isPending: isSubmitting || isPending || isConfirming,
		isSuccess,
		error: txError,
	};
}
