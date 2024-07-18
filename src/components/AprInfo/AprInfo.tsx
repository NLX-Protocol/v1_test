import { Trans, t } from "@lingui/macro";
import ExternalLink from "components/ExternalLink/ExternalLink";
import StatsTooltipRow from "components/StatsTooltip/StatsTooltipRow";
import Tooltip from "components/Tooltip/Tooltip";
import { BigNumber } from "ethers";
import { formatAmount } from "lib/numbers";
import { useCallback, useEffect, useState } from "react";
import { ImSpinner2 } from "react-icons/im"

export function AprInfo({
  apr,
  incentiveApr,
  showTooltip = true,
  isGmList,
}: {
  apr: BigNumber | undefined;
  incentiveApr: BigNumber | undefined;
  showTooltip?: boolean;
  isGmList?: boolean;
}) {

  const [isTimerLoading,setIsTimerLoading]=useState(false);
  useEffect(() => {
      setIsTimerLoading(true);
      const timer = setTimeout(() => {
        setIsTimerLoading(false);
      },1500); 
    return () => clearTimeout(timer); 
  }, []);
  
  const totalApr = apr?.add(incentiveApr ?? 0) ?? BigNumber.from(0);
  const displayApr=`${Number(formatAmount(totalApr, 2, 2))< 0.1 ? "< 0.1":formatAmount(totalApr, 2, 2)}%`;
  const aprNodeGm = <div> {isTimerLoading? <ImSpinner2 width={60} height={60} className="spin TransactionStatus-spin" /> : displayApr }</div>;
  const aprNode =<>{displayApr}</>
  const renderTooltipContent = useCallback(() => {
    return (
      <>
        <StatsTooltipRow showDollar={false} label={t`Base APR`} value={`${formatAmount(apr, 2, 2)}%`} />
        <StatsTooltipRow showDollar={false} label={t`Bonus APR`} value={`${formatAmount(incentiveApr, 2, 2)}%`} />
        <br />
        <Trans>
          The Bonus APR will be airdropped as ARB tokens.{" "}
          <ExternalLink href="https://beta.nlx.trade">
            Read more
          </ExternalLink>
          .
        </Trans>
      </>
    );
  }, [apr, incentiveApr]);
  return showTooltip && incentiveApr && incentiveApr.gt(0) ? (
    <Tooltip handle={aprNode} position="right-bottom" renderContent={renderTooltipContent} />
  ) : (
    isGmList?
    aprNodeGm
    :aprNode
  );
}
