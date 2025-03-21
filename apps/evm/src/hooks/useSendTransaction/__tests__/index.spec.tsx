import noop from 'noop-ts';
import type { Mock } from 'vitest';

import fakeContractReceipt from '__mocks__/models/contractReceipt';
import fakeContractTransaction from '__mocks__/models/contractTransaction';
import fakeProvider from '__mocks__/models/provider';
import { renderHook } from 'testUtils/render';

import FunctionKey from 'constants/functionKey';

import contractTxData from '__mocks__/models/contractTxData';
import { useIsFeatureEnabled } from 'hooks/useIsFeatureEnabled';
import { VError } from 'libs/errors';
import { useProvider } from 'libs/wallet';
import type { Config as WagmiConfig } from 'wagmi';
import { useSendTransaction } from '..';
import { CONFIRMATIONS, TIMEOUT_MS } from '../constants';
import { sendTransaction } from '../sendTransaction';
import { useTrackTransaction } from '../useTrackTransaction';

vi.mock('../useTrackTransaction');
vi.mock('../sendTransaction');

const mockWagmiConfig = {} as WagmiConfig;

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');

  return {
    ...actual,
    useConfig: vi.fn(() => mockWagmiConfig),
  };
});

const fakeFnKey = [FunctionKey.SUPPLY];
const fakeHookInput = {
  fn: vi.fn(async () => contractTxData),
  fnKey: fakeFnKey,
  onConfirmed: noop,
  onReverted: noop,
};
const fakeMutationInput = {};

describe('useSendTransaction', () => {
  beforeEach(() => {
    (useIsFeatureEnabled as Mock).mockImplementation(() => false);

    (fakeProvider.waitForTransaction as Mock).mockImplementation(async () => fakeContractReceipt);

    (useProvider as Mock).mockImplementation(() => ({
      provider: fakeProvider,
    }));
  });

  it('sends transaction and tracks it', async () => {
    const trackTransactionMock = vi.fn();
    (useTrackTransaction as Mock).mockImplementation(() => trackTransactionMock);

    (sendTransaction as Mock).mockReturnValue(fakeContractTransaction);

    const fnMock = vi.fn(async () => contractTxData);

    const { result } = renderHook(() =>
      useSendTransaction({
        ...fakeHookInput,
        fn: fnMock,
        options: {
          onSuccess: noop,
        },
      }),
    );

    const { mutateAsync } = result.current;

    // Send transaction
    await mutateAsync(fakeMutationInput);

    expect(fnMock).toHaveBeenCalledTimes(1);
    expect(fnMock).toHaveBeenCalledWith(fakeMutationInput);

    expect(sendTransaction).toHaveBeenCalledWith({
      txData: contractTxData,
      gasless: false,
      wagmiConfig: mockWagmiConfig,
    });

    expect(trackTransactionMock).toHaveBeenCalledTimes(1);
    expect(trackTransactionMock).toHaveBeenCalledWith({
      transactionHash: fakeContractTransaction.hash,
      onConfirmed: expect.any(Function),
      onReverted: expect.any(Function),
    });
  });

  it('sends transaction, tracks it and waits for its confirmation before returning', async () => {
    const trackTransactionMock = vi.fn();
    (useTrackTransaction as Mock).mockImplementation(() => trackTransactionMock);

    (sendTransaction as Mock).mockReturnValue(fakeContractTransaction);

    const fnMock = vi.fn(async () => contractTxData);

    const { result } = renderHook(() =>
      useSendTransaction({
        ...fakeHookInput,
        fn: fnMock,
        options: {
          onSuccess: noop,
          waitForConfirmation: true,
        },
      }),
    );

    const { mutateAsync } = result.current;

    // Send transaction
    await mutateAsync(fakeMutationInput);

    expect(fnMock).toHaveBeenCalledTimes(1);
    expect(fnMock).toHaveBeenCalledWith(fakeMutationInput);

    expect(sendTransaction).toHaveBeenCalledWith({
      txData: contractTxData,
      gasless: false,
      wagmiConfig: mockWagmiConfig,
    });

    expect(trackTransactionMock).toHaveBeenCalledTimes(1);
    expect(trackTransactionMock).toHaveBeenCalledWith({
      transactionHash: fakeContractTransaction.hash,
      onConfirmed: expect.any(Function),
      onReverted: expect.any(Function),
    });

    expect(fakeProvider.waitForTransaction).toHaveBeenCalledTimes(1);
    expect(fakeProvider.waitForTransaction).toHaveBeenCalledWith(
      fakeContractTransaction.hash,
      CONFIRMATIONS,
      TIMEOUT_MS,
    );
  });

  it('calls onError callback when transaction fails', async () => {
    const trackTransactionMock = vi.fn();
    (useTrackTransaction as Mock).mockImplementation(() => trackTransactionMock);

    const error = new VError({
      type: 'unexpected',
      code: 'somethingWentWrong',
    });
    (sendTransaction as Mock).mockRejectedValue(error);

    const fnMock = vi.fn(async () => contractTxData);
    const onErrorMock = vi.fn();

    const { result } = renderHook(() =>
      useSendTransaction({
        ...fakeHookInput,
        fn: fnMock,
        options: {
          onError: onErrorMock,
        },
      }),
    );

    const { mutateAsync } = result.current;

    // Send transaction
    await expect(mutateAsync(fakeMutationInput)).rejects.toThrow(error.code);

    expect(fnMock).toHaveBeenCalledTimes(1);
    expect(fnMock).toHaveBeenCalledWith(fakeMutationInput);

    expect(sendTransaction).toHaveBeenCalledWith({
      txData: contractTxData,
      gasless: false,
      wagmiConfig: mockWagmiConfig,
    });

    expect(trackTransactionMock).not.toHaveBeenCalled();

    expect(onErrorMock).toHaveBeenCalledTimes(1);
    expect(onErrorMock).toHaveBeenCalledWith(error, fakeMutationInput, undefined);
  });
});
