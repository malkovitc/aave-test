# Aave Lite v2

Minimal Aave V3 interface for deposits and withdrawals on Sepolia testnet.

## Features

- Deposit tokens to Aave V3 (USDC, DAI, LINK)
- Withdraw tokens from Aave V3
- EIP-2612 gasless approvals (permit)
- Real-time aToken balance tracking
- Max withdrawal support
- Responsive UI (mobile + desktop)

## Tech Stack

- React 18 + TypeScript + Vite
- wagmi v2 + viem v2
- TanStack Query v5
- Tailwind CSS + Radix UI
- Vitest + React Testing Library

## Quick Start

```bash
# Install
npm install

# Setup environment
cp .env.example .env
# Add your RPC URL to .env

# Run dev server
npm run dev
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript check
```

## Configuration

### Network
- Sepolia Testnet (Chain ID: 11155111)

### Tokens
- USDC (6 decimals)
- DAI (18 decimals)
- LINK (18 decimals)

Addresses from official Aave V3 Sepolia deployment.

## Project Structure

```
src/
  app/            # Application root
  features/
    wallet/       # Wallet connection
    tokens/       # Token balances
    lending/      # Deposit/withdraw
  shared/
    ui/           # UI components
    hooks/        # Shared hooks
    lib/          # Utilities
```

## License

MIT
