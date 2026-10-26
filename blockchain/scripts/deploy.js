const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying RepairChain contract...");

  const [deployer] = await ethers.getSigners();
  console.log(`   Deployer address: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  const RepairChain = await ethers.getContractFactory("RepairChain");
  const repairChain = await RepairChain.deploy();
  await repairChain.waitForDeployment();

  const contractAddress = await repairChain.getAddress();
  console.log(`✅ RepairChain deployed to: ${contractAddress}`);

  // ── Write ABI and deployment info to backend/config ───────────────────────
  const backendConfigDir = path.join(__dirname, "../../backend/config");
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }

  const artifactPath  = path.join(__dirname, "../artifacts/contracts/RepairChain.sol/RepairChain.json");
  const backendAbiPath = path.join(backendConfigDir, "RepairChain.json");

  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(artifactPath, backendAbiPath);
    console.log(`📋 ABI copied to backend/config/RepairChain.json`);
  }

  const deploymentInfo = {
    contractAddress,
    network:    "localhost",
    chainId:    31337,
    deployedAt: new Date().toISOString(),
    deployer:   deployer.address,
  };

  fs.writeFileSync(
    path.join(backendConfigDir, "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  fs.writeFileSync(
    path.join(__dirname, "../deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`📝 Deployment info saved to backend/config/deployment.json`);
  console.log("\n🎉 Deployment complete!");
  console.log(`   Contract: ${contractAddress}`);
  console.log(`\n   Add this to backend/.env:`);
  console.log(`   CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
