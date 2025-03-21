import { type ChainId, chainMetadata } from '@venusprotocol/chains';
import type { ContractReceipt } from 'ethers';
import { VError, logError } from 'libs/errors';
import type { Provider } from 'libs/wallet';
import type { Hex } from 'viem';

const WAIT_INTERVAL_MS = 1000;
const MAX_TRIES = 10;

// TODO: add tests

interface SafeWalletTransaction {
  transactionHash: Hex;
  isSuccessful: boolean | null;
}

const getTransactionHashFromSafe = async ({
  chainId,
  hash,
}: {
  chainId: ChainId;
  hash: Hex;
}) => {
  const safeWalletApiUrl = chainMetadata[chainId].safeWalletApiUrl;

  if (!safeWalletApiUrl) {
    throw new VError({
      type: 'unexpected',
      code: 'couldNotRetrieveSafeTransaction',
    });
  }

  // Retrieve transaction from Safe Wallet's API
  const data = await fetch(`${safeWalletApiUrl}/api/v2/multisig-transactions/${hash}/`);
  const safeTransaction: SafeWalletTransaction = await data.json();

  let transactionHash: Hex | undefined;

  if (safeTransaction.isSuccessful) {
    transactionHash = safeTransaction.transactionHash;
  }

  return {
    transactionHash,
  };
};

const waitForSafeTransaction = ({
  chainId,
  hash,
}: {
  chainId: ChainId;
  hash: Hex;
}) =>
  new Promise<{ transactionHash: Hex | undefined }>((resolve, reject) => {
    let tries = 0;

    // We'll try up to MAX_TRIES times to fetch the transaction from Safe, waiting in between each
    // attempt. The reason we need to do this is because once a transaction is sent to Safe it takes
    // some time before it is confirmed and the API returns the transaction hash of the final
    // transaction.
    const attemptFetch = async () => {
      tries += 1;

      // Resolve if we've reached the maximum number of tries
      if (tries >= MAX_TRIES) {
        return resolve({
          transactionHash: undefined,
        });
      }

      try {
        // Attempt to fetch transaction hash from Safe Wallet's API
        const { transactionHash } = await getTransactionHashFromSafe({
          chainId,
          hash,
        });

        if (transactionHash) {
          // Resolve with transaction hash
          return resolve({ transactionHash });
        }
      } catch (error) {
        if (error instanceof VError && error.code === 'couldNotRetrieveSafeTransaction') {
          logError(
            "Could not retrieve transaction hash from Safe Wallet's API: missing Safe Wallet API URL",
          );

          // Bubble up error
          return reject(error);
        }
      }

      // Wait before the next attempt
      setTimeout(attemptFetch, WAIT_INTERVAL_MS);
    };

    attemptFetch();
  });

export const waitForTransaction = async ({
  provider,
  hash,
  confirmations,
  isSafeWalletTransaction,
  timeoutMs,
}: {
  provider: Provider;
  hash: Hex;
  isSafeWalletTransaction: boolean;
  confirmations: number;
  timeoutMs: number;
}) => {
  let transactionHash: Hex | undefined = undefined;

  if (isSafeWalletTransaction) {
    const { transactionHash: tmpHash } = await waitForSafeTransaction({
      chainId: provider.network.chainId as ChainId,
      hash,
    });

    console.log('Transaction found from Safe:', transactionHash);

    transactionHash = tmpHash;
  } else {
    transactionHash = hash;
  }

  let transactionReceipt: ContractReceipt | undefined;

  if (transactionHash) {
    // Retrieve transaction from RPC provider
    transactionReceipt = await provider.waitForTransaction(
      transactionHash,
      confirmations,
      timeoutMs,
    );
  }

  return { transactionReceipt };
};
