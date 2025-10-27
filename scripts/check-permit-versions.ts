/**
 * Script to check EIP-2612 permit version for each token
 * Run: npx tsx scripts/check-permit-versions.ts
 */

import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';

const TOKENS = {
	USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8' as Address,
	USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0' as Address,
	LINK: '0xf8Fb3713D459D7C1018BD0A49D19b4C44290EBE5' as Address,
};

const publicClient = createPublicClient({
	chain: sepolia,
	transport: http(),
});

async function checkTokenVersion(symbol: string, address: Address) {
	console.log(`\n📝 Checking ${symbol} (${address})...`);

	// Check name
	try {
		const name = (await publicClient.readContract({
			address,
			abi: [
				{
					name: 'name',
					type: 'function',
					stateMutability: 'view',
					inputs: [],
					outputs: [{ type: 'string' }],
				},
			],
			functionName: 'name',
		})) as string;
		console.log(`   name: "${name}"`);
	} catch (err) {
		console.log(`   name: ❌ NOT FOUND`);
	}

	// Check version
	try {
		const version = (await publicClient.readContract({
			address,
			abi: [
				{
					name: 'version',
					type: 'function',
					stateMutability: 'view',
					inputs: [],
					outputs: [{ type: 'string' }],
				},
			],
			functionName: 'version',
		})) as string;
		console.log(`   version: "${version}"`);
	} catch (err) {
		console.log(`   version: ❌ NOT IMPLEMENTED (will use default "1")`);
	}

	// Check DOMAIN_SEPARATOR
	try {
		const domainSeparator = (await publicClient.readContract({
			address,
			abi: [
				{
					name: 'DOMAIN_SEPARATOR',
					type: 'function',
					stateMutability: 'view',
					inputs: [],
					outputs: [{ type: 'bytes32' }],
				},
			],
			functionName: 'DOMAIN_SEPARATOR',
		})) as string;
		console.log(`   DOMAIN_SEPARATOR: ${domainSeparator.slice(0, 20)}...`);
	} catch (err) {
		console.log(`   DOMAIN_SEPARATOR: ❌ NOT FOUND`);
	}
}

async function main() {
	console.log('🔍 Checking EIP-2612 permit versions for all tokens...\n');

	for (const [symbol, address] of Object.entries(TOKENS)) {
		await checkTokenVersion(symbol, address);
	}

	console.log('\n✅ Done!');
}

main().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
