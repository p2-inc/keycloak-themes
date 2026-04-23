/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { keycloakify } from "keycloakify/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    keycloakify({
      accountThemeImplementation: "Single-Page",
      themeName: ["phasetwo-ui"],
      themeVersion: "0.0.1",
      environmentVariables: [
        { name: "SHOW_DARK_MODE_TOGGLE", default: "false" },
      ],
      keycloakifyBuildDirPath: path.resolve(
        dirname,
        "../../target/phasetwo-ui",
      ),
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": "phasetwo-ui-theme.jar",
      },
      startKeycloakOptions: {
        dockerImage: "quay.io/phasetwo/phasetwo-keycloak:latest",
        keycloakExtraArgs: [
          "--spi-email-template-provider=freemarker-plus-mustache",
          "--spi-email-template-freemarker-plus-mustache-enabled=true",
          "--spi-theme-cache-themes=false",
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(dirname, "src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
});
