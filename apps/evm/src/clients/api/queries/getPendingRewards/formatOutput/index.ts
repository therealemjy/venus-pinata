import BigNumber from 'bignumber.js';

import type { PoolLens, Prime, VaiVault, VenusLens, XvsVault } from 'libs/contracts';
import type { Token } from 'types';

import type {
  PendingExternalRewardSummary,
  PendingInternalRewardSummary,
  PendingRewardGroup,
  PrimePendingRewardGroup,
  XvsVestingVaultPendingRewardGroup,
} from '../types';
import formatToExternalPendingRewardGroup from './formatToExternalPendingRewardGroup';
import formatToIsolatedPoolPendingRewardGroup from './formatToIsolatedPoolPendingRewardGroup';
import formatToLegacyPoolPendingRewardGroup from './formatToLegacyPoolPendingRewardGroup';
import formatToPrimePendingRewardGroup from './formatToPrimePendingRewardGroup';
import formatToVaultPendingRewardGroup from './formatToVaultPendingRewardGroup';
import formatToVestingVaultPendingRewardGroup from './formatToVestingVaultPendingRewardGroup';

const formatOutput = ({
  tokens,
  legacyPoolComptrollerContractAddress,
  isolatedPoolComptrollerAddresses,
  vaiVaultPendingXvs,
  isolatedPoolsPendingRewards,
  xvsVestingVaultPoolInfos,
  xvsVestingVaultPendingRewards,
  xvsVestingVaultPendingWithdrawalsBeforeUpgrade,
  tokenPriceMapping,
  venusLensPendingRewards,
  primePendingRewards,
  isPrimeContractPaused,
  isVaiVaultContractPaused,
  isXvsVestingVaultContractPaused,
  merklPendingRewards,
}: {
  tokens: Token[];
  isolatedPoolsPendingRewards: Array<
    Awaited<ReturnType<PoolLens['getPendingRewards']>> | undefined
  >;
  xvsVestingVaultPoolInfos: Array<Awaited<ReturnType<XvsVault['poolInfos']>> | undefined>;
  xvsVestingVaultPendingRewards: Array<Awaited<ReturnType<XvsVault['pendingReward']>> | undefined>;
  xvsVestingVaultPendingWithdrawalsBeforeUpgrade: Array<
    Awaited<ReturnType<XvsVault['pendingWithdrawalsBeforeUpgrade']>> | undefined
  >;
  tokenPriceMapping: Record<string, BigNumber>;
  isolatedPoolComptrollerAddresses: string[];
  isVaiVaultContractPaused: boolean;
  isXvsVestingVaultContractPaused: boolean;
  isPrimeContractPaused: boolean;
  vaiVaultPendingXvs?: Awaited<ReturnType<VaiVault['pendingXVS']>>;
  venusLensPendingRewards?: Awaited<ReturnType<VenusLens['pendingRewards']>>;
  legacyPoolComptrollerContractAddress?: string;
  primePendingRewards?: Awaited<ReturnType<Prime['callStatic']['getPendingRewards']>>;
  merklPendingRewards: PendingExternalRewardSummary[];
}): PendingRewardGroup[] => {
  const pendingRewardGroups: PendingRewardGroup[] = [];

  // Extract pending rewards from core pool
  const legacyPoolPendingRewardGroup =
    venusLensPendingRewards && legacyPoolComptrollerContractAddress
      ? formatToLegacyPoolPendingRewardGroup({
          venusLensPendingRewards,
          tokenPriceMapping,
          comptrollerContractAddress: legacyPoolComptrollerContractAddress,
          tokens,
        })
      : undefined;

  if (legacyPoolPendingRewardGroup) {
    pendingRewardGroups.push(legacyPoolPendingRewardGroup);
  }

  // Extract pending rewards from isolated pools
  const isolatedPoolsPendingRewardSummaries = isolatedPoolsPendingRewards.reduce<
    PendingInternalRewardSummary[]
  >(
    (acc, rawPendingRewards, index) =>
      rawPendingRewards
        ? [
            ...acc,
            ...rawPendingRewards.map<PendingInternalRewardSummary>(raw => ({
              type: 'isolatedPool',
              poolComptrollerAddress: isolatedPoolComptrollerAddresses[index],
              distributorAddress: raw.distributorAddress,
              rewardTokenAddress: raw.rewardTokenAddress,
              totalRewards: new BigNumber(raw.totalRewards.toString()),
              pendingRewards: raw.pendingRewards.map(pr => ({
                vTokenAddress: pr.vTokenAddress,
                amountMantissa: new BigNumber(pr.amount.toString()),
              })),
            })),
          ]
        : acc,
    [],
  );

  const pendingRewardsPerIsolatedPool = isolatedPoolsPendingRewardSummaries.reduce<
    Record<string, PendingInternalRewardSummary[]>
  >(
    (acc, rs) => ({
      ...acc,
      [rs.poolComptrollerAddress]: acc[rs.poolComptrollerAddress]
        ? [...acc[rs.poolComptrollerAddress], rs]
        : [rs],
    }),
    {},
  );

  const isolatedPoolPendingRewardGroups = Object.keys(pendingRewardsPerIsolatedPool).reduce<
    PendingRewardGroup[]
  >((acc, poolComptrollerAddress) => {
    const isolatedPoolPendingRewardGroup = formatToIsolatedPoolPendingRewardGroup({
      comptrollerContractAddress: poolComptrollerAddress,
      rewardSummaries: pendingRewardsPerIsolatedPool[poolComptrollerAddress],
      tokenPriceMapping,
      tokens,
    });

    return isolatedPoolPendingRewardGroup ? [...acc, isolatedPoolPendingRewardGroup] : acc;
  }, []);

  pendingRewardGroups.push(...isolatedPoolPendingRewardGroups);

  // Extract pending rewards from VAI vault
  const vaiVaultPendingRewardAmountMantissa =
    vaiVaultPendingXvs && new BigNumber(vaiVaultPendingXvs.toString());

  const vaiVaultPendingRewardGroup =
    vaiVaultPendingRewardAmountMantissa &&
    formatToVaultPendingRewardGroup({
      isDisabled: isVaiVaultContractPaused,
      pendingRewardAmountMantissa: vaiVaultPendingRewardAmountMantissa,
      tokenPriceMapping,
      stakedTokenSymbol: 'VAI',
      rewardTokenSymbol: 'XVS',
      tokens,
    });

  if (vaiVaultPendingRewardGroup) {
    pendingRewardGroups.push(vaiVaultPendingRewardGroup);
  }

  // Extract pending rewards from XVS vesting vaults
  const xvsVestingVaultPendingRewardGroups = xvsVestingVaultPendingRewards
    .map((xvsVestingVaultPendingReward, index) => {
      if (!xvsVestingVaultPendingReward) {
        return;
      }

      const vaultPoolInfo = xvsVestingVaultPoolInfos[index];
      const userPendingRewardsAmountMantissa =
        xvsVestingVaultPendingReward && new BigNumber(xvsVestingVaultPendingReward.toString());
      const unsafeUserPendingWithdrawalsBeforeUpgradeAmountMantissa =
        xvsVestingVaultPendingWithdrawalsBeforeUpgrade[index];
      const userPendingWithdrawalsBeforeUpgradeAmountMantissa =
        unsafeUserPendingWithdrawalsBeforeUpgradeAmountMantissa &&
        new BigNumber(unsafeUserPendingWithdrawalsBeforeUpgradeAmountMantissa.toString());

      if (
        !vaultPoolInfo ||
        !userPendingRewardsAmountMantissa ||
        !userPendingWithdrawalsBeforeUpgradeAmountMantissa
      ) {
        return;
      }

      return formatToVestingVaultPendingRewardGroup({
        poolIndex: index,
        isDisabled: isXvsVestingVaultContractPaused,
        userPendingRewardsAmountMantissa,
        userPendingWithdrawalsBeforeUpgradeAmountMantissa,
        tokenPriceMapping,
        tokens,
        stakedTokenAddress: vaultPoolInfo.token,
      });
    })
    .filter((group): group is XvsVestingVaultPendingRewardGroup => !!group);

  pendingRewardGroups.push(...xvsVestingVaultPendingRewardGroups);

  // Extract pending rewards from Prime
  let primePendingRewardGroup: PrimePendingRewardGroup | undefined;

  if (primePendingRewards) {
    primePendingRewardGroup = formatToPrimePendingRewardGroup({
      isPrimeContractPaused,
      primePendingRewards,
      tokenPriceMapping,
      tokens,
    });
  }

  if (primePendingRewardGroup) {
    pendingRewardGroups.push(primePendingRewardGroup);
  }

  const merklPendingRewardGroups = formatToExternalPendingRewardGroup({
    externalRewardsSummaries: merklPendingRewards,
    tokens,
    tokenPriceMapping,
  });

  pendingRewardGroups.push(...merklPendingRewardGroups);

  return pendingRewardGroups;
};

export default formatOutput;
