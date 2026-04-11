#!/usr/bin/env node
/**
 * scripts/admin.js
 * CLI admin helpers. Run from repo root after deploying.
 *
 * Usage:
 *   node scripts/admin.js register-judge 0xJUDGE_ADDRESS
 *   node scripts/admin.js revoke-judge   0xJUDGE_ADDRESS
 *   node scripts/admin.js finalize
 *   node scripts/admin.js info
 */

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const deployment = JSON.parse(fs.readFileSync(path.join(__dirname, "../backend/deployment.json")));
const abi        = JSON.parse(fs.readFileSync(path.join(__dirname, "../backend/HackathonJudge.abi.json")));

const provider    = new ethers.JsonRpcProvider(process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc");
const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract    = new ethers.Contract(deployment.address, abi, adminWallet);

const [,, cmd, arg] = process.argv;

async function main() {
  console.log(`\n⬡ HackJudge Admin CLI`);
  console.log(`  Contract: ${deployment.address}`);
  console.log(`  Admin:    ${adminWallet.address}\n`);

  switch (cmd) {
    case "register-judge": {
      if (!arg || !ethers.isAddress(arg)) { console.error("Usage: register-judge <address>"); process.exit(1); }
      console.log(`Registering judge: ${arg}`);
      const tx = await contract.registerJudge(arg);
      await tx.wait();
      console.log(`✅ Done. Tx: ${tx.hash}`);
      break;
    }
    case "revoke-judge": {
      if (!arg || !ethers.isAddress(arg)) { console.error("Usage: revoke-judge <address>"); process.exit(1); }
      console.log(`Revoking judge: ${arg}`);
      const tx = await contract.revokeJudge(arg);
      await tx.wait();
      console.log(`✅ Done. Tx: ${tx.hash}`);
      break;
    }
    case "finalize": {
      console.log("Finalizing results…");
      const tx = await contract.finalizeResults();
      await tx.wait();
      console.log(`🔒 Finalized. Tx: ${tx.hash}`);
      break;
    }
    case "info": {
      const count     = await contract.projectCount();
      const finalized = await contract.finalized();
      const admin     = await contract.admin();
      console.log(`  Admin:     ${admin}`);
      console.log(`  Projects:  ${count.toString()}`);
      console.log(`  Finalized: ${finalized}`);

      for (let i = 1; i <= Number(count); i++) {
        const p  = await contract.getProject(i);
        const [avg, jc] = await contract.getAggregateScore(i);
        console.log(`\n  [${i}] ${p.projectName} — ${p.teamName}`);
        console.log(`      Judges: ${jc.toString()} | Avg: ${(Number(avg)/10).toFixed(1)}/10`);
      }
      break;
    }
    default:
      console.log("Commands: register-judge, revoke-judge, finalize, info");
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
