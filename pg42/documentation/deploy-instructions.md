# 📖 Instructions de Déploiement du Token PG42 et du MultiSigWallet

Ce guide explique comment **compiler, déployer et vérifier** le contrat PG42(Token BEP-20) et MultiSigWallet sur **BNB Smart Chain Testnet**.

---

## 1️⃣ Prérequis

Avant de commencer, assurez-vous d’avoir installé :
- **Node.js** (`>= 16`)
- **pnpm** (`>= 8`)
- **Hardhat** (`>= 2.22.18`)

Installez les dépendances avec :
```sh
pnpm install
```

---

## 2️⃣ Configuration de l’Environnement

Avant de lancer le déploiement, vous devez configurer les variables d’environnement.

📌 Créez un fichier `.env` dans `deployment/` et ajoutez ces lignes :
```ini
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=VOTRE_API_KEY_BSCSCAN
DEPLOYER_PRIVATE_KEY=VOTRE_CLE_PRIVEE
PG42_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_PG42
MULTISIG_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_MULTISIG
```

🔹 Explication des variables :

* BSC_TESTNET_RPC : URL du nœud public de BNB Smart Chain Testnet.
* BSCSCAN_API_KEY : Clé API pour vérifier le contrat sur BscScan.
* DEPLOYER_PRIVATE_KEY : Clé privée du wallet qui déploiera le contrat.
* PG42_CONTRACT_ADDRESS : Adresse du contrat PG42 après déploiement.
* MULTISIG_CONTRACT_ADDRESS : Adresse du MultiSigWallet après déploiement.

**⚠️ Ne partagez jamais votre clé privée en public !**

--- 

## 3️⃣ Compilation du Smart Contract

Avant de déployer, assurez-vous que le contrat compile correctement :
```sh
pnpm hardhat compile
```

Si tout fonctionne, vous verrez :
```sh
Compiled 7 Solidity files successfully (evm target: paris).
```

---

## 4️⃣ Déploiement du Token PG42 et du MultiSigWallet

Lancez la commande suivante pour déployer le contrat sur BNB Smart Chain Testnet :
```bash
pnpm hardhat run scripts/deploy.ts --network bscTestnet
```

Si le déploiement est réussi, vous verrez un message affichant l’adresse du contrat :
```bash
🚀 Déploiement en cours avec l'adresse : 0x3794e29d7Fb16319b169Ee4ED52Dfc6F2b090E15
✅ PG42 déployé à l'adresse : 0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd
```

Lancez la commande suivante pour déployer le MultiSigWallet :
```bash
pnpm hardhat run scripts/deploy-multisig.ts --network bscTestnet
```

Si le déploiement est réussi, vous verrez :
```bash
🚀 Déploiement du MultiSigWallet en cours...
✅ MultiSigWallet déployé à l'adresse : 0xE7Af61dCd1600bc7b4fFd632b61529388B729604
```

📌 Notez ces adresses et ajoutez-les dans `.env`

---

## 5️⃣ Vérification du Contrat sur BscScan

Pour rendre le contrat lisible publiquement sur BscScan, exécutez :
```bash
pnpm hardhat verify --network bscTestnet VOTRE_ADRESSE_CONTRAT "0xVOTRE_ADRESSE_DEPLOYEUR"
```

📌 Exemple concret :
```bash
pnpm hardhat verify --network bscTestnet 0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd "0x3794e29d7Fb16319b169Ee4ED52Dfc6F2b090E15"
```

Si la vérification est réussie, vous verrez :

```bash
Successfully verified contract PG42 on the block explorer.
https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code
```

🔗 Votre contrat est désormais accessible ici :
📌 [Voir sur BscScan](https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code)

---

## 5️⃣ Exécution du Test Complet (PG42 + MultiSigWallet)

Une fois les contrats déployés, vous pouvez exécuter un test complet pour valider leur bon fonctionnement :
```bash
pnpm hardhat run scripts/full-test.ts --network bscTestnet
```

Si tout fonctionne, vous verrez :
```bash
🚀 Démarrage du test complet...
✅ Utilisation du contrat PG42 : 0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd
💰 Solde initial du déployeur : 999900.0 PG42
✅ Transfert de 10.0 PG42 vers 0x665eF53f3E0e39555C1905aD07Ca0dd4477e5A75
✅ Récompense attribuée avec succès !
🚀 Test du MultiSigWallet...
✅ Transaction soumise et confirmée !
✅ Transaction exécutée avec succès !
✅ Résumé des vérifications :
🔗 PG42 sur BscScan : https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd
🔗 MultiSigWallet sur BscScan : https://testnet.bscscan.com/address/0xE7Af61dCd1600bc7b4fFd632b61529388B729604
```

---

## 6️⃣ Vérification des Contrats sur BscScan

Pour rendre les contrats lisibles publiquement sur BscScan, exécutez :

- Pour PG42 :
```bash
pnpm hardhat verify --network bscTestnet 0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd "0x3794e29d7Fb16319b169Ee4ED52Dfc6F2b090E15"
```

- Pour le MultiSigWallet :
```bash
pnpm hardhat verify --network bscTestnet 0xE7Af61dCd1600bc7b4fFd632b61529388B729604
```

Si la vérification est réussie, vous verrez :
```bash
Successfully verified contract PG42 on the block explorer.
https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code

Successfully verified contract MultiSigWallet on the block explorer.
https://testnet.bscscan.com/address/0xE7Af61dCd1600bc7b4fFd632b61529388B729604#code
```

