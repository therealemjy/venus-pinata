import type { Mock } from 'vitest';

import fakeContractReceipt from '__mocks__/models/contractReceipt';
import fakeContractTransaction from '__mocks__/models/contractTransaction';
import fakeProvider from '__mocks__/models/provider';
import { renderHook } from 'testUtils/render';

import { ChainExplorerLink } from 'containers/ChainExplorerLink';
import {
  checkForComptrollerTransactionError,
  checkForTokenTransactionError,
  checkForVaiControllerTransactionError,
  checkForVaiVaultTransactionError,
  checkForXvsVaultProxyTransactionError,
} from 'libs/errors';
import { displayNotification, updateNotification } from 'libs/notifications';
import { en } from 'libs/translations';
import { useProvider } from 'libs/wallet';
import { ChainId } from 'types';

import { CONFIRMATIONS, TIMEOUT_MS } from 'hooks/useSendTransaction/constants';
import type { Hex } from 'viem';
import { useTrackTransaction } from '..';

vi.mock('context/ErrorLogger');
vi.mock('libs/notifications');
vi.mock('libs/errors');
vi.mock('errors');

const fakeError = new Error('Fake error');

describe('useTrackTransaction', () => {
  beforeEach(() => {
    (displayNotification as Mock).mockImplementation(({ id }: { id: string | number }) => id);

    (fakeProvider.waitForTransaction as Mock).mockImplementation(async () => fakeContractReceipt);

    (useProvider as Mock).mockImplementation(() => ({
      provider: fakeProvider,
    }));
  });

  it('handles errors from provider', async () => {
    (fakeProvider.waitForTransaction as Mock).mockImplementation(async () => {
      throw fakeError;
    });

    const { result } = renderHook(() => useTrackTransaction());
    const trackTransaction = result.current;

    await trackTransaction({
      transactionHash: fakeContractTransaction.hash as Hex,
    });

    // Check loading notification was displayed
    expect(displayNotification).toHaveBeenCalledTimes(1);
    expect(displayNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'loading',
      autoClose: false,
      title: en.transactionNotification.pending.title,
      description: (
        <ChainExplorerLink
          chainId={ChainId.BSC_TESTNET}
          hash={fakeContractTransaction.hash}
          urlType="tx"
        />
      ),
    });

    // Check provider was called
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledTimes(1);
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledWith(
      fakeContractTransaction.hash,
      CONFIRMATIONS,
      TIMEOUT_MS,
    );

    // Check notification was updated
    expect(updateNotification).toBeCalledTimes(1);
    expect(updateNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'warning',
      title: en.transactionNotification.couldNotFetchReceipt.title,
    });
  });

  it.each([
    { name: 'checkForComptrollerTransactionError', checkFn: checkForComptrollerTransactionError },
    { name: 'checkForComptrollerTransactionError', checkFn: checkForComptrollerTransactionError },
    { name: 'checkForTokenTransactionError', checkFn: checkForTokenTransactionError },
    {
      name: 'checkForVaiControllerTransactionError',
      checkFn: checkForVaiControllerTransactionError,
    },
    { name: 'checkForVaiVaultTransactionError', checkFn: checkForVaiVaultTransactionError },
    {
      name: 'checkForXvsVaultProxyTransactionError',
      checkFn: checkForXvsVaultProxyTransactionError,
    },
  ])(
    'checks for errors in transaction receipt on confirmation. Check function: %s',
    async ({ checkFn }) => {
      (checkFn as Mock).mockImplementation(() => {
        throw fakeError;
      });

      const { result } = renderHook(() => useTrackTransaction());
      const trackTransaction = result.current;

      await trackTransaction({
        transactionHash: fakeContractTransaction.hash as Hex,
      });

      // Check loading notification was displayed
      expect(displayNotification).toHaveBeenCalledTimes(1);
      expect(displayNotification).toHaveBeenCalledWith({
        id: fakeContractTransaction.hash,
        variant: 'loading',
        autoClose: false,
        title: en.transactionNotification.pending.title,
        description: (
          <ChainExplorerLink
            chainId={ChainId.BSC_TESTNET}
            hash={fakeContractTransaction.hash}
            urlType="tx"
          />
        ),
      });

      // Check provider was called
      expect(fakeProvider.waitForTransaction).toHaveBeenCalledTimes(1);
      expect(fakeProvider.waitForTransaction).toHaveBeenCalledWith(
        fakeContractTransaction.hash,
        CONFIRMATIONS,
        TIMEOUT_MS,
      );

      // Test check functions were called
      expect(checkFn).toHaveBeenCalledTimes(1);
      expect(checkFn).toHaveBeenCalledWith(fakeContractReceipt);

      // Check notification was updated
      expect(updateNotification).toBeCalledTimes(1);
      expect(updateNotification).toHaveBeenCalledWith({
        id: fakeContractTransaction.hash,
        variant: 'error',
        title: en.transactionNotification.failed.title,
      });
    },
  );

  it('handles a transaction that failed', async () => {
    (fakeProvider.waitForTransaction as Mock).mockImplementation(async () => ({
      ...fakeContractReceipt,
      status: 0, // Failed transaction status
    }));

    const { result } = renderHook(() => useTrackTransaction());
    const trackTransaction = result.current;

    const onRevertedMock = vi.fn();

    await trackTransaction({
      transactionHash: fakeContractTransaction.hash as Hex,
      onReverted: onRevertedMock,
    });

    // Check loading notification was displayed
    expect(displayNotification).toHaveBeenCalledTimes(1);
    expect(displayNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'loading',
      autoClose: false,
      title: en.transactionNotification.pending.title,
      description: (
        <ChainExplorerLink
          chainId={ChainId.BSC_TESTNET}
          hash={fakeContractTransaction.hash}
          urlType="tx"
        />
      ),
    });

    // Check provider was called
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledTimes(1);
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledWith(
      fakeContractTransaction.hash,
      CONFIRMATIONS,
      TIMEOUT_MS,
    );

    // Check notification was updated
    expect(updateNotification).toBeCalledTimes(1);
    expect(updateNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'error',
      title: en.transactionNotification.failed.title,
    });

    // Check callback was executed
    expect(onRevertedMock).toHaveBeenCalledTimes(1);
    expect(onRevertedMock).toHaveBeenCalledWith({ transactionHash: fakeContractTransaction.hash });
  });

  it('handles a transaction that succeeded', async () => {
    const { result } = renderHook(() => useTrackTransaction());
    const trackTransaction = result.current;

    const onConfirmedMock = vi.fn();

    await trackTransaction({
      transactionHash: fakeContractTransaction.hash as Hex,
      onConfirmed: onConfirmedMock,
    });

    // Check loading notification was displayed
    expect(displayNotification).toHaveBeenCalledTimes(1);
    expect(displayNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'loading',
      autoClose: false,
      title: en.transactionNotification.pending.title,
      description: (
        <ChainExplorerLink
          chainId={ChainId.BSC_TESTNET}
          hash={fakeContractTransaction.hash}
          urlType="tx"
        />
      ),
    });

    // Check provider was called
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledTimes(1);
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledWith(
      fakeContractTransaction.hash,
      CONFIRMATIONS,
      TIMEOUT_MS,
    );

    // Check notification was updated
    expect(updateNotification).toBeCalledTimes(1);
    expect(updateNotification).toHaveBeenCalledWith({
      id: fakeContractTransaction.hash,
      variant: 'success',
      title: en.transactionNotification.success.title,
    });

    // Check callback was executed
    expect(onConfirmedMock).toHaveBeenCalledTimes(1);
    expect(onConfirmedMock).toHaveBeenCalledWith({
      transactionHash: fakeContractTransaction.hash,
      transactionReceipt: fakeContractReceipt,
    });
  });
});
