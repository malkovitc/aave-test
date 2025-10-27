import { memo } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { SuccessMessage } from '@/shared/ui/status-message';
import { HintText, InfoText } from '@/shared/ui/text';
import { SUPPORTED_TOKENS } from '../config/tokens';
import { useWethBalances } from '../hooks/use-weth-balances';
import { useWrapForm } from '../hooks/use-wrap-form';
import { useWethWrap, useWethUnwrap } from '../hooks/use-weth-wrap';
import { useSuccessNotification } from '../hooks/use-success-notification';
import { getTransactionUrl } from '@/shared/lib/chain-config';
import { MIN_ETH_FOR_GAS } from '@/shared/constants/gas';
import { SUCCESS_MESSAGES, INFO_MESSAGES } from '@/shared/config/messages';
import { VERTICAL_SPACING } from '@/shared/config/spacing';

const WETH_CONFIG = SUPPORTED_TOKENS.WETH;

/**
 * WETH Wrapper Component
 *
 * Allows users to wrap ETH to WETH and unwrap WETH to ETH
 * This is a helper component for testing - WETH is needed for Aave deposits
 *
 * Composition:
 * - useWethBalances: Fetches and formats ETH/WETH balances
 * - useWrapForm: Manages form state, validation, and max buttons
 * - useWethWrap: Handles wrapping ETH → WETH
 * - useWethUnwrap: Handles unwrapping WETH → ETH
 * - useSuccessNotification: Manages success message timing
 */
function WethWrapperComponent() {
	const { chain } = useAccount();

	// Balance management
	const { ethBalance, wethBalance, ethBalanceFormatted, wethBalanceFormatted, isLoading, refetchBalances } =
		useWethBalances();

	// Form state and validation
	const { amount, setAmount, clearAmount, isValidAmount, hasEnoughEth, hasEnoughWeth, handleMaxEth, handleMaxWeth } =
		useWrapForm(ethBalance, wethBalance);

	// Wrap/Unwrap hooks
	const {
		handleWrap: executeWrap,
		wrapHash,
		isWrapPending,
		isWrapSuccess,
	} = useWethWrap(WETH_CONFIG?.address, refetchBalances);

	const {
		handleUnwrap: executeUnwrap,
		unwrapHash,
		isUnwrapPending,
		isUnwrapSuccess,
	} = useWethUnwrap(WETH_CONFIG?.address, refetchBalances);

	// Success notifications
	const { showSuccess: showWrapSuccess } = useSuccessNotification(isWrapSuccess, clearAmount);
	const { showSuccess: showUnwrapSuccess } = useSuccessNotification(isUnwrapSuccess, clearAmount);

	// Action handlers
	const handleWrap = () => executeWrap(amount);
	const handleUnwrap = () => executeUnwrap(amount);

	return (
		<Card>
			<CardHeader>
				<CardTitle>🔄 WETH Wrapper</CardTitle>
				<CardDescription>Wrap ETH to WETH or unwrap WETH to ETH. WETH is required for Aave deposits.</CardDescription>
			</CardHeader>
			<CardContent className={VERTICAL_SPACING.CARD_CONTENT}>
				{/* Balances */}
				<div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-lg text-sm">
					<div>
						<InfoText>ETH Balance</InfoText>
						<div className="font-medium">
							{isLoading ? <Skeleton className="h-5 w-24" /> : `${ethBalanceFormatted} ETH`}
						</div>
					</div>
					<div>
						<InfoText>WETH Balance</InfoText>
						<div className="font-medium">
							{isLoading ? <Skeleton className="h-5 w-24" /> : `${wethBalanceFormatted} WETH`}
						</div>
					</div>
				</div>

				{/* Amount Input */}
				<div className={VERTICAL_SPACING.FORM_FIELD}>
					<label className="text-sm font-medium">Amount</label>
					<div className="flex gap-2">
						<Input
							type="number"
							placeholder="0.01"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							step="0.001"
							min="0"
						/>
					</div>
					<div className="flex gap-2">
						<HintText asChild>
							<button onClick={handleMaxEth} className="text-primary hover:underline">
								Max ETH
							</button>
						</HintText>
						<HintText>|</HintText>
						<HintText asChild>
							<button onClick={handleMaxWeth} className="text-primary hover:underline">
								Max WETH
							</button>
						</HintText>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="grid grid-cols-2 gap-2">
					<Button onClick={handleWrap} disabled={!isValidAmount || !hasEnoughEth || isWrapPending} className="w-full">
						{isWrapPending ? 'Wrapping...' : 'Wrap ETH → WETH'}
					</Button>
					<Button
						onClick={handleUnwrap}
						disabled={!isValidAmount || !hasEnoughWeth || isUnwrapPending}
						variant="outline"
						className="w-full"
					>
						{isUnwrapPending ? 'Unwrapping...' : 'Unwrap WETH → ETH'}
					</Button>
				</div>

				{/* Success Messages */}
				{showWrapSuccess && (
					<SuccessMessage
						link={
							wrapHash && chain
								? {
										href: getTransactionUrl(chain, wrapHash),
										text: 'View on Explorer',
									}
								: undefined
						}
					>
						{SUCCESS_MESSAGES.ETH_WRAPPED}
					</SuccessMessage>
				)}

				{showUnwrapSuccess && (
					<SuccessMessage
						link={
							unwrapHash && chain
								? {
										href: getTransactionUrl(chain, unwrapHash),
										text: 'View on Explorer',
									}
								: undefined
						}
					>
						{SUCCESS_MESSAGES.ETH_UNWRAPPED}
					</SuccessMessage>
				)}

				{/* Info */}
				<HintText>{INFO_MESSAGES.MIN_ETH_FOR_GAS(MIN_ETH_FOR_GAS.toString())}</HintText>
			</CardContent>
		</Card>
	);
}

export const WethWrapper = memo(WethWrapperComponent);

/**
 * Conditional wrapper that only shows WethWrapper when user needs it
 * Shows when: user has ETH but no (or low) WETH
 */
export function ConditionalWethWrapper() {
	const { isConnected } = useAccount();
	const { ethBalance, wethBalance, isLoading } = useWethBalances();

	// Don't show if not connected
	if (!isConnected) {
		return null;
	}

	// Don't show while loading
	if (isLoading) {
		return null;
	}

	// Show if user has ETH but no WETH (or very little WETH < 0.001)
	const hasEth = ethBalance && ethBalance > 0n;
	const hasLowOrNoWeth = !wethBalance || wethBalance < BigInt(1e15); // < 0.001 WETH

	if (hasEth && hasLowOrNoWeth) {
		return <WethWrapper />;
	}

	return null;
}
