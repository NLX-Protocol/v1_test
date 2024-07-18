import connectWalletImg from "img/ic_wallet_24.svg";
import AddressDropdown from "../AddressDropdown/AddressDropdown";
import ConnectWalletButton from "../Common/ConnectWalletButton";

import { Trans } from "@lingui/macro";
// import cx from "classnames";
import { CORE_TESTNET, getChainName } from "config/chains";
// import { isDevelopment } from "config/env";
import { getIcon } from "config/icons";
import { useChainId } from "lib/chains";
import { getAccountUrl, isHomeSite } from "lib/legacy";
import LanguagePopupHome from "../NetworkDropdown/LanguagePopupHome";
import NetworkDropdown from "../NetworkDropdown/NetworkDropdown";
import "./Header.css";
// import { HeaderLink } from "./HeaderLink";
import useWallet from "lib/wallets/useWallet";
import { useConnectModal } from "@rainbow-me/rainbowkit";
// import usePoints from "components/Header/utils";
import { isDevelopment } from "config/env";

type Props = {
  openSettings: () => void;
  small?: boolean;
  disconnectAccountAndCloseSettings: () => void;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
  tradePageVersion: number;
};

const NETWORK_OPTIONS = [
  {
    label: getChainName(CORE_TESTNET),
    value: CORE_TESTNET,
    icon: getIcon(CORE_TESTNET, "network"),
    color: "#E841424D",
  },
];

if (isDevelopment()) {
  // NETWORK_OPTIONS.push({
  //   label: getChainName(LOCALHOST),
  //   value: LOCALHOST,
  //   icon: getIcon(LOCALHOST, "network"),
  //   color: "#E841424D",
  // });
}

export function AppHeaderUser({
  openSettings,
  small,
  disconnectAccountAndCloseSettings,
  redirectPopupTimestamp,
  showRedirectModal,
  tradePageVersion,
}: Props) {
  const { chainId } = useChainId();
  const { active, account } = useWallet();
  const { openConnectModal } = useConnectModal();
  const showConnectionOptions = !isHomeSite();
  // const {points} = usePoints();

  // const tradeLink = tradePageVersion === 2 ? "/trade" : "/v1";

  const selectorLabel = getChainName(chainId);

  if (!active || !account) {
    return (
      <div className="App-header-user">

        {showConnectionOptions && openConnectModal ? (
          <>
            <ConnectWalletButton onClick={openConnectModal} imgSrc={connectWalletImg}>
              {small ? <Trans>Connect</Trans> : <Trans>Connect Wallet</Trans>}
            </ConnectWalletButton>
            <NetworkDropdown
              small={small}
              networkOptions={NETWORK_OPTIONS}
              selectorLabel={selectorLabel}
              openSettings={openSettings}
            />
          </>
        ) : (
          <LanguagePopupHome />
        )}
      </div>
    );
  }

  const accountUrl = getAccountUrl(chainId, account);

  return (
    <div className="App-header-user">

      {showConnectionOptions ? (
        <>
          <div className="App-header-user-address">
            <AddressDropdown
              account={account}
              accountUrl={accountUrl}
              disconnectAccountAndCloseSettings={disconnectAccountAndCloseSettings}
            />
          </div>
          <NetworkDropdown
            small={small}
            networkOptions={NETWORK_OPTIONS}
            selectorLabel={selectorLabel}
            openSettings={openSettings}
          />
        </>
      ) : (
        <LanguagePopupHome />
      )}
    </div>
  );
}
