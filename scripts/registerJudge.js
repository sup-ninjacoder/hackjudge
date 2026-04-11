const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x47F6758689a1035016Aaf5cC5e7f733Bd8d6eB26";

  const [signer] = await ethers.getSigners();

  const contract = await ethers.getContractAt("HackathonJudge", contractAddress);

  const tx = await contract.registerJudge(signer.address);
  await tx.wait();

  console.log("✅ Judge registered:", signer.address);
}

main().catch(console.error);