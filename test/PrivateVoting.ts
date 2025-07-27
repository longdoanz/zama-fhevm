import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { PrivateVoting, PrivateVoting__factory } from "../types";

// Dummy FHE encryption for test (replace with real FHE tooling in prod)
function dummyEncryptVote(vote: number): string {
  // In real use, this should be FHE-encrypted bytes
  // Here we just encode as hex string for test
  return ethers.utils.hexZeroPad(ethers.utils.hexlify(vote), 32);
}

describe("PrivateVoting", function () {
  let voting: PrivateVoting;
  let signers: HardhatEthersSigner[];

  beforeEach(async function () {
    signers = await ethers.getSigners();
    const factory = (await ethers.getContractFactory("PrivateVoting")) as PrivateVoting__factory;
    voting = (await factory.deploy()) as PrivateVoting;
    await voting.deployed();
  });

  it("should allow users to vote yes or no and only once", async function () {
    // Alice votes yes
    await expect(voting.connect(signers[1]).vote(dummyEncryptVote(1)))
      .to.emit(voting, "Voted")
      .withArgs(signers[1].address, true);
    // Bob votes no
    await expect(voting.connect(signers[2]).vote(dummyEncryptVote(0)))
      .to.emit(voting, "Voted")
      .withArgs(signers[2].address, false);
    // Alice cannot vote again
    await expect(voting.connect(signers[1]).vote(dummyEncryptVote(1))).to.be.revertedWith("Already voted");
  });

  it("should return encrypted results", async function () {
    await voting.connect(signers[1]).vote(dummyEncryptVote(1));
    await voting.connect(signers[2]).vote(dummyEncryptVote(0));
    const [yesEnc, noEnc] = await voting.getEncryptedResults();
    expect(yesEnc).to.be.proper("bytes");
    expect(noEnc).to.be.proper("bytes");
  });
});
