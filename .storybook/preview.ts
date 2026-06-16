import { withCanvas } from './decorators/withCanvas';

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Default canvas options
    canvas: {
      engineOptions: {
        // Default engine options here
      }
    },
    layout: 'fullscreen',
  },
  decorators: [withCanvas]
};

export default preview;
