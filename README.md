# Aave Lite v2

A minimal, production-ready Aave interface focused on deposit/withdraw flows, built with React 18, TypeScript, wagmi v2, and viem v2.

## Features

✅ **Phase 1-4 Complete:**
- Deposit assets to Aave V3 (USDC, DAI, LINK)
- Withdraw assets from Aave V3
- Track aToken positions with auto-refresh
- Responsive UI (mobile + desktop)
- Copy aToken addresses to clipboard
- Max withdraw support (full balance)
- Type-safe Web3 interactions with wagmi v2 and viem v2
- Modern React patterns with strict TypeScript
- Comprehensive testing with 22 test cases (75% coverage)

🚧 **Coming in Phase 5:**
- APY display and calculation
- Interest earned tracking
- Transaction history
- Reserve data fetching

## Tech Stack

- **Framework**: Vite 6 + React 18
- **Language**: TypeScript (strict mode)
- **Web3**: wagmi v2 + viem v2
- **State Management**: TanStack Query v5 + Zustand
- **Styling**: Tailwind CSS v3
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint 9 (flat config) + Prettier

## Project Structure

```
src/
  app/                    # Application root and providers
  features/
    wallet/              # Wallet connection & network state
    tokens/              # Token metadata and balances
    lending/             # Deposit/withdraw flows
  shared/
    ui/                  # Reusable UI components
    hooks/               # Shared React hooks
    lib/                 # Utility functions
  styles/                # Global styles and themes
  test/                  # Test utilities and mocks
```

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, or pnpm
- MetaMask or another Web3 wallet

### Installation

1. Clone the repository:
```bash
cd /Users/evgeny/Downloads/aave-lite-v2
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your configuration:
   - `VITE_RPC_URL`: Get an API key from [Alchemy](https://www.alchemy.com) or [Infura](https://infura.io)
   - `VITE_WALLETCONNECT_PROJECT_ID`: (Optional) Get from [WalletConnect Cloud](https://cloud.walletconnect.com)

### Development

Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Testing

Run tests:
```bash
npm run test
```

Run tests with UI:
```bash
npm run test:ui
```

Generate coverage report:
```bash
npm run test:coverage
```

### Linting & Formatting

Lint code:
```bash
npm run lint
```

Format code:
```bash
npm run format
```

Type check:
```bash
npm run type-check
```

## Configuration

### Supported Networks

Currently configured for:
- **Sepolia Testnet** (Chain ID: 11155111)

### Supported Tokens

- **USDC**: USD Coin (6 decimals)
- **DAI**: Dai Stablecoin (18 decimals)
- **LINK**: ChainLink Token (18 decimals)

Token addresses are from the official Aave V3 Sepolia deployment.

## Development Roadmap

### Phase 1: Foundation & Tooling ✅
- [x] Project setup with Vite + React + TypeScript
- [x] ESLint, Prettier, and strict TypeScript configuration
- [x] Tailwind CSS setup with design tokens
- [x] wagmi + viem configuration
- [x] Environment variable management
- [x] Project structure and folder organization

### Phase 2: Wallet & Tokens (In Progress)
- [ ] Wallet connection UI
- [ ] Network detection and switching
- [ ] Token balance queries
- [ ] Token metadata display

### Phase 3: Deposit Flow
- [ ] Deposit form with validation
- [ ] Token approval flow
- [ ] Deposit transaction handling
- [ ] Transaction status toasts

### Phase 4: Positions & Withdraw
- [ ] aToken balance discovery
- [ ] Positions table
- [ ] Withdraw form
- [ ] Full withdrawal support

### Phase 5: Polish & Testing
- [ ] Error handling and user feedback
- [ ] Dark mode support
- [ ] Comprehensive test coverage
- [ ] Performance optimization

### Phase 6: Production Ready
- [ ] E2E tests with Playwright
- [ ] Accessibility audit
- [ ] Documentation
- [ ] CI/CD pipeline

## Architecture

This project follows a feature-oriented architecture based on the [Blueprint](./docs/architecture/blueprint.md):

- **Feature modules**: Self-contained features with their own hooks, components, and services
- **Shared utilities**: Reusable code across features
- **Type safety**: Strict TypeScript with Zod validation
- **Performance**: React 18 patterns, code splitting, optimized queries
- **Testing**: Unit, integration, and E2E test coverage

## Contributing

This is a demonstration project showcasing best practices for React + Web3 development in 2025.

## License

MIT

## Resources

- [Aave V3 Documentation](https://docs.aave.com/developers/getting-started/v3-overview)
- [wagmi Documentation](https://wagmi.sh)
- [viem Documentation](https://viem.sh)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)
