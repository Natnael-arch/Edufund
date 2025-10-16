# EduFund Frontend

React + TypeScript + Vite frontend for the EduFund platform.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure WalletConnect:
   - Get a Project ID from https://cloud.walletconnect.com/
   - Update `src/wagmi.config.ts` with your Project ID

3. Start development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

Create `.env` file (optional):
```
VITE_API_URL=http://localhost:3001/api
```

## Routes

- `/` - Home page (quest listing)
- `/quest/:id` - Quest details
- `/profile` - User profile (requires wallet connection)

## Features

- Wallet connection with RainbowKit
- Quest browsing and completion
- User profile with completed quests
- Responsive design with TailwindCSS



