import { fireEvent, waitFor } from '@testing-library/react';
import BigNumber from 'bignumber.js';
import type { Mock } from 'vitest';

import fakeAccountAddress from '__mocks__/models/address';
import fakeContractTransaction from '__mocks__/models/contractTransaction';
import { poolData } from '__mocks__/models/pools';
import { renderComponent } from 'testUtils/render';

import { useGetPool } from 'clients/api';
import { en } from 'libs/translations';

import Withdraw from '.';

describe('Withdraw', () => {
  beforeEach(() => {
    (useGetPool as Mock).mockImplementation(() => ({
      data: {
        pool: {
          ...poolData[0],
          userTotalBorrowLimit: new BigNumber('111'),
          userTotalBorrowBalance: new BigNumber('91'),
          userTotalSupplyBalance: new BigNumber('910'),
        },
      },
      isLoading: false,
    }));
  });

  it('submit button is enabled with input, good vesting period and not loading', async () => {
    const withdrawXvs = vi.fn().mockReturnValue(fakeContractTransaction);
    const { getByText } = renderComponent(
      <Withdraw
        xvsWithdrawableAmount={new BigNumber(9999)}
        withdrawXvs={withdrawXvs}
        withdrawXvsLoading={false}
      />,
      {
        accountAddress: fakeAccountAddress,
      },
    );

    const submitButton = getByText(en.convertVrt.withdrawXvs).closest(
      'button',
    ) as HTMLButtonElement;

    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    await waitFor(() => expect(withdrawXvs).toHaveBeenCalledTimes(1));
  });
});
