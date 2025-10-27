import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Constants for clipboard operations
 */
const CLIPBOARD_CONFIG = {
	TEXTAREA_POSITION: '-9999px', // Position textarea off-screen for fallback
	ERROR_MESSAGE: 'Failed to copy value',
} as const;

/**
 * Fallback clipboard copy using deprecated execCommand
 * Used when Clipboard API is not available (older browsers, non-HTTPS contexts)
 *
 * @param value - Text to copy
 * @returns true if successful, false otherwise
 */
function fallbackCopyToClipboard(value: string): boolean {
	const textArea = document.createElement('textarea');
	textArea.value = value;

	// Position off-screen to avoid layout shift
	textArea.style.position = 'fixed';
	textArea.style.left = CLIPBOARD_CONFIG.TEXTAREA_POSITION;
	textArea.style.top = CLIPBOARD_CONFIG.TEXTAREA_POSITION;

	document.body.appendChild(textArea);

	try {
		textArea.focus();
		textArea.select();

		// Try to copy using deprecated execCommand
		const successful = document.execCommand('copy');
		return successful;
	} catch (error) {
		console.error('Fallback clipboard copy failed:', error);
		return false;
	} finally {
		// Always cleanup DOM
		document.body.removeChild(textArea);
	}
}

/**
 * Copy text to clipboard using modern Clipboard API with fallback
 *
 * @param value - Text to copy
 * @returns Promise that resolves when copy is successful
 */
async function copyToClipboard(value: string): Promise<void> {
	// Try modern Clipboard API first (works in HTTPS contexts)
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return;
		} catch {
			// Silently fall through to fallback method
		}
	}

	// Fallback to execCommand (works in HTTP and older browsers)
	const success = fallbackCopyToClipboard(value);

	if (!success) {
		throw new Error('Both Clipboard API and fallback failed');
	}
}

/**
 * Hook that provides a clipboard copy function with toast feedback
 *
 * Features:
 * - Modern Clipboard API with automatic fallback to execCommand
 * - Consistent toast notifications (success/error)
 * - Proper error handling and logging
 * - Memoized callback to prevent unnecessary re-renders
 *
 * @param successMessage - Custom success message (default: 'Copied to clipboard')
 * @returns Memoized async function to copy text to clipboard
 *
 * @example
 * const copyToClipboard = useClipboardToast('Address copied!');
 * await copyToClipboard('0x1234...');
 */
export function useClipboardToast(successMessage = 'Copied to clipboard') {
	return useCallback(
		async (value: string) => {
			try {
				await copyToClipboard(value);
				toast.success(successMessage);
			} catch (error) {
				console.error('Clipboard copy operation failed:', error);
				toast.error(CLIPBOARD_CONFIG.ERROR_MESSAGE);
			}
		},
		[successMessage]
	);
}
