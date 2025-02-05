import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiSigWallet } from "../typechain-types";

describe("MultiSigWallet", function () {
  let multiSigWallet: MultiSigWallet;
  let owner1: any, owner2: any, nonOwner: any;
  let recipient: any;
  const sendAmount = ethers.parseUnits("0.01", "ether");

  beforeEach(async function () {
    [owner1, owner2, nonOwner, recipient] = await ethers.getSigners();

    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    multiSigWallet = await MultiSigWallet.deploy([owner1.address, owner2.address], 1);
    await multiSigWallet.waitForDeployment();
  });

  it("✅ Vérifie que les propriétaires sont bien enregistrés", async function () {
    expect(await multiSigWallet.isOwner(owner1.address)).to.be.true;
    expect(await multiSigWallet.isOwner(owner2.address)).to.be.true;
    expect(await multiSigWallet.isOwner(nonOwner.address)).to.be.false;
  });

  it("✅ Dépôt de fonds dans le multisig", async function () {
    const depositAmount = ethers.parseUnits("0.02", "ether");

    await owner1.sendTransaction({
      to: await multiSigWallet.getAddress(),
      value: depositAmount,
    });

    const balance = await ethers.provider.getBalance(await multiSigWallet.getAddress());
    expect(balance).to.equal(depositAmount);
  });

  it("✅ Soumission d'une transaction par un propriétaire", async function () {
    const tx = await multiSigWallet.submitTransaction(recipient.address, sendAmount, "0x");
    await tx.wait();

    const txCount = await multiSigWallet.transactionCount();
    expect(txCount).to.equal(1);

    const transaction = await multiSigWallet.transactions(0);
    expect(transaction.destination).to.equal(recipient.address);
    expect(transaction.value).to.equal(sendAmount);
    expect(transaction.executed).to.be.false;
  });

  it("✅ Confirmation d'une transaction par un propriétaire", async function () {
    await multiSigWallet.submitTransaction(recipient.address, sendAmount, "0x");
    await multiSigWallet.connect(owner1).confirmTransaction(0);

    const isConfirmed = await multiSigWallet.confirmations(0, owner1.address);
    expect(isConfirmed).to.be.true;
  });

  it("✅ Exécution d'une transaction après confirmation suffisante", async function () {
    await owner1.sendTransaction({
      to: await multiSigWallet.getAddress(),
      value: sendAmount,
    });

    await multiSigWallet.submitTransaction(recipient.address, sendAmount, "0x");

    await multiSigWallet.connect(owner1).confirmTransaction(0);

    const txnBefore = await multiSigWallet.transactions(0);
    expect(txnBefore.executed).to.be.false;

    await (await multiSigWallet.connect(owner1).executeTransaction(0)).wait();

    const txnAfter = await multiSigWallet.transactions(0);
    expect(txnAfter.executed).to.be.true;

    const balanceAfter = await ethers.provider.getBalance(await multiSigWallet.getAddress());
    expect(balanceAfter).to.equal(0);
  });

  it("❌ Empêche un non-propriétaire de soumettre une transaction", async function () {
    await expect(
      multiSigWallet.connect(nonOwner).submitTransaction(recipient.address, sendAmount, "0x")
    ).to.be.revertedWith("Not an owner");
  });

  it("❌ Empêche l'exécution d'une transaction sans confirmations suffisantes", async function () {
    await multiSigWallet.submitTransaction(recipient.address, sendAmount, "0x");

    await expect(
      multiSigWallet.connect(owner1).executeTransaction(0)
    ).to.be.revertedWith("Not enough confirmations");

  });
});
