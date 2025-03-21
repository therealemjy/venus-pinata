import vOpCoreLogo from 'libs/tokens/img/vTokens/vOpCore.svg';
import vUsdcCoreLogo from 'libs/tokens/img/vTokens/vUsdcCore.svg';
import vUsdtCoreLogo from 'libs/tokens/img/vTokens/vUsdtCore.svg';
import vWBnbCoreLogo from 'libs/tokens/img/vTokens/vWBtcCore.svg';
import vWEthCoreLogo from 'libs/tokens/img/vTokens/vWethCore.svg';

import isolatedPoolsOptimismMainnetDeployments from '@venusprotocol/isolated-pools/deployments/opmainnet_addresses.json';

import type { VTokenAssets } from 'libs/tokens/types';

export const vTokenAssets: VTokenAssets = {
  // Core pool
  [isolatedPoolsOptimismMainnetDeployments.addresses.VToken_vOP_Core.toLowerCase()]: vOpCoreLogo,
  [isolatedPoolsOptimismMainnetDeployments.addresses.VToken_vWBTC_Core.toLowerCase()]:
    vWBnbCoreLogo,
  [isolatedPoolsOptimismMainnetDeployments.addresses.VToken_vWETH_Core.toLowerCase()]:
    vWEthCoreLogo,
  [isolatedPoolsOptimismMainnetDeployments.addresses.VToken_vUSDC_Core.toLowerCase()]:
    vUsdcCoreLogo,
  [isolatedPoolsOptimismMainnetDeployments.addresses.VToken_vUSDT_Core.toLowerCase()]:
    vUsdtCoreLogo,
};
