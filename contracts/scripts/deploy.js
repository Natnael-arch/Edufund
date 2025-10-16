const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduFundRewards contract to Mezo Testnet...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "BTC\n");

  if (balance === 0n) {
    console.log("❌ No BTC balance! Get testnet BTC from https://faucet.test.mezo.org");
    process.exit(1);
  }

  // mUSD token address on Mezo testnet
  // TODO: Replace with actual mUSD contract address once you find it
  const MUSD_TOKEN_ADDRESS = process.env.MUSD_CONTRACT || "0x0000000000000000000000000000000000000000";
  
  if (MUSD_TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  WARNING: Using placeholder mUSD address!");
    console.log("   Update MUSD_CONTRACT in .env with real address\n");
  } else {
    console.log("mUSD Token Address:", MUSD_TOKEN_ADDRESS, "\n");
  }

  // Deploy contract
  console.log("Deploying EduFundRewards...");
  const EduFundRewards = await hre.ethers.getContractFactory("EduFundRewards");
  const rewards = await EduFundRewards.deploy(MUSD_TOKEN_ADDRESS);

  await rewards.waitForDeployment();
  const contractAddress = await rewards.getAddress();

  console.log("\n✅ EduFundRewards deployed!");
  console.log("Contract Address:", contractAddress);
  console.log("Transaction Hash:", rewards.deploymentTransaction().hash);
  console.log("Block Number:", rewards.deploymentTransaction().blockNumber);
  
  console.log("\n📋 Next Steps:");
  console.log("1. View on Explorer:", `https://explorer.test.mezo.org/address/${contractAddress}`);
  console.log("2. Update frontend config with contract address");
  console.log("3. Fund contract with mUSD tokens");
  console.log("4. Update backend with contract address");
  
  console.log("\n💾 Save this info:");
  console.log("CONTRACT_ADDRESS=", contractAddress);
  console.log("MUSD_TOKEN=", MUSD_TOKEN_ADDRESS);
  console.log("DEPLOYER=", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


