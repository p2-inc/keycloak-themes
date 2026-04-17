import react from "@vitejs/plugin-react";
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
      themeName: ["phasetwo-admin-ui"],
      themeVersion: "0.0.1",
      keycloakifyBuildDirPath: path.resolve(
        dirname,
        "../../target/phasetwo-admin-ui-keycloakify",
      ),
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": "phasetwo-admin-ui-theme.jar",
      },
      startKeycloakOptions: {
        dockerImage: "quay.io/phasetwo/phasetwo-keycloak:26.5.6",
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
});
