import { useEffect } from 'react';

/**
 * Generic hook to trigger refetch callbacks when operation succeeds
 * Prevents scattered refetch logic across multiple useEffect
 */
export function useRefetchOnSuccess(isSuccess: boolean, callbacks: (() => void)[]) {
	useEffect(() => {
		if (isSuccess) {
			callbacks.forEach((callback) => callback());
		}
	}, [isSuccess, ...callbacks]); // eslint-disable-line react-hooks/exhaustive-deps
}
