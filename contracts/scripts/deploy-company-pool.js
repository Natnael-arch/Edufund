const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduFundCompanyPool contract to Mezo Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BTC\n");

  if (balance === 0n) {
    console.log("❌ No BTC balance! Get testnet BTC from https://faucet.test.mezo.org");
    process.exit(1);
  }

  const MUSD_TOKEN_ADDRESS = process.env.MUSD_CONTRACT || "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
  console.log("mUSD Token Address:", MUSD_TOKEN_ADDRESS, "\n");

  console.log("Deploying EduFundCompanyPool...");
  const EduFundCompanyPool = await hre.ethers.getContractFactory("EduFundCompanyPool");
  const pool = await EduFundCompanyPool.deploy(MUSD_TOKEN_ADDRESS);

  await pool.waitForDeployment();
  const contractAddress = await pool.getAddress();

  console.log("\n✅ EduFundCompanyPool deployed!");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", pool.deploymentTransaction().hash);
  
  console.log("\n📋 Next Steps:");
  console.log("1. View on Explorer:", `https://explorer.test.mezo.org/address/${contractAddress}`);
  console.log("2. Update backend with contract address");
  console.log("3. Companies can now create funding pools!");
  
  console.log("\n💾 Save this:");
  console.log("COMPANY_POOL_CONTRACT=", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

