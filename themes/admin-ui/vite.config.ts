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
      accountThemeImplementation: "none",
      themeName: ["admin-ui"],
      themeVersion: "0.0.1",
      keycloakifyBuildDirPath: path.resolve(
        dirname,
        "../../target/admin-ui-keycloakify",
      ),
      keycloakVersionTargets: {
        "22-to-25": false,
        "all-other-versions": "admin-ui-theme.jar",
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
