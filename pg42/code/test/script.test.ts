import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("PG42 Token", function () {
  async function deployPG42Fixture() {
    // Récupération des signers (comptes)
    const [owner, user, recipient] = await ethers.getSigners();

    // Déploiement du contrat PG42
    const PG42 = await ethers.deployContract("PG42", [owner.address]);
    await PG42.waitForDeployment();

    return { PG42, owner, user, recipient };
  }

  it("🚀 Doit attribuer le supply total au propriétaire", async function () {
    const { PG42, owner } = await loadFixture(deployPG42Fixture);

    const ownerBalance = await PG42.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 18)); // 1M PG42
  });

  it("🔄 Doit permettre un transfert de tokens entre utilisateurs", async function () {
    const { PG42, owner, recipient } = await loadFixture(deployPG42Fixture);

    // Transférer 100 PG42 du propriétaire vers le destinataire
    await PG42.transfer(recipient.address, ethers.parseUnits("100", 18));

    const recipientBalance = await PG42.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(ethers.parseUnits("100", 18));
  });

  it("🎁 Doit permettre à l'owner d'utiliser reward()", async function () {
    const { PG42, owner, recipient } = await loadFixture(deployPG42Fixture);

    // L'owner envoie 50 PG42 en récompense au destinataire
    await PG42.reward(recipient.address, ethers.parseUnits("50", 18));

    const recipientBalance = await PG42.balanceOf(recipient.address);
    expect(recipientBalance).to.equal(ethers.parseUnits("50", 18));
  });

  it("⛔ Ne doit pas permettre à un autre utilisateur d'utiliser reward()", async function () {
    const { PG42, user, recipient } = await loadFixture(deployPG42Fixture);

    await expect(PG42.connect(user).reward(recipient.address, ethers.parseUnits("100", 18)))
      .to.be.revertedWithCustomError(PG42, "OwnableUnauthorizedAccount")
      .withArgs(user.address);
  });

  it("⛔ Ne doit pas permettre de reward plus de tokens que le solde disponible", async function () {
    const { PG42, owner, recipient } = await loadFixture(deployPG42Fixture);

    await expect(PG42.reward(recipient.address, ethers.parseUnits("2000000", 18)))
      .to.be.revertedWith("Insufficient balance");
  });
});
