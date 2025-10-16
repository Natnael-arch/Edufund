const { ethers } = require('ethers');

const CONTRACT_ADDRESS = '0x105982Df4Bf219244116A2e814B68A62f4802421';
const MUSD_ADDRESS = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503';
const RPC_URL = 'https://rpc.test.mezo.org';

const MUSD_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];

async function checkBalance() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const musd = new ethers.Contract(MUSD_ADDRESS, MUSD_ABI, provider);
    
    const balance = await musd.balanceOf(CONTRACT_ADDRESS);
    const decimals = await musd.decimals();
    const formatted = ethers.formatUnits(balance, decimals);
    
    console.log('Contract Address:', CONTRACT_ADDRESS);
    console.log('mUSD Balance:', formatted, 'mUSD');
    
    if (balance === 0n) {
      console.log('\n⚠️  WARNING: Contract has NO mUSD!');
      console.log('You need to fund it first for claiming to work.');
    } else {
      console.log('\n✅ Contract has mUSD - ready for claims!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkBalance();

