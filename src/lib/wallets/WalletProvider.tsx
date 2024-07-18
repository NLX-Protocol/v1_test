import React from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets, darkTheme, RainbowKitProvider, Theme, WalletList } from "@rainbow-me/rainbowkit";
import {
  ledgerWallet,
  safeWallet,
  rabbyWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  imTokenWallet,
  zerionWallet,
  okxWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { configureChains, createClient, WagmiConfig } from "wagmi";
// import { arbitrum, arbitrumGoerli, avalanche, avalancheFuji } from "wagmi/chains";
import { publicProvider } from "wagmi/providers/public";
import merge from "lodash/merge";
// import { isDevelopment } from "config/env";
import { coreWallet } from "./connecters/core/coreWallet";
import { bitgetWallet } from "./connecters/bitgetWallet/bitgetWallet";
import binanceWallet from "./connecters/binanceW3W/binanceWallet";

const coreMainnet = {
  id: 1116, // replace with your custom chain ID
  name: "Core Blockchain Mainnet",
  network: "core-mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "CORE",
    symbol: "CORE",
  },
  rpcUrls: {
    default: {
      http: ["https://nlxrpc.up.railway.app/api/"],
    },
    public: {
      http: ["https://nlxrpc.up.railway.app/api/"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Core Scan",
      url: "https://scan.coredao.org",
    },
    default: {
      name: "Core Scan",
      url: "https://scan.coredao.org",
    },
  },
  // contracts: {
  //   multicall3: {
  //     address: "0xcustomMulticallAddress",
  //     blockCreated: 1234567,
  //   },
  // },
};

// const localhost = {
//   id: 31337, // replace with your custom chain ID
//   name: "Core Localhost",
//   network: "localhost",
//   nativeCurrency: {
//     decimals: 18,
//     name: "CORE",
//     symbol: "CORE",
//   },
//   rpcUrls: {
//     default: {
//       http: ["http://127.0.0.1:8545"],
//     },
//     public: {
//       http: ["http://127.0.0.1:8545"],
//     },
//   },
//   blockExplorers: {
//     etherscan: {
//       name: "Core Scan",
//       url: "https://scan.coredao.org",
//     },
//     default: {
//       name: "Core Scan",
//       url: "https://scan.coredao.org",
//     },
//   },
//   // contracts: {
//   //   multicall3: {
//   //     address: "0xcustomMulticallAddress",
//   //     blockCreated: 1234567,
//   //   },
//   // },
// };

const WALLET_CONNECT_PROJECT_ID = "de24cddbaf2a68f027eae30d9bb5df58";
const APP_NAME = "GMX";

const walletTheme = merge(darkTheme(), {
  colors: {
    modalBackground: "#191919",
    accentColor: "#9da5f2",
    menuItemBackground: "#808aff14",
  },
  radii: {
    modal: "4px",
    menuButton: "4px",
  },
} as Theme);

const { chains, provider } = configureChains(
  [ coreMainnet],
  [publicProvider()]
);

const recommendedWalletList: WalletList = [
  {
    groupName: "Recommended",
    wallets: [
      injectedWallet({ chains }),
      safeWallet({ chains }),
      rabbyWallet({ chains }),
      metaMaskWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      walletConnectWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
    ],
  },
];

const othersWalletList: WalletList = [
  {
    groupName: "Others",
    wallets: [
      coreWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      coinbaseWallet({ appName: APP_NAME, chains }),
      binanceWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      okxWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      ledgerWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      rainbowWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      bitgetWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      zerionWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
      imTokenWallet({ chains, projectId: WALLET_CONNECT_PROJECT_ID }),
    ],
  },
];

const connectors = connectorsForWallets([...recommendedWalletList, ...othersWalletList]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

export default function WalletProvider({ children }) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider theme={walletTheme} chains={chains} modalSize="compact">
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
