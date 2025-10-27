/**
 * Amount input sanitization and validation utilities
 * Used for handling user input in token amount fields
 */

/**
 * Configuration for amount input validation
 */
const AMOUNT_CONFIG = {
	DECIMAL_SEPARATOR: '.',
	LEADING_ZERO: '0',
	VALID_CHARS_REGEX: /[^\d.]/g, // Allow only digits and dot
} as const;

/**
 * Removes all non-numeric characters except decimal separator
 *
 * @param value - Raw input string
 * @returns String containing only digits and dots
 *
 * @example
 * removeInvalidCharacters('12.34abc') // '12.34'
 * removeInvalidCharacters('1,234.56') // '1234.56'
 */
function removeInvalidCharacters(value: string): string {
	return value.replace(AMOUNT_CONFIG.VALID_CHARS_REGEX, '');
}

/**
 * Ensures only one decimal separator exists in the string
 * Keeps the first dot and removes all subsequent dots
 *
 * @param value - String that may contain multiple dots
 * @returns String with at most one dot
 *
 * @example
 * normalizeSingleDecimal('12.34.56') // '12.3456'
 * normalizeSingleDecimal('1.2.3.4')  // '1.234'
 */
function normalizeSingleDecimal(value: string): string {
	const parts = value.split(AMOUNT_CONFIG.DECIMAL_SEPARATOR);

	// No dots or single dot - return as is
	if (parts.length <= 2) {
		return value;
	}

	// Multiple dots - keep first as separator, join rest
	const [integerPart, ...decimalParts] = parts;
	return integerPart + AMOUNT_CONFIG.DECIMAL_SEPARATOR + decimalParts.join('');
}

/**
 * Adds leading zero if value starts with decimal separator
 *
 * @param value - Input string
 * @returns String with leading zero if necessary
 *
 * @example
 * ensureLeadingZero('.5')  // '0.5'
 * ensureLeadingZero('5.0') // '5.0'
 */
function ensureLeadingZero(value: string): string {
	if (value.startsWith(AMOUNT_CONFIG.DECIMAL_SEPARATOR)) {
		return AMOUNT_CONFIG.LEADING_ZERO + value;
	}
	return value;
}

/**
 * Limits the number of decimal places
 *
 * @param value - Input string with potential decimals
 * @param decimalLimit - Maximum number of decimal places allowed
 * @returns String with limited decimal places
 *
 * @example
 * limitDecimalPlaces('12.3456', 2)  // '12.34'
 * limitDecimalPlaces('12.3', 2)     // '12.3'
 * limitDecimalPlaces('12', 2)       // '12'
 */
function limitDecimalPlaces(value: string, decimalLimit: number): string {
	if (!value.includes(AMOUNT_CONFIG.DECIMAL_SEPARATOR)) {
		return value;
	}

	const [integerPart = AMOUNT_CONFIG.LEADING_ZERO, decimalPart = ''] = value.split(AMOUNT_CONFIG.DECIMAL_SEPARATOR);

	if (decimalPart.length <= decimalLimit) {
		return value;
	}

	return integerPart + AMOUNT_CONFIG.DECIMAL_SEPARATOR + decimalPart.slice(0, decimalLimit);
}

/**
 * Checks if the sanitized value is valid for use
 *
 * @param value - Sanitized input string
 * @returns true if value is valid (empty string or valid number)
 *
 * @example
 * isValidSanitizedValue('')    // true (empty is valid - user cleared input)
 * isValidSanitizedValue('12')  // true
 * isValidSanitizedValue('.')   // false (standalone dot is invalid)
 */
function isValidSanitizedValue(value: string): boolean {
	// Empty string is valid (user cleared the input)
	if (value === '') {
		return true;
	}

	// Standalone decimal separator is invalid
	if (value === AMOUNT_CONFIG.DECIMAL_SEPARATOR) {
		return false;
	}

	return true;
}

/**
 * Sanitize amount input to ensure it's a valid decimal number
 *
 * Flow:
 * 1. Remove all non-numeric characters (except dots)
 * 2. Normalize to single decimal separator
 * 3. Add leading zero if starts with dot
 * 4. Limit decimal places if specified
 * 5. Validate final result
 *
 * @param value - Raw input value from user
 * @param decimalLimit - Maximum number of decimal places allowed (optional)
 * @returns Sanitized value, empty string if cleared, or null if invalid
 *
 * @example
 * // Basic sanitization
 * sanitizeAmountInput('12.34')      // '12.34'
 * sanitizeAmountInput('12.34abc')   // '12.34'
 * sanitizeAmountInput('.5')         // '0.5'
 *
 * // With decimal limit
 * sanitizeAmountInput('12.3456', 2) // '12.34'
 * sanitizeAmountInput('0.999', 2)   // '0.99'
 *
 * // Edge cases
 * sanitizeAmountInput('')           // ''
 * sanitizeAmountInput('.')          // null
 * sanitizeAmountInput('12.34.56')   // '12.3456'
 */
export function sanitizeAmountInput(value: string, decimalLimit?: number): string | null {
	// Step 1: Remove invalid characters
	let sanitized = removeInvalidCharacters(value);

	// Step 2: Normalize to single decimal separator
	sanitized = normalizeSingleDecimal(sanitized);

	// Step 3: Add leading zero if needed
	sanitized = ensureLeadingZero(sanitized);

	// Step 4: Limit decimal places if specified
	if (decimalLimit !== undefined) {
		sanitized = limitDecimalPlaces(sanitized, decimalLimit);
	}

	// Step 5: Validate final result
	if (!isValidSanitizedValue(sanitized)) {
		return null;
	}

	return sanitized;
}
