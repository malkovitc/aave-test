import { ReactElement, ReactNode } from 'react';
import { render, renderHook, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { UserTokensProvider } from '@/features/tokens/context/UserTokensContext';
import { DepositProvider } from '@/features/lending/context/DepositContext';

/**
 * Test utilities for rendering components with providers
 *
 * Provides Wagmi and TanStack Query context for testing hooks and components
 */

// Create a test Wagmi config
export const createTestConfig = () => {
	return createConfig({
		chains: [sepolia],
		transports: {
			[sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/demo'),
		},
	});
};

// Create a test QueryClient with sensible defaults
export const createTestQueryClient = () => {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false, // Don't retry failed queries in tests
				gcTime: 0, // Disable garbage collection
				staleTime: 0, // Always fetch fresh data in tests
			},
			mutations: {
				retry: false,
			},
		},
	});
};

interface AllTheProvidersProps {
	children: ReactNode;
	queryClient?: QueryClient;
	wagmiConfig?: ReturnType<typeof createTestConfig>;
}

// Provider wrapper for tests
function AllTheProviders({
	children,
	queryClient = createTestQueryClient(),
	wagmiConfig = createTestConfig(),
}: AllTheProvidersProps) {
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				<UserTokensProvider>
					<DepositProvider>{children}</DepositProvider>
				</UserTokensProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}

// Custom render function that includes providers
export function renderWithProviders(
	ui: ReactElement,
	options?: Omit<RenderOptions, 'wrapper'> & {
		queryClient?: QueryClient;
		wagmiConfig?: ReturnType<typeof createTestConfig>;
	}
) {
	const { queryClient, wagmiConfig, ...renderOptions } = options || {};

	return render(ui, {
		wrapper: ({ children }) => (
			<AllTheProviders queryClient={queryClient} wagmiConfig={wagmiConfig}>
				{children}
			</AllTheProviders>
		),
		...renderOptions,
	});
}

// Custom renderHook function that includes providers
export function renderHookWithProviders<Result, Props>(
	hook: (props: Props) => Result,
	options?: Omit<RenderOptions, 'wrapper'> & {
		queryClient?: QueryClient;
		wagmiConfig?: ReturnType<typeof createTestConfig>;
		initialProps?: Props;
	}
) {
	const { queryClient, wagmiConfig, ...renderOptions } = options || {};

	return renderHook(hook, {
		wrapper: ({ children }) => (
			<AllTheProviders queryClient={queryClient} wagmiConfig={wagmiConfig}>
				{children}
			</AllTheProviders>
		),
		...renderOptions,
	});
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { renderWithProviders as render };
export { renderHookWithProviders as renderHook };
