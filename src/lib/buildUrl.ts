import queryString from "query-string";
import { CHART_PERIODS, PYTH_CHART_RESOLUTIONS } from "./legacy";
import { Token } from "domain/tokens";

export function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | boolean | undefined>) {
  const qs = query ? `?${queryString.stringify(query)}` : "";

  return `${baseUrl}${path}${qs}`;
}

export function buildPythUrl(query: Record<string, string | number | boolean | undefined>) {
  const baseUrl = "https://benchmarks.pyth.network/v1/shims/tradingview/history";
  //5m
  let timeAgo = CHART_PERIODS[query.period as string] * 1000
  let from = Math.floor((new Date().getTime() - timeAgo) / 1000)
  let to = Math.floor(new Date().getTime() / 1000);
  let resolution = PYTH_CHART_RESOLUTIONS[query.period as string];

  query = {
    symbol: `Crypto.${query!.tokenSymbol}/USD`,
    from,
    to,
    resolution
  }

  const qs = query ? `?${queryString.stringify(query)}` : "";

  return `${baseUrl}${qs}`;
}

export function buildPythUrl24Hours(tokens: Token[]) {
  return tokens.map((token) => {

    const baseUrl = "https://benchmarks.pyth.network/v1/shims/tradingview/history";
    //5m
    let timeAgo = 60 * 60 * 24 * 1000
    let from = Math.floor((new Date().getTime() - timeAgo) / 1000)
    let to = Math.floor(new Date().getTime() / 1000);
    let resolution = "D";
    const query = {
      symbol: `Crypto.${token.symbol}/USD`,
      from,
      to,
      resolution
    }

    const qs = query ? `?${queryString.stringify(query)}` : "";

    return { queryUrl: `${baseUrl}${qs}`, tokenSymbol: token.symbol };
  })
}