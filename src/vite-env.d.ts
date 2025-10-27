/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CHAIN_ID: string;
	readonly VITE_RPC_URL: string;
	readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
