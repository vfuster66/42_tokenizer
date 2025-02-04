import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import path from "path";

// Charge `.env` depuis `deployment/`
dotenv.config({ path: path.resolve(__dirname, "../deployment/.env") });

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    }
  },
  etherscan: {
    apiKey: process.env.BSCSCAN_API_KEY || "",
  }
};

export default config;
