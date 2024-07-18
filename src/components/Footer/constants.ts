import { t } from "@lingui/macro";
import "./Footer.css";
import xIcon from "img/ic_x.svg";
import discordIcon from "img/ic_discord.svg";
import telegramIcon from "img/ic_telegram.svg";
import githubIcon from "img/ic_github.svg";
import substackIcon from "img/ic_substack.svg";

type Link = {
  label: string;
  link: string;
  external?: boolean;
  isAppLink?: boolean;
};

type SocialLink = {
  link: string;
  name: string;
  icon: string;
};

export function getFooterLinks(isHome) {
  const FOOTER_LINKS: { home: Link[]; app: Link[] } = {
    home: [
      { label: t`Terms and Conditions`, link: "/terms-and-conditions" },
      { label: t`Referral Terms`, link: "/referral-terms" },
      { label: t`Media Kit`, link: "https://docs.nlx.trade", external: true },
      // { label: "Jobs", link: "/jobs", isAppLink: true },
    ],
    app: [
      { label: t`Twitter`, link: "https://twitter.com/nlx_trade", external: true },
      // { label: "Jobs", link: "/jobs" },
    ],
  };
  return FOOTER_LINKS[isHome ? "home" : "app"];
}

export const SOCIAL_LINKS: SocialLink[] = [
  { link: "https://twitter.com/nlx_trade", name: "Twitter", icon: xIcon },
  { link: "https://substack.com/", name: "Substack", icon: substackIcon },
  { link: "https://github.com/", name: "Github", icon: githubIcon },
  { link: "https://t.me/", name: "Telegram", icon: telegramIcon },
  { link: "https://discord.gg/", name: "Discord", icon: discordIcon },
];