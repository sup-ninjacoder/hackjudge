const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "AVAX");

  const Factory = await ethers.getContractFactory("HackathonJudge");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("\n✅ HackathonJudge deployed to:", address);
  console.log("   Network:", (await ethers.provider.getNetwork()).name);

  // Write deployment info so backend can pick it up
  const deployInfo = {
    address,
    network: "fuji",
    chainId: 43113,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  const outPath = path.join(__dirname, "../backend/deployment.json");
  fs.writeFileSync(outPath, JSON.stringify(deployInfo, null, 2));
  console.log("   Saved deployment info to backend/deployment.json");

  // Also copy ABI
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/HackathonJudge.sol/HackathonJudge.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abiPath = path.join(__dirname, "../backend/HackathonJudge.abi.json");
  fs.writeFileSync(abiPath, JSON.stringify(artifact.abi, null, 2));
  console.log("   Saved ABI to backend/HackathonJudge.abi.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
