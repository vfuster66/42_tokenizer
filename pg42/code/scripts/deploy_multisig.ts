import { ethers } from "hardhat";
import dotenv from "dotenv";

// 🔹 Chargement des variables d'environnement depuis le fichier .env
dotenv.config();

async function main() {
    // 🔹 Vérification que toutes les adresses des propriétaires sont bien définies dans le fichier .env
    if (!process.env.OWNER1_ADDRESS || !process.env.OWNER2_ADDRESS || 
        !process.env.OWNER3_ADDRESS || !process.env.OWNER4_ADDRESS) {
        throw new Error("❌ Les adresses des owners sont manquantes dans le fichier .env");
    }

    // 🔹 Récupération du compte qui déploiera le contrat
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // 🔹 Définition des adresses des propriétaires multisig à partir du .env
    const owners = [
        process.env.OWNER1_ADDRESS,
        process.env.OWNER2_ADDRESS,
        process.env.OWNER3_ADDRESS,
        process.env.OWNER4_ADDRESS
    ];

    // 🔹 Vérification qu'il n'y a pas de doublons parmi les propriétaires
    const uniqueOwners = new Set(owners);
    if (uniqueOwners.size !== owners.length) {
        throw new Error("❌ Les owners ne doivent pas contenir de doublons.");
    }

    // 🔹 Récupération du nombre de confirmations requises, avec une valeur par défaut de 2 si non défini
    const requiredConfirmations = process.env.REQUIRED_CONFIRMATIONS 
        ? parseInt(process.env.REQUIRED_CONFIRMATIONS) 
        : 2;

    console.log(`🚀 Déploiement du multisig avec l'adresse : ${deployer.address}`);
    console.log("👥 Owners:", owners);
    console.log("✍️ Confirmations requises:", requiredConfirmations);

    // 🔹 Déploiement du contrat MultiSigWallet en passant la liste des propriétaires et le nombre de confirmations requises
    const MultiSigWallet = await ethers.deployContract("MultiSigWallet", [
        owners,
        requiredConfirmations
    ]);

    // 🔹 Attente de la confirmation du déploiement
    await MultiSigWallet.waitForDeployment();
    const multisigAddress = await MultiSigWallet.getAddress();
    console.log(`✅ Multisig déployé à l'adresse : ${multisigAddress}`);

    // 🔹 Affichage d'un résumé des informations de déploiement
    console.log("\n📝 Résumé du déploiement:");
    console.log("------------------------");
    console.log("Adresse du contrat:", multisigAddress);
    console.log("Nombre d'owners:", owners.length);
    console.log("Confirmations nécessaires:", requiredConfirmations);
}

// 🔹 Gestion des erreurs lors du déploiement du contrat
main().catch((error) => {
    console.error("❌ Erreur lors du déploiement :", error);
    process.exitCode = 1;
});
