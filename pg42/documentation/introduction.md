# 📖 Introduction

## 1️⃣ MetaMask

### ✅ Qu'est-ce que MetaMask ?

    Extension de navigateur et application mobile permettant d'interagir avec la blockchain.
    Sert de portefeuille crypto pour stocker, envoyer et recevoir des tokens.
    Permet de se connecter aux DApps et d'approuver des transactions.

### ✅ Pourquoi l'utiliser ?

    Permet de gérer son compte sur la BNB Chain.
    Facilite la signature et l’envoi de transactions sur la blockchain.
    Peut être utilisé avec des réseaux de test (Testnet BSC, Ethereum Goerli, etc.).

### ✅ Configuration sur la BNB Chain

    Ajouter la BNB Smart Chain à MetaMask en ajoutant l’URL du réseau.
    Différence entre le Mainnet (Réseau principal) et le Testnet (Réseau de test).
    Récupération de BNB de test via le BNB Chain Faucet.

### ✅ Exemples d’actions avec MetaMask

    Vérifier son solde en BNB et en tokens BEP-20.
    Signer une transaction (ex: envoi de BNB ou d’un token).
    Se connecter à une DApp via MetaMask.

---

## 2️⃣ Hardhat

### ✅ Qu'est-ce que Hardhat ?

- Un environnement de développement pour déployer et tester des smart contracts sur Ethereum/BSC.
- Fournit une blockchain locale pour tester ses contrats.
- Supporte le déploiement automatique sur un réseau test ou mainnet.

### ✅ Pourquoi l'utiliser ?

- Simuler la blockchain en local pour tester son smart contract.
- Automatiser les compilations, tests et déploiements de contrats intelligents.
- Interaction avec MetaMask et BscScan pour tester en réel.

### ✅ Principales commandes à connaître

- **npx hardhat** → Créer un projet Hardhat.
- **npx hardhat compile** → Compiler les contrats.
- **npx hardhat test** → Exécuter les tests.
- **npx hardhat node** → Lancer une blockchain locale.
- **npx hardhat run scripts/deploy.js --network testnet** → Déployer sur BSC Testnet.

### ✅ Scripts importants

- Déploiement de token ERC-20/BEP-20 avec Hardhat.
- Interaction avec un smart contract (appels de fonctions avec ethers.js).

### ✅ Gestion des logs et erreurs

- Vérifier les logs de transaction.
- Déboguer un smart contract avant de le déployer sur la blockchain.

---

## 3️⃣ BscScan

### ✅ Qu'est-ce que BscScan ?

- Un explorateur de blockchain pour suivre les transactions et les smart contracts sur Binance Smart Chain.
- Permet d’afficher les soldes, les tokens, et les interactions avec un contrat.
- Utilisé pour vérifier et valider le déploiement de ton smart contract.

### ✅ Pourquoi l'utiliser ?

- Vérifier si un contrat a bien été déployé.
- Voir l'adresse du contrat, les transactions et les événements.
- Vérifier les transactions envoyées depuis MetaMask.
- Publier et vérifier son code source sur BscScan pour prouver son authenticité.

### ✅ Comment publier son smart contract sur BscScan ?

- Déployer le contrat avec Hardhat.
- Récupérer l’adresse du contrat déployé.
- Soumettre et vérifier le code sur BscScan.
- Ajouter le token dans MetaMask pour tester les transactions.

### ✅ Lecture et analyse des transactions sur BscScan

- Vérifier l’historique des transactions.
- Analyser les logs d’événements pour déboguer un contrat.
- Voir les balances et les tokens détenus par une adresse.

---

## 4️⃣ Points Clés à Comprendre
### 🔹 Différence entre un Mainnet et un Testnet

- Mainnet : Réseau principal où les transactions utilisent de la crypto réelle.
- Testnet : Réseau de test permettant d'expérimenter sans risque, avec des tokens gratuits (faucets).

### 🔹 Différence entre ERC-20 (Ethereum) et BEP-20 (Binance Smart Chain)

- ERC-20 : Standard des tokens Ethereum.
- BEP-20 : Standard des tokens sur Binance Smart Chain (similaire à ERC-20 mais adapté à BSC).

### 🔹 Processus de déploiement et vérification d’un contrat sur BSC

- Écrire et tester le smart contract en local avec Hardhat.
- Déployer le contrat sur le testnet avec Hardhat et récupérer l'adresse du contrat.
- Vérifier le contrat sur BscScan en soumettant le code source pour validation.
- Tester les fonctionnalités du token (émission, transfert, validation).
- Déployer sur le Mainnet si tout fonctionne correctement.

### 🔹 Interaction entre Hardhat, MetaMask et BscScan

- Hardhat : Sert à développer, tester et déployer le smart contract.
- MetaMask : Utilisé pour signer et valider les transactions sur la blockchain.
- BscScan : Permet de suivre l’état des transactions et de vérifier le code source.

### 🔹 Importance des permissions et de la sécurité d’un smart contract

- Protéger les fonctions critiques (ex: mint, burn, transfert d’ownership).
- Éviter les failles de sécurité (ex: reentrancy, integer overflow).
- Limiter les autorisations des comptes externes.
- Auditer le smart contract avant un déploiement en production.

---