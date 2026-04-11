const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HackathonJudge", function () {
  let contract, admin, judge1, judge2, team1;

  const META_HASH = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
    description: "A great project",
    repoUrl: "https://github.com/team/project",
    demoUrl: "https://demo.example.com",
  })));

  beforeEach(async function () {
    [admin, judge1, judge2, team1] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("HackathonJudge");
    contract = await Factory.deploy();
  });

  it("admin is set on deploy", async () => {
    expect(await contract.admin()).to.equal(admin.address);
  });

  it("team can submit a project", async () => {
    await expect(
      contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH)
    ).to.emit(contract, "ProjectSubmitted").withArgs(
      1, "CoolApp", "Team Rocket", team1.address, META_HASH, expect.anything()
    );
    expect(await contract.projectCount()).to.equal(1);
  });

  it("judge can be registered and score", async () => {
    await contract.registerJudge(judge1.address);
    await contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH);
    await expect(
      contract.connect(judge1).submitScore(1, 8, 7, 9, 8, "Solid project")
    ).to.emit(contract, "ScoreSubmitted");

    const score = await contract.getScore(1, judge1.address);
    expect(score.innovation).to.equal(8);
    expect(score.comment).to.equal("Solid project");
  });

  it("unregistered address cannot score", async () => {
    await contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH);
    await expect(
      contract.connect(judge2).submitScore(1, 8, 7, 9, 8, "Nope")
    ).to.be.revertedWith("Not a registered judge");
  });

  it("scores out of range are rejected", async () => {
    await contract.registerJudge(judge1.address);
    await contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH);
    await expect(
      contract.connect(judge1).submitScore(1, 11, 7, 9, 8, "Bad")
    ).to.be.revertedWith("innovation out of range");
  });

  it("aggregate score is calculated", async () => {
    await contract.registerJudge(judge1.address);
    await contract.registerJudge(judge2.address);
    await contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH);
    await contract.connect(judge1).submitScore(1, 8, 8, 8, 8, "Good");
    await contract.connect(judge2).submitScore(1, 6, 6, 6, 6, "OK");
    const [avg] = await contract.getAggregateScore(1);
    // (32 + 24) / 2 / 4 * 10 = 70
    expect(avg).to.equal(70);
  });

  it("no scoring after finalize", async () => {
    await contract.registerJudge(judge1.address);
    await contract.connect(team1).submitProject("CoolApp", "Team Rocket", META_HASH);
    await contract.finalizeResults();
    await expect(
      contract.connect(judge1).submitScore(1, 8, 7, 9, 8, "Late")
    ).to.be.revertedWith("Judging is finalized");
  });
});
