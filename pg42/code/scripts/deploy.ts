import { ethers } from "hardhat";

async function main() {
  // 🔹 Récupération du signataire qui va déployer le contrat
  const [deployer] = await ethers.getSigners();

  console.log(`🚀 Déploiement en cours avec l'adresse : ${deployer.address}`);

  // 🔹 Déploiement du contrat PG42 avec l'adresse du déployeur comme argument
  const PG42 = await ethers.deployContract("PG42", [deployer.address]);

  // 🔹 Attente de la confirmation du déploiement sur la blockchain
  await PG42.waitForDeployment();

  // 🔹 Affichage de l'adresse du contrat déployé
  console.log(`✅ PG42 déployé à l'adresse : ${await PG42.getAddress()}`);
}

// 🔹 Exécute le script et capture les erreurs éventuelles
main().catch((error) => {
  console.error("❌ Erreur lors du déploiement :", error);
  process.exitCode = 1;
});
