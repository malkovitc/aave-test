/**
 * ERC20 Token Standard ABI
 *
 * Contains common ERC20 function signatures used across the application.
 * Extracted to shared location to avoid duplication (DRY principle).
 */

/**
 * Full ERC20 ABI with all common view functions
 */
export const ERC20_ABI = [
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'name',
		outputs: [{ name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ name: '', type: 'uint8' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;

/**
 * Minimal ERC20 ABI with only balanceOf function
 * Use this when you only need to read token balances (more efficient)
 */
export const ERC20_BALANCE_ABI = [
	{
		inputs: [{ name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;

/**
 * ERC20 Permit ABI - DOMAIN_SEPARATOR for EIP-2612 support detection
 * Use this to check if a token supports gasless approvals via permit()
 */
export const ERC20_PERMIT_ABI = [
	{
		inputs: [],
		name: 'DOMAIN_SEPARATOR',
		outputs: [{ name: '', type: 'bytes32' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const;
