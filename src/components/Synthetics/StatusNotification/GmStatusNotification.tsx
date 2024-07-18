import { Trans, t } from "@lingui/macro";
import { TransactionStatus, TransactionStatusType } from "components/TransactionStatus/TransactionStatus";
import { convertTokenAddress } from "config/tokens";
import cx from "classnames";
import {
  PendingDepositData,
  PendingWithdrawalData,
  getPendingDepositKey,
  getPendingWithdrawalKey,
  useSyntheticsEvents,
} from "context/SyntheticsEvents";
import { MarketsInfoData, getMarketIndexName, getMarketPoolName } from "domain/synthetics/markets";
import { TokenData, TokensData } from "domain/synthetics/tokens";
import { useChainId } from "lib/chains";
import { getByKey } from "lib/objects";
import { useEffect, useMemo, useState } from "react";
import { useToastAutoClose } from "./useToastAutoClose";

export type Props = {
  toastTimestamp: number;
  pendingDepositData?: PendingDepositData;
  pendingWithdrawalData?: PendingWithdrawalData;
  marketsInfoData?: MarketsInfoData;
  tokensData?: TokensData;
};

export function GmStatusNotification({
  toastTimestamp,
  pendingDepositData,
  pendingWithdrawalData,
  marketsInfoData,
  tokensData,
}: Props) {
  const { chainId } = useChainId();
  const { depositStatuses, withdrawalStatuses, setDepositStatusViewed, setWithdrawalStatusViewed } =
    useSyntheticsEvents();

  const isDeposit = Boolean(pendingDepositData);

  const [depositStatusKey, setDepositStatusKey] = useState<string>();
  const [withdrawalStatusKey, setWithdrawalStatusKey] = useState<string>();

  const depositStatus = getByKey(depositStatuses, depositStatusKey);
  const withdrawalStatus = getByKey(withdrawalStatuses, withdrawalStatusKey);

  const isCompleted = isDeposit ? Boolean(depositStatus?.executedTxnHash) : Boolean(withdrawalStatus?.executedTxnHash);

  const hasError = isDeposit ? Boolean(depositStatus?.cancelledTxnHash) : Boolean(withdrawalStatus?.cancelledTxnHash);

  const pendingDepositKey = useMemo(() => {
    if (pendingDepositData) {
      return getPendingDepositKey(pendingDepositData);
    }
  }, [pendingDepositData]);

  const pendingWithdrawalKey = useMemo(() => {
    if (pendingWithdrawalData) {
      return getPendingWithdrawalKey(pendingWithdrawalData);
    }
  }, [pendingWithdrawalData]);

  const title = useMemo(() => {
    if (isDeposit) {
      if (!pendingDepositData) {
        return t`Unknown buy NX order`;
      }

      let longToken: TokenData | undefined;
      let shortToken: TokenData | undefined;

      if (pendingDepositData.initialLongTokenAmount.gt(0)) {
        longToken = getByKey(
          tokensData,
          convertTokenAddress(
            chainId,
            pendingDepositData.initialLongTokenAddress,
            pendingDepositData.shouldUnwrapNativeToken ? "native" : "wrapped"
          )
        );
      }

      if (pendingDepositData.initialShortTokenAmount.gt(0)) {
        shortToken = getByKey(
          tokensData,
          convertTokenAddress(
            chainId,
            pendingDepositData.initialShortTokenAddress,
            pendingDepositData.shouldUnwrapNativeToken ? "native" : "wrapped"
          )
        );
      }

      const tokensText = [longToken, shortToken]
        .filter(Boolean)
        .map((token) => token?.symbol)
        .join(" and ");

      const marketInfo = getByKey(marketsInfoData, pendingDepositData.marketAddress);
      const indexName = marketInfo ? getMarketIndexName(marketInfo) : "";
      const poolName = marketInfo ? getMarketPoolName(marketInfo) : "";

      return (
        <Trans>
          <div className="inline-flex">
            Buying NX:&nbsp;<span>{indexName}</span>
            <span className="subtext gm-toast">[{poolName}]</span>
          </div>{" "}
          <span>with {tokensText}</span>
        </Trans>
      );
    } else {
      if (!pendingWithdrawalData) {
        return t`Unknown sell NX order`;
      }

      const marketInfo = getByKey(marketsInfoData, pendingWithdrawalData.marketAddress);
      const indexName = marketInfo ? getMarketIndexName(marketInfo) : "";
      const poolName = marketInfo ? getMarketPoolName(marketInfo) : "";

      return (
        <Trans>
          <div className="inline-flex">
            Selling NX:&nbsp;<span>{indexName}</span>
            <span className="subtext gm-toast">[{poolName}]</span>
          </div>
        </Trans>
      );
    }
  }, [chainId, isDeposit, marketsInfoData, pendingDepositData, pendingWithdrawalData, tokensData]);

  const creationStatus = useMemo(() => {
    let text = "";
    let status: TransactionStatusType = "loading";
    let createdTxnHash: string | undefined;

    if (isDeposit) {
      text = t`Sending Stake request`;
      if (depositStatus?.createdTxnHash) {
        text = t`Stake request sent`;
        status = "success";
        createdTxnHash = depositStatus?.createdTxnHash;
      }
    } else {
      text = t`Sending Unstake request`;

      if (withdrawalStatus?.createdTxnHash) {
        text = t`Unstake request sent`;
        status = "success";
        createdTxnHash = withdrawalStatus?.createdTxnHash;
      }
    }

    return <TransactionStatus status={status} txnHash={createdTxnHash} text={text} />;
  }, [depositStatus?.createdTxnHash, isDeposit, withdrawalStatus?.createdTxnHash]);

  const executionStatus = useMemo(() => {
    let text = "";
    let status: TransactionStatusType = "muted";
    let txnHash: string | undefined;

    if (isDeposit) {
      text = t`Fulfilling Stake request`;

      if (depositStatus?.createdTxnHash) {
        status = "loading";
      }

      if (depositStatus?.executedTxnHash) {
        text = t`Stake order executed`;
        status = "success";
        txnHash = depositStatus?.executedTxnHash;
      }

      if (depositStatus?.cancelledTxnHash) {
        text = t`Stake order cancelled`;
        status = "error";
        txnHash = depositStatus?.cancelledTxnHash;
      }
    } else {
      text = t`Fulfilling Unstake request`;

      if (withdrawalStatus?.createdTxnHash) {
        status = "loading";
      }

      if (withdrawalStatus?.executedTxnHash) {
        text = t`Unstake order executed`;
        status = "success";
        txnHash = withdrawalStatus?.executedTxnHash;
      }

      if (withdrawalStatus?.cancelledTxnHash) {
        text = t`Unstake order cancelled`;
        status = "error";
        txnHash = withdrawalStatus?.cancelledTxnHash;
      }
    }

    return <TransactionStatus status={status} txnHash={txnHash} text={text} />;
  }, [depositStatus, isDeposit, withdrawalStatus]);

  
  useEffect(
    function getStatusKey() {
      if (isDeposit) {
        if (depositStatusKey) {
          return;
        }
        const matchedStatusKey = Object.values(depositStatuses).find((status) => {
          const isMatch = !status.isViewed && getPendingDepositKey(status.data) === pendingDepositKey;
          return isMatch;
        })?.key;

        if (matchedStatusKey) {
          setDepositStatusKey(matchedStatusKey);
          setDepositStatusViewed(matchedStatusKey);
        }
      } else {
        if (withdrawalStatusKey) {
          return;
        }

        const matchedStatusKey = Object.values(withdrawalStatuses).find((status) =>
          {
            const isMatch= !status.isViewed && getPendingWithdrawalKey(status.data) === pendingWithdrawalKey;
            return isMatch;
          } 
        )?.key;

        if (matchedStatusKey) {
          setWithdrawalStatusKey(matchedStatusKey);
          setWithdrawalStatusViewed(matchedStatusKey);
        }
      }
    },
    [
      depositStatusKey,
      depositStatuses,
      isDeposit,
      pendingDepositKey,
      pendingWithdrawalKey,
      setDepositStatusViewed,
      setWithdrawalStatusViewed,
      toastTimestamp,
      withdrawalStatusKey,
      withdrawalStatuses,
    ]
  );

  useToastAutoClose(isCompleted, toastTimestamp);

  return (
    <div className="StatusNotification">
      <div className="StatusNotification-content">
        <div className="StatusNotification-title">{title}</div>

        <div className="StatusNotification-items">
          {creationStatus}
          {executionStatus}
        </div>
      </div>

      <div className={cx("StatusNotification-background", { error: hasError })}></div>
    </div>
  );
}
