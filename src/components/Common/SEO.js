import { Helmet } from "react-helmet";
import { t } from "@lingui/macro";

function SEO(props) {
  const { children, ...customMeta } = props;
  const meta = {
    title: t`NLX | On-Chain Perpetuals backed by Bitcoin`,
    description: t`Trade On-Chain Perpetuals including BTC, CORE and other top cryptocurrencies with up to 50x leverage directly from your wallet on Core Blockchain.`,
    image: "https://opengraph.b-cdn.net/production/images/5607e533-4b4a-441a-8d48-64deb8e6cad7.png?token=ORLsklMW5-IZ8AiBL_cn8sHSzH2k297yXQ8p0e4ij2g&height=600&width=1200&expires=33254040599",
    type: "exchange",
    ...customMeta,
  };
  return (
    <>
      <Helmet>
        <title>{meta.title}</title>
        <meta name="robots" content="follow, index" />
        <meta content={meta.description} name="description" />
        <meta property="og:type" content={meta.type} />
        <meta property="og:site_name" content="NLX" />
        <meta property="og:description" content={meta.description} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:image" content={meta.image} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="beta.nlx.trade"/>
        <meta property="twitter:url" content="https://beta.nlx.trade"/>
        <meta name="twitter:site" content="@nlx_trade" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image} />
      </Helmet>
      {children}
    </>
  );
}

export default SEO;
