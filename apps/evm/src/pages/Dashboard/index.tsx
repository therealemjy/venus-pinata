import { type InputHTMLAttributes, useMemo, useState } from 'react';

import { useGetPools } from 'clients/api';
import { Page, type Tag, TagGroup, TextField, Toggle } from 'components';
import { MarketTable } from 'containers/MarketTable';
import { useTranslation } from 'libs/translations';
import { useAccountAddress } from 'libs/wallet';
import { isAssetPaused } from 'utilities';

import { PoolStats } from 'containers/PoolStats';
import { Carousel } from './Carousel';
import TEST_IDS from './testIds';
import useFormatPools from './useFormatPools';
import { useMarketTableColumns } from './useMarketTableColumns';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { accountAddress } = useAccountAddress();

  const [selectedPoolTagIndex, setSelectedPoolTagIndex] = useState<number>(0);
  const [shouldDisplayPausedAssets, setShouldDisplayPausedAssets] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchInputChange: InputHTMLAttributes<HTMLInputElement>['onChange'] = changeEvent =>
    setSearchValue(changeEvent.currentTarget.value);

  const { data: getPools, isLoading: isGetPoolsLoading } = useGetPools({
    accountAddress,
  });

  const pools = getPools?.pools || [];
  const columns = useMarketTableColumns();

  const pausedAssetsExist = useMemo(
    () =>
      pools.some(pool =>
        pool.assets.some(asset =>
          isAssetPaused({
            disabledTokenActions: asset.disabledTokenActions,
          }),
        ),
      ),
    [pools],
  );

  const formattedPools = useFormatPools({
    pools,
    searchValue,
    shouldDisplayPausedAssets,
    selectedPoolIndex: selectedPoolTagIndex - 1,
  });

  const poolTags: Tag[] = useMemo(
    () =>
      [
        {
          id: 'all',
          content: t('dashboard.allTag'),
        },
      ].concat(
        pools.map(pool => ({
          id: pool.comptrollerAddress,
          content: pool.name,
        })),
      ),
    [pools, t],
  );

  return (
    <Page>
      <Carousel />

      <PoolStats
        pools={pools}
        className="mb-6"
        stats={['supply', 'borrow', 'liquidity', 'treasury', 'dailyXvsDistribution', 'assetCount']}
      />

      <div className="mb-6 space-y-6 lg:flex lg:items-center lg:justify-between lg:space-x-6 lg:space-y-0">
        {pools.length > 0 && (
          <TagGroup
            tags={poolTags}
            activeTagIndex={selectedPoolTagIndex}
            onTagClick={setSelectedPoolTagIndex}
            className="mx-[-16px] px-4 md:mx-0 md:px-0 lg:mr-6 grow"
          />
        )}

        <div className="space-y-6 lg:flex lg:items-center lg:space-y-0 lg:space-x-6 ml-auto shrink-0">
          {pausedAssetsExist && (
            <Toggle
              onChange={() => setShouldDisplayPausedAssets(currentValue => !currentValue)}
              value={shouldDisplayPausedAssets}
              label={t('dashboard.pausedAssetsToggle.label')}
              className="lg:ml-auto"
            />
          )}

          <TextField
            className="lg:w-[300px]"
            isSmall
            value={searchValue}
            onChange={handleSearchInputChange}
            placeholder={t('dashboard.searchInput.placeholder')}
            leftIconSrc="magnifier"
            variant="secondary"
          />
        </div>
      </div>

      <MarketTable
        pools={formattedPools}
        isFetching={isGetPoolsLoading}
        breakpoint="lg"
        columns={columns}
        marketType="supply"
        initialOrder={{
          orderBy: 'labeledSupplyApy',
          orderDirection: 'desc',
        }}
        data-testid={TEST_IDS.marketTable}
        key="dashboard-market-table"
      />
    </Page>
  );
};

export default Dashboard;
