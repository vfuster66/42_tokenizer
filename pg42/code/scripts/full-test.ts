import { ethers } from "hardhat";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function main() {
    console.log("\n🚀 Démarrage du test complet...");

    let logResults = "🚀 Résumé du test complet\n\n";

    // 🔄 Récupération du signataire déployeur
    const [deployer] = await ethers.getSigners();
    console.log(`✅ Utilisation du compte déployeur : ${deployer.address}`);
    logResults += `✅ Utilisation du compte déployeur : ${deployer.address}\n`;

    // 🔄 Vérification si le contrat PG42 existe
    const PG42_ADDRESS = process.env.PG42_CONTRACT_ADDRESS;
    if (!PG42_ADDRESS) {
        console.error("❌ Aucune adresse de contrat PG42 trouvée. Vérifie le fichier .env !");
        process.exit(1);
    }
    const pg42 = await ethers.getContractAt("PG42", PG42_ADDRESS);
    console.log(`✅ Utilisation du contrat PG42 : ${PG42_ADDRESS}`);
    logResults += `✅ Utilisation du contrat PG42 : ${PG42_ADDRESS}\n`;

    // 🔍 Vérification du solde initial du déployeur
    let balance = await pg42.balanceOf(deployer.address);
    console.log(`💰 Solde initial du déployeur : ${ethers.formatUnits(balance, 18)} PG42`);
    logResults += `💰 Solde initial du déployeur : ${ethers.formatUnits(balance, 18)} PG42\n`;

    // 🔄 Test du transfert de tokens
    const recipient = "0x665eF53f3E0e39555C1905aD07Ca0dd4477e5A75";
    console.log(`🔄 Transfert de 10.0 PG42 vers ${recipient}...`);
    await (await pg42.transfer(recipient, ethers.parseUnits("10", 18))).wait();
    console.log("✅ Transfert effectué avec succès !");
    logResults += `✅ Transfert de 10 PG42 vers ${recipient} effectué avec succès !\n`;

    // 🔍 Vérification du solde du destinataire
    balance = await pg42.balanceOf(recipient);
    console.log(`💰 Nouveau solde du destinataire : ${ethers.formatUnits(balance, 18)} PG42`);
    logResults += `💰 Nouveau solde du destinataire : ${ethers.formatUnits(balance, 18)} PG42\n`;

    // 🎁 Test de la fonction reward()
    console.log("🎁 Test de la fonction reward()...");
    await (await pg42.reward(recipient, ethers.parseUnits("5", 18))).wait();
    console.log("✅ Récompense attribuée avec succès !");
    logResults += `✅ Récompense de 5 PG42 attribuée à ${recipient}\n`;

    // 🔍 Vérification du contrat sur BscScan
    console.log(`🔍 Vérification du contrat sur BscScan : https://testnet.bscscan.com/address/${PG42_ADDRESS}`);
    logResults += `🔍 Vérification du contrat PG42 sur BscScan : https://testnet.bscscan.com/address/${PG42_ADDRESS}\n`;

    // 🚀 Test du MultiSigWallet
    console.log("\n🚀 Test du MultiSigWallet...");
    logResults += "\n🚀 Test du MultiSigWallet...\n";

    const MULTISIG_ADDRESS = process.env.MULTISIG_CONTRACT_ADDRESS;
    if (!MULTISIG_ADDRESS) {
        console.error("❌ Aucune adresse de contrat MultiSig trouvée. Vérifie le fichier .env !");
        process.exit(1);
    }
    const multiSigWallet = await ethers.getContractAt("MultiSigWallet", MULTISIG_ADDRESS);
    console.log(`✅ Utilisation du MultiSigWallet : ${MULTISIG_ADDRESS}`);
    logResults += `✅ Utilisation du MultiSigWallet : ${MULTISIG_ADDRESS}\n`;

    // 💰 Dépôt de fonds dans le MultiSig
    console.log("💰 Dépôt de fonds dans le MultiSig...");
    await deployer.sendTransaction({
        to: MULTISIG_ADDRESS,
        value: ethers.parseUnits("0.01", "ether"),
    });
    console.log("✅ Dépôt effectué avec succès !");
    logResults += "✅ Dépôt de 0.01 BNB effectué dans le MultiSig\n";

    // 🔍 Vérification du solde du MultiSig
    let multiSigBalance = await ethers.provider.getBalance(MULTISIG_ADDRESS);
    console.log(`💰 Solde actuel du MultiSig : ${ethers.formatUnits(multiSigBalance, "ether")} BNB`);
    logResults += `💰 Solde actuel du MultiSig : ${ethers.formatUnits(multiSigBalance, "ether")} BNB\n`;

    // 📌 Soumission d'une transaction MultiSig
    console.log("📌 Soumission d'une transaction MultiSig...");
    await (await multiSigWallet.submitTransaction(recipient, ethers.parseUnits("0.005", "ether"), "0x")).wait();

    // ✅ Récupération de l'ID de la transaction
    const transactionCount = await multiSigWallet.transactionCount();
    const transactionId = transactionCount - 1n; // Dernière transaction soumise
    console.log(`✅ Transaction soumise avec ID : ${transactionId}`);
    logResults += `✅ Transaction MultiSig soumise avec ID : ${transactionId}\n`;

    // ✅ Confirmation de la transaction
    console.log("✅ Confirmation de la transaction...");
    await (await multiSigWallet.confirmTransaction(transactionId)).wait();
    console.log("✅ Transaction confirmée avec succès !");
    logResults += "✅ Transaction confirmée avec succès !\n";

    // 📌 Vérification des confirmations
    const isConfirmed = await multiSigWallet.confirmations(transactionId, deployer.address);
    console.log(`📌 Transaction confirmée par ${deployer.address} ? ${isConfirmed}`);
    logResults += `📌 Transaction confirmée par ${deployer.address} ? ${isConfirmed}\n`;

    // 🚀 Exécution de la transaction
    try {
        console.log("🚀 Exécution de la transaction...");
        await (await multiSigWallet.executeTransaction(transactionId)).wait();
        console.log("✅ Transaction exécutée avec succès !");
        logResults += "✅ Transaction MultiSig exécutée avec succès !\n";
    } catch (error) {
        console.error(`❌ Erreur lors de l'exécution : ${(error as any).message}`);
        logResults += `❌ Erreur lors de l'exécution : ${(error as any).message}\n`;
    }

    // 📌 Vérification des URLs
    console.log("\n✅ Résumé des vérifications à effectuer :");
    console.log(`🔗 PG42 sur BscScan : https://testnet.bscscan.com/address/${PG42_ADDRESS}`);
    console.log(`🔗 MultiSigWallet sur BscScan : https://testnet.bscscan.com/address/${MULTISIG_ADDRESS}`);
    
    logResults += `\n✅ Résumé des vérifications à effectuer :\n`;
    logResults += `🔗 PG42 sur BscScan : https://testnet.bscscan.com/address/${PG42_ADDRESS}\n`;
    logResults += `🔗 MultiSigWallet sur BscScan : https://testnet.bscscan.com/address/${MULTISIG_ADDRESS}\n`;

    // 📄 Enregistrement des résultats dans un fichier
    fs.writeFileSync("test-results.txt", logResults, "utf8");
    console.log("📄 Résumé du test sauvegardé dans test-results.txt");
}

main().catch((error) => {
    console.error("❌ Erreur lors du test complet :", error);
    process.exitCode = 1;
});
