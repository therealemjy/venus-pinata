// react-testing-library renders your components to document.body,
// this adds jest-dom's custom assertions
import '@testing-library/jest-dom';
import initializeLibraries from 'initializeLibraries';
import type { Mock } from 'vitest';
// Polyfill "window.fetch"
import 'whatwg-fetch';

import { xvs } from '__mocks__/models/tokens';

import { NULL_ADDRESS } from 'constants/address';
import useTokenApproval from 'hooks/useTokenApproval';

vi.mock('hooks/useIsFeatureEnabled');
vi.mock('hooks/useTokenApproval');
vi.mock('clients/api');
vi.mock('clients/subgraph');
vi.mock('libs/tokens');
vi.mock('libs/wallet');
vi.mock('components/Redirect');
vi.mock('components/Carousel');
vi.mock('hooks/useDebounceValue', () => ({
  default: (value: unknown) => value,
}));

// Mock zustand library (optimized state manager)
vi.mock('zustand');

// Mock Venus chains library
vi.mock('@venusprotocol/chains');

// Mock React Markdown library
vi.mock('@uiw/react-md-editor', () => ({
  default: ({
    onChange,
    previewOptions: _previewOptions,
    textareaProps: _textareaProps,
    commands: _commands,
    ...otherProps
  }: any) => <input onChange={e => onChange(e.currentTarget.value)} {...otherProps} />,
  commands: {
    title1: '',
    title2: '',
    title3: '',
    title4: '',
    unorderedListCommand: '',
    link: '',
    bold: '',
    italic: '',
  },
}));
vi.mock('@uiw/react-markdown-preview', () => ({
  default: ({ content: _content, ...otherProps }: any) => <p {...otherProps}>content</p>,
}));

initializeLibraries();

global.fetch = vi.fn();

const useTokenApprovalOriginalOutput = useTokenApproval(
  // These aren't used since useTokenApproval is mocked
  {
    token: xvs,
    spenderAddress: NULL_ADDRESS,
    accountAddress: NULL_ADDRESS,
  },
);

afterEach(() => {
  (useTokenApproval as Mock).mockImplementation(() => useTokenApprovalOriginalOutput);
});
