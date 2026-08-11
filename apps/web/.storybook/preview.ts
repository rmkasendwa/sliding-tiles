import type { Preview } from '@storybook/react-vite';

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
  },
};

export default preview;
