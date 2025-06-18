

import { join, dirname } from "path";

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')))
}

/** @type { import('@storybook/html-vite').StorybookConfig } */
const config = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials")
  ],
  "framework": {
    "name": getAbsolutePath('@storybook/html-vite'),
    "options": {}
  },
  "core": {
    "disableTelemetry": true
  }
};

export default config;
