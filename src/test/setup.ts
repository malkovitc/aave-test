import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case (e.g., clearing jsdom)
afterEach(() => {
	cleanup();
});

// Mock useUserTokens hook globally to prevent UserTokensProvider from making API calls
vi.mock('@/features/tokens/hooks/use-user-tokens', () => ({
	useUserTokens: vi.fn(() => ({
		data: [],
		isLoading: false,
		error: null,
	})),
}));
