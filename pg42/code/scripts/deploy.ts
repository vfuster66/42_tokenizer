import { ethers } from "hardhat";

async function main() {
  // ✅ Récupération propre du déployeur
  const [deployer] = await ethers.getSigners();

  console.log(`🚀 Déploiement en cours avec l'adresse : ${deployer.address}`);

  // ✅ Déploiement du contrat avec l’owner
  const PG42 = await ethers.deployContract("PG42", [deployer.address]);

  await PG42.waitForDeployment();

  console.log(`✅ PG42 déployé à l'adresse : ${await PG42.getAddress()}`);
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement :", error);
  process.exitCode = 1;
});
