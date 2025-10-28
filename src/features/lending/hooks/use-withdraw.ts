import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits, Address, maxUint256 } from 'viem';
import { TokenConfig } from '@/features/tokens/config/tokens';
import { getChainConfig } from '@/features/tokens/config/chains';
import aavePoolAbi from '../abis/AavePool.json';
import { useTransactionMonitor } from './use-transaction-monitor';

export function useWithdraw(token: TokenConfig) {
	const { address: userAddress, chainId } = useAccount();
	const { writeContract, data: hash, isPending } = useWriteContract();

	const { isConfirming, isSuccess, receiptError, receiptStatus, manualReceiptError, txError } =
		useTransactionMonitor(hash);

	const withdraw = async (amount: string, isMax: boolean = false) => {
		if (!userAddress || !chainId) {
			console.error('🔴 No wallet connected');
			return;
		}

		try {
			let poolAddress: Address;
			try {
				({ poolAddress } = getChainConfig(chainId));
			} catch (configError) {
				console.error('🔴 Unsupported chain for withdraw', configError);
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
		} catch (err) {
			console.error('🔴 Withdraw error:', err);
		}
	};

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
