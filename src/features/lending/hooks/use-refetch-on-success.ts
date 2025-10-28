import { useEffect, useRef } from 'react';

/**
 * Generic hook to trigger refetch callbacks when operation succeeds
 *
 * Architecture:
 * - Uses ref to store callbacks (avoids spreading array in deps)
 * - Only 1 dependency in useEffect (isSuccess)
 * - Callbacks are always fresh (updated via ref)
 *
 * Prevents scattered refetch logic across multiple useEffect
 */
export function useRefetchOnSuccess(isSuccess: boolean, callbacks: (() => void)[]) {
	// Store callbacks in ref to avoid adding them to dependencies
	const callbacksRef = useRef<(() => void)[]>(callbacks);

	// Always keep ref in sync with latest callbacks
	callbacksRef.current = callbacks;

	// Execute callbacks when operation succeeds (only 1 dep!)
	useEffect(() => {
		if (isSuccess && callbacksRef.current) {
			callbacksRef.current.forEach((callback) => callback());
		}
	}, [isSuccess]);
}
