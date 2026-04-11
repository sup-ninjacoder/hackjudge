// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * HackathonJudge.sol
 * Avalanche Fuji Testnet
 *
 * Stores project submissions and judge scores on-chain.
 * Large metadata (descriptions, links) is stored off-chain;
 * only hashes and essential identifiers live here.
 */
contract HackathonJudge {
    // ─── State ────────────────────────────────────────────────────────────────

    address public admin;
    bool public finalized;

    struct Project {
        uint256 id;
        bytes32 metadataHash; // keccak256 of off-chain JSON metadata
        string  projectName;  // short label kept on-chain for readability
        string  teamName;
        address submitter;
        uint256 submittedAt;
        bool    exists;
    }

    struct Score {
        uint8   innovation;        // 1–10
        uint8   technicalComplexity;
        uint8   usefulness;
        uint8   demoQuality;
        string  comment;           // short comment (keep it concise)
        address judge;
        uint256 scoredAt;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    mapping(address => bool)    public judges;
    // projectId => judge address => Score
    mapping(uint256 => mapping(address => Score)) public scores;
    // projectId => list of judge addresses who scored it
    mapping(uint256 => address[]) private _projectJudges;
    // judge => list of projectIds they scored
    mapping(address => uint256[]) private _judgeScores;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ProjectSubmitted(uint256 indexed projectId, string projectName, string teamName, address indexed submitter, bytes32 metadataHash, uint256 timestamp);
    event JudgeRegistered(address indexed judge, uint256 timestamp);
    event JudgeRevoked(address indexed judge, uint256 timestamp);
    event ScoreSubmitted(uint256 indexed projectId, address indexed judge, uint8 innovation, uint8 technicalComplexity, uint8 usefulness, uint8 demoQuality, uint256 timestamp);
    event ResultsFinalized(uint256 timestamp);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyJudge() {
        require(judges[msg.sender], "Not a registered judge");
        _;
    }

    modifier notFinalized() {
        require(!finalized, "Judging is finalized");
        _;
    }

    modifier validProject(uint256 projectId) {
        require(projects[projectId].exists, "Project does not exist");
        _;
    }

    modifier validScore(uint8 v) {
        require(v >= 1 && v <= 10, "Score must be 1-10");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function registerJudge(address judge) external onlyAdmin {
        require(judge != address(0), "Zero address");
        judges[judge] = true;
        emit JudgeRegistered(judge, block.timestamp);
    }

    function revokeJudge(address judge) external onlyAdmin {
        judges[judge] = false;
        emit JudgeRevoked(judge, block.timestamp);
    }

    function finalizeResults() external onlyAdmin notFinalized {
        finalized = true;
        emit ResultsFinalized(block.timestamp);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }

    // ─── Team submission ──────────────────────────────────────────────────────

    /**
     * @param projectName  Short project name (stored on-chain)
     * @param teamName     Team name (stored on-chain)
     * @param metadataHash keccak256 hash of the full off-chain JSON blob
     *                     (description, repoUrl, demoUrl, ipfsHash)
     */
    function submitProject(
        string  calldata projectName,
        string  calldata teamName,
        bytes32          metadataHash
    ) external notFinalized returns (uint256 projectId) {
        require(bytes(projectName).length > 0, "Project name required");
        require(bytes(teamName).length > 0,    "Team name required");
        require(metadataHash != bytes32(0),    "Metadata hash required");

        projectId = ++projectCount;
        projects[projectId] = Project({
            id:           projectId,
            metadataHash: metadataHash,
            projectName:  projectName,
            teamName:     teamName,
            submitter:    msg.sender,
            submittedAt:  block.timestamp,
            exists:       true
        });

        emit ProjectSubmitted(projectId, projectName, teamName, msg.sender, metadataHash, block.timestamp);
    }

    // ─── Judge scoring ────────────────────────────────────────────────────────

    function submitScore(
        uint256 projectId,
        uint8   innovation,
        uint8   technicalComplexity,
        uint8   usefulness,
        uint8   demoQuality,
        string  calldata comment
    )
        external
        onlyJudge
        notFinalized
        validProject(projectId)
    {
        require(innovation          >= 1 && innovation          <= 10, "innovation out of range");
        require(technicalComplexity >= 1 && technicalComplexity <= 10, "technical out of range");
        require(usefulness          >= 1 && usefulness          <= 10, "usefulness out of range");
        require(demoQuality         >= 1 && demoQuality         <= 10, "demoQuality out of range");

        bool alreadyScored = scores[projectId][msg.sender].scoredAt != 0;

        scores[projectId][msg.sender] = Score({
            innovation:           innovation,
            technicalComplexity:  technicalComplexity,
            usefulness:           usefulness,
            demoQuality:          demoQuality,
            comment:              comment,
            judge:                msg.sender,
            scoredAt:             block.timestamp
        });

        if (!alreadyScored) {
            _projectJudges[projectId].push(msg.sender);
            _judgeScores[msg.sender].push(projectId);
        }

        emit ScoreSubmitted(projectId, msg.sender, innovation, technicalComplexity, usefulness, demoQuality, block.timestamp);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getProject(uint256 projectId)
        external view validProject(projectId)
        returns (Project memory)
    {
        return projects[projectId];
    }

    function getJudgesForProject(uint256 projectId)
        external view validProject(projectId)
        returns (address[] memory)
    {
        return _projectJudges[projectId];
    }

    function getScore(uint256 projectId, address judge)
        external view validProject(projectId)
        returns (Score memory)
    {
        return scores[projectId][judge];
    }

    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory all = new Project[](projectCount);
        for (uint256 i = 1; i <= projectCount; i++) {
            all[i - 1] = projects[i];
        }
        return all;
    }

    /**
     * Returns aggregate average score for a project (scaled x10 to avoid floats).
     * e.g. 75 means average 7.5
     */
    function getAggregateScore(uint256 projectId)
        external view validProject(projectId)
        returns (uint256 avgTotal, uint256 judgeCount)
    {
        address[] memory js = _projectJudges[projectId];
        judgeCount = js.length;
        if (judgeCount == 0) return (0, 0);

        uint256 total;
        for (uint256 i = 0; i < judgeCount; i++) {
            Score memory s = scores[projectId][js[i]];
            total += uint256(s.innovation) + uint256(s.technicalComplexity) + uint256(s.usefulness) + uint256(s.demoQuality);
        }
        // average of 4 criteria, scaled x10
        avgTotal = (total * 10) / (judgeCount * 4);
    }
}
