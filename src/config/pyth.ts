import DataStore from "abis/DataStore.json";
import Token from "abis/Token.json";
import { TOKENS_MAP } from "./tokens";
import { priceFeedIdKey } from "./dataStore";
import { Contract } from "ethers";
import { getContract } from "./contracts";
import { bigNumberify, expandDecimals } from "lib/numbers";
import { PRECISION } from "lib/legacy";
import { getProvider } from "lib/rpc";

export async function getPythTokenPrices(chainId: number, ) {

    const dataStoreAddress = getContract(chainId, "DataStore");

    const dataStore = new Contract(dataStoreAddress, DataStore.abi, getProvider(undefined,chainId));

    const prices = await Promise.all(Object.values(TOKENS_MAP[chainId]).map(async (token) => {
        try {


            const priceFeedId = await dataStore.getBytes32(priceFeedIdKey(token.address))
            // console.log(constants.AddressZero)
            if (priceFeedId !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
                //fetch price
                const primaryRPC = `${process.env.REACT_APP_PYTH_HERMES}/latest_price_feeds?ids[]=${priceFeedId}`;
                const fallbackRPC = `https://hermes.pyth.network/api/latest_price_feeds?ids[]=${priceFeedId}`;
                let response;

                try {
                  response = await fetch(primaryRPC).then(res => res.json());
                } catch (error) {
                  // eslint-disable-next-line no-console
                  console.error("Primary RPC failed, attempting fallback RPC:", error);
                  try {
                    response = await fetch(fallbackRPC).then(res => res.json());
                  } catch (fallbackError) {
                    // eslint-disable-next-line no-console
                    console.error("Fallback RPC also failed:", fallbackError);
                    // Handle the case where both RPCs fail
                  }
                }


                const price = response[0].price;
                const pythPricePrecision = expandDecimals(1, Math.abs(price!.expo));
                
                let decimals = 0
                if (token.isSynthetic) {

                    decimals = token.decimals;

                } else {

                    const ERC20Contract = new Contract(token.address, Token.abi, getProvider(undefined,chainId));
                    decimals = await ERC20Contract.decimals();

                }

                const currentPrice = bigNumberify(price?.price)?.mul(PRECISION).div(pythPricePrecision);

                const actualPrice = currentPrice!
                    .mul(10_000)
                    .div(10_000)
                    .div(expandDecimals(1, decimals));


                return {
                    tokenAddress: token.address,
                    minPrice: actualPrice,
                    maxPrice: actualPrice,
                    updatedAt: price.publish_time,
                    priceFeedId,
                    tokenSymbol: token.symbol
                };
            }

        } catch (error) {
            return null;
        }
    }))
    return prices.filter((price) => price !== null)
}