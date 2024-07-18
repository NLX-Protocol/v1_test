// import { symbolName } from 'typescript';
import { subscribeOnStream, unsubscribeFromStream } from './streaming.js'

const API_ENDPOINT = 'https://benchmarks.pyth.network/v1/shims/tradingview'

// Use it to keep a record of the most recent bar on the chart
const lastBarsCache = new Map()

const datafeed_pyth =(sym)=> {
  
  const userInput= sym;
  
  return{

  onReady: (callback) => {
    // console.log('[onReady]: Method call')
    fetch(`${API_ENDPOINT}/config`).then((response) => {
      response.json().then((configurationData) => {
        setTimeout(() => callback(configurationData))
      })
    })
  },
  searchSymbols: (exchange, symbolType, onResultReadyCallback) => {
    // console.log('[searchSymbols]: Method call')
    fetch(
      `${API_ENDPOINT}/search?query=${userInput}`
    ).then((response) => {
      response.json().then((data) => {
        onResultReadyCallback(data)
      })
    })
  },

  resolveSymbol: (
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) => {
    // console.log('[resolveSymbol]: Method call', symbolName)
    // fetch(`${API_ENDPOINT}/symbols?symbol=${symbolName}`).then((response) => {
    fetch(`${API_ENDPOINT}/symbols?symbol=${(symbolName==='ETH')? 'ETHUSD':symbolName}`).then((response) => {
      response
        .json()
        .then((symbolInfo) => {
        //   console.log('[resolveSymbol]: Symbol resolved', symbolInfo)
          symbolInfo.pricescale = symbolInfo.name==="COREUSD" ? 10000:100;
          onSymbolResolvedCallback(symbolInfo)
        })
        .catch((error) => {
        //   console.log('[resolveSymbol]: Cannot resolve symbol', symbolName)
          onResolveErrorCallback('Cannot resolve symbol')
          return
        })
    })
  },
  getBars: (
    symbolInfo,
    resolution,
    periodParams,
    onHistoryCallback,
    onErrorCallback
  ) => {
    // const { from, to, firstDataRequest } = periodParams
    const { firstDataRequest } = periodParams
    // console.log('[getBars]: Method call', symbolInfo, resolution, from, to)
    fetch(
      `${API_ENDPOINT}/history?symbol=${symbolInfo.ticker}&from=${periodParams.from}&to=${periodParams.to}&resolution=${resolution}`
    ).then((response) => {
      response
        .json()
        .then((data) => {
          if (data.t.length === 0) {
            onHistoryCallback([], { noData: true })
            return
          }
          const bars = []
          for (let i = 0; i < data.t.length; ++i) {
            bars.push({
              time: data.t[i] * 1000,
              low: data.l[i],
              high: data.h[i],
              open: data.o[i],
              close: data.c[i],
            })
          }
          if (firstDataRequest) {
            lastBarsCache.set(symbolInfo.ticker, {
              ...bars[bars.length - 1],
            })
          }
          onHistoryCallback(bars, { noData: false })
        })
        .catch((error) => {
          // console.log('[getBars]: Get error', error)
          onErrorCallback(error)
        })
    })
  },
  subscribeBars: (
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback
  ) => {
    // console.log(
    //   '[subscribeBars]: Method call with subscriberUID:',
    //   subscriberUID
    // )
    subscribeOnStream(
      symbolInfo,
      resolution,
      onRealtimeCallback,
      subscriberUID,
      onResetCacheNeededCallback,
      lastBarsCache.get(symbolInfo.ticker)
    )
  },
  unsubscribeBars: (subscriberUID) => {
    // console.log(
    //   '[unsubscribeBars]: Method call with subscriberUID:',
    //   subscriberUID
    // )
    unsubscribeFromStream(subscriberUID)
  },
}
}

export default datafeed_pyth;
