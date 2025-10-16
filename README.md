# EduFund - Bitcoin-Powered Learn-to-Earn Platform

EduFund is a Web3 learn-to-earn platform built on **Mezo**, where users can complete educational quests and earn **mUSD** (Bitcoin-backed stablecoin) rewards.

## 🎯 Features

- **Wallet-Based Authentication**: Connect with Ethereum-compatible wallets
- **Educational Quests**: Browse and complete learning challenges
- **Mezo Integration**: Connect to Mezo network and interact with mUSD
- **Claim mUSD Rewards**: Earn and claim Bitcoin-backed stablecoin rewards
- **Rewards Dashboard**: Track your earnings and transaction history
- **User Profiles**: Track your progress and total earnings
- **Bitcoin-Powered**: Built on Mezo infrastructure

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Prisma** ORM
- **PostgreSQL** Database

### Frontend
- **React** + **TypeScript** + **Vite**
- **Wagmi** + **RainbowKit** for wallet integration
- **TailwindCSS** for styling
- **React Router** for navigation

## 📁 Project Structure

```
Edufund/
├── backend/
│   ├── src/
│   │   └── index.ts           # Express server & API routes
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Header.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx       # Quest listing
│   │   │   ├── QuestDetails.tsx
│   │   │   └── Profile.tsx
│   │   ├── services/
│   │   │   └── api.ts         # API client
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── wagmi.config.ts
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- WalletConnect Project ID (get from https://cloud.walletconnect.com/)

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your PostgreSQL connection string
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/edufund?schema=public"
   PORT=3001
   ```

4. **Initialize database**:
   ```bash
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

Backend will run on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Wagmi**:
   - Open `src/wagmi.config.ts`
   - Replace `YOUR_PROJECT_ID` with your WalletConnect Project ID

4. **Start development server**:
   ```bash
   npm run dev
   ```

Frontend will run on `http://localhost:3000`

## 📡 API Endpoints

### Quests
- `GET /api/quests` - Get all quests
- `POST /api/quests` - Create a new quest (admin)
- `POST /api/quests/:id/complete` - Mark quest as completed

### Users
- `GET /api/users/:walletAddress` - Get user profile and completed quests

## 🎮 Usage

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Browse Quests**: View available learning quests on the home page
3. **Complete Quest**: Click on a quest, read the content, and complete it
4. **Earn Rewards**: Receive mUSD rewards for completed quests
5. **View Profile**: Check your progress and total earnings

## 🧪 Adding Sample Quests

You can add quests using the API:

```bash
curl -X POST http://localhost:3001/api/quests \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction to Bitcoin",
    "description": "Learn the basics of Bitcoin and blockchain technology",
    "reward": 100,
    "difficulty": "beginner",
    "content": "Bitcoin is a decentralized digital currency..."
  }'
```

## 🚀 Mezo Integration (Phase 3 - Complete!)

EduFund now has full Mezo + mUSD integration! See **[MEZO_INTEGRATION.md](MEZO_INTEGRATION.md)** for details.

### New Features:
- ✅ Mezo wallet connection
- ✅ Live mUSD balance display
- ✅ Reward claiming with on-chain transactions
- ✅ Rewards dashboard at `/rewards`
- ✅ Transaction history with explorer links

### Quick Start:
```bash
# See MEZO_QUICK_START.md for setup
# Update frontend/src/services/mezo.ts with your Mezo config
```

## 🔮 Future Enhancements

- [ ] Quiz/assessment system for quest validation
- [ ] Admin dashboard for quest management
- [ ] Leaderboard and achievements
- [ ] Social features (share progress)
- [ ] NFT certificates for completed quests
- [ ] Multi-chain wallet support

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


