import CustomErrors from "abis/CustomErrors.json";
import { ARBITRUM, ARBITRUM_GOERLI, AVALANCHE, AVALANCHE_FUJI, CORE_TESTNET, getFallbackRpcUrl, getRpcUrl } from "config/chains";
import { PublicClient, createPublicClient, http } from "viem";
import { arbitrum, arbitrumGoerli, avalanche, avalancheFuji } from "viem/chains";
import { MulticallRequestConfig, MulticallResult } from "./types";

import { sleep } from "lib/sleep";
import { Signer } from "ethers";

export const MAX_TIMEOUT = 20000;

const coreTestnet = {
  id: 1115, // replace with your custom chain ID
  name: "Core Blockchain Testnet",
  network: "core-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Testnet CORE",
    symbol: "tCORE",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.test.btcs.network"],
    },
    public: {
      http: ["https://rpc.test.btcs.network"],
    },
  },
  blockExplorers: {
    etherscan: {
      name: "Custom Explorer",
      url: "https://scan.test.btcs.network",
    },
    default: {
      name: "Custom Explorer",
      url: "https://scan.test.btcs.network",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 15979981,
    },
  },
  testnet: true, // set to true if it's a testnet
};


// const localhost = {
//   id: 31337, // replace with your custom chain ID
//   name: "Core Blockchain Mainnet",
//   network: "core-mainnet",
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
//       name: "Custom Explorer",
//       url: "https://scan.coredao.org/",
//     },
//     default: {
//       name: "Custom Explorer",
//       url: "https://scan.coredao.org/",
//     },
//   },
//   contracts: {
//     multicall3: {
//       address: "0x44EB7b229456600Dc91088bDD163aD60F5148CfB",
//       blockCreated: 15979981,
//     },
//   },
//   testnet: false, // set to true if it's a testnet
// };
const CHAIN_BY_CHAIN_ID = {
  [AVALANCHE_FUJI]: avalancheFuji,
  [ARBITRUM_GOERLI]: arbitrumGoerli,
  [ARBITRUM]: arbitrum,
  [AVALANCHE]: avalanche,
  [CORE_TESTNET]: coreTestnet,
  // [LOCALHOST]: localhost
};

const BATCH_CONFIGS = {
  [ARBITRUM]: {
    http: {
      batchSize: 0, // disable batches, here batchSize is the number of eth_calls in a batch
      wait: 0, // keep this setting in case batches are enabled in future
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024, // here batchSize is the number of bytes in a multicall
        wait: 0, // zero delay means formation of a batch in the current macro-task, like setTimeout(fn, 0)
      },
    },
  },
  [AVALANCHE]: {
    http: {
      batchSize: 0,
      wait: 0,
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024,
        wait: 0,
      },
    },
  },
  [AVALANCHE_FUJI]: {
    http: {
      batchSize: 40,
      wait: 0,
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024,
        wait: 0,
      },
    },
  },
  [ARBITRUM_GOERLI]: {
    http: {
      batchSize: 0,
      wait: 0,
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024,
        wait: 0,
      },
    },
  },
  [CORE_TESTNET]: {
    http: {
      batchSize: 0,
      wait: 0,
    },
    client: {
      multicall: {
        batchSize: 1024 * 1024,
        wait: 0,
      },
    },
  },
};

export async function executeMulticall(
  chainId: number,
  signer: Signer | undefined,
  request: MulticallRequestConfig<any>
) {
  const multicall = await Multicall.getInstance(chainId);

  return multicall?.call(request, MAX_TIMEOUT);
}

export class Multicall {
  static instances: {
    [chainId: number]: Multicall | undefined;
  } = {};

  static async getInstance(chainId: number) {
    let instance = Multicall.instances[chainId];

    if (!instance || instance.chainId !== chainId) {
      const rpcUrl = getRpcUrl(chainId);

      if (!rpcUrl) {
        return undefined;
      }

      instance = new Multicall(chainId, rpcUrl);

      Multicall.instances[chainId] = instance;
    }

    return instance;
  }

  static getViemClient(chainId: number, rpcUrl: string) {
    return createPublicClient({
      transport: http(rpcUrl, {
        // retries works strangely in viem, so we disable them
        retryCount: 0,
        retryDelay: 10000000,
        batch: BATCH_CONFIGS[chainId].http,
      }),
      pollingInterval: undefined,
      batch: BATCH_CONFIGS[chainId].client,
      chain: CHAIN_BY_CHAIN_ID[chainId],
    });
  }

  viemClient: PublicClient;

  constructor(public chainId: number, public rpcUrl: string) {
    this.viemClient = Multicall.getViemClient(chainId, rpcUrl);
  }

  async call(request: MulticallRequestConfig<any>, maxTimeout: number) {
    const originalKeys: {
      contractKey: string;
      callKey: string;
    }[] = [];

    const abis: any = {};

    const encodedPayload: { address: string; abi: any; functionName: string; args: any }[] = [];

    const contractKeys = Object.keys(request);

    contractKeys.forEach((contractKey) => {
      const contractCallConfig = request[contractKey];

      if (!contractCallConfig) {
        return;
      }

      Object.keys(contractCallConfig.calls).forEach((callKey) => {
        const call = contractCallConfig.calls[callKey];

        if (!call) {
          return;
        }

        // Add Errors ABI to each contract ABI to correctly parse errors
        abis[contractCallConfig.contractAddress] =
          abis[contractCallConfig.contractAddress] || contractCallConfig.abi.concat(CustomErrors.abi);

        const abi = abis[contractCallConfig.contractAddress];

        originalKeys.push({
          contractKey,
          callKey,
        });

        encodedPayload.push({
          address: contractCallConfig.contractAddress,
          functionName: call.methodName,
          abi,
          args: call.params,
        });
      });
    });

    const response: any = await Promise.race([
      this.viemClient.multicall({ contracts: encodedPayload as any }),
      sleep(maxTimeout).then(() => Promise.reject(new Error("multicall timeout"))),
    ]).catch((_viemError) => {
      const e = new Error(_viemError.message.slice(0, 150));

      // eslint-disable-next-line no-console
      console.groupCollapsed("multicall error:");
      // eslint-disable-next-line no-console
      console.error(e);
      // eslint-disable-next-line no-console
      console.groupEnd();

      const rpcUrl = getFallbackRpcUrl(this.chainId);

      if (!rpcUrl) {
        throw e;
      }

      const fallbackClient = Multicall.getViemClient(this.chainId, rpcUrl);

      // eslint-disable-next-line no-console
      console.log(`using multicall fallback for chain ${this.chainId}`);

      return fallbackClient.multicall({ contracts: encodedPayload as any }).catch((_viemError) => {
        const e = new Error(_viemError.message.slice(0, 150));
        // eslint-disable-next-line no-console
        console.groupCollapsed("multicall fallback error:");
        // eslint-disable-next-line no-console
        console.error(e);
        // eslint-disable-next-line no-console
        console.groupEnd();

        throw e;
      });
    });

    const multicallResult: MulticallResult<any> = {
      success: true,
      errors: {},
      data: {},
    };

    response.forEach(({ result, status, error }, i) => {
      const { contractKey, callKey } = originalKeys[i];

      if (status === "success") {
        let values: any;

        if (Array.isArray(result) || typeof result === "object") {
          values = result;
        } else {
          values = [result];
        }

        multicallResult.data[contractKey] = multicallResult.data[contractKey] || {};
        multicallResult.data[contractKey][callKey] = {
          contractKey,
          callKey,
          returnValues: values,
          success: true,
        };
      } else {
        multicallResult.success = false;

        multicallResult.errors[contractKey] = multicallResult.errors[contractKey] || {};
        multicallResult.errors[contractKey][callKey] = error;

        multicallResult.data[contractKey] = multicallResult.data[contractKey] || {};
        multicallResult.data[contractKey][callKey] = {
          contractKey,
          callKey,
          returnValues: [],
          success: false,
          error: error,
        };
      }
    });

    return multicallResult;
  }
}