/**
 * backend/server.js
 * Express API — connects frontend to Avalanche smart contract.
 * Off-chain metadata stored in metadata.json (swap for MongoDB in production).
 */

const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");
const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

// ─── Contract setup ───────────────────────────────────────────────────────────

const deploymentPath = path.join(__dirname, "deployment.json");
const abiPath        = path.join(__dirname, "HackathonJudge.abi.json");

if (!fs.existsSync(deploymentPath) || !fs.existsSync(abiPath)) {
  console.error("❌  Missing deployment.json or ABI. Run: npx hardhat run scripts/deploy.js --network fuji");
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentPath));
const abi        = JSON.parse(fs.readFileSync(abiPath));

const provider = new ethers.JsonRpcProvider(
  process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"
);

const adminWallet = process.env.ADMIN_PRIVATE_KEY
  ? new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider)
  : null;

const readContract = new ethers.Contract(deployment.address, abi, provider);
const writeContract = adminWallet
  ? new ethers.Contract(deployment.address, abi, adminWallet)
  : null;

// ─── Off-chain metadata store (simple JSON file) ──────────────────────────────

const metaPath = path.join(__dirname, "metadata.json");
function readMeta() {
  if (!fs.existsSync(metaPath)) return {};
  return JSON.parse(fs.readFileSync(metaPath));
}
function writeMeta(data) {
  fs.writeFileSync(metaPath, JSON.stringify(data, null, 2));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeMetaHash(obj) {
  const canonical = JSON.stringify(obj, Object.keys(obj).sort());
  return ethers.keccak256(ethers.toUtf8Bytes(canonical));
}

function formatProject(p) {
  return {
    id:           p.id.toString(),
    projectName:  p.projectName,
    teamName:     p.teamName,
    submitter:    p.submitter,
    metadataHash: p.metadataHash,
    submittedAt:  new Date(Number(p.submittedAt) * 1000).toISOString(),
  };
}

function formatScore(s) {
  if (s.scoredAt === 0n) return null;
  return {
    innovation:          Number(s.innovation),
    technicalComplexity: Number(s.technicalComplexity),
    usefulness:          Number(s.usefulness),
    demoQuality:         Number(s.demoQuality),
    comment:             s.comment,
    judge:               s.judge,
    scoredAt:            new Date(Number(s.scoredAt) * 1000).toISOString(),
    total:               Number(s.innovation) + Number(s.technicalComplexity) + Number(s.usefulness) + Number(s.demoQuality),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    contract: deployment.address,
    network: deployment.network,
    chainId: deployment.chainId,
    adminConnected: !!adminWallet,
  });
});

/**
 * POST /api/submit
 * Body: { projectName, teamName, description, repoUrl, demoUrl, ipfsHash?, submitterAddress }
 * Returns: { projectId, txHash, metadataHash }
 *
 * NOTE: In a production app the submitter would sign the tx from their own wallet.
 * For this MVP the admin wallet pays gas — submitterAddress is recorded off-chain.
 */
app.post("/api/submit", async (req, res) => {
  try {
    const { projectName, teamName, description, repoUrl, demoUrl, ipfsHash, submitterAddress } = req.body;

    if (!projectName || !teamName || !description || !repoUrl) {
      return res.status(400).json({ error: "projectName, teamName, description, repoUrl are required" });
    }
    if (!writeContract) {
      return res.status(503).json({ error: "Admin wallet not configured — set ADMIN_PRIVATE_KEY" });
    }

    const metaObj = { projectName, teamName, description, repoUrl, demoUrl: demoUrl || "", ipfsHash: ipfsHash || "", submitterAddress: submitterAddress || "" };
    const metadataHash = computeMetaHash(metaObj);

    const tx = await writeContract.submitProject(projectName, teamName, metadataHash);
    const receipt = await tx.wait();

    // Parse the emitted event to get projectId
    const iface = new ethers.Interface(abi);
    let projectId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed.name === "ProjectSubmitted") {
          projectId = parsed.args.projectId.toString();
        }
      } catch (_) {}
    }

    // Store full metadata off-chain
    const meta = readMeta();
    meta[projectId] = { ...metaObj, metadataHash, txHash: tx.hash, projectId };
    writeMeta(meta);

    res.json({ projectId, txHash: tx.hash, metadataHash, message: "Project submitted on-chain ✅" });
  } catch (err) {
    console.error("submit error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/submissions
 * Returns all projects with their off-chain metadata merged in.
 */
app.get("/api/submissions", async (req, res) => {
  try {
    const onChain = await readContract.getAllProjects();
    const meta    = readMeta();

    const projects = onChain.map((p) => ({
      ...formatProject(p),
      ...(meta[p.id.toString()] || {}),
    }));

    res.json({ projects, total: projects.length });
  } catch (err) {
    console.error("submissions error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/submissions/:id
 */
app.get("/api/submissions/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const p  = await readContract.getProject(id);
    const meta = readMeta();
    const judgeAddresses = await readContract.getJudgesForProject(id);

    const scoresList = await Promise.all(
      judgeAddresses.map(async (j) => {
        const s = await readContract.getScore(id, j);
        return formatScore(s);
      })
    );

    res.json({
      project: { ...formatProject(p), ...(meta[id] || {}) },
      scores:  scoresList.filter(Boolean),
    });
  } catch (err) {
    console.error("submission detail error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/judges/register
 * Body: { judgeAddress }   (admin only — verified by ADMIN_SECRET header)
 */
app.post("/api/judges/register", async (req, res) => {
  try {
    const secret = req.headers["x-admin-secret"];
    if (secret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }
    if (!writeContract) return res.status(503).json({ error: "No admin wallet" });

    const { judgeAddress } = req.body;
    if (!ethers.isAddress(judgeAddress)) return res.status(400).json({ error: "Invalid address" });

    const tx = await writeContract.registerJudge(judgeAddress);
    await tx.wait();
    res.json({ txHash: tx.hash, message: `Judge ${judgeAddress} registered ✅` });
  } catch (err) {
    console.error("register judge error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/score
 * Body: { projectId, innovation, technicalComplexity, usefulness, demoQuality, comment, judgePrivateKey }
 *
 * SECURITY NOTE: Passing a private key through an API is ONLY acceptable for a
 * hackathon demo. In production, judges sign transactions in their own wallet (MetaMask).
 */
app.post("/api/score", async (req, res) => {
  try {
    const { projectId, innovation, technicalComplexity, usefulness, demoQuality, comment, judgePrivateKey } = req.body;

    if (!judgePrivateKey) return res.status(400).json({ error: "judgePrivateKey required (demo mode)" });

    const judgeWallet   = new ethers.Wallet(judgePrivateKey, provider);
    const judgeContract = new ethers.Contract(deployment.address, abi, judgeWallet);

    const tx = await judgeContract.submitScore(
      projectId,
      innovation,
      technicalComplexity,
      usefulness,
      demoQuality,
      comment || ""
    );
    const receipt = await tx.wait();

    res.json({ txHash: tx.hash, judge: judgeWallet.address, message: "Score recorded on-chain ✅" });
  } catch (err) {
    console.error("score error:", err);
    res.status(500).json({ error: err.reason || err.message });
  }
});

/**
 * GET /api/leaderboard
 * Returns projects ranked by average on-chain score.
 */
app.get("/api/leaderboard", async (req, res) => {
  try {
    const onChain = await readContract.getAllProjects();
    const meta    = readMeta();

    const ranked = await Promise.all(
      onChain.map(async (p) => {
        const id = p.id.toString();
        const [avgTotal, judgeCount] = await readContract.getAggregateScore(id);
        const judgeAddresses = await readContract.getJudgesForProject(id);

        return {
          ...formatProject(p),
          ...(meta[id] || {}),
          avgScore:   Number(avgTotal) / 10, // e.g. 7.5
          judgeCount: Number(judgeCount),
          judgesScored: judgeAddresses,
        };
      })
    );

    ranked.sort((a, b) => b.avgScore - a.avgScore);
    ranked.forEach((p, i) => (p.rank = i + 1));

    res.json({ leaderboard: ranked });
  } catch (err) {
    console.error("leaderboard error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/finalize
 * Admin finalizes — no more scores accepted.
 */
app.post("/api/finalize", async (req, res) => {
  try {
    const secret = req.headers["x-admin-secret"];
    if (secret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: "Forbidden" });
    if (!writeContract) return res.status(503).json({ error: "No admin wallet" });

    const tx = await writeContract.finalizeResults();
    await tx.wait();
    res.json({ txHash: tx.hash, message: "Results finalized on-chain 🔒" });
  } catch (err) {
    console.error("finalize error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/contract-info
 * Returns contract address and explorer link for the UI.
 */
app.get("/api/contract-info", (_req, res) => {
  res.json({
    address: deployment.address,
    chainId: deployment.chainId,
    network: deployment.network,
    explorerUrl: `https://testnet.snowtrace.io/address/${deployment.address}`,
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 HackJudge API running at http://localhost:${PORT}`);
  console.log(`   Contract: ${deployment.address}`);
  console.log(`   Network:  ${deployment.network} (chainId ${deployment.chainId})`);
  console.log(`   Admin wallet: ${adminWallet ? adminWallet.address : "⚠️  NOT SET"}`);
});
