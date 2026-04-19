const NFTMarketplace = artifacts.require("NFTMarketplace");
const fs = require("fs");
const path = require("path");

module.exports = async function (deployer) {
  await deployer.deploy(NFTMarketplace, 25); // 25 = 2.5% fee
  const instance = await NFTMarketplace.deployed();

  console.log("✅ NFTMarketplace deployed at:", instance.address);

  const frontendLibDir = path.join(__dirname, "../frontend/src/lib");
  if (!fs.existsSync(frontendLibDir)) {
    fs.mkdirSync(frontendLibDir, { recursive: true });
  }

  const artifact = {
    address: instance.address,
    abi: NFTMarketplace.abi,
  };

  const outputPath = path.join(frontendLibDir, "contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2));
  console.log("📄 ABI exported to frontend/src/lib/contract.json");
};
