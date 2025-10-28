import { forwardRef, useEffect, useMemo, useCallback, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ErrorText, InfoText, SecondaryText } from '@/shared/ui/text';
import { useDepositFlow } from '../hooks/use-deposit-flow';
import { useWithdrawFlow } from '../hooks/use-withdraw-flow';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useTokenForm } from '../hooks/use-token-form';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { useDepositContext } from '../context/DepositContext';
import { useAmountValidation } from '@/shared/hooks/use-amount-validation';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import type { DiscoveredToken } from '@/features/tokens/hooks/use-user-tokens';
import { ERROR_MESSAGES, INFO_MESSAGES } from '@/shared/config/messages';
import { VERTICAL_SPACING } from '@/shared/config/spacing';

export interface TokenFormCardRef {
	selectToken: (symbol: string) => void;
}

interface TokenFormCardProps {
	mode: 'deposit' | 'withdraw';
}

// Helper functions
function filterTokensWithBalance(tokens: TokenConfig[]): DiscoveredToken[] {
	return tokens.filter((token): token is DiscoveredToken => {
		return 'balance' in token && (token as DiscoveredToken).balance > 0n;
	});
}

function getTokenBalanceFormatted(token: TokenConfig | null): string {
	if (!token) return '0';
	if ('balanceFormatted' in token) {
		return (token as DiscoveredToken).balanceFormatted;
	}
	return '0';
}

function getActionLabel(
	mode: 'deposit' | 'withdraw',
	{
		needsApproval,
		isApproving,
		isProcessing,
	}: {
		needsApproval?: boolean;
		isApproving?: boolean;
		isProcessing: boolean;
	}
) {
	if (mode === 'deposit') {
		if (isApproving) return 'Approving...';
		if (isProcessing) return 'Depositing...';
		if (needsApproval) return 'Approve';
		return 'Deposit';
	} else {
		return isProcessing ? 'Withdrawing...' : 'Withdraw';
	}
}

/**
 * Unified form component for deposit and withdraw operations
 * Handles approval + deposit flow OR withdrawal flow based on mode prop
 */
export const TokenFormCard = forwardRef<TokenFormCardRef, TokenFormCardProps>(({ mode }, ref) => {
	const { isConnected, isWrongNetwork, switchToSupportedNetwork } = useWallet();
	const { depositInputRef, withdrawInputRef } = useDepositContext();
	const { positions } = useATokenBalances();

	const inputRef = mode === 'deposit' ? depositInputRef : withdrawInputRef;

	// Get tokens based on mode
	const getTokens = mode === 'deposit' ? filterTokensWithBalance : () => positions.map((p) => p.token);

	const {
		tokens,
		isLoadingTokens,
		selectedToken,
		setSelectedToken,
		safeToken,
		localAmount,
		debouncedAmount,
		handleAmountChange,
		handleMaxClick: handleMaxClickForm,
		clearAmount,
		selectToken,
	} = useTokenForm(getTokens);

	useImperativeHandle(ref, () => ({ selectToken }), [selectToken]);

	// Get balance based on mode
	const balanceFormatted =
		mode === 'deposit'
			? getTokenBalanceFormatted(selectedToken)
			: positions.find((p) => p.token.symbol === safeToken.symbol)?.formatted || '0';

	const aTokenAddress = mode === 'withdraw' ? safeToken.aTokenAddress : undefined;

	// Use appropriate flow hook based on mode
	const depositFlow = useDepositFlow(safeToken, balanceFormatted);
	const withdrawFlow = useWithdrawFlow(safeToken, balanceFormatted, safeToken.aTokenAddress);

	const flow = mode === 'deposit' ? depositFlow : withdrawFlow;

	// Sync debounced amount to flow
	useEffect(() => {
		flow.setAmount(debouncedAmount);
		// Reset isMaxWithdraw flag for withdraw mode
		if (mode === 'withdraw' && debouncedAmount !== balanceFormatted) {
			withdrawFlow.setIsMaxWithdraw(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debouncedAmount, flow.setAmount, mode, balanceFormatted, withdrawFlow]);

	// Reset local amount after successful operation
	useEffect(() => {
		const isSuccess = mode === 'deposit' ? depositFlow.isDepositSuccess : withdrawFlow.isWithdrawSuccess;
		if (isSuccess) {
			clearAmount();
		}
	}, [mode, depositFlow.isDepositSuccess, withdrawFlow.isWithdrawSuccess, clearAmount]);

	const handleMaxClick = () => {
		handleMaxClickForm(balanceFormatted, flow.setAmount);
		// Mark as MAX withdrawal if withdraw mode
		if (mode === 'withdraw') {
			withdrawFlow.handleMaxClick();
		}
	};

	// Local validation
	const isLocallyValid = useAmountValidation(debouncedAmount, balanceFormatted, safeToken.decimals);

	// Validation state (for aria-invalid and error display)
	const showValidationError = useMemo(() => {
		if (mode === 'deposit') {
			return debouncedAmount !== '' && !isLocallyValid;
		}
		return localAmount !== '' && localAmount === debouncedAmount && !flow.isValidAmount;
	}, [mode, debouncedAmount, isLocallyValid, localAmount, flow.isValidAmount]);

	// Base disabled conditions (common for all inputs/buttons)
	const hasBaseDisabledConditions = useMemo(() => {
		return !isConnected || flow.isLoading || tokens.length === 0;
	}, [isConnected, flow.isLoading, tokens.length]);

	// Input disabled: base conditions + wrong network + no token selected
	const isInputDisabled = useMemo(() => {
		return hasBaseDisabledConditions || isWrongNetwork || !selectedToken;
	}, [hasBaseDisabledConditions, isWrongNetwork, selectedToken]);

	// Primary button disabled: base conditions + invalid amount
	const isPrimaryButtonDisabled = useMemo(() => {
		return hasBaseDisabledConditions || !flow.isValidAmount;
	}, [hasBaseDisabledConditions, flow.isValidAmount]);

	// Token lookup map for O(1) access (instead of O(n) find)
	const tokensBySymbol = useMemo(() => {
		return new Map(tokens.map((token) => [token.symbol, token]));
	}, [tokens]);

	// Handle token selection (memoized for performance)
	const handleTokenSelect = useCallback((symbol: string) => {
		const token = tokensBySymbol.get(symbol);
		if (token) {
			setSelectedToken(token);
		}
	}, [tokensBySymbol, setSelectedToken]);

	// Button label logic
	const buttonLabel = useMemo(() => {
		if (mode === 'withdraw') {
			return withdrawFlow.isWithdrawing ? 'Withdrawing...' : 'Withdraw';
		}

		if (localAmount !== debouncedAmount && localAmount !== '') {
			return depositFlow.needsApproval ? 'Approve' : 'Deposit';
		}
		return getActionLabel(mode, {
			needsApproval: depositFlow.needsApproval,
			isApproving: depositFlow.isApproving,
			isProcessing: depositFlow.isDepositing,
		});
	}, [mode, localAmount, debouncedAmount, depositFlow, withdrawFlow]);

	const handlePrimaryAction = async () => {
		if (!isConnected) return;
		if (isWrongNetwork) {
			switchToSupportedNetwork();
			return;
		}

		if (mode === 'deposit') {
			if (depositFlow.needsApproval) {
				await depositFlow.handleApprove();
			} else {
				await depositFlow.handleDeposit();
			}
		} else {
			await withdrawFlow.handleWithdraw();
		}
	};

	// Config based on mode
	const config = {
		deposit: {
			title: 'Deposit',
			description: 'Deposit your tokens into Aave to start earning interest',
			inputId: 'deposit',
			balanceLabel: 'Available',
			balanceValue: balanceFormatted,
			balanceSymbol: safeToken.symbol || '',
			errorMessage: ERROR_MESSAGES.WRONG_NETWORK_DEPOSIT,
			infoMessage: INFO_MESSAGES.NO_TOKENS_WITH_BALANCE,
			showAToken: false,
		},
		withdraw: {
			title: 'Withdraw',
			description: 'Withdraw your tokens',
			inputId: 'withdraw',
			balanceLabel: 'Available',
			balanceValue: balanceFormatted,
			balanceSymbol: `a${safeToken.symbol || ''}`,
			errorMessage: ERROR_MESSAGES.WRONG_NETWORK_WITHDRAW,
			infoMessage: INFO_MESSAGES.NO_POSITIONS_WITHDRAW,
			showAToken: true,
		},
	}[mode];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{config.title}</CardTitle>
				<CardDescription>{config.description}</CardDescription>
			</CardHeader>
			<CardContent className={VERTICAL_SPACING.CARD_CONTENT}>
				<div className={VERTICAL_SPACING.FORM_FIELD}>
					<Label htmlFor={`${config.inputId}-token`}>Token</Label>
					<Select
						value={selectedToken?.symbol || ''}
						onValueChange={handleTokenSelect}
						disabled={!isConnected || isLoadingTokens || tokens.length === 0}
					>
						<SelectTrigger id={`${config.inputId}-token`}>
							{isLoadingTokens ? <Skeleton className="h-5 w-32" /> : <SelectValue placeholder="Select token" />}
						</SelectTrigger>
						<SelectContent>
							{tokens.map((token) => (
								<SelectItem key={token.symbol} value={token.symbol}>
									{token.symbol}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{config.showAToken && aTokenAddress && tokens.length > 0 && (
						<SecondaryText>
							aToken: {aTokenAddress.slice(0, 6)}...{aTokenAddress.slice(-4)}
						</SecondaryText>
					)}
					{tokens.length === 0 && !isLoadingTokens && isConnected && <InfoText>{config.infoMessage}</InfoText>}
				</div>

				<div className={VERTICAL_SPACING.FORM_FIELD}>
					<Label htmlFor={`${config.inputId}-amount`}>Amount</Label>
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							id={`${config.inputId}-amount`}
							type="text"
							placeholder="0.00"
							inputMode="decimal"
							value={localAmount}
							onChange={(e) => handleAmountChange(e.target.value)}
							disabled={isInputDisabled}
							aria-invalid={showValidationError}
							aria-describedby={showValidationError ? `${config.inputId}-amount-error` : undefined}
						/>
						<Button
							type="button"
							variant="outline"
							onClick={handleMaxClick}
							disabled={isInputDisabled}
						>
							Max
						</Button>
					</div>
					<div className="min-h-5">
						{showValidationError && (
							<ErrorText id={`${config.inputId}-amount-error`}>{ERROR_MESSAGES.INVALID_AMOUNT}</ErrorText>
						)}
					</div>
					<SecondaryText>
						{config.balanceLabel}: {config.balanceValue} {config.balanceSymbol}
					</SecondaryText>
				</div>

				{isWrongNetwork && <ErrorText>{config.errorMessage}</ErrorText>}

				{isWrongNetwork ? (
					<Button onClick={handlePrimaryAction} className="w-full" variant="destructive">
						Switch to supported network
					</Button>
				) : (
					<Button
						onClick={handlePrimaryAction}
						disabled={isPrimaryButtonDisabled}
						className="w-full"
					>
						{flow.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{buttonLabel}
					</Button>
				)}
			</CardContent>
		</Card>
	);
});

TokenFormCard.displayName = 'TokenFormCard';
