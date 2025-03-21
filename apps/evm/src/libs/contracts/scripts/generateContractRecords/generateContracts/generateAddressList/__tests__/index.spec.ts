import type { Mock } from 'vitest';

import { fakeContractConfigs } from 'libs/contracts/__testUtils__/fakeConfig';
import writeFile from 'utilities/writeFile';

import { generateAddressList } from '..';

vi.mock('utilities/writeFile');

describe('generateAddressList', () => {
  it('calls writeFile with the right arguments', () => {
    generateAddressList({
      outputFilePath: 'fake/output/director/path',
      contractConfigs: fakeContractConfigs,
    });

    expect(writeFile).toHaveBeenCalledTimes(1);
    expect((writeFile as Mock).mock.calls[0]).toMatchSnapshot();
  });
});
