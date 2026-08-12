import type { Preview } from '@storybook/react-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import '../app/globals.css';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#0f1714' },
        { name: 'panel', value: '#f6f1e8' },
      ],
    },
    controls: {
      expanded: true,
    },
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
      viewports: MINIMAL_VIEWPORTS,
    },
  },
};

export default preview;
