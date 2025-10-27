import { useState, useEffect } from 'react';

/**
 * Hook to manage success notification timing
 *
 * Responsibilities:
 * - Show success message when transaction completes
 * - Hide message after specified duration
 * - Clear form after specified delay
 *
 * @param isSuccess - Whether the transaction succeeded
 * @param onClearForm - Callback to clear the form
 * @param messageDuration - How long to show success message (ms)
 * @param clearFormDelay - How long to wait before clearing form (ms)
 */
export function useSuccessNotification(
	isSuccess: boolean,
	onClearForm?: () => void,
	messageDuration: number = 10000,
	clearFormDelay: number = 2000
) {
	const [showSuccess, setShowSuccess] = useState(false);

	useEffect(() => {
		if (!isSuccess) return;

		// Show success message
		setShowSuccess(true);

		// Hide success message after duration
		const hideTimer = setTimeout(() => {
			setShowSuccess(false);
		}, messageDuration);

		// Clear form after delay
		const clearTimer = setTimeout(() => {
			if (onClearForm) {
				onClearForm();
			}
		}, clearFormDelay);

		return () => {
			clearTimeout(hideTimer);
			clearTimeout(clearTimer);
		};
	}, [isSuccess, onClearForm, messageDuration, clearFormDelay]);

	return { showSuccess };
}
