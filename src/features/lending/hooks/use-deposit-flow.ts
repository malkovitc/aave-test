import { useState, useCallback, useEffect, useRef } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDepositContextSync } from './use-deposit-context-sync';
import { useDepositAmount } from './deposit/use-deposit-amount';
import { useDepositApproval } from './deposit/use-deposit-approval';
import { useDepositTransaction } from './deposit/use-deposit-transaction';

export function useDepositFlow(token: TokenConfig, balance: string) {
	const [hasTriggeredAutoDeposit, setHasTriggeredAutoDeposit] = useState(false);
	const previousTokenSymbol = useRef(token.symbol);
	const lastProcessedApproveHash = useRef<string | undefined>();

	const amountHook = useDepositAmount(token, balance);
	const transactionHook = useDepositTransaction(token, amountHook.clearAmount);
	const approvalHook = useDepositApproval(token, amountHook.amount, transactionHook.usesPermit);

	const { isApproveSuccess, approveTxHash, refetchAllowances } = approvalHook;
	const { handleDeposit: depositFn } = transactionHook;
	const { isValid: isValidAmount, amount } = amountHook;

	const triggerAutoDeposit = useCallback(() => {
		refetchAllowances();
		if (isValidAmount) {
			depositFn(amount);
		}
	}, [refetchAllowances, isValidAmount, amount, depositFn]);

	useEffect(() => {
		const isNewApproval = approveTxHash && approveTxHash !== lastProcessedApproveHash.current;

		if (isApproveSuccess && isNewApproval && !hasTriggeredAutoDeposit) {
			lastProcessedApproveHash.current = approveTxHash;
			setHasTriggeredAutoDeposit(true);
			triggerAutoDeposit();
		}

		if (!isApproveSuccess && hasTriggeredAutoDeposit) {
			setHasTriggeredAutoDeposit(false);
		}
	}, [isApproveSuccess, approveTxHash, hasTriggeredAutoDeposit, triggerAutoDeposit]);

	const { setAmount } = amountHook;

	useEffect(() => {
		if (previousTokenSymbol.current !== token.symbol) {
			previousTokenSymbol.current = token.symbol;
			lastProcessedApproveHash.current = undefined;
			setAmount('');
			setHasTriggeredAutoDeposit(false);
		}
	}, [token.symbol, setAmount]);

	useDepositContextSync(
		token.symbol,
		approvalHook.isApproving,
		transactionHook.isDepositing,
		transactionHook.isDepositSuccess,
		amountHook.amount,
		transactionHook.hasRawError // Use raw error to clear optimistic UI immediately
	);

	const { handleApprove: approveFn } = approvalHook;
	const { handleDeposit: txDepositFn } = transactionHook;

	const handleApprove = useCallback(async () => {
		if (!isValidAmount) return;
		await approveFn();
	}, [isValidAmount, approveFn]);

	const handleDeposit = useCallback(async () => {
		if (!isValidAmount) return;
		await txDepositFn(amount);
	}, [isValidAmount, amount, txDepositFn]);

	return {
		amount: amountHook.amount,
		setAmount: amountHook.setAmount,
		balance,
		needsApproval: approvalHook.needsApproval,
		isValidAmount: amountHook.isValid,
		handleApprove,
		handleDeposit,
		handleMaxClick: amountHook.handleMaxClick,
		isApproving: approvalHook.isApproving,
		isDepositing: transactionHook.isDepositing,
		isLoading: approvalHook.isApproving || transactionHook.isDepositing,
		isAllowancesLoading: approvalHook.isAllowancesLoading,
		isApproveSuccess: approvalHook.isApproveSuccess,
		isDepositSuccess: transactionHook.isDepositSuccess,
		approveTxHash: approvalHook.approveTxHash,
		depositTxHash: transactionHook.depositTxHash,
		usesPermit: transactionHook.usesPermit,
	};
}
