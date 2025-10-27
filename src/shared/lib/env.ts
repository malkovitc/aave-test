import { z } from 'zod';

const envSchema = z.object({
	VITE_CHAIN_ID: z.string().transform(Number),
	VITE_RPC_URL: z.string().url(),
	VITE_WALLETCONNECT_PROJECT_ID: z.string().optional(),
});

function getEnv() {
	const env = {
		VITE_CHAIN_ID: import.meta.env.VITE_CHAIN_ID,
		VITE_RPC_URL: import.meta.env.VITE_RPC_URL,
		VITE_WALLETCONNECT_PROJECT_ID: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
	};

	const parsed = envSchema.safeParse(env);

	if (!parsed.success) {
		console.error('Invalid environment variables:', parsed.error.flatten());
		throw new Error('Invalid environment configuration');
	}

	return parsed.data;
}

export const env = getEnv();
