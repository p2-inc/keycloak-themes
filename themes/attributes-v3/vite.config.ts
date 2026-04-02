/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { keycloakify } from "keycloakify/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), keycloakify({
    accountThemeImplementation: "none",
    themeName: ["attributes-v3"],
    themeVersion: "0.0.1",
    keycloakifyBuildDirPath: path.resolve(dirname, "../../target/attributes-v3-keycloakify"),
    keycloakVersionTargets: {
      "22-to-25": false,
      "all-other-versions": "attributes-v3-theme.jar"
    }
  }), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src")
    }
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        },
        setupFiles: ['.storybook/vitest.setup.ts']
      }
    }]
  }
});
