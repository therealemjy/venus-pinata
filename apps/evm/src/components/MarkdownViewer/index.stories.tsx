import type { Meta } from '@storybook/react';

import { MarkdownViewer } from '.';

export default {
  title: 'Components/Markdown/Viewer',
  component: MarkdownViewer,
} as Meta<typeof MarkdownViewer>;

export const Default = () => (
  <MarkdownViewer content="This markdown has an image but it isn't allowed ![alt text](https://cdn.mos.cms.futurecdn.net/RifjtkFLBEFgzkZqWEh69P-1024-80.jpg)" />
);
