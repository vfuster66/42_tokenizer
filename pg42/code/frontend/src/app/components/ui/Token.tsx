import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, Send, Shield, Coins, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/CardComponent';

declare global {
    interface Window {
        ethereum: any;
    }
}

const PG42_ADDRESS = process.env.NEXT_PUBLIC_PG42_ADDRESS || "0x0000000000000000000000000000000000000000";
const BSC_TESTNET_RPC = process.env.NEXT_PUBLIC_BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545";
const MULTISIG_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MULTISIG_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

const TOKEN_ABI = [
    "function transfer(address to, uint256 value) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function owner() view returns (address)",
    "function transferFrom(address from, address to, uint256 value) returns (bool)",
] as const;

const MULTISIG_ABI = [
    "function submitTransaction(address to, uint256 value, bytes calldata data) returns (uint256)",
    "function confirmTransaction(uint256 txIndex) returns (bool)",
    "function executeTransaction(uint256 txIndex) returns (bool)",
    "function isOwner(address) view returns (bool)",
    "function transactions(uint256) view returns (address to, uint256 value, bytes data, bool executed, uint256 numConfirmations)",
    "function required() view returns (uint256)",
    "function confirmations(uint256,address) view returns (bool)"
] as const;

const OWNERS = [
    {
        address: process.env.NEXT_PUBLIC_OWNER1_ADDRESS || "",
        label: "Owner 1 (Deployer)"
    },
    {
        address: process.env.NEXT_PUBLIC_OWNER2_ADDRESS || "",
        label: "Owner 2"
    },
    {
        address: process.env.NEXT_PUBLIC_OWNER3_ADDRESS || "",
        label: "Owner 3"
    },
    {
        address: process.env.NEXT_PUBLIC_OWNER4_ADDRESS || "",
        label: "Owner 4"
    }
];

interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    type: 'Transfer' | 'Reward' | 'Multisig';
    status: 'Pending' | 'Confirmed' | 'Executed';
    txIndex?: number;
    numConfirmations?: number;
    requiredConfirmations?: number;
}

import { BaseContract, BigNumberish, ContractTransactionResponse, BaseContractMethod } from "ethers";

interface TokenContract extends BaseContract {
    owner: BaseContractMethod<[], Promise<string>>;
    transfer: BaseContractMethod<[string, BigNumberish],
        ContractTransactionResponse>;
    transferFrom: BaseContractMethod<[string, string, BigNumberish], ContractTransactionResponse>;
    approve: BaseContractMethod<[string, BigNumberish], ContractTransactionResponse>;
    allowance: BaseContractMethod<[string, string], Promise<BigNumberish>>;
    reward: BaseContractMethod<[string, BigNumberish], ContractTransactionResponse>;
    decimals: BaseContractMethod<[], number>;
    balanceOf: BaseContractMethod<[string], BigNumberish>;
}

interface MultisigContract extends BaseContract {
    submitTransaction: BaseContractMethod<[string, BigNumberish, string], Promise<ContractTransactionResponse>>;
    confirmTransaction: BaseContractMethod<[BigNumberish], Promise<ContractTransactionResponse>>;
    executeTransaction: BaseContractMethod<[BigNumberish], Promise<ContractTransactionResponse>>;
    isOwner: BaseContractMethod<[string], Promise<boolean>>;
    transactions: BaseContractMethod<[BigNumberish], Promise<[string, bigint, string, boolean, bigint]>>;
    required: BaseContractMethod<[], Promise<bigint>>;
    confirmations: BaseContractMethod<[BigNumberish, string], Promise<boolean>>;
}

const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
const tokenContract = new ethers.Contract(
    PG42_ADDRESS,
    TOKEN_ABI,
    provider
) as unknown as TokenContract;

const TokenInterface: React.FC = () => {
    const [account, setAccount] = useState<string>("");
    const [balance, setBalance] = useState<string>("0");
    const [recipient, setRecipient] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [isMultisigOwner, setIsMultisigOwner] = useState<boolean>(false);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transactionMode, setTransactionMode] = useState<'transfer' | 'reward' | 'multisig'>('transfer');
    const [multisigTxIndex, setMultisigTxIndex] = useState<number | null>(null);
    const [requiredConfirmations, setRequiredConfirmations] = useState<number>(0);
    const [currentConfirmations, setCurrentConfirmations] = useState<number>(0);
    const [allowance, setAllowance] = useState<string>("0");
    const [accounts, setAccounts] = useState<string[]>([]);
    const [ownerConfirmations, setOwnerConfirmations] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        if (multisigTxIndex !== null) {
            checkOwnerConfirmations();
        }
    }, [multisigTxIndex]);

    // 🔹 Vérifie si les propriétaires ont confirmé la transaction multisig
    const checkOwnerConfirmations = async () => {
        if (multisigTxIndex === null) return;

        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                provider
            ) as unknown as MultisigContract;

            const confirmationStates: { [key: string]: boolean } = {};

            for (const owner of OWNERS) {
                const hasConfirmed: boolean = await contract.confirmations(multisigTxIndex, owner.address) as boolean;
                confirmationStates[owner.address] = hasConfirmed;
            }

            setOwnerConfirmations(confirmationStates);
        } catch (error) {
            console.error("Error checking owner confirmations:", error);
        }
    };

    // 🔹 Vérifie l'autorisation (allowance) accordée au contrat multisig pour manipuler les fonds de l'utilisateur
    const checkAllowance = async (ownerAddress: string): Promise<void> => {
        try {
            if (!tokenContract) {
                console.error("❌ Token contract non initialisé !");
                return;
            }
            if (!MULTISIG_CONTRACT_ADDRESS) {
                console.error("❌ Adresse du contrat multisig invalide !");
                return;
            }

            const resolvedAddress = Array.isArray(ownerAddress) ? ownerAddress[0] : ownerAddress;

            const rawAllowance = await tokenContract.allowance(resolvedAddress, MULTISIG_CONTRACT_ADDRESS);
            const decimals = await tokenContract.decimals();

            setAllowance(ethers.formatUnits(rawAllowance, decimals));
        } catch (error) {
            console.error("❌ Error checking allowance:", error);
        }
    };

    // 🔹 Connexion au wallet via MetaMask et récupération des comptes disponibles
    const connectWallet = async (): Promise<void> => {
        try {
            if (!window.ethereum) {
                setStatus("❌ MetaMask non détecté. Installez-le pour continuer !");
                return;
            }
            const accs = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];

            if (accs.length === 0) {
                throw new Error("❌ Aucun compte détecté. Connectez-vous à MetaMask.");
            }

            setAccounts(accs);
            setAccount(accs[0]);
            await checkBalance(accs[0]);
            await checkOwner(accs[0]);
            await checkAllowance(accs[0]);
            await checkMultisigConfirmations();

            window.ethereum.on('accountsChanged', handleAccountsChanged);
        } catch (error) {
            console.error("Erreur lors de la connexion :", error);
            setStatus(`❌ Erreur connexion wallet : ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // 🔹 Gère les changements de compte MetaMask et met à jour l'état de l'application
    const handleAccountsChanged = async (selectedAddress: string) => {
        if (!selectedAddress) {
            setStatus('Please connect to MetaMask.');
        } else {
            setAccount(selectedAddress);
            await checkBalance(selectedAddress);
            await checkOwner(selectedAddress);
            await checkAllowance(selectedAddress);
        }
    };

    useEffect(() => {
        const handleAccountsChange = async (accounts: string[]) => {
            if (accounts.length > 0) {
                setAccounts(accounts);
                setAccount(accounts[0]);
                await checkBalance(accounts[0]);
                await checkOwner(accounts[0]);
                await checkAllowance(accounts[0]);
            } else {
                setAccounts([]);
                setAccount("");
            }
        };

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', handleAccountsChange);
            window.ethereum.request({ method: 'eth_accounts' })
                .then(handleAccountsChange);
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChange);
            }
        };
    }, []);

    // 🔹 Vérifie le solde de l'utilisateur pour le token PG42
    const checkBalance = async (address: string): Promise<void> => {
        try {
            if (!tokenContract) {
                console.error("❌ Token contract non initialisé !");
                return;
            }
            if (!ethers.isAddress(address)) {
                console.error("❌ Adresse invalide :", address);
                return;
            }

            const [rawBalance, rawDecimals] = await Promise.all([
                tokenContract.balanceOf(address),
                tokenContract.decimals()
            ]);

            setBalance(ethers.formatUnits(rawBalance, rawDecimals));
        } catch (error) {
            console.error("❌ Error fetching balance:", error);
            setBalance("0");
        }
    };

    // 🔹 Vérifie si l'utilisateur est propriétaire du token ou propriétaire multisig
    const checkOwner = async (address: string): Promise<void> => {
        try {
            if (!tokenContract) {
                console.error("❌ Token contract non initialisé !");
                return;
            }

            const tokenOwner = await tokenContract.owner();
            setIsOwner(tokenOwner.toLowerCase() === address.toLowerCase());

            if (!MULTISIG_CONTRACT_ADDRESS) {
                console.error("❌ Adresse du contrat multisig invalide !");
                return;
            }

            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const multisigContract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                provider
            ) as unknown as MultisigContract;

            const isOwnerMultisig = await multisigContract.isOwner(address);
            setIsMultisigOwner(isOwnerMultisig);
        } catch (error) {
            console.error("❌ Error checking owner:", error);
        }
    };

    // 🔹 Gère l'envoi de tokens via un transfert direct, une récompense ou une transaction multisig
    const handleTransaction = async (): Promise<void> => {
        try {
            if (!window.ethereum) throw new Error("❌ MetaMask non installé");
            if (!ethers.isAddress(recipient)) throw new Error("❌ Adresse du destinataire invalide");
            if (!amount || isNaN(Number(amount)) || parseFloat(amount) <= 0) {
                throw new Error("❌ Montant invalide");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            let tx: ethers.ContractTransactionResponse;

            if (transactionMode === "multisig" && !isMultisigOwner) {
                throw new Error("❌ Seuls les propriétaires multisig peuvent soumettre une transaction");
            }

            switch (transactionMode) {
                case "transfer":
                    tx = await handleTransfer(signer);
                    break;
                case "reward":
                    if (!isOwner) throw new Error("❌ Seul le propriétaire peut envoyer une récompense");
                    tx = await handleReward(signer);
                    break;
                case "multisig":
                    tx = await handleMultisig(signer);
                    break;
                default:
                    throw new Error("❌ Mode de transaction invalide");
            }

            setStatus(`⏳ Transaction ${transactionMode} soumise...`);

            const normalizedTransactionMode = transactionMode.charAt(0).toUpperCase() + transactionMode.slice(1) as "Transfer" | "Reward" | "Multisig";

            addTransaction(tx.hash, normalizedTransactionMode);
            await tx.wait();
            await checkBalance(account);
            setStatus(`✅ Transaction ${transactionMode} réussie !`);
        } catch (error) {
            console.error(`Erreur ${transactionMode} :`, error);
            setStatus(`❌ Erreur : ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    // 🔹 Gère un transfert de tokens classique vers un destinataire
    const handleTransfer = async (signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> => {
        const contract = new ethers.Contract(
            PG42_ADDRESS,
            ["function transfer(address to, uint256 value) returns (bool)", "function decimals() view returns (uint8)"],
            signer
        ) as unknown as TokenContract;

        const decimals = (await contract.decimals()) as number;
        return contract.transfer(recipient, ethers.parseUnits(amount, decimals));
    };

    // 🔹 Gère l'envoi de récompenses uniquement par le propriétaire du token
    const handleReward = async (signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> => {
        const contract = new ethers.Contract(
            PG42_ADDRESS,
            ["function reward(address recipient, uint256 amount)", "function decimals() view returns (uint8)"],
            signer
        ) as unknown as TokenContract;

        const decimals = (await contract.decimals()) as number;
        return contract.reward(recipient, ethers.parseUnits(amount, decimals));
    };


    // 🔹 Vérifie combien de confirmations sont nécessaires pour exécuter une transaction multisig
    const checkMultisigConfirmations = async (): Promise<void> => {
        try {
            if (!MULTISIG_CONTRACT_ADDRESS) {
                console.error("❌ Adresse du contrat multisig invalide !");
                return;
            }

            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const multisigContract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                provider
            ) as unknown as MultisigContract;

            const required = await multisigContract.required();
            setRequiredConfirmations(Number(required));
        } catch (error) {
            console.error("Error checking required confirmations:", error);
        }
    };

    // 🔹 Gère la soumission d'une transaction multisig, avec approbation préalable du contrat
    const handleMultisig = async (signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> => {
        try {
            const tokenContract = new ethers.Contract(
                PG42_ADDRESS,
                TOKEN_ABI,
                signer
            ) as unknown as TokenContract;

            const multisigContract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                signer
            ) as unknown as MultisigContract;

            const decimals = (await tokenContract.decimals()) as number;
            const amountInWei = ethers.parseUnits(amount, decimals);

            const signerAddress = await signer.getAddress();

            const tokenInterface = new ethers.Interface([
                ...TOKEN_ABI,
                "function transferFrom(address from, address to, uint256 value) returns (bool)"
            ]);
            const transferData = tokenInterface.encodeFunctionData("transferFrom", [
                signerAddress,
                recipient,
                amountInWei
            ]);

            const approveTx = await tokenContract.approve(MULTISIG_CONTRACT_ADDRESS, amountInWei);
            await approveTx.wait();

            const tx = await multisigContract.submitTransaction(
                PG42_ADDRESS,
                0,
                transferData
            );

            const receipt = await tx.wait();

            if (receipt?.logs && receipt.logs.length > 0) {
                try {
                    const txIndex = Number(receipt.logs[0].topics[1]);
                    setMultisigTxIndex(txIndex);

                    const [required, txInfo] = await Promise.all([
                        multisigContract.required(),
                        multisigContract.transactions(txIndex) as unknown as Promise<[string, bigint, string, boolean, bigint]>
                    ]);

                    setRequiredConfirmations(Number(required));
                    setCurrentConfirmations(Number(txInfo[4]));
                } catch (error) {
                    console.error("Error getting transaction details:", error);
                }
            }

            return tx;
        } catch (error) {
            console.error("Multisig transaction failed:", error);
            throw error;
        }
    };

    // 🔹 Confirme une transaction multisig en tant que propriétaire
    const confirmMultisigTransaction = async (ownerAddress: string): Promise<void> => {
        try {
            if (multisigTxIndex === null) throw new Error("❌ Aucune transaction multisig à confirmer.");
            if (!window.ethereum) throw new Error("❌ MetaMask non installé.");

            if (!OWNERS.some(owner => owner.address.toLowerCase() === ownerAddress.toLowerCase())) {
                throw new Error("❌ Vous devez être un propriétaire pour confirmer cette transaction.");
            }

            console.log(`🔍 Vérification en cours pour l'owner: ${ownerAddress}`);

            await window.ethereum.request({
                method: "wallet_requestPermissions",
                params: [{ eth_accounts: {} }],
            });

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const activeAccount = await signer.getAddress();

            if (activeAccount.toLowerCase() !== ownerAddress.toLowerCase()) {
                throw new Error(`❌ Veuillez basculer sur le bon compte propriétaire : ${ownerAddress}`);
            }

            console.log(`✅ Compte actif validé: ${activeAccount}`);

            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                signer
            ) as unknown as MultisigContract;

            const txInfo = await contract.transactions(multisigTxIndex) as [string, bigint, string, boolean, bigint];
            const confirmationsCount = Number(txInfo[4]);
            const alreadyExecuted = txInfo[3];

            console.log(`🔍 Transaction #${multisigTxIndex} - Confirmations actuelles: ${confirmationsCount}/${requiredConfirmations}`);

            if (alreadyExecuted) {
                throw new Error("❌ Cette transaction est déjà exécutée.");
            }

            console.log(`⏳ Confirmation en cours par ${ownerAddress}...`);
            const confirmTx = await contract.confirmTransaction(multisigTxIndex);
            await confirmTx.wait();

            console.log(`✅ #${multisigTxIndex} confirmée par ${ownerAddress}`);

            setOwnerConfirmations(prevState => ({
                ...prevState,
                [ownerAddress]: true
            }));

            const updatedTxInfo = await contract.transactions(multisigTxIndex) as [string, bigint, string, boolean, bigint];
            const updatedConfirmationsCount = Number(updatedTxInfo[4]);
            const isExecuted = updatedTxInfo[3];

            setCurrentConfirmations(updatedConfirmationsCount);

            setTransactions(prev =>
                prev.map(tx =>
                    tx.txIndex === multisigTxIndex
                        ? {
                            ...tx,
                            numConfirmations: updatedConfirmationsCount,
                            status: isExecuted
                                ? "Executed"
                                : updatedConfirmationsCount >= requiredConfirmations
                                    ? "Confirmed"
                                    : "Pending"
                        }
                        : tx
                )
            );

            if (updatedConfirmationsCount >= requiredConfirmations && !isExecuted) {
                try {
                    console.log(`⚡️ Exécution de la transaction #${multisigTxIndex}...`);
                    const executeTx = await contract.executeTransaction(multisigTxIndex);
                    await executeTx.wait();

                    console.log(`✅ Transaction #${multisigTxIndex} exécutée avec succès !`);
                    setStatus("✅ Transaction multisig exécutée avec succès !");
                    await checkBalance(activeAccount);

                    setTransactions(prev =>
                        prev.map(tx =>
                            tx.txIndex === multisigTxIndex ? { ...tx, status: "Executed" } : tx
                        )
                    );
                } catch (execError) {
                    console.error("⚠️ Échec de l'exécution :", execError);
                    setStatus(`Transaction confirmée (${updatedConfirmationsCount}/${requiredConfirmations} confirmations), mais l'exécution a échoué.`);
                }
            } else {
                setStatus(`Transaction confirmée (${updatedConfirmationsCount}/${requiredConfirmations} confirmations)`);
            }
        } catch (error) {
            console.error("❌ Erreur lors de la confirmation multisig :", error);
            setStatus(`❌ ${error instanceof Error ? error.message : String(error)}`);
        }
    };


    // 🔹 Ajoute une transaction à l'historique et met à jour son statut en fonction du nombre de confirmations
    const addTransaction = async (hash: string, type: Transaction['type'], txIndex?: number): Promise<void> => {
        let status: Transaction['status'] = "Pending";
        let numConfirmations = 0;
        let requiredConfirmations = 0;

        if (type === "Multisig" && txIndex !== undefined) {
            try {
                const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
                const contract = new ethers.Contract(
                    MULTISIG_CONTRACT_ADDRESS,
                    MULTISIG_ABI,
                    provider
                ) as unknown as MultisigContract;

                const txInfo = await contract.transactions(txIndex) as [string, bigint, string, boolean, bigint];

                numConfirmations = Number(txInfo[4]);
                requiredConfirmations = Number(await contract.required());
                const executed = txInfo[3];

                if (executed) {
                    status = "Executed";
                } else if (numConfirmations >= requiredConfirmations) {
                    status = "Confirmed";
                }
            } catch (error) {
                console.error("Erreur lors de la récupération du statut de la transaction multisig:", error);
            }
        }

        const newTx: Transaction = {
            hash,
            from: account,
            to: recipient,
            value: amount,
            type,
            status,
            txIndex,
            numConfirmations,
            requiredConfirmations
        };

        setTransactions(prev => [newTx, ...prev]);
        setTimeout(() => confirmTransaction(hash), 15000);
    };

    // 🔹 Vérifie si une transaction sur la blockchain a été confirmée et met à jour son statut
    const confirmTransaction = async (hash: string): Promise<void> => {
        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const receipt = await provider.getTransactionReceipt(hash);
            if (receipt && receipt.status === 1) {
                setTransactions(prev =>
                    prev.map(tx => tx.hash === hash ? { ...tx, status: "Confirmed" } : tx)
                );
            }
        } catch (error) {
            console.error("Error confirming transaction:", error);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-4">
            {/* Card Wallet */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wallet className="w-6 h-6" />
                        PG42 Token Interface
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!account ? (
                        <button
                            onClick={connectWallet}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex flex-col space-y-2">
                                <p className="text-sm break-all">Connected: {account}</p>
                                <div className="flex items-center gap-2">
                                    <Coins className="w-5 h-5" />
                                    <span className="font-medium">{balance} PG42</span>
                                    <button
                                        onClick={() => checkBalance(account)}
                                        className="text-blue-500 text-sm hover:underline"
                                    >
                                        Refresh
                                    </button>
                                </div>
                                {accounts.length > 0 && (
                                    <div className="mt-4 p-4 bg-gray-50 rounded">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Switch Owner Account
                                        </label>
                                        <select
                                            className="w-full p-2 border rounded"
                                            value={account}
                                            onChange={(e) => handleAccountsChanged(e.target.value)}
                                        >
                                            {accounts.map((acc) => {
                                                let label = "";
                                                if (acc === "0x3794e29d7Fb16319b169Ee4ED52Dfc6F2b090E15") {
                                                    label = "Owner 1 (Deployer)";
                                                } else if (acc === "0xa92776Bb2DE972f367305A85D0354554E28a9E8f") {
                                                    label = "Owner 2";
                                                } else if (acc === "0xc134b8048d6b066684840aDa9bDbAf023DA62C97") {
                                                    label = "Owner 3";
                                                } else {
                                                    label = `${acc.slice(0, 6)}...${acc.slice(-4)}`;
                                                }
                                                return (
                                                    <option key={acc} value={acc}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600">
                                                Current account role: {isMultisigOwner ? "Multisig Owner" : "Not an owner"}
                                            </p>
                                            {isMultisigOwner && multisigTxIndex !== null && (
                                                <p className="text-sm text-green-600">
                                                    Can confirm transaction #{multisigTxIndex}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {transactionMode === "multisig" && (
                                <div className="mt-2 text-sm">
                                    <p className="text-gray-600">Current Allowance: {allowance} PG42</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Card Transaction Type & Form */}
            <Card>
                <CardContent className="pt-6">
                    {/* Transaction Type Buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        <button
                            onClick={() => setTransactionMode("transfer")}
                            className={`p-2 rounded flex items-center justify-center gap-2 ${transactionMode === "transfer" ? "bg-blue-500 text-white" : "bg-gray-100"
                                }`}
                        >
                            <Send className="w-4 h-4" /> Transfer
                        </button>
                        <button
                            onClick={() => setTransactionMode("reward")}
                            className={`p-2 rounded flex items-center justify-center gap-2 ${!isOwner ? "opacity-50 cursor-not-allowed" :
                                transactionMode === "reward" ? "bg-blue-500 text-white" : "bg-gray-100"
                                }`}
                            disabled={!isOwner}
                        >
                            <Shield className="w-4 h-4" /> Reward
                        </button>
                        <button
                            onClick={() => setTransactionMode("multisig")}
                            className={`p-2 rounded flex items-center justify-center gap-2 ${!isMultisigOwner ? "opacity-50 cursor-not-allowed" :
                                transactionMode === "multisig" ? "bg-blue-500 text-white" : "bg-gray-100"
                                }`}
                            disabled={!isMultisigOwner}
                        >
                            <Users className="w-4 h-4" /> Multisig
                        </button>
                    </div>

                    {/* Transaction Form */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Recipient Address"
                            className="w-full p-2 border rounded"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            autoComplete="off"
                            data-form-type="other"
                        />
                        <input
                            type="text"
                            placeholder="Amount"
                            className="w-full p-2 border rounded"
                            value={amount}
                            onChange={(e) => {
                                if (!isNaN(Number(e.target.value)) && Number(e.target.value) >= 0) {
                                    setAmount(e.target.value);
                                }
                            }}
                            autoComplete="off"
                            data-form-type="other"
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleTransaction}
                                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                {transactionMode === "multisig" ? "Submit Multisig" :
                                    transactionMode === "reward" ? "Reward Tokens" : "Transfer Tokens"}
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Message */}
            {status && (
                <div className={`p-4 rounded 
        ${status.startsWith("✅") ? "bg-green-100 text-green-800" :
                        status.startsWith("⏳") ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"}`}>
                    {status}
                </div>
            )}

            {/* Multisig Details Card */}
            {transactionMode === "multisig" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Multisig Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {multisigTxIndex !== null && (
                                <>
                                    <div className="bg-blue-50 p-4 rounded">
                                        <p className="font-medium">Transaction #{multisigTxIndex}</p>
                                        <p className="text-sm">
                                            Confirmations : {currentConfirmations}/{requiredConfirmations}
                                        </p>
                                    </div>

                                    <h3 className="text-sm font-medium mb-2">Confirmations des propriétaires</h3>
                                    <div className="space-y-2">
                                        {OWNERS.map((owner) => (
                                            <div key={owner.address} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div>
                                                    <p className="font-medium text-sm">{owner.label}</p>
                                                    <p className="text-xs text-gray-500">{owner.address}</p>
                                                </div>
                                                <button
                                                    onClick={() => confirmMultisigTransaction(owner.address)}
                                                    className={`px-3 py-1 rounded text-sm ${ownerConfirmations[owner.address] ? "bg-green-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                                                        }`}
                                                    disabled={ownerConfirmations[owner.address]}
                                                >
                                                    {ownerConfirmations[owner.address] ? "Confirmed" : "Confirm"}
                                                </button>
                                            </div>
                                        ))}


                                    </div>

                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

            )}

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {transactions.map((tx, index) => (
                            <div key={tx.hash || index} className="p-4 border rounded">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">{tx.type}</span>
                                    <span className={`px-2 py-1 rounded ${tx.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                                        tx.status === "Confirmed" ? "bg-green-100 text-green-800" :
                                            "bg-green-500 text-white"}`}>
                                        {tx.status}
                                    </span>
                                </div>
                                <p className="text-sm">Amount: {tx.value} PG42</p>
                                <a
                                    href={`https://testnet.bscscan.com/tx/${tx.hash}`}
                                    className="text-blue-500 text-sm hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View on BscScan
                                </a>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default TokenInterface;