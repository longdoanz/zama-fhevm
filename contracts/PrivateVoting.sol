// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FHE, euint8} from "@fhevm/lib/FHE.sol";

contract PrivateVoting {
    mapping(address => bool) public hasVoted;
    euint8 private yesVotes;
    euint8 private noVotes;

    event Voted(address indexed voter, bool vote);

    constructor() {
        yesVotes = FHE.asEuint8(0);
        noVotes = FHE.asEuint8(0);
    }

    function vote(bytes calldata encryptedVote) external {
        require(!hasVoted[msg.sender], "Already voted");
        hasVoted[msg.sender] = true;
        euint8 encVote = FHE.asEuint8(encryptedVote);
        // 1 = yes, 0 = no
        yesVotes = FHE.add(yesVotes, FHE.cmux(encVote, FHE.asEuint8(1), FHE.asEuint8(0)));
        noVotes = FHE.add(noVotes, FHE.cmux(encVote, FHE.asEuint8(0), FHE.asEuint8(1)));
        emit Voted(msg.sender, FHE.decrypt(encVote) == 1);
    }

    function getEncryptedResults() external view returns (bytes memory, bytes memory) {
        return (FHE.toBytes(yesVotes), FHE.toBytes(noVotes));
    }
}
