import { type QueryObserverOptions, useQuery } from '@tanstack/react-query';

import getAddressDomainName, {
  type GetAddressDomainNameInput,
  type GetAddressDomainNameOutput,
} from 'clients/api/queries/getAddressDomainName';
import FunctionKey from 'constants/functionKey';
import { useIsFeatureEnabled } from 'hooks/useIsFeatureEnabled';

type UseGetAddressDomainNameInput = GetAddressDomainNameInput;

export type UseGetAddressDomainNameQueryKey = [
  FunctionKey.GET_ADDRESS_DOMAIN_NAME,
  GetAddressDomainNameInput,
];

type Options = QueryObserverOptions<
  GetAddressDomainNameOutput,
  Error,
  GetAddressDomainNameOutput,
  GetAddressDomainNameOutput,
  UseGetAddressDomainNameQueryKey
>;

const useGetAddressDomainName = (
  { accountAddress, chainId }: UseGetAddressDomainNameInput,
  options?: Partial<Options>,
) => {
  const isWeb3DomainNamesFeatureEnabled = useIsFeatureEnabled({ name: 'web3DomainNames' });
  const queryKey: UseGetAddressDomainNameQueryKey = [
    FunctionKey.GET_ADDRESS_DOMAIN_NAME,
    {
      accountAddress,
      chainId,
    },
  ];

  return useQuery({
    queryKey: queryKey,
    queryFn: () => getAddressDomainName({ accountAddress, chainId }),
    ...options,
    enabled: isWeb3DomainNamesFeatureEnabled && !!options?.enabled,
  });
};

export default useGetAddressDomainName;
