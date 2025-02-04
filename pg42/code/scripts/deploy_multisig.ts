import { ethers } from "hardhat";

async function main() {
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    
    console.log(`🚀 Déploiement du multisig avec l'adresse : ${deployer.address}`);
    
    const MultiSigWallet = await ethers.deployContract("MultiSigWallet", [
        [deployer.address], // Seulement 1 owner
        1 // 1 confirmation requise
    ]);
    
    await MultiSigWallet.waitForDeployment();
    
    console.log(`✅ Multisig déployé à l'adresse : ${await MultiSigWallet.getAddress()}`);
    
}

main().catch((error) => {
  console.error("❌ Erreur lors du déploiement :", error);
  process.exitCode = 1;
});
