import BigNumber from 'bignumber.js';

import type { Asset } from 'types';

import getCombinedDistributionApys from './getCombinedDistributionApys';

export const calculateYearlyInterests = ({
  balance,
  interestPercentage,
}: {
  balance: BigNumber;
  interestPercentage: BigNumber;
}) => {
  if (!interestPercentage.isFinite()) {
    return new BigNumber(0);
  }

  return balance.multipliedBy(interestPercentage).dividedBy(100);
};

export const calculateYearlyEarningsForAsset = ({ asset }: { asset: Asset }) => {
  // Combine supply and borrow APYs with distribution APYs
  const combinedDistributionApys = getCombinedDistributionApys({ asset });

  // Calculate yearly earnings
  const supplyYearlyEarningsCents = calculateYearlyInterests({
    balance: asset.userSupplyBalanceCents,
    interestPercentage: combinedDistributionApys.totalSupplyApyPercentage,
  });
  const borrowYearlyInterestsCents = calculateYearlyInterests({
    balance: asset.userBorrowBalanceCents,
    interestPercentage: combinedDistributionApys.totalBorrowApyPercentage,
  });

  return supplyYearlyEarningsCents.minus(borrowYearlyInterestsCents).dp(0);
};

export const calculateYearlyEarningsForAssets = ({ assets }: { assets: Asset[] }) => {
  // We use the yearly earnings to calculate the daily earnings the net APY
  let yearlyEarningsCents: BigNumber | undefined;

  assets.forEach(asset => {
    if (!yearlyEarningsCents) {
      yearlyEarningsCents = new BigNumber(0);
    }

    const assetYearlyEarningsCents = calculateYearlyEarningsForAsset({
      asset,
    });

    yearlyEarningsCents = yearlyEarningsCents.plus(assetYearlyEarningsCents);
  });

  return yearlyEarningsCents;
};
