import { getOracleKeeperNextIndex, getOracleKeeperUrl } from "config/oracleKeeper";
import { getNormalizedTokenSymbol, getTokens } from "config/tokens";
import { useSettings } from "context/SettingsContext/SettingsContextProvider";
import { timezoneOffset } from "domain/prices";
import { Bar } from "domain/tradingview/types";
import { buildPythUrl, buildPythUrl24Hours, buildUrl } from "lib/buildUrl";
import { useLocalStorageSerializeKey } from "lib/localStorage";
import { useMemo } from "react";

export type TickersResponse = {
  minPrice: string;
  maxPrice: string;
  oracleDecimals: number;
  tokenSymbol: string;
  tokenAddress: string;
  updatedAt: number;
}[];

export type DayPriceCandle = {
  tokenSymbol: string;
  high: number;
  low: number;
  open: number;
  close: number;
};

export type RawIncentivesStats = {
  lp: {
    isActive: boolean;
    totalRewards: string;
    period: number;
    rewardsPerMarket: Record<string, string>;
  };
  migration: {
    isActive: boolean;
    maxRebateBps: number;
    period: number;
  };
  trading:
  | {
    isActive: true;
    rebatePercent: number;
    allocation: string;
    period: number;
  }
  | {
    isActive: false;
  };
};

export type OracleKeeperFetcher = ReturnType<typeof useOracleKeeperFetcher>;

function parseOracleCandle(rawCandle: number[]): Bar {
  const [timestamp, open, high, low, close] = rawCandle;

  return {
    time: timestamp + timezoneOffset,
    open,
    high,
    low,
    close,
  };
}

let fallbackThrottleTimerId: any;

export function useOracleKeeperFetcher(chainId: number) {
  const { oracleKeeperInstancesConfig, setOracleKeeperInstancesConfig } = useSettings();
  const oracleKeeperIndex = oracleKeeperInstancesConfig[chainId];
  const oracleKeeperUrl = getOracleKeeperUrl(chainId, oracleKeeperIndex);
  const [forceIncentivesActive] = useLocalStorageSerializeKey("forceIncentivesActive", false);

  return useMemo(() => {
    const switchOracleKeeper = () => {
      if (fallbackThrottleTimerId) {
        return;
      }

      const nextIndex = getOracleKeeperNextIndex(chainId, oracleKeeperIndex);

      if (nextIndex === oracleKeeperIndex) {
        // eslint-disable-next-line no-console
        console.error(`no available oracle keeper for chain ${chainId}`);
        return;
      }

      // eslint-disable-next-line no-console
      console.log(`switch oracle keeper to ${getOracleKeeperUrl(chainId, nextIndex)}`);

      setOracleKeeperInstancesConfig((old) => {
        return { ...old, [chainId]: nextIndex };
      });

      fallbackThrottleTimerId = setTimeout(() => {
        fallbackThrottleTimerId = undefined;
      }, 5000);
    };

    function fetchTickers(): Promise<TickersResponse> {
      return fetch(buildUrl(oracleKeeperUrl!, "/prices/tickers"))
        .then((res) => res.json())
        .then((res) => {
          if (!res.length) {
            throw new Error("Invalid tickers response");
          }

          return res;
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          switchOracleKeeper();

          throw e;
        });
    }

    async function fetch24hPrices(): Promise<DayPriceCandle[]> {
      const promises = buildPythUrl24Hours(getTokens(chainId)).map((item) => {
        return fetch(item.queryUrl)
          .then((res) => res.json())
          .then((response) => {
            if (response.s === "ok") {
              return {
                close: response.c[0],
                high: response.h[0],
                low: response.l[0],
                open: response.o[0],
                tokenSymbol: item.tokenSymbol,
              } as DayPriceCandle;
            }
          });
      });

      return Promise.all(promises).then((dayPriceCandles) => {
        return dayPriceCandles.filter((candle) => candle !== undefined) as DayPriceCandle[];
      });
    }

    async function fetchOracleCandles(tokenSymbol: string, period: string, limit: number): Promise<Bar[]> {
      tokenSymbol = getNormalizedTokenSymbol(tokenSymbol);

      return fetch(buildPythUrl({ tokenSymbol, period, limit }))
        .then((res) => res.json())
        .then(async (res) => {

          const candles: any[] = []
          // // o, h, l, c

          const { t, o, h, l, c } = res
          t.forEach((timestamp, i) => {
            candles.push([
              timestamp,
              o[i],
              h[i],
              l[i],
              c[i]
            ])
          })


          return candles.sort((a, b)=> b[0] - a[0]).map(parseOracleCandle);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          switchOracleKeeper();
          throw e;
        });
    }

    async function fetchIncentivesRewards(): Promise<RawIncentivesStats | null> {
      return fetch(
        buildUrl(oracleKeeperUrl!, "/incentives/stip", {
          ignoreStartDate: forceIncentivesActive ? "1" : undefined,
        })
      )
        .then((res) => res.json())
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.error(e);
          switchOracleKeeper();
          return null;
        });
    }

    return {
      oracleKeeperUrl,
      fetchTickers,
      fetch24hPrices,
      fetchOracleCandles,
      fetchIncentivesRewards,
    };
  }, [chainId, forceIncentivesActive, oracleKeeperIndex, oracleKeeperUrl, setOracleKeeperInstancesConfig]);
}
