import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
    console.log("\n🚀 DÉMARRAGE DU TEST COMPLET...\n" + "=".repeat(50));

    let logResults = "🚀 RÉSUMÉ DU TEST COMPLET\n\n";

    // 🔄 Récupération du signataire déployeur
    const [deployer] = await ethers.getSigners();
    console.log(`✅ Utilisation du compte déployeur : ${deployer.address}\n`);
    logResults += `✅ Utilisation du compte déployeur : ${deployer.address}\n\n`;

    // 🔄 Connexion au contrat PG42
    const PG42_ADDRESS = process.env.PG42_CONTRACT_ADDRESS;
    if (!PG42_ADDRESS) {
        console.error("❌ Aucune adresse de contrat PG42 trouvée. Vérifie le fichier .env !");
        process.exit(1);
    }
    const pg42 = await ethers.getContractAt("PG42", PG42_ADDRESS, deployer);
    console.log(`✅ Connexion au contrat PG42 réussie : ${PG42_ADDRESS}\n`);

    // 🎯 Vérification des soldes initiaux
    const recipient = "0x665eF53f3E0e39555C1905aD07Ca0dd4477e5A75";
    let initialDeployerBalance = await pg42.balanceOf(deployer.address);
    let initialRecipientBalance = await pg42.balanceOf(recipient);

    console.log(`💰 Solde initial du déployeur : ${ethers.formatUnits(initialDeployerBalance, 18)} PG42`);
    console.log(`💰 Solde initial du destinataire : ${ethers.formatUnits(initialRecipientBalance, 18)} PG42\n`);

    // 🎯 **Test Transfer**
    console.log("\n🔹 TEST : TRANSFERT DE TOKENS\n" + "-".repeat(50));
    console.log(`🔄 Transfert de 10.0 PG42 vers ${recipient}...`);
    try {
        const txTransfer = await pg42.transfer(recipient, ethers.parseUnits("10", 18));
        console.log(`⏳ Transaction en attente... (TX: ${txTransfer.hash})`);
        await txTransfer.wait();
        console.log("✅ Transfert effectué avec succès !");
        console.log(`🔗 Vérifie sur BscScan : https://testnet.bscscan.com/tx/${txTransfer.hash}\n`);

        // 🔍 Vérification des nouveaux soldes
        let newDeployerBalance = await pg42.balanceOf(deployer.address);
        let newRecipientBalance = await pg42.balanceOf(recipient);

        console.log(`💰 Nouveau solde du déployeur : ${ethers.formatUnits(newDeployerBalance, 18)} PG42`);
        console.log(`💰 Nouveau solde du destinataire : ${ethers.formatUnits(newRecipientBalance, 18)} PG42\n`);
    } catch (error) {
        console.error("❌ Erreur lors du transfert de tokens :", error);
        process.exit(1);
    }

    // 🎁 **Test Reward**
    console.log("\n🔹 TEST : REWARD TOKENS\n" + "-".repeat(50));
    console.log("🎁 Attribution de 5 PG42 en récompense...");
    try {
        const txReward = await pg42.reward(recipient, ethers.parseUnits("5", 18));
        console.log(`⏳ Transaction en attente... (TX: ${txReward.hash})`);
        await txReward.wait();
        console.log("✅ Récompense attribuée avec succès !");
        console.log(`🔗 Vérifie sur BscScan : https://testnet.bscscan.com/tx/${txReward.hash}\n`);

        // 🔍 Vérification des nouveaux soldes
        let updatedRecipientBalance = await pg42.balanceOf(recipient);
        console.log(`💰 Nouveau solde du destinataire : ${ethers.formatUnits(updatedRecipientBalance, 18)} PG42\n`);
    } catch (error) {
        console.error("❌ Erreur lors de l'attribution de la récompense :", error);
        process.exit(1);
    }

    // 🎯 **Test MultiSig Wallet**
    console.log("\n🔹 TEST : MULTISIG WALLET\n" + "-".repeat(50));
    const MULTISIG_ADDRESS = process.env.MULTISIG_CONTRACT_ADDRESS;
    if (!MULTISIG_ADDRESS) {
        console.error("❌ Aucune adresse de contrat MultiSig trouvée. Vérifie le fichier .env !");
        process.exit(1);
    }
    const multiSigWallet = await ethers.getContractAt("MultiSigWallet", MULTISIG_ADDRESS, deployer);
    console.log(`✅ Connexion au MultiSigWallet réussie : ${MULTISIG_ADDRESS}\n`);

    // 📌 **Soumission d'une transaction MultiSig**
    console.log(`📌 Soumission d'une transaction MultiSig pour envoyer 0.005 BNB à ${recipient}...`);
    try {
        const txSubmit = await multiSigWallet.submitTransaction(recipient, ethers.parseUnits("0.005", "ether"), "0x");
        console.log(`⏳ Transaction en attente... (TX: ${txSubmit.hash})`);
        await txSubmit.wait();
        console.log("✅ Transaction soumise avec succès !");
        console.log(`🔗 Vérifie sur BscScan : https://testnet.bscscan.com/tx/${txSubmit.hash}\n`);
    } catch (error) {
        console.error("❌ Erreur lors de la soumission de la transaction MultiSig :", error);
        process.exit(1);
    }

    // 🆔 **Récupération de l'ID de la transaction soumise**
    const transactionCount = await multiSigWallet.transactionCount();
    const transactionId = transactionCount - 1n;
    console.log(`✅ Transaction soumise avec ID : ${transactionId}\n`);

    // 📌 **Confirmation de la transaction MultiSig par les propriétaires**
    console.log(`📝 Confirmation par les propriétaires...\n`);

    const owners = [
        { address: process.env.OWNER1_ADDRESS, privateKey: process.env.OWNER1_PRIVATE_KEY },
        { address: process.env.OWNER2_ADDRESS, privateKey: process.env.OWNER2_PRIVATE_KEY },
        { address: process.env.OWNER3_ADDRESS, privateKey: process.env.OWNER3_PRIVATE_KEY },
        { address: process.env.OWNER4_ADDRESS, privateKey: process.env.OWNER4_PRIVATE_KEY },
    ];

    const provider = new ethers.JsonRpcProvider(process.env.BSC_TESTNET_RPC);

    for (const owner of owners) {
        if (!owner.privateKey) {
            console.error(`❌ Clé privée manquante pour ${owner.address} dans .env`);
            continue;
        }

        try {
            const wallet = new ethers.Wallet(owner.privateKey, provider);
            const txConfirm = await multiSigWallet.connect(wallet).confirmTransaction(transactionId);
            console.log(`⏳ Confirmation en attente... (TX: ${txConfirm.hash})`);
            await txConfirm.wait();
            console.log(`✅ Confirmation réussie par ${owner.address} !`);
            console.log(`🔗 Vérifie sur BscScan : https://testnet.bscscan.com/tx/${txConfirm.hash}\n`);
        } catch (error) {
            console.error(`❌ Erreur lors de la confirmation par ${owner.address} :`, error);
        }
    }

    // 🚀 **Exécution de la transaction**
    console.log("\n🚀 Exécution de la transaction MultiSig...");
    try {
        const txExecute = await multiSigWallet.executeTransaction(transactionId);
        console.log(`⏳ Exécution en attente... (TX: ${txExecute.hash})`);
        await txExecute.wait();
        console.log("✅ Transaction exécutée avec succès !");
        console.log(`🔗 Vérifie sur BscScan : https://testnet.bscscan.com/tx/${txExecute.hash}\n`);
    } catch (error) {
        console.error("❌ Erreur lors de l'exécution de la transaction :", error);
        process.exit(1);
    }

    console.log("\n✅ TEST COMPLET TERMINÉ !\n" + "=".repeat(50));
}

main().catch((error) => {
    console.error("❌ Erreur lors du test complet :", error);
    process.exitCode = 1;
});
