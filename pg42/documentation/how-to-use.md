# 📖 Guide d’Utilisation du Token PG42 et du MultiSigWallet

Ce guide explique comment interagir avec le token **PG42** sur **BNB Smart Chain Testnet**.  
Vous apprendrez à :
- 📥 **Ajouter PG42 à MetaMask**
- 🔄 **Transférer des tokens**
- 🔐 **Déposer et gérer des fonds avec le MultiSigWallet**
- 🎁 **Utiliser la fonction `reward()` pour récompenser un utilisateur**
- 🔍 **Vérifier les transactions sur BscScan**

---

## 1️⃣ Ajouter PG42 à MetaMask

1. **Ouvrez MetaMask** et sélectionnez **BNB Smart Chain Testnet**.
   - Si ce réseau n’est pas encore ajouté, configurez-le avec :
     ```
     Nom du réseau : BNB Smart Chain Testnet
     RPC URL : https://data-seed-prebsc-1-s1.binance.org:8545
     ID Chaîne : 97
     Symbole : BNB
     Explorateur : https://testnet.bscscan.com/
     ```
2. Cliquez sur **"Ajouter un token"**.
3. Sélectionnez **"Token personnalisé"** et entrez l’adresse suivante : 0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd
4. Validez, et vous verrez votre solde PG42 apparaître.

📌 **Vous pouvez maintenant recevoir et envoyer des PG42 directement depuis MetaMask !** 🚀

---

## 2️⃣ Envoyer des Tokens PG42 via MetaMask

1. Ouvrez MetaMask et sélectionnez **BNB Smart Chain Testnet**.
2. Cliquez sur **"Envoyer"**.
3. Entrez **l’adresse du destinataire** (ex. un autre compte MetaMask).
4. Indiquez **le montant en PG42**.
5. Confirmez la transaction et attendez la validation sur la blockchain.

📌 **Vous pouvez suivre votre transaction sur BscScan en utilisant l'ID de transaction.**  

---

## 3️⃣ Envoyer des Tokens PG42 via Hardhat

Vous pouvez aussi utiliser Hardhat pour envoyer des tokens.  

1️⃣ Ouvrez une console Hardhat :
```sh
pnpm hardhat console --network bscTestnet
```

2️⃣ Dans la console, exécutez :
```sh
const PG42 = await ethers.getContractAt("PG42", "0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd");
await PG42.transfer("0xADRESSE_DESTINATAIRE", ethers.parseUnits("10", 18));
```

📌 Cela enverra 10 PG42 à l’adresse spécifiée.

---

## 4️⃣ Récompenser un Utilisateur avec reward()

Seul l’owner du contrat peut utiliser la fonction reward() pour attribuer des PG42 à un utilisateur.

1️⃣ Ouvrez une console Hardhat :
```sh
pnpm hardhat console --network bscTestnet
```

2️⃣ Dans la console, exécutez :
```
await PG42.reward("0xADRESSE_DESTINATAIRE", ethers.parseUnits("50", 18));
```

📌 L’utilisateur recevra 50 PG42 en récompense ! 🎁

---

## 5️⃣ Vérifier les Transactions sur BscScan

Vous pouvez suivre toutes vos transactions sur BscScan Testnet.

🔍 Lien vers le contrat PG42 :
📌 [Voir sur BscScan](https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code)

🔍 Pour voir une transaction spécifique :

    Copiez l’ID de transaction (Tx Hash) depuis MetaMask.
    Allez sur BscScan Testnet.
    Collez l’ID dans la barre de recherche.

📌 Vous pourrez voir tous les détails : confirmations, bloc, frais de gas, etc.

---

## 6️⃣ Utilisation du MultiSigWallet

Le MultiSigWallet est un portefeuille sécurisé nécessitant plusieurs signatures pour approuver les transactions.

### 🔹 Déposer des BNB dans le MultiSigWallet

Vous pouvez envoyer des BNB au MultiSigWallet comme ceci :

1️⃣ Ouvrez une console Hardhat :
```bash
pnpm hardhat console --network bscTestnet
```

2️⃣ Effectuez un dépôt :
```js
const deployer = await ethers.getSigner();
await deployer.sendTransaction({
    to: "0xE7Af61dCd1600bc7b4fFd632b61529388B729604", // Adresse du MultiSigWallet
    value: ethers.parseUnits("0.01", "ether") // Montant en BNB
});
```

📌 Le MultiSigWallet peut désormais gérer et sécuriser ces fonds.

## 7️⃣ Vérifier les Transactions sur BscScan

Vous pouvez suivre toutes vos transactions sur BscScan Testnet.

🔍 Liens utiles :

- PG42 sur BscScan :
    📌 [Voir le contrat](https://testnet.bscscan.com/address/0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd#code)
- MultiSigWallet sur BscScan :
    📌 [Voir le contrat](https://testnet.bscscan.com/address/0xE7Af61dCd1600bc7b4fFd632b61529388B729604#code)

🔍 Pour voir une transaction spécifique :

1. Copiez l’ID de transaction (Tx Hash) depuis MetaMask.
2. Allez sur BscScan Testnet.
3. Collez l’ID dans la barre de recherche.

📌 Vous pourrez voir tous les détails : confirmations, bloc, frais de gas, etc.