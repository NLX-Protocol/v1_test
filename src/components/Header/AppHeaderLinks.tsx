import React from "react";
import { FiX } from "react-icons/fi";
import { Trans } from "@lingui/macro";
import { Link } from "react-router-dom";

import { HeaderLink } from "./HeaderLink";
import "./Header.css";
import ExternalLink from "components/ExternalLink/ExternalLink";
import { isHomeSite } from "lib/legacy";
import logoImg from "img/logo_nlx.png";

type Props = {
  small?: boolean;
  clickCloseIcon?: () => void;
  openSettings?: () => void;
  redirectPopupTimestamp: number;
  showRedirectModal: (to: string) => void;
};

export function AppHeaderLinks({
  small,
  openSettings,
  clickCloseIcon,
  redirectPopupTimestamp,
  showRedirectModal,
}: Props) {


  return (
    <div className="App-header-links">
      {small && (
        <div className="App-header-links-header">
          <Link className="App-header-link-main" to="/">
            <img src={logoImg} alt="NLX Logo" />
          </Link>
          <div
            className="App-header-menu-icon-block mobile-cross-menu"
            onClick={() => clickCloseIcon && clickCloseIcon()}
          >
            <FiX className="App-header-menu-icon" />
          </div>
        </div>
      )}
      <div className="App-header-link-container">
        <HeaderLink to="/trade" redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal}>
          <Trans>Trade</Trans>
        </HeaderLink>
      </div>
      <div className="App-header-link-container">
        <HeaderLink to="/stake" redirectPopupTimestamp={redirectPopupTimestamp} showRedirectModal={showRedirectModal}>
          <Trans>Stake Liquidity</Trans>
        </HeaderLink>
      </div>
      <div className="App-header-link-container">
        <ExternalLink href="https://nlx.mintlify.app/">
          <Trans>Docs</Trans>
        </ExternalLink>
      </div>
      <div className="App-header-link-container">
        <a href="https://bridge.coredao.org/bridge" target="_blank" rel="noreferrer" >
          <Trans>Bridge</Trans>
        </a>
      </div>

      {small && !isHomeSite() && (
        <div className="App-header-link-container">
          {/* eslint-disable-next-line */}
          <a href="#" onClick={openSettings}>
            <Trans>Settings</Trans>
          </a>
        </div>
      )}
    </div>
  );
}
