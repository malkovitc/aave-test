import { forwardRef, useEffect, useMemo, useImperativeHandle } from 'react';
import { parseUnits } from 'viem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ErrorText, InfoText } from '@/shared/ui/text';
import { useDepositFlow } from '../hooks/use-deposit-flow';
import { useTokenForm } from '../hooks/use-token-form';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { useDepositContext } from '../context/DepositContext';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import type { DiscoveredToken } from '@/features/tokens/hooks/use-user-tokens';
import { ERROR_MESSAGES, INFO_MESSAGES } from '@/shared/config/messages';
import { VERTICAL_SPACING } from '@/shared/config/spacing';

export interface DepositFormCardRef {
	selectToken: (symbol: string) => void;
}

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

function getActionLabel({
	needsApproval,
	isApproving,
	isDepositing,
}: {
	needsApproval: boolean;
	isApproving: boolean;
	isDepositing: boolean;
}) {
	if (isApproving) return 'Approving...';
	if (isDepositing) return 'Depositing...';
	if (needsApproval) return 'Approve';
	return 'Deposit';
}

/**
 * Deposit form - uncontrolled component with imperative selectToken() API.
 * Handles approval + deposit flow with supplyWithPermit for supported tokens.
 */
export const DepositFormCard = forwardRef<DepositFormCardRef>((_props, ref) => {
	const { isConnected, isWrongNetwork, switchToSupportedNetwork } = useWallet();
	const { depositInputRef } = useDepositContext();

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
	} = useTokenForm(filterTokensWithBalance);

	useImperativeHandle(ref, () => ({ selectToken }), [selectToken]);

	const balanceFormatted = getTokenBalanceFormatted(selectedToken);

		const {
			setAmount,
			needsApproval,
			isValidAmount,
			handleApprove,
			handleDeposit,
			isApproving,
			isDepositing,
			isLoading,
			isDepositSuccess,
		} = useDepositFlow(safeToken, balanceFormatted);

		// Sync debounced amount to depositFlow (only after user stops typing)
		useEffect(() => {
			setAmount(debouncedAmount);
		}, [debouncedAmount, setAmount]);

		// Reset local amount after successful deposit
		useEffect(() => {
			if (isDepositSuccess) {
				clearAmount();
			}
		}, [isDepositSuccess, clearAmount]);

		const handleMaxClick = () => {
			handleMaxClickForm(balanceFormatted, setAmount);
		};

		// Local validation based on debouncedAmount (no race condition)
		// This ensures validation result is always in sync with debouncedAmount
		const isLocallyValid = useMemo(() => {
			if (!debouncedAmount) return false;
			try {
				const amountBigInt = parseUnits(debouncedAmount, safeToken.decimals);
				const balanceBigInt = parseUnits(balanceFormatted || '0', safeToken.decimals);
				return amountBigInt > 0n && amountBigInt <= balanceBigInt;
			} catch {
				return false;
			}
		}, [debouncedAmount, balanceFormatted, safeToken.decimals]);
		
		// Stabilize button label to prevent flickering during input
		const buttonLabel = useMemo(() => {
			if (localAmount !== debouncedAmount && localAmount !== '') {
				// User is still typing - keep current label stable
				return needsApproval ? 'Approve' : 'Deposit';
			}
			// Debounce completed - update label based on latest state
			return getActionLabel({ needsApproval, isApproving, isDepositing });
		}, [localAmount, debouncedAmount, needsApproval, isApproving, isDepositing]);

		const handlePrimaryAction = async () => {
			if (!isConnected) {
				return;
			}

			if (isWrongNetwork) {
				switchToSupportedNetwork();
				return;
			}

			if (needsApproval) {
				await handleApprove();
			} else {
				await handleDeposit();
			}
		};

		return (
			<Card>
				<CardHeader>
					<CardTitle>Deposit</CardTitle>
					<CardDescription>Deposit your tokens into Aave to start earning interest</CardDescription>
				</CardHeader>
				<CardContent className={VERTICAL_SPACING.CARD_CONTENT}>
					<div className={VERTICAL_SPACING.FORM_FIELD}>
						<Label htmlFor="deposit-token">Token</Label>
						<Select
							value={selectedToken?.symbol || ''}
							onValueChange={(symbol) => {
								const token = tokens.find((t) => t.symbol === symbol);
								if (token) {
									setSelectedToken(token);
								}
							}}
							disabled={!isConnected || isLoadingTokens}
						>
							<SelectTrigger id="deposit-token">
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
						{tokens.length === 0 && !isLoadingTokens && isConnected && (
							<InfoText>{INFO_MESSAGES.NO_TOKENS_WITH_BALANCE}</InfoText>
						)}
					</div>

					<div className={VERTICAL_SPACING.FORM_FIELD}>
						<Label htmlFor="deposit-amount">Amount</Label>
						<div className="flex gap-2">
							<Input
								ref={depositInputRef}
								id="deposit-amount"
								type="text"
								placeholder="0.00"
								inputMode="decimal"
								value={localAmount}
								onChange={(e) => handleAmountChange(e.target.value)}
								disabled={!isConnected || isLoading || isWrongNetwork || !selectedToken}
								aria-invalid={debouncedAmount !== '' && !isLocallyValid}
								aria-describedby={debouncedAmount !== '' && !isLocallyValid ? 'deposit-amount-error' : undefined}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={handleMaxClick}
								disabled={!isConnected || isLoading || isWrongNetwork || !selectedToken}
							>
								Max
							</Button>
						</div>
						<div className="min-h-5">
							{debouncedAmount !== '' && !isLocallyValid && (
								<ErrorText id="deposit-amount-error">{ERROR_MESSAGES.INVALID_AMOUNT}</ErrorText>
							)}
						</div>
					</div>

					{isWrongNetwork && <ErrorText>{ERROR_MESSAGES.WRONG_NETWORK_DEPOSIT}</ErrorText>}

					{isWrongNetwork ? (
						<Button onClick={handlePrimaryAction} className="w-full" variant="destructive">
							Switch to supported network
						</Button>
					) : (
						<Button
							onClick={handlePrimaryAction}
							disabled={!isConnected || !isValidAmount || isLoading}
							className="w-full"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{buttonLabel}
						</Button>
					)}
				</CardContent>
			</Card>
		);
	}
);

DepositFormCard.displayName = 'DepositFormCard';
