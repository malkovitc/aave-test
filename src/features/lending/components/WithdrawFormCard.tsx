import { forwardRef, useEffect, useImperativeHandle } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { ErrorText, SecondaryText, InfoText } from '@/shared/ui/text';
import { useWithdrawFlow } from '../hooks/use-withdraw-flow';
import { useATokenBalances } from '@/features/tokens/hooks/use-atoken-balances';
import { useTokenForm } from '../hooks/use-token-form';
import { useWallet } from '@/features/wallet/hooks/use-wallet';
import { useDepositContext } from '../context/DepositContext';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { ERROR_MESSAGES, INFO_MESSAGES } from '@/shared/config/messages';
import { VERTICAL_SPACING } from '@/shared/config/spacing';

export interface WithdrawFormCardRef {
	selectToken: (symbol: string) => void;
}

/**
 * Withdraw form - uncontrolled component with imperative selectToken() API.
 * Handles withdrawal from Aave positions.
 */
export const WithdrawFormCard = forwardRef<WithdrawFormCardRef, {}>((props, ref) => {
	const { isConnected, isWrongNetwork, switchToSupportedNetwork } = useWallet();
	const { positions } = useATokenBalances();
	const { withdrawInputRef } = useDepositContext();

	const tokensWithBalance = positions.map((p) => p.token);

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
	} = useTokenForm(() => tokensWithBalance);

	useImperativeHandle(ref, () => ({ selectToken }), [selectToken]);

	const position = positions.find((p) => p.token.symbol === safeToken.symbol);
	const balanceFormatted = position?.formatted || '0';
	const aTokenAddress = safeToken.aTokenAddress;

		const {
			setAmount,
			isValidAmount,
			handleWithdraw,
			handleMaxClick: handleMaxWithdrawFlow,
			setIsMaxWithdraw,
			isWithdrawing,
			isLoading,
			isWithdrawSuccess,
		} = useWithdrawFlow(safeToken, balanceFormatted, aTokenAddress);

		// Sync debounced amount to withdrawFlow (only after user stops typing)
		useEffect(() => {
			setAmount(debouncedAmount);
			// Reset isMaxWithdraw flag when user manually types
			if (debouncedAmount !== balanceFormatted) {
				setIsMaxWithdraw(false);
			}
		}, [debouncedAmount, setAmount, balanceFormatted, setIsMaxWithdraw]);

		// Reset local amount after successful withdrawal
		useEffect(() => {
			if (isWithdrawSuccess) {
				clearAmount();
			}
		}, [isWithdrawSuccess, clearAmount]);

		const handleMaxClick = () => {
			// Set the formatted balance in the input
			handleMaxClickForm(balanceFormatted, setAmount);
			// Mark this as a MAX withdrawal (will use maxUint256)
			handleMaxWithdrawFlow();
		};

		const handlePrimaryAction = async () => {
			if (!isConnected) {
				return;
			}

			if (isWrongNetwork) {
				switchToSupportedNetwork();
				return;
			}

			await handleWithdraw();
		};

		return (
			<Card>
				<CardHeader>
					<CardTitle>Withdraw</CardTitle>
					<CardDescription>Withdraw your tokens</CardDescription>
				</CardHeader>
				<CardContent className={VERTICAL_SPACING.CARD_CONTENT}>
					<div className={VERTICAL_SPACING.FORM_FIELD}>
						<Label htmlFor="withdraw-token">Token</Label>
						<Select
							value={selectedToken?.symbol || ''}
							onValueChange={(symbol) => {
								const token = tokens.find((t) => t.symbol === symbol);
								if (token) {
									setSelectedToken(token);
								}
							}}
							disabled={!isConnected || isLoadingTokens || tokens.length === 0}
						>
							<SelectTrigger id="withdraw-token">
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
						{aTokenAddress && tokens.length > 0 && (
							<SecondaryText>
								aToken: {aTokenAddress.slice(0, 6)}...{aTokenAddress.slice(-4)}
							</SecondaryText>
						)}
						{tokens.length === 0 && !isLoadingTokens && isConnected && (
							<InfoText>{INFO_MESSAGES.NO_POSITIONS_WITHDRAW}</InfoText>
						)}
					</div>

					<div className={VERTICAL_SPACING.FORM_FIELD}>
						<Label htmlFor="withdraw-amount">Amount</Label>
						<div className="flex gap-2">
							<Input
								ref={withdrawInputRef}
								id="withdraw-amount"
								type="text"
								placeholder="0.00"
								inputMode="decimal"
								value={localAmount}
								onChange={(e) => handleAmountChange(e.target.value)}
								disabled={!isConnected || isLoading || isWrongNetwork || !selectedToken || tokens.length === 0}
								aria-invalid={localAmount !== '' && localAmount === debouncedAmount && !isValidAmount}
								aria-describedby={
									localAmount !== '' && localAmount === debouncedAmount && !isValidAmount
										? 'withdraw-amount-error'
										: undefined
								}
							/>
							<Button
								type="button"
								variant="outline"
								onClick={handleMaxClick}
								disabled={!isConnected || isLoading || isWrongNetwork || !selectedToken || tokens.length === 0}
							>
								Max
							</Button>
						</div>
						<div className="min-h-5">
							{localAmount !== '' && localAmount === debouncedAmount && !isValidAmount && (
								<ErrorText id="withdraw-amount-error">{ERROR_MESSAGES.INVALID_AMOUNT}</ErrorText>
							)}
						</div>
						<SecondaryText>
							Available: {balanceFormatted} a{safeToken.symbol || ''}
						</SecondaryText>
					</div>

					{isWrongNetwork && <ErrorText>{ERROR_MESSAGES.WRONG_NETWORK_WITHDRAW}</ErrorText>}

					{isWrongNetwork ? (
						<Button onClick={handlePrimaryAction} className="w-full" variant="destructive">
							Switch to supported network
						</Button>
					) : (
						<Button
							onClick={handlePrimaryAction}
							disabled={!isConnected || !isValidAmount || isLoading || tokens.length === 0}
							className="w-full"
						>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
						</Button>
					)}
				</CardContent>
			</Card>
		);
	}
);

WithdrawFormCard.displayName = 'WithdrawFormCard';
