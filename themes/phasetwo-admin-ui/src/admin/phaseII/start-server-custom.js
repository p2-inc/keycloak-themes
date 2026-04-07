#!/usr/bin/env node

/**
 * Custom Keycloak Server Starter Script
 *
 * This script provides flexible options for starting a Keycloak server for development,
 * including support for Phase Two Keycloak containers and local development servers.
 *
 * USAGE:
 *   node start-server-custom.js [OPTIONS]
 *
 * OPTIONS:
 *   --phasetwo              Use Phase Two Keycloak Docker container instead of nightly build
 *   --tag=<version>         Specify Phase Two image tag (default: latest)
 *                           Example: --tag=26.0.2
 *   --admin-dev             Enable admin UI development mode (serves from http://localhost:5174)
 *   --account-dev           Enable account UI development mode (serves from http://localhost:5173)
 *   --local                 Use locally built Keycloak distribution
 *
 * EXAMPLES:
 *   # Start Phase Two container with admin dev mode
 *   node start-server-custom.js --phasetwo --admin-dev
 *
 *   # Start Phase Two container with specific tag
 *   node start-server-custom.js --phasetwo --tag=26.0.2 --admin-dev
 *
 *   # Start standard Keycloak nightly with admin dev mode
 *   node start-server-custom.js --admin-dev
 *
 *   # Start local build with both admin and account dev modes
 *   node start-server-custom.js --local --admin-dev --account-dev
 *
 * ENVIRONMENT VARIABLES:
 *   KC_BOOTSTRAP_ADMIN_USERNAME  Admin username (default: admin)
 *   KC_BOOTSTRAP_ADMIN_PASSWORD  Admin password (default: admin)
 *   KC_BOOTSTRAP_ADMIN_CLIENT_ID Client ID (default: admin-cli)
 *   KC_BOOTSTRAP_ADMIN_CLIENT_SECRET Client secret (default: none)
 *
 * NOTES:
 *   - When using --phasetwo, Docker must be installed and running
 *   - The --admin-dev flag sets KC_ADMIN_VITE_URL to point to local dev server
 *   - The --account-dev flag sets KC_ACCOUNT_VITE_URL to point to local dev server
 *   - Keycloak will be accessible at http://localhost:8080
 */

import { Octokit } from "@octokit/rest";
import gunzip from "gunzip-maybe";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { extract } from "tar-fs";
import { parseArgs } from "node:util";

const DIR_NAME = path.dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = path.resolve(DIR_NAME, "../server");
const LOCAL_QUARKUS = path.resolve(DIR_NAME, "../../../../quarkus/dist/target");
const LOCAL_DIST_NAME = "keycloak-999.0.0-SNAPSHOT.tar.gz";
const SCRIPT_EXTENSION = process.platform === "win32" ? ".bat" : ".sh";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin";
const CLIENT_ID = "temporary-admin-service";
const CLIENT_SECRET = "temporary-admin-service";

// Add a new option for custom image
const options = {
  local: {
    type: "boolean",
  },
  "account-dev": {
    type: "boolean",
  },
  "admin-dev": {
    type: "boolean",
  },
  phasetwo: {
    type: "boolean",
  },
  tag: {
    type: "string",
    default: "latest",
  },
};

await startServer();

async function startServer() {
  let { scriptArgs, keycloakArgs } = handleArgs(process.argv.slice(2));

  if (scriptArgs.phasetwo) {
    await startPhaseTwoContainer(
      scriptArgs.tag || "latest",
      keycloakArgs,
      scriptArgs,
    );
  } else {
    await downloadServer(scriptArgs.local);
    const env = {
      KC_BOOTSTRAP_ADMIN_USERNAME: ADMIN_USERNAME,
      KC_BOOTSTRAP_ADMIN_PASSWORD: ADMIN_PASSWORD,
      KC_BOOTSTRAP_ADMIN_CLIENT_ID: CLIENT_ID,
      KC_BOOTSTRAP_ADMIN_CLIENT_SECRET: CLIENT_SECRET,
      ...process.env,
    };

    if (scriptArgs["account-dev"]) {
      env.KC_ACCOUNT_VITE_URL = "http://localhost:5173";
    }

    if (scriptArgs["admin-dev"]) {
      env.KC_ADMIN_VITE_URL = "http://localhost:5174";
    }

    console.info("Starting server…");

    const child = spawn(
      path.join(SERVER_DIR, `bin/kc${SCRIPT_EXTENSION}`),
      [
        "start-dev",
        `--features="login:v2,account:v3,admin-fine-grained-authz:v2,transient-users,oid4vc-vci,organization,declarative-ui,quick-theme"`,
        ...keycloakArgs,
      ],
      {
        shell: true,
        env,
      },
    );

    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }
}

async function startPhaseTwoContainer(tag, keycloakArgs, scriptArgs) {
  const imageName = `quay.io/phasetwo/phasetwo-keycloak:${tag}`;

  const env = {
    KC_BOOTSTRAP_ADMIN_USERNAME: ADMIN_USERNAME,
    KC_BOOTSTRAP_ADMIN_PASSWORD: ADMIN_PASSWORD,
    KC_BOOTSTRAP_ADMIN_CLIENT_ID: CLIENT_ID,
    KC_BOOTSTRAP_ADMIN_CLIENT_SECRET: CLIENT_SECRET,
  };

  if (scriptArgs["account-dev"]) {
    env.KC_ACCOUNT_VITE_URL = "http://localhost:5173";
  }

  if (scriptArgs["admin-dev"]) {
    env.KC_ADMIN_VITE_URL = "http://localhost:5174";
  }

  const envArgs = Object.entries(env)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(" ");

  console.info(`Starting Phase Two Keycloak container: ${imageName}`);

  const dockerCommand = `docker run --rm -p 8080:8080 ${envArgs} ${imageName} start-dev --features="login:v2,account:v3,admin-fine-grained-authz:v2,transient-users,organization,oid4vc-vci,declarative-ui,quick-theme" ${keycloakArgs.join(
    " ",
  )}`;

  const child = spawn(dockerCommand, [], { shell: true });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
}

function handleArgs(args) {
  const { values, tokens } = parseArgs({
    args,
    options,
    strict: false,
    tokens: true,
  });
  // we need to remove the args that belong to the script so that we can pass the rest through to keycloak
  tokens
    .filter((token) => Object.hasOwn(options, token.name))
    .forEach((token) => {
      let tokenRaw = token.rawName;
      if (token.value) {
        tokenRaw += `=${token.value}`;
      }
      args.splice(args.indexOf(tokenRaw), 1);
    });
  return { scriptArgs: values, keycloakArgs: args };
}

async function downloadServer(local, phasetwo, tag = "latest") {
  const directoryExists = fs.existsSync(SERVER_DIR);

  if (directoryExists) {
    console.info("Server installation found, skipping download.");
    return;
  }

  let assetStream;
  if (local) {
    console.info(`Looking for ${LOCAL_DIST_NAME} at ${LOCAL_QUARKUS}`);
    assetStream = fs.createReadStream(
      path.join(LOCAL_QUARKUS, LOCAL_DIST_NAME),
    );
  } else if (phasetwo) {
    console.info(`Downloading Phase Two Keycloak image with tag: ${tag}...`);
    assetStream = await getPhaseTwoAssetAsStream(tag);
  } else {
    console.info("Downloading and extracting server…");
    const nightlyAsset = await getNightlyAsset();
    assetStream = await getAssetAsStream(nightlyAsset);
  }
  await extractTarball(assetStream, SERVER_DIR, { strip: 1 });
}

async function getNightlyAsset() {
  const api = new Octokit();
  const release = await api.repos.getReleaseByTag({
    owner: "keycloak",
    repo: "keycloak",
    tag: "nightly",
  });

  return release.data.assets.find(
    ({ name }) => name === "keycloak-999.0.0-SNAPSHOT.tar.gz",
  );
}

async function getAssetAsStream(asset) {
  const response = await fetch(asset.browser_download_url);

  if (!response.ok) {
    throw new Error("Something went wrong requesting the nightly release.");
  }

  return response.body;
}

// Add new function to get Phase Two asset
async function getPhaseTwoAssetAsStream(tag = "latest") {
  // You'll need to determine the correct download URL format for Phase Two
  // This might require checking their API or documentation
  const downloadUrl = `https://quay.io/v2/phasetwo/phasetwo-keycloak/manifests/${tag}`;

  // Note: Quay.io doesn't provide direct tarball downloads like GitHub releases
  // You might need to use Docker API or find an alternative approach
  console.error("Direct download from Quay.io not implemented yet");
  throw new Error(
    "Phase Two image download not implemented - consider using Docker instead",
  );
}

function extractTarball(stream, path, options) {
  return pipeline(stream, gunzip(), extract(path, options));
}
