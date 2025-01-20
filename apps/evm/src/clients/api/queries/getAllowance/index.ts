import type { Address, PublicClient } from 'viem';

import BigNumber from 'bignumber.js';
import { Bep20Abi } from 'libs/contracts';
import type { Token } from 'types';

export interface GetAllowanceInput {
  publicClient: PublicClient;
  token: Token;
  accountAddress: string;
  spenderAddress: string;
}

export type GetAllowanceOutput = {
  allowanceMantissa: BigNumber;
};

const getAllowance = async ({
  publicClient,
  token,
  accountAddress,
  spenderAddress,
}: GetAllowanceInput): Promise<GetAllowanceOutput> => {
  const allowanceMantissa = await publicClient.readContract({
    abi: Bep20Abi,
    address: token.address as Address,
    functionName: 'allowance',
    args: [accountAddress as Address, spenderAddress as Address],
  });

  return {
    allowanceMantissa: new BigNumber(allowanceMantissa.toString()),
  };
};

export default getAllowance;
