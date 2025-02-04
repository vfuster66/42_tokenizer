import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, Send, Shield, Coins, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/CardComponent';

declare global {
  interface Window {
    ethereum: any;
  }
}

const PG42_ADDRESS = "0xBEaaBEbFf537ea950C3998150C72b7546B10F6bd";
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545";
const MULTISIG_CONTRACT_ADDRESS = "0x72cfC41c3FCA17cC1B1Aa351fF2236339AdD3b2A";

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

interface MultisigTransaction {
    to: string;
    value: bigint;
    data: string;
    executed: boolean;
    numConfirmations: number;
}

interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    type: 'Transfer' | 'Reward' | 'Multisig';
    status: 'Pending' | 'Confirmed';
    txIndex?: number;
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

    const checkAllowance = async (ownerAddress: string): Promise<void> => {
        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const contract = new ethers.Contract(
                PG42_ADDRESS,
                TOKEN_ABI,
                provider
            ) as unknown as TokenContract;

            const currentAllowance = await contract.allowance(ownerAddress, MULTISIG_CONTRACT_ADDRESS);
            const decimals = await contract.decimals();
            setAllowance(ethers.formatUnits(currentAllowance as BigNumberish, decimals));
        } catch (error) {
            console.error("Error checking allowance:", error);
        }
    };

    const connectWallet = async (): Promise<void> => {
        try {
            if (!window.ethereum) {
                setStatus("Please install MetaMask!");
                return;
            }
            const accounts = await window.ethereum.request({ 
                method: "eth_requestAccounts" 
            }) as string[];
            if (accounts.length > 0) {
                setAccount(accounts[0]);
                await checkBalance(accounts[0]);
                await checkOwner(accounts[0]);
                await checkAllowance(accounts[0]);
                await checkMultisigConfirmations();
            }
        } catch (error) {
            console.error("Error connecting wallet:", error);
            setStatus(`Error connecting wallet: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const checkBalance = async (address: string): Promise<void> => {
        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const contract = new ethers.Contract(
                PG42_ADDRESS,
                ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"],
                provider
            );
            const tokenContract = contract as unknown as TokenContract;

            const [rawBalance, decimals] = await Promise.all([
                contract.balanceOf(address),
                contract.decimals()
            ]);

            setBalance(ethers.formatUnits(rawBalance, decimals));
        } catch (error) {
            console.error("Error fetching balance:", error);
            setBalance("0");
        }
    };

    const checkOwner = async (address: string): Promise<void> => {
        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            
            // Check token owner
            const tokenContract = new ethers.Contract(
                PG42_ADDRESS,
                ["function owner() view returns (address)"],
                provider
            ) as unknown as TokenContract;
            const tokenOwner: string = await tokenContract.owner();
            setIsOwner(tokenOwner.toLowerCase() === address.toLowerCase());
            
            // Check multisig owner
            const multisigContract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                ["function isOwner(address) view returns (bool)"],
                provider
            ) as unknown as MultisigContract;
            const isOwnerMultisig = await multisigContract.isOwner(address);
            setIsMultisigOwner(isOwnerMultisig);
        } catch (error) {
            console.error("Error checking owner:", error);
        }
    };

    const handleTransaction = async (): Promise<void> => {
        try {
            if (!window.ethereum) throw new Error("MetaMask not installed");
            if (!ethers.isAddress(recipient)) throw new Error("Invalid recipient address");
            if (!amount || parseFloat(amount) <= 0) throw new Error("Invalid amount");

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            let tx: ethers.ContractTransactionResponse;

            if (transactionMode === 'multisig' && !isMultisigOwner) {
                throw new Error("Only multisig owners can submit transactions");
            }

            switch (transactionMode) {
                case "transfer":
                    tx = await handleTransfer(signer);
                    break;
                case "reward":
                    if (!isOwner) throw new Error("Not authorized - only owner can reward");
                    tx = await handleReward(signer);
                    break;
                case "multisig":
                    tx = await handleMultisig(signer);
                    break;
                default:
                    throw new Error("Invalid transaction mode");
            }

            setStatus(`${transactionMode} transaction submitted`);
            addTransaction(tx.hash, transactionMode);
            await tx.wait();
            await checkBalance(account);
            setStatus(`✅ ${transactionMode} successful!`);
        } catch (error) {
            console.error(`${transactionMode} failed:`, error);
            setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const handleTransfer = async (signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> => {
        const contract = new ethers.Contract(
            PG42_ADDRESS,
            ["function transfer(address to, uint256 value) returns (bool)", "function decimals() view returns (uint8)"],
            signer
        ) as unknown as TokenContract;
        
        const decimals = await contract.decimals();
        return contract.transfer(recipient, ethers.parseUnits(amount, decimals));
    };

    const handleReward = async (signer: ethers.Signer): Promise<ethers.ContractTransactionResponse> => {
        const contract = new ethers.Contract(
            PG42_ADDRESS,
            ["function reward(address recipient, uint256 amount)", "function decimals() view returns (uint8)"],
            signer
        ) as TokenContract;
        
        const decimals = await contract.decimals();
        return contract.reward(recipient, ethers.parseUnits(amount, decimals));
    };

    const checkMultisigConfirmations = async (): Promise<void> => {
        try {
            const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS,
                MULTISIG_ABI,
                provider
            ) as unknown as MultisigContract;

            const required = await contract.required();
            setRequiredConfirmations(Number(required));
        } catch (error) {
            console.error("Error checking required confirmations:", error);
        }
    };

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
    
            // Obtenir les décimales et calculer le montant
            const decimals = await tokenContract.decimals();
            const amountInWei = ethers.parseUnits(amount, decimals);
    
            // Obtenir l'adresse du signataire
            const signerAddress = await signer.getAddress();
    
            // Préparer les données de la transaction transferFrom
            const tokenInterface = new ethers.Interface([
                ...TOKEN_ABI,
                "function transferFrom(address from, address to, uint256 value) returns (bool)"
            ]);
            const transferData = tokenInterface.encodeFunctionData("transferFrom", [
                signerAddress, // from - l'adresse qui a approuvé les tokens
                recipient,     // to - le destinataire
                amountInWei   // montant
            ]);
    
            // 1. Approuver le multisig
            const approveTx = await tokenContract.approve(MULTISIG_CONTRACT_ADDRESS, amountInWei);
            await approveTx.wait();
            
            // 2. Soumettre la transaction multisig
            const tx = await multisigContract.submitTransaction(
                PG42_ADDRESS,   // le contrat token
                0,              // valeur en BNB (0 car nous envoyons des tokens)
                transferData    // données encodées pour transferFrom
            );
    
            const receipt = await tx.wait();
            
            if (receipt?.logs && receipt.logs.length > 0) {
                try {
                    const txIndex = Number(receipt.logs[0].topics[1]);
                    setMultisigTxIndex(txIndex);
                    
                    // Obtenir toutes les informations nécessaires
                    const [required, txInfo] = await Promise.all([
                        multisigContract.required(),
                        multisigContract.transactions(txIndex)
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

    const [totalConfirmations, setTotalConfirmations] = useState<number>(0);
    
    const confirmMultisigTransaction = async (): Promise<void> => {
        try {
            if (multisigTxIndex === null) throw new Error("No transaction to confirm");
            if (!window.ethereum) throw new Error("MetaMask not installed");
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(
                MULTISIG_CONTRACT_ADDRESS, 
                MULTISIG_ABI, 
                signer
            ) as unknown as MultisigContract;
            
            // Récupérer les données de la transaction
            const required = await contract.required();
            const txInfo = await contract.transactions(multisigTxIndex);
            
            // Confirmer la transaction
            const confirmTx = await contract.confirmTransaction(multisigTxIndex);
            await confirmTx.wait();
    
            // Mettre à jour le nombre de confirmations
            const newTxInfo = await contract.transactions(multisigTxIndex);
            const confirmationsCount = Number(newTxInfo[4]); // numConfirmations
            setCurrentConfirmations(confirmationsCount);
            setRequiredConfirmations(Number(required));
            
            if (confirmationsCount >= Number(required)) {
                try {
                    const executeTx = await contract.executeTransaction(multisigTxIndex);
                    await executeTx.wait();
                    setStatus("✅ Multisig transaction executed successfully!");
                    await checkBalance(account);
                } catch (execError) {
                    console.error("Execution failed:", execError);
                    setStatus(`Transaction confirmed (${confirmationsCount}/${required} confirmations)`);
                }
            } else {
                setStatus(`Transaction confirmed (${confirmationsCount}/${required} confirmations)`);
            }
        } catch (error) {
            console.error("Multisig confirmation failed:", error);
            setStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

    const addTransaction = (hash: string, type: Transaction['type']): void => {
        const newTx: Transaction = {
            hash,
            from: account,
            to: recipient,
            value: amount,
            type,
            status: "Pending"
        };
        setTransactions(prev => [newTx, ...prev]);
        setTimeout(() => confirmTransaction(hash), 15000);
    };

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
                  className={`p-2 rounded flex items-center justify-center gap-2 ${
                    transactionMode === "transfer" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                >
                  <Send className="w-4 h-4" /> Transfer
                </button>
                <button
                  onClick={() => setTransactionMode("reward")}
                  className={`p-2 rounded flex items-center justify-center gap-2 ${
                    !isOwner ? "opacity-50 cursor-not-allowed" :
                    transactionMode === "reward" ? "bg-blue-500 text-white" : "bg-gray-100"
                  }`}
                  disabled={!isOwner}
                >
                  <Shield className="w-4 h-4" /> Reward
                </button>
                <button
                  onClick={() => setTransactionMode("multisig")}
                  className={`p-2 rounded flex items-center justify-center gap-2 ${
                    !isMultisigOwner ? "opacity-50 cursor-not-allowed" :
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
                  {transactionMode === "multisig" && multisigTxIndex !== null && (
                    <button
                      onClick={confirmMultisigTransaction}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Confirm Multisig
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
    
          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded ${
              status.startsWith("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
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
                    <div className="space-y-2">
                        {multisigTxIndex !== null && (
                            <div className="bg-blue-50 p-4 rounded">
                                <p className="font-medium">Current Transaction #{multisigTxIndex}</p>
                                <p className="text-sm">
                                    Current Confirmations: {currentConfirmations}/{requiredConfirmations}
                                </p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm text-gray-600">Required Confirmations</p>
                                <p className="font-medium">{requiredConfirmations}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Current Allowance</p>
                                <p className="font-medium">{allowance} PG42</p>
                            </div>
                        </div>
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
              <div key={index} className="p-4 border rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{tx.type}</span>
                  <span className={`px-2 py-1 rounded ${
                    tx.status === "Pending" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                  }`}>
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