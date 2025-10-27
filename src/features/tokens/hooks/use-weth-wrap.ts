import { useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, type Address } from 'viem';

const WETH_DEPOSIT_ABI = [
	{
		name: 'deposit',
		type: 'function',
		stateMutability: 'payable',
		inputs: [],
		outputs: [],
	},
] as const;

const WETH_WITHDRAW_ABI = [
	{
		name: 'withdraw',
		type: 'function',
		stateMutability: 'nonpayable',
		inputs: [{ name: 'wad', type: 'uint256' }],
		outputs: [],
	},
] as const;

/**
 * Hook for wrapping ETH to WETH
 *
 * Responsibilities:
 * - Execute wrap transaction (ETH → WETH)
 * - Monitor wrap transaction status
 * - Call onSuccess callback when complete
 */
export function useWethWrap(wethAddress: Address | undefined, onSuccess?: () => void) {
	const { writeContract: wrap, data: wrapHash, isPending: isWrapping } = useWriteContract();

	const { isLoading: isWrapConfirming, isSuccess: isWrapSuccess } = useWaitForTransactionReceipt({
		hash: wrapHash,
	});

	const handleWrap = (amount: string) => {
		if (!amount || parseFloat(amount) <= 0 || !wethAddress) return;

		wrap({
			address: wethAddress,
			abi: WETH_DEPOSIT_ABI,
			functionName: 'deposit',
			value: parseEther(amount),
		});
	};

	useEffect(() => {
		if (isWrapSuccess && onSuccess) {
			onSuccess();
		}
	}, [isWrapSuccess, onSuccess]);

	return {
		handleWrap,
		wrapHash,
		isWrapping,
		isWrapConfirming,
		isWrapSuccess,
		isWrapPending: isWrapping || isWrapConfirming,
	};
}

/**
 * Hook for unwrapping WETH to ETH
 *
 * Responsibilities:
 * - Execute unwrap transaction (WETH → ETH)
 * - Monitor unwrap transaction status
 * - Call onSuccess callback when complete
 */
export function useWethUnwrap(wethAddress: Address | undefined, onSuccess?: () => void) {
	const { writeContract: unwrap, data: unwrapHash, isPending: isUnwrapping } = useWriteContract();

	const { isLoading: isUnwrapConfirming, isSuccess: isUnwrapSuccess } = useWaitForTransactionReceipt({
		hash: unwrapHash,
	});

	const handleUnwrap = (amount: string) => {
		if (!amount || parseFloat(amount) <= 0 || !wethAddress) return;

		unwrap({
			address: wethAddress,
			abi: WETH_WITHDRAW_ABI,
			functionName: 'withdraw',
			args: [parseEther(amount)],
		});
	};

	useEffect(() => {
		if (isUnwrapSuccess && onSuccess) {
			onSuccess();
		}
	}, [isUnwrapSuccess, onSuccess]);

	return {
		handleUnwrap,
		unwrapHash,
		isUnwrapping,
		isUnwrapConfirming,
		isUnwrapSuccess,
		isUnwrapPending: isUnwrapping || isUnwrapConfirming,
	};
}
