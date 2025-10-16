const { ethers } = require('ethers');

const MUSD_ADDRESS = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503';
const WALLET = '0xC201B98d96d09f2B15Cb7fe8E8c40Da6D664B15c'; // Your wallet
const RPC_URL = 'https://rpc.test.mezo.org';

const MUSD_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function checkBalance() {
  try {
    console.log('🔍 Checking mUSD balance...\n');
    console.log('Wallet:', WALLET);
    console.log('Network: Mezo Testnet');
    console.log('RPC:', RPC_URL);
    console.log('mUSD Contract:', MUSD_ADDRESS);
    console.log('---');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const musd = new ethers.Contract(MUSD_ADDRESS, MUSD_ABI, provider);
    
    const symbol = await musd.symbol();
    const decimals = await musd.decimals();
    const balance = await musd.balanceOf(WALLET);
    
    console.log('\n✅ Token Info:');
    console.log('Symbol:', symbol);
    console.log('Decimals:', decimals);
    console.log('Raw Balance:', balance.toString());
    console.log('Formatted:', ethers.formatUnits(balance, decimals), symbol);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

checkBalance();

