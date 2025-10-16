const { ethers } = require('ethers');

const MUSD_ADDRESS = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503';
const COMPANY_WALLET = '0x55d829A66BB1D9f82923cBDEe355249EE5940365';
const RPC_URL = 'https://rpc.test.mezo.org';

const MUSD_ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];

async function check() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const musd = new ethers.Contract(MUSD_ADDRESS, MUSD_ABI, provider);
  const balance = await musd.balanceOf(COMPANY_WALLET);
  const decimals = await musd.decimals();
  console.log('Company Wallet:', COMPANY_WALLET);
  console.log('mUSD Balance:', ethers.formatUnits(balance, decimals), 'mUSD');
}

check();
