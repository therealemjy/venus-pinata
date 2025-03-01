import BigNumber from 'bignumber.js';
import type { Mock } from 'vitest';

import fakeAccountAddress, {
  altAddress as fakePoolComptrollerContractAddress,
} from '__mocks__/models/address';
import fakeContractTransaction from '__mocks__/models/contractTransaction';
import fakeSigner from '__mocks__/models/signer';
import { vBnb, vXvs } from '__mocks__/models/vTokens';
import { getNativeTokenGatewayContract } from 'libs/contracts';

import { type VBep20, type VBnb, getVTokenContract } from 'libs/contracts';

import supply from '.';

const fakeAmountMantissa = new BigNumber('10000000000000000');

vi.mock('libs/contracts');

describe('supply', () => {
  describe('supply flow', () => {
    describe('supply BNB', () => {
      it('returns contract transaction when request succeeds', async () => {
        const mintMock = vi.fn(() => fakeContractTransaction);

        const fakeVBep20Contract = {
          functions: {
            mint: mintMock,
          },
          signer: fakeSigner,
        } as unknown as VBep20;

        (getVTokenContract as Mock).mockImplementationOnce(() => fakeVBep20Contract);

        const response = await supply({
          signer: fakeSigner,
          vToken: vBnb,
          amountMantissa: fakeAmountMantissa,
        });

        expect(response).toStrictEqual({
          contract: fakeVBep20Contract,
          args: [],
          methodName: 'mint',
          overrides: {
            value: fakeAmountMantissa.toFixed(),
          },
        });
      });
    });

    describe('supply non-BNB token', () => {
      it('returns contract transaction when request succeeds', async () => {
        const mintMock = vi.fn(() => fakeContractTransaction);

        const fakeVBnbContract = {
          functions: {
            mint: mintMock,
          },
          signer: fakeSigner,
        } as unknown as VBnb;

        (getVTokenContract as Mock).mockImplementationOnce(() => fakeVBnbContract);

        const response = await supply({
          signer: fakeSigner,
          vToken: vXvs,
          amountMantissa: fakeAmountMantissa,
        });

        expect(response).toStrictEqual({
          contract: fakeVBnbContract,
          args: [fakeAmountMantissa.toFixed()],
          methodName: 'mint',
        });
      });
    });
  });

  describe('wrap and supply flow', () => {
    it('throws an error when wrap is passed as true but not all required parameters are passed', async () => {
      try {
        await supply({
          wrap: true,
          signer: fakeSigner,
          amountMantissa: fakeAmountMantissa,
          accountAddress: fakeAccountAddress,
          poolComptrollerContractAddress: fakePoolComptrollerContractAddress,
        });

        throw new Error('supply should have thrown an error but did not');
      } catch (error) {
        expect(error).toMatchInlineSnapshot('[Error: somethingWentWrong]');
      }
    });

    it('returns contract transaction when request succeeds', async () => {
      const wrapAndSupplyMock = vi.fn(() => fakeContractTransaction);

      const fakeNativeTokenGatewayContract = {
        functions: {
          wrapAndSupply: wrapAndSupplyMock,
        },
        signer: fakeSigner,
      } as unknown as VBnb;

      (getNativeTokenGatewayContract as Mock).mockImplementationOnce(
        () => fakeNativeTokenGatewayContract,
      );

      const response = await supply({
        wrap: true,
        signer: fakeSigner,
        amountMantissa: fakeAmountMantissa,
        accountAddress: fakeAccountAddress,
        poolComptrollerContractAddress: fakePoolComptrollerContractAddress,
      });

      expect(response).toStrictEqual({
        contract: fakeNativeTokenGatewayContract,
        args: [fakeAccountAddress],
        overrides: {
          value: fakeAmountMantissa.toFixed(),
        },
        methodName: 'wrapAndSupply',
      });
    });
  });
});
