# PG42 - Token BEP-20 sur BNB Smart Chain Testnet

## 📌 Introduction

PG42 est un **token BEP-20** conçu pour être déployé sur la **BNB Smart Chain Testnet**, dans le cadre du projet **42 x BNB Chain**.  
Il a été développé pour **récompenser la participation des membres de ProxyGirl’s** à divers événements communautaires tels que **workshops, meetups, mentoring et hackathons**.

En complément, un MultiSigWallet a été implémenté pour sécuriser la gestion des fonds et garantir une gouvernance transparente.

Le projet est structuré autour de trois principaux dossiers :
- **`code/`** : Contient le smart contract et les scripts de déploiement.
- **`deployment/`** : Contient les fichiers de configuration et d’environnement.
- **`documentation/`** : Inclut la documentation et le guide d’utilisation.

---

## 📌 Justification des choix techniques

### **1️⃣ Choix de la Blockchain : BNB Smart Chain Testnet**
#### ✅ Raisons :
- **Faibles coûts de transaction** par rapport à Ethereum.
- **Facilité d’intégration avec les outils Web3** et support large de la communauté.
- **Compatibilité avec les standards ERC-20/BEP-20**, facilitant l’interopérabilité.

---

### **2️⃣ Choix du standard BEP-20**
#### ✅ Raisons pour BEP-20:
- **BEP-20 est une extension de l’ERC-20**, garantissant la compatibilité avec l’écosystème BSC.
- **Standard éprouvé** avec des implémentations solides via OpenZeppelin.
- **Simplicité et sécurité**, permettant une adoption rapide.

#### ✅ Raisons pour le MultiSigWallet :

- **Sécurisation des fonds** : Une seule signature ne suffit pas pour exécuter une transaction.
- **Approche de gouvernance décentralisée** : Plusieurs propriétaires doivent approuver les transactions.
- **Facilité d’audit** : Toutes les transactions sont transparentes et accessibles via BscScan.

---

### **3️⃣ Choix de Solidity et OpenZeppelin**
#### ✅ Raisons :
- **Solidity est le langage standard pour le développement de smart contracts**.
- **Utilisation des bibliothèques OpenZeppelin** pour bénéficier d’implémentations sécurisées et éviter les vulnérabilités connues.
- **Réduction des risques de bugs et amélioration de la maintenabilité**.

---

### **4️⃣ Choix de Hardhat pour le développement**
#### ✅ Raisons :
- **Hardhat offre un environnement de développement puissant et flexible**.
- **Facilité de déploiement sur le BSC Testnet**.
- **Intégration avec ethers.js et TypeScript** pour une meilleure sécurité et lisibilité du code.

---

### **5️⃣ Fonctionnalités clés du token PG42**
Le token PG42 implémente les fonctionnalités suivantes :
- **Transférabilité** : Permet aux utilisateurs d’envoyer des PG42 à d’autres adresses.
- **Supply fixe** : Limitée à **1,000,000 PG42** pour éviter l’inflation.
- **Fonction `reward()`** : Permet à l’owner du contrat d’émettre des tokens pour récompenser des membres engagés.

```solidity
function reward(address recipient, uint256 amount) external onlyOwner {
    require(amount > 0, "Invalid amount");
    require(balanceOf(msg.sender) >= amount, "Insufficient balance");

    _transfer(msg.sender, recipient, amount);

    emit Rewarded(recipient, amount);
}
```

📌 Pourquoi cette approche ?

* Empêcher l’émission infinie de tokens et maintenir la valeur du PG42.
* Seul l’owner peut attribuer des récompenses, garantissant un contrôle transparent.

---

### **6️⃣ Choix de la structure du projet**
Nous avons organisé le repository en trois dossiers principaux pour assurer une meilleure maintenabilité :
```bash
PG42/
│── code/                 # Contient le smart contract et les scripts de déploiement
│   ├── contracts/        # Fichiers Solidity
│   │   ├── PG42.sol      # Le contrat du token PG42
│   │   ├── MultiSigWallet.sol      # Le contrat du multisig
│   ├── scripts/          # Scripts de déploiement
│   │   ├── deploy.ts     # Script de déploiement 
│   │   ├── deploy-multisig.ts     # Script de déploiement 
│   │   ├── full-test.ts     # Script de test complet du projet
Hardhat
│   ├── hardhat.config.ts # Configuration de Hardhat
│
│── deployment/           # Environnement de déploiement
│   ├── .env              # Variables d'environnement (RPC, clé privée, API)
│
│── documentation/        # Documentation du projet
│   ├── deploy-instructions.md # Instructions de déploiement
│   ├── deploy-instructions.md     # Guide de déploiement
│   ├── how-to-use.md     # Guide d’utilisation
│   ├── setup-guide.md     # Guide de lancement
│── README.md
```

📌 Pourquoi cette organisation ?

* Séparation claire du code source, des configurations et de la documentation.
* Facilité de navigation et d’extension du projet.
* Bonne pratique pour un projet Web3 structuré.

---

## 📌 Fonctionnalités clés

### 🔹 PG42 Token

Le token PG42 implémente les fonctionnalités suivantes :

- Transférabilité : Permet aux utilisateurs d’envoyer des PG42 à d’autres adresses.
- Supply fixe : Limitée à 1,000,000 PG42 pour éviter l’inflation.
- Fonction reward() : Permet à l’owner du contrat d’émettre des tokens pour récompenser des membres engagés.

```js
function reward(address recipient, uint256 amount) external onlyOwner {
    require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
    _mint(recipient, amount);
}
```

📌 Pourquoi cette approche ?

- Empêcher l’émission infinie de tokens et maintenir la valeur du PG42.
- Seul l’owner peut attribuer des récompenses, garantissant un contrôle transparent.

### 🔹 MultiSigWallet

Le MultiSigWallet permet une gestion sécurisée des fonds grâce à un système de validation multiple des transactions.

- Ajout de propriétaires lors du déploiement.
- Dépôt de fonds directement sur le contrat.
- Soumission d’une transaction par un propriétaire.
- Confirmation d’une transaction par les propriétaires requis.
- Exécution d’une transaction uniquement après le nombre de confirmations requis.

function submitTransaction(address destination, uint256 value, bytes memory data) 
    public onlyOwner returns (uint256) 
{
    uint256 transactionId = transactionCount++;
    transactions[transactionId] = Transaction(destination, value, data, false);
    emit Submission(transactionId);
    return transactionId;
}

📌 Pourquoi cette approche ?

- Renforce la sécurité des fonds grâce à la validation multiple.
- Évite les transactions frauduleuses en demandant un consensus.
- Traçabilité totale des transactions via la blockchain BSC.

---

## 📌 Déploiement du projet
### **1️⃣ Prérequis**

* `pnpm` pour la gestion des dépendances.
* `Node.js` et `Hardhat` pour le développement et le test.
```bash
pnpm install
```

---

### **2️⃣ Configuration de l’Environnement**

Ajoutez un fichier `.env` dans le dossier `deployment/` :
```bash
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSCSCAN_API_KEY=VOTRE_API_KEY_BSCSCAN
DEPLOYER_PRIVATE_KEY=VOTRE_CLE_PRIVEE
PG42_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_PG42
MULTISIG_CONTRACT_ADDRESS=ADRESSE_DEPLOYE_MULTISIG
```

---

### **3️⃣ Compilation du Smart Contract**
```bash
pnpm hardhat compile
```

### **4️⃣ Déploiement du Token**
```bash
pnpm hardhat run scripts/deploy.ts --network bscTestnet
```

### **5️⃣ Vérification sur BscScan**
```bash
pnpm hardhat verify --network bscTestnet VOTRE_ADRESSE_CONTRAT "0xVOTRE_ADRESSE_DEPLOYEUR"
```

### **6️⃣ Exécution du test complet (PG42 + MultiSigWallet)**
```bash
pnpm hardhat run scripts/full-test.ts --network bscTestnet
```

---

## 📌 Sécurité et Vérification

- ✅ **Adresse du contrat PG42** : `0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd`
- ✅ **Adresse du MultiSigWallet** : `0x72cfC41c3FCA17cC1B1Aa351fF2236339AdD3b2A`
- ✅ **Contrat vérifié sur BscScan** : [Voir sur BscScan](https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code)
- **MultiSigWallet vérifié sur BscScan** : [MultiSigWallet sur BscScan](https://testnet.bscscan.com/address/0x72cfC41c3FCA17cC1B1Aa351fF2236339AdD3b2A#code)

- ✅ **Contrat restreint à l’owner** : Seul l’owner peut utiliser `reward()`.
- ✅ **Utilisation des standards OpenZeppelin** : `ERC-20` et `Ownable` pour plus de sécurité.

---

## 📌 Améliorations Futures

🚀 Améliorations envisagées :

* 🌱 Système de staking pour récompenser les membres actifs.
* 🖥️ Développement d’une interface Web (Vue 3 + ethers.js) pour interagir avec PG42.