import { useMemo, useEffect, useRef } from 'react';
import type { TokenConfig } from '@/features/tokens/config/tokens';
import { useDeposit } from './use-deposit';
import { useSupplyWithPermit } from './use-supply-with-permit';
import { useTransactionToast } from '@/shared/hooks/use-transaction-toast';
import { useDepositContext } from '../context/DepositContext';

// Global registry to track which hashes belong to which tokens
// This prevents wagmi's stale hashes from one token being accepted as "new" for another token
const hashToTokenRegistry = new Map<string, string>();

/**
 * Abstraction over deposit methods (permit vs traditional)
 * Automatically selects the correct method based on token.supportsPermit
 *
 * Also manages toast notifications at this orchestration level to ensure
 * component-level isolation and prevent cross-token interference from wagmi's
 * global singleton state.
 */
export function useDepositMethod(token: TokenConfig) {
	const traditionalDeposit = useDeposit(token);
	const permitDeposit = useSupplyWithPermit(token);
	const { refetchBalances } = useDepositContext();

	const usesPermit = token.supportsPermit;
	const hash = usesPermit ? permitDeposit.hash : traditionalDeposit.hash;
	const isPending = usesPermit ? permitDeposit.isPending : traditionalDeposit.isPending;
	const isSuccess = usesPermit ? permitDeposit.isSuccess : traditionalDeposit.isSuccess;
	const error = usesPermit ? permitDeposit.error : traditionalDeposit.error;

	// Track the last hash AND token to detect stale errors from wagmi
	// Wagmi DOES NOT clear error/hash state when switching tokens!
	const lastHashWithError = useRef<string | undefined>();
	const lastTokenSymbol = useRef<string>(token.symbol);
	const lastSeenHashForToken = useRef<string | undefined>();
	const tokenJustChanged = useRef<boolean>(false);

	// Reset error tracking when token changes
	if (lastTokenSymbol.current !== token.symbol) {
		console.log(`[useDepositMethod] 🔄 Token changed: ${lastTokenSymbol.current} → ${token.symbol}, resetting error tracking`);
		lastTokenSymbol.current = token.symbol;
		lastHashWithError.current = undefined;
		lastSeenHashForToken.current = undefined;
		tokenJustChanged.current = true; // Mark that token just changed
	}

	// If token just changed, ignore any hash/error until we get a NEW hash for this token
	if (tokenJustChanged.current) {
		if (hash && hash !== lastSeenHashForToken.current) {
			// Check if this hash belongs to a DIFFERENT token
			const hashOwner = hashToTokenRegistry.get(hash);
			if (hashOwner && hashOwner !== token.symbol) {
				// This hash belongs to another token - ignore it!
				console.log(`[useDepositMethod] ⛔ Rejecting hash ${hash.slice(0,8)} - belongs to ${hashOwner}, not ${token.symbol}`);
			} else {
				// This is a NEW hash for the new token - start tracking it
				console.log(`[useDepositMethod] ✅ First NEW hash for ${token.symbol}: ${hash.slice(0,8)}`);
				lastSeenHashForToken.current = hash;
				hashToTokenRegistry.set(hash, token.symbol);
				tokenJustChanged.current = false;
			}
		} else {
			// Still seeing old hash or no hash - ignore everything
			console.log(`[useDepositMethod] ⏭️  Ignoring stale state after token change (hash=${hash?.slice(0,8)})`);
		}
	} else {
		// Normal operation - track new hashes
		if (hash && hash !== lastSeenHashForToken.current) {
			lastSeenHashForToken.current = hash;
			hashToTokenRegistry.set(hash, token.symbol);
		}
	}

	// Only consider error valid if:
	// 1. Token hasn't just changed (no stale state)
	// 2. Hash exists AND matches the hash that caused the error
	let isError = false;
	if (!tokenJustChanged.current && error && hash) {
		// If we have an error and a hash, record this hash as having an error
		lastHashWithError.current = hash;
		isError = true;
	} else if (error && !hash) {
		// If we have error but no hash, this is a STALE error from previous transaction
		isError = false;
	} else if (!error && hash) {
		// If no error but we have a hash, clear the last error hash
		if (lastHashWithError.current === hash) {
			lastHashWithError.current = undefined;
		}
		isError = false;
	}

	// Filter out stale state when token just changed
	// Pass undefined to toast to prevent showing stale transactions
	const filteredHash = tokenJustChanged.current ? undefined : hash;
	const filteredIsPending = tokenJustChanged.current ? false : isPending;
	const filteredIsSuccess = tokenJustChanged.current ? false : isSuccess;

	// Log aggregated state
	console.log(`[useDepositMethod ${token.symbol}] tokenJustChanged=${tokenJustChanged.current}, usesPermit=${usesPermit}, hash=${hash?.slice(0,8)}, filteredHash=${filteredHash?.slice(0,8)}, isPending=${isPending}, isSuccess=${isSuccess}, rawError=${!!error}, isError=${isError}, lastErrorHash=${lastHashWithError.current?.slice(0,8)}`);

	// Show transaction toast notifications
	useTransactionToast(
		filteredHash,
		filteredIsPending,
		filteredIsSuccess,
		isError,
		{
			pending: 'Confirming deposit...',
			success: `Deposited ${token.symbol} successfully!`,
			error: 'Deposit failed'
		},
		`deposit-${token.symbol}`
	);

	// Refetch balances immediately after successful deposit
	useEffect(() => {
		if (isSuccess && refetchBalances) {
			refetchBalances();
		}
	}, [isSuccess, refetchBalances]);

	return useMemo(() => {
		return {
			deposit: usesPermit ? permitDeposit.supplyWithPermit : traditionalDeposit.deposit,
			isPending,
			isSuccess,
			hash,
			error,
			usesPermit,
		};
	}, [usesPermit, permitDeposit, traditionalDeposit, isPending, isSuccess, hash, error]);
}
