import { createContext, useContext, type ReactNode } from 'react';
import { useUserTokens } from '../hooks/use-user-tokens';
import type { TokenConfig } from '../config/tokens';

interface DiscoveredToken extends TokenConfig {
	balance: bigint;
	balanceFormatted: string;
}

interface UserTokensContextValue {
	tokens: DiscoveredToken[];
	isLoading: boolean;
	error: Error | null;
	refetch: () => void;
}

const UserTokensContext = createContext<UserTokensContextValue | undefined>(undefined);

export function UserTokensProvider({ children }: { children: ReactNode }) {
	const { data: tokens = [], isLoading, error, refetch } = useUserTokens({ onlyWithBalance: false });

	return (
		<UserTokensContext.Provider value={{ tokens, isLoading, error: error as Error | null, refetch }}>
			{children}
		</UserTokensContext.Provider>
	);
}

export function useUserTokensContext() {
	const context = useContext(UserTokensContext);
	if (context === undefined) {
		throw new Error('useUserTokensContext must be used within UserTokensProvider');
	}
	return context;
}
