# EduFund Smart Contracts

## 🎯 Quick Start

### 1. Install
```bash
npm install
```

### 2. Setup
```bash
cp env.template .env
# Edit .env with your values
```

### 3. Deploy
```bash
npm run compile
npm run deploy:testnet
```

## 📁 Files

- `EduFundRewards.sol` - Main rewards distribution contract
- `deploy.js` - Deployment script for Mezo testnet
- `hardhat.config.js` - Hardhat configuration
- `env.template` - Environment variable template

## 🔑 Environment Variables

```env
PRIVATE_KEY=your_wallet_private_key
MUSD_CONTRACT=0xMUSDTokenAddress
```

## 📋 Commands

```bash
npm run compile        # Compile contracts
npm run deploy:testnet # Deploy to Mezo testnet
npm test              # Run tests
```

## 🔗 Links

- **Full Guide**: See `SMART_CONTRACT_DEPLOY.md`
- **Mezo Testnet**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Faucet**: https://faucet.test.mezo.org

## ⚠️ Security

- Never commit `.env` file
- Keep private keys secure
- Test thoroughly before mainnet


