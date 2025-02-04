# 📖 Guide de Réinstallation du Projet PG42

Ce guide explique comment **remettre en place le projet après une correction** et s'assurer que tout fonctionne correctement.

---

## 📌 1️⃣ Récupérer le Projet

Si tu dois récupérer ton projet après la correction, commence par **cloner ton dépôt** :

```sh
git clone url_du_projet
cd pg42
```

---

## 📌 2️⃣ Réinstaller les Dépendances

Lorsque tu reviens sur ton projet après une période d’inactivité, il faut réinstaller toutes les bibliothèques nécessaires.

Dans le dossier de ton projet (pg42/code/), exécute :
```bash
pnpm install
```

Cela va réinstaller Hardhat, ethers.js et toutes les autres dépendances.

---

## 📌 3️⃣ Vérifier la Configuration de l’Environnement

Vérifie si le fichier `.env` est bien présent dans `deployment/`.
S'il a été ignoré lors du commit, il faudra le recréer manuellement :

📌 Crée un fichier deployment/.env et ajoute les informations suivantes :
```bash
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=VOTRE_API_KEY_BSCSCAN
DEPLOYER_PRIVATE_KEY=VOTRE_CLE_PRIVEE
PG42_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_PG42
MULTISIG_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_MULTISIG
```

⚠️ Attention : Ne partage jamais ta clé privée sur GitHub ou en public !

---

## 📌 4️⃣ Vérifier que le Code Fonctionne
🔹 Compiler le Smart Contract
```bash
pnpm hardhat compile
```

Si tout va bien, tu devrais voir :
```bash
Compiled 7 Solidity files successfully (evm target: paris).
```

🔹 Vérifier l’Adresse du Contrat

Si ton contrat est déjà déployé, tu peux le vérifier ici : 🔗 [PG42 sur BscScan](https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code)

---

## 📌 5️⃣ Tester l’Interaction avec PG42 et MultiSigWallet

Si ton contrat est déjà en ligne, tu peux tester ses fonctionnalités sans redéploiement.

### 1️⃣ Ouvrir la console Hardhat
```bash
pnpm hardhat console --network bscTestnet
```

### 2️⃣ Vérifier le Solde d'un Utilisateur
```bash
const PG42 = await ethers.getContractAt("PG42", "0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd");
const balance = await PG42.balanceOf("0xADRESSE_UTILISATEUR");
console.log("Solde :", ethers.formatUnits(balance, 18), "PG42");
```

### 3️⃣ Transférer des Tokens PG42
```bash
await PG42.transfer("0xADRESSE_DESTINATAIRE", ethers.parseUnits("10", 18));
console.log("✅ 10 PG42 envoyés !");
```

### 4️⃣ Déposer des fonds dans le MultiSigWallet
```bash
await ethers.getSigner().sendTransaction({
    to: process.env.MULTISIG_CONTRACT_ADDRESS,
    value: ethers.parseUnits("0.01", "ether"),
});
console.log("✅ Dépôt effectué avec succès !");
```

### 5️⃣ Vérifier le Solde du MultiSigWallet
```bash
const multiSigBalance = await ethers.provider.getBalance(process.env.MULTISIG_CONTRACT_ADDRESS);
console.log("💰 Solde du MultiSig :", ethers.formatUnits(multiSigBalance, "ether"), "BNB");
```

### 6️⃣ Soumettre une Transaction avec MultiSigWallet
```bash
const multiSig = await ethers.getContractAt("MultiSigWallet", process.env.MULTISIG_CONTRACT_ADDRESS);
await multiSig.submitTransaction("0xDESTINATAIRE", ethers.parseUnits("0.005", "ether"), "0x");
console.log("✅ Transaction soumise !");
```

### 7️⃣ Confirmer et Exécuter une Transaction MultiSig
```bash
const transactionCount = await multiSig.transactionCount();
const transactionId = transactionCount - 1n;
await multiSig.confirmTransaction(transactionId);
console.log("✅ Transaction confirmée !");
await multiSig.executeTransaction(transactionId);
console.log("✅ Transaction exécutée !");
```

---

## 📌 6️⃣ Que Faire si le Contrat doit être Redéployé ?

⚠️ Si le contrat doit être redéployé, utilise la procédure suivante :

### 1️⃣ Nettoyer les fichiers de build
```bash
pnpm hardhat clean
```

### 2️⃣ Recompiler le contrat
```bash
pnpm hardhat compile
```

### 3️⃣ Déployer sur BNB Smart Chain Testnet
```bash
pnpm hardhat run scripts/deploy.ts --network bscTestnet
pnpm hardhat run scripts/deploy-multisig.ts --network bscTestnet

```

Une nouvelle adresse de contrat sera générée.

### 4️⃣ Vérifier le Contrat sur BscScan
```bash
pnpm hardhat verify --network bscTestnet NOUVELLE_ADRESSE "0xVOTRE_ADRESSE_DEPLOYEUR"
pnpm hardhat verify --network bscTestnet NOUVELLE_ADRESSE_MULTISIG
```

---
