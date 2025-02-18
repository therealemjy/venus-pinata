import { getDefaultConfig } from 'connectkit';
import { http, createConfig, injected } from 'wagmi';

import { Emitter } from '@wagmi/core/internal';
import localConfig from 'config';
import { MAIN_PRODUCTION_HOST } from 'constants/production';
import type { ChainId } from 'types';
import type { Chain, Transport } from 'viem';
import { safe } from 'wagmi/connectors';
import { chains } from '../chains';
import { WALLET_CONNECT_PROJECT_ID } from '../constants';

const connectKitConfig = getDefaultConfig({
  chains: chains as [Chain, ...Chain[]],
  transports: chains.reduce((acc, chain) => {
    const url = localConfig.rpcUrls[chain.id as ChainId];

    return {
      ...acc,
      [chain.id]: http(url),
    };
  }, {}) as Record<ChainId, Transport>,
  walletConnectProjectId: WALLET_CONNECT_PROJECT_ID,
  appName: 'Venus',
  appUrl: `https://${MAIN_PRODUCTION_HOST}`,
  appDescription:
    'Venus is a decentralized finance (DeFi) algorithmic money market protocol on EVM networks.',
  appIcon: 'https://venus.io/180x180.png',
  batch: {
    multicall: {
      wait: 50,
    },
  },
  connectors: [injected()],
});

const config = createConfig({
  ...connectKitConfig,
  connectors: connectKitConfig.connectors?.map(connector => {
    const c = connector({
      chains: connectKitConfig.chains,
      emitter: new Emitter(''),
    });

    if (c.id === 'safe') {
      return safe({
        allowedDomains: [/^app\.safe\.global$/],
      });
    }

    return connector;
  }),
});

export default config;
