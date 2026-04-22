#!/usr/bin/env node

if (typeof fetch !== "function") {
  throw new Error("This script requires Node.js 18+ with global fetch().");
}

const HELP_TEXT = `Seed organizations and users into a Phase Two / Keycloak realm.

Usage:
  node scripts/seed-orgs.mjs [options]

Options:
  --base-url <url>          Keycloak base URL. Default: http://localhost:8080
  --realm <realm>           Target realm for organizations and users. Default: myrealm
  --login-realm <realm>     Realm used to get an admin token. Default: master
  --client-id <id>          OIDC client id for the token request. Default: admin-cli
  --username <user>         Admin username for token retrieval
  --password <pass>         Admin password for token retrieval
  --token <token>           Existing bearer token. Skips username/password login
  --count <n>               Number of orgs to ensure exist. Default: 300
  --start-at <n>            Starting index for org naming. Default: 1
  --prefix <text>           Org name prefix. Default: seed-org
  --domain-suffix <text>    Org domain suffix. Default: example.test
  --no-domains              Do not send domains/url in the org payload
  --user-count <n>          Number of users to ensure exist. Default: 0
  --user-start-at <n>       Starting index for user naming. Default: 1
  --user-prefix <text>      Username prefix. Default: username
  --user-email-domain <d>   User email domain. Default: example.test
  --user-password <pass>    Password assigned to created users. Default: Password123!
  --concurrency <n>         Parallel create requests for each resource type. Default: 10
  --dry-run                 Show the plan without creating anything
  --help                    Show this help text

Environment variable equivalents:
  KEYCLOAK_BASE_URL, KEYCLOAK_REALM, KEYCLOAK_LOGIN_REALM, KEYCLOAK_CLIENT_ID
  KEYCLOAK_USERNAME, KEYCLOAK_PASSWORD, KEYCLOAK_TOKEN
  ORG_COUNT, ORG_START_AT, ORG_PREFIX, ORG_DOMAIN_SUFFIX
  USER_COUNT, USER_START_AT, USER_PREFIX, USER_EMAIL_DOMAIN, USER_PASSWORD
  ORG_CONCURRENCY

Examples:
  KEYCLOAK_USERNAME=admin KEYCLOAK_PASSWORD=admin \\
  node scripts/seed-orgs.mjs --realm myrealm

  node scripts/seed-orgs.mjs --realm myrealm --count 0 --user-count 300

  node scripts/seed-orgs.mjs --realm myrealm --count 300 --user-count 300
`;

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index++) {
    const current = argv[index];

    if (current === "--help") {
      args.help = true;
      continue;
    }

    if (current === "--no-domains") {
      args.includeDomains = false;
      continue;
    }

    if (current === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (!current.startsWith("--")) {
      throw new Error(`Unexpected argument: ${current}`);
    }

    const [flag, inlineValue] = current.split("=", 2);
    const value =
      inlineValue !== undefined ? inlineValue : argv[index + 1] ?? undefined;

    if (inlineValue === undefined) {
      index += 1;
    }

    if (!value) {
      throw new Error(`Missing value for ${flag}`);
    }

    switch (flag) {
      case "--base-url":
        args.baseUrl = value;
        break;
      case "--realm":
        args.realm = value;
        break;
      case "--login-realm":
        args.loginRealm = value;
        break;
      case "--client-id":
        args.clientId = value;
        break;
      case "--username":
        args.username = value;
        break;
      case "--password":
        args.password = value;
        break;
      case "--token":
        args.token = value;
        break;
      case "--count":
        args.orgCount = value;
        break;
      case "--start-at":
        args.orgStartAt = value;
        break;
      case "--prefix":
        args.orgPrefix = value;
        break;
      case "--domain-suffix":
        args.orgDomainSuffix = value;
        break;
      case "--user-count":
        args.userCount = value;
        break;
      case "--user-start-at":
        args.userStartAt = value;
        break;
      case "--user-prefix":
        args.userPrefix = value;
        break;
      case "--user-email-domain":
        args.userEmailDomain = value;
        break;
      case "--user-password":
        args.userPassword = value;
        break;
      case "--concurrency":
        args.concurrency = value;
        break;
      default:
        throw new Error(`Unknown flag: ${flag}`);
    }
  }

  return args;
}

function parseNonNegativeInteger(name, value) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `${name} must be a non-negative integer. Received: ${value}`,
    );
  }

  return parsed;
}

function parsePositiveInteger(name, value) {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer. Received: ${value}`);
  }

  return parsed;
}

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function readMaybeEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

function buildConfig(rawArgs) {
  const orgCount = parseNonNegativeInteger(
    "orgCount",
    rawArgs.orgCount ?? readMaybeEnv("ORG_COUNT", "300"),
  );
  const userCount = parseNonNegativeInteger(
    "userCount",
    rawArgs.userCount ?? readMaybeEnv("USER_COUNT", "0"),
  );

  return {
    baseUrl: normalizeBaseUrl(
      rawArgs.baseUrl ??
        readMaybeEnv("KEYCLOAK_BASE_URL", "http://localhost:8080"),
    ),
    realm: rawArgs.realm ?? readMaybeEnv("KEYCLOAK_REALM", "myrealm"),
    loginRealm:
      rawArgs.loginRealm ?? readMaybeEnv("KEYCLOAK_LOGIN_REALM", "master"),
    clientId:
      rawArgs.clientId ?? readMaybeEnv("KEYCLOAK_CLIENT_ID", "admin-cli"),
    username: rawArgs.username ?? readMaybeEnv("KEYCLOAK_USERNAME", undefined),
    password: rawArgs.password ?? readMaybeEnv("KEYCLOAK_PASSWORD", undefined),
    token: rawArgs.token ?? readMaybeEnv("KEYCLOAK_TOKEN", undefined),
    orgCount,
    orgStartAt: parsePositiveInteger(
      "orgStartAt",
      rawArgs.orgStartAt ?? readMaybeEnv("ORG_START_AT", "1"),
    ),
    orgPrefix: rawArgs.orgPrefix ?? readMaybeEnv("ORG_PREFIX", "seed-org"),
    orgDomainSuffix:
      rawArgs.orgDomainSuffix ??
      readMaybeEnv("ORG_DOMAIN_SUFFIX", "example.test"),
    includeDomains: rawArgs.includeDomains ?? true,
    userCount,
    userStartAt: parsePositiveInteger(
      "userStartAt",
      rawArgs.userStartAt ?? readMaybeEnv("USER_START_AT", "1"),
    ),
    userPrefix: rawArgs.userPrefix ?? readMaybeEnv("USER_PREFIX", "username"),
    userEmailDomain:
      rawArgs.userEmailDomain ??
      readMaybeEnv("USER_EMAIL_DOMAIN", "example.test"),
    userPassword:
      rawArgs.userPassword ??
      readMaybeEnv(
        "USER_PASSWORD",
        userCount > 0 ? "Password123!" : undefined,
      ),
    concurrency: parsePositiveInteger(
      "concurrency",
      rawArgs.concurrency ?? readMaybeEnv("ORG_CONCURRENCY", "10"),
    ),
    dryRun: rawArgs.dryRun ?? false,
  };
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => undefined);

    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      return (
        data.error ||
        data.errorMessage ||
        data.message ||
        JSON.stringify(data)
      );
    }
  }

  return (await response.text().catch(() => "")).trim();
}

async function getAccessToken(config) {
  if (config.token) {
    return config.token;
  }

  if (!config.username || !config.password) {
    throw new Error(
      "Set KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD, or pass --token.",
    );
  }

  const tokenUrl = `${config.baseUrl}/realms/${config.loginRealm}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    client_id: config.clientId,
    grant_type: "password",
    username: config.username,
    password: config.password,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const message = await readResponseBody(response);
    throw new Error(
      `Token request failed with ${response.status}: ${message || response.statusText}`,
    );
  }

  const json = await response.json();

  if (!json.access_token) {
    throw new Error("Token response did not include access_token.");
  }

  return json.access_token;
}

async function fetchExistingOrgNames(config, token) {
  const pageSize = 100;
  const names = new Set();
  let first = 0;

  while (true) {
    const url = `${config.baseUrl}/realms/${config.realm}/orgs?first=${first}&max=${pageSize}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await readResponseBody(response);
      throw new Error(
        `Failed to fetch existing orgs with ${response.status}: ${message || response.statusText}`,
      );
    }

    const orgs = await response.json();

    if (!Array.isArray(orgs)) {
      throw new Error("Expected the org list response to be an array.");
    }

    for (const org of orgs) {
      if (org?.name) {
        names.add(org.name);
      }
    }

    if (orgs.length < pageSize) {
      break;
    }

    first += pageSize;
  }

  return names;
}

async function fetchExistingUsernames(config, token) {
  const pageSize = 100;
  const usernames = new Set();
  let first = 0;

  while (true) {
    const url =
      `${config.baseUrl}/admin/realms/${config.realm}/users` +
      `?first=${first}&max=${pageSize}&briefRepresentation=true`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const message = await readResponseBody(response);
      throw new Error(
        `Failed to fetch existing users with ${response.status}: ${message || response.statusText}`,
      );
    }

    const users = await response.json();

    if (!Array.isArray(users)) {
      throw new Error("Expected the user list response to be an array.");
    }

    for (const user of users) {
      if (typeof user?.username === "string") {
        usernames.add(user.username);
      }
    }

    if (users.length < pageSize) {
      break;
    }

    first += pageSize;
  }

  return usernames;
}

function buildOrgPayload(config, width, number) {
  const suffix = String(number).padStart(width, "0");
  const name = slugify(`${config.orgPrefix}-${suffix}`);

  if (!name) {
    throw new Error(
      `Generated org name was empty. Check prefix "${config.orgPrefix}".`,
    );
  }

  const payload = {
    realm: config.realm,
    name,
    displayName: `Seed Org ${suffix}`,
    url: "",
    domains: [],
  };

  if (config.includeDomains) {
    const domain = `${name}.${config.orgDomainSuffix}`.replace(/\.\.+/g, ".");
    payload.url = `https://${domain}`;
    payload.domains = [domain];
  }

  return payload;
}

function buildUserPayload(config, width, number) {
  const suffix = String(number);
  const username = slugify(`${config.userPrefix}-${suffix}`);

  if (!username) {
    throw new Error(
      `Generated username was empty. Check prefix "${config.userPrefix}".`,
    );
  }

  return {
    username,
    email: `${username}@${config.userEmailDomain}`,
    firstName: "Seed",
    lastName: `User ${suffix}`,
    enabled: true,
    emailVerified: true,
  };
}

async function createOrg(config, token, org) {
  const url = `${config.baseUrl}/realms/${config.realm}/orgs`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(org),
  });

  if (response.ok) {
    return { status: "created" };
  }

  const message = await readResponseBody(response);

  if (response.status === 409) {
    return { status: "skipped", message: message || "already exists" };
  }

  throw new Error(
    `Create failed with ${response.status}: ${message || response.statusText}`,
  );
}

function extractIdFromLocation(location) {
  if (!location) {
    return undefined;
  }

  const parts = location.split("/").filter(Boolean);
  return parts.at(-1);
}

async function findUserIdByUsername(config, token, username) {
  const url =
    `${config.baseUrl}/admin/realms/${config.realm}/users` +
    `?username=${encodeURIComponent(username)}&exact=true`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await readResponseBody(response);
    throw new Error(
      `Failed to resolve user ID with ${response.status}: ${message || response.statusText}`,
    );
  }

  const users = await response.json();

  if (!Array.isArray(users)) {
    throw new Error("Expected the user lookup response to be an array.");
  }

  const match = users.find((user) => user?.username === username);
  return match?.id;
}

async function setUserPassword(config, token, userId, password) {
  const url =
    `${config.baseUrl}/admin/realms/${config.realm}/users/${userId}` +
    "/reset-password";
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: "password",
      value: password,
      temporary: false,
    }),
  });

  if (!response.ok) {
    const message = await readResponseBody(response);
    throw new Error(
      `Password reset failed with ${response.status}: ${message || response.statusText}`,
    );
  }
}

async function createUser(config, token, user) {
  const url = `${config.baseUrl}/admin/realms/${config.realm}/users`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(user),
  });

  if (response.ok) {
    if (config.userPassword) {
      let userId = extractIdFromLocation(response.headers.get("location"));

      if (!userId) {
        userId = await findUserIdByUsername(config, token, user.username);
      }

      if (!userId) {
        throw new Error(
          `User ${user.username} was created but no user ID was returned.`,
        );
      }

      await setUserPassword(config, token, userId, config.userPassword);
    }

    return { status: "created" };
  }

  const message = await readResponseBody(response);

  if (response.status === 409) {
    return { status: "skipped", message: message || "already exists" };
  }

  throw new Error(
    `Create failed with ${response.status}: ${message || response.statusText}`,
  );
}

async function runPool(items, concurrency, worker) {
  const limit = Math.min(concurrency, Math.max(items.length, 1));
  let cursor = 0;

  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (true) {
        const current = cursor;
        cursor += 1;

        if (current >= items.length) {
          return;
        }

        await worker(items[current], current);
      }
    }),
  );
}

function printConfig(config) {
  console.log("Seeding realm data with config:");
  console.log(`  Base URL:          ${config.baseUrl}`);
  console.log(`  Target realm:      ${config.realm}`);
  console.log(`  Login realm:       ${config.loginRealm}`);
  console.log(`  Client ID:         ${config.clientId}`);
  console.log(`  Org count:         ${config.orgCount}`);
  console.log(`  Org start at:      ${config.orgStartAt}`);
  console.log(`  Org prefix:        ${config.orgPrefix}`);
  console.log(
    `  Org domains:       ${config.includeDomains ? config.orgDomainSuffix : "disabled"}`,
  );
  console.log(`  User count:        ${config.userCount}`);
  console.log(`  User start at:     ${config.userStartAt}`);
  console.log(`  User prefix:       ${config.userPrefix}`);
  console.log(`  User email domain: ${config.userEmailDomain}`);
  if (config.userCount > 0) {
    console.log(
      `  User password:     ${config.userPassword ?? "not set during creation"}`,
    );
  }
  console.log(`  Concurrency:       ${config.concurrency}`);
  console.log(`  Dry run:           ${config.dryRun ? "yes" : "no"}`);
}

function buildRequestedEntities(count, startAt, builder) {
  const requested = [];

  if (count === 0) {
    return requested;
  }

  const finalIndex = startAt + count - 1;
  const width = String(finalIndex).length;

  for (let number = startAt; number <= finalIndex; number++) {
    requested.push(builder(width, number));
  }

  return requested;
}

async function seedOrganizations(config, token) {
  if (config.orgCount === 0) {
    console.log('Skipping organizations because org count is 0.');
    return { created: 0, skipped: 0, failures: [] };
  }

  const existingNames = await fetchExistingOrgNames(config, token);
  const requestedOrgs = buildRequestedEntities(
    config.orgCount,
    config.orgStartAt,
    (width, number) => buildOrgPayload(config, width, number),
  );
  const toCreate = requestedOrgs.filter((org) => !existingNames.has(org.name));
  const skippedBeforeCreate = requestedOrgs.length - toCreate.length;

  console.log(
    `Found ${existingNames.size} existing orgs in realm "${config.realm}".`,
  );
  console.log(
    `Prepared ${requestedOrgs.length} orgs. ${skippedBeforeCreate} already exist, ${toCreate.length} need creation.`,
  );

  if (config.dryRun) {
    return { created: 0, skipped: skippedBeforeCreate, failures: [] };
  }

  let created = 0;
  let skipped = skippedBeforeCreate;
  const failures = [];

  await runPool(toCreate, config.concurrency, async (org, index) => {
    try {
      const result = await createOrg(config, token, org);

      if (result.status === "created") {
        created += 1;
        console.log(`[org ${index + 1}/${toCreate.length}] created ${org.name}`);
        return;
      }

      skipped += 1;
      console.log(
        `[org ${index + 1}/${toCreate.length}] skipped ${org.name} (${result.message})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: org.name, message });
      console.error(
        `[org ${index + 1}/${toCreate.length}] failed ${org.name}: ${message}`,
      );
    }
  });

  return { created, skipped, failures };
}

async function seedUsers(config, token) {
  if (config.userCount === 0) {
    console.log('Skipping users because user count is 0.');
    return { created: 0, skipped: 0, failures: [] };
  }

  const existingUsernames = await fetchExistingUsernames(config, token);
  const requestedUsers = buildRequestedEntities(
    config.userCount,
    config.userStartAt,
    (width, number) => buildUserPayload(config, width, number),
  );
  const toCreate = requestedUsers.filter(
    (user) => !existingUsernames.has(user.username),
  );
  const skippedBeforeCreate = requestedUsers.length - toCreate.length;

  console.log(
    `Found ${existingUsernames.size} existing users in realm "${config.realm}".`,
  );
  console.log(
    `Prepared ${requestedUsers.length} users. ${skippedBeforeCreate} already exist, ${toCreate.length} need creation.`,
  );

  if (config.dryRun) {
    return { created: 0, skipped: skippedBeforeCreate, failures: [] };
  }

  let created = 0;
  let skipped = skippedBeforeCreate;
  const failures = [];

  await runPool(toCreate, config.concurrency, async (user, index) => {
    try {
      const result = await createUser(config, token, user);

      if (result.status === "created") {
        created += 1;
        console.log(
          `[user ${index + 1}/${toCreate.length}] created ${user.username}`,
        );
        return;
      }

      skipped += 1;
      console.log(
        `[user ${index + 1}/${toCreate.length}] skipped ${user.username} (${result.message})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: user.username, message });
      console.error(
        `[user ${index + 1}/${toCreate.length}] failed ${user.username}: ${message}`,
      );
    }
  });

  return { created, skipped, failures };
}

function printSummary(label, summary) {
  console.log(`${label}:`);
  console.log(`  Created: ${summary.created}`);
  console.log(`  Skipped: ${summary.skipped}`);
  console.log(`  Failed:  ${summary.failures.length}`);

  if (summary.failures.length > 0) {
    console.log("  Failure details:");
    for (const failure of summary.failures) {
      console.log(`    ${failure.name}: ${failure.message}`);
    }
  }
}

async function main() {
  const rawArgs = parseArgs(process.argv.slice(2));

  if (rawArgs.help) {
    console.log(HELP_TEXT);
    return;
  }

  const config = buildConfig(rawArgs);

  if (config.orgCount === 0 && config.userCount === 0) {
    console.log("Nothing to do. Both org count and user count are 0.");
    return;
  }

  printConfig(config);

  const token = await getAccessToken(config);
  const orgSummary = await seedOrganizations(config, token);
  const userSummary = await seedUsers(config, token);

  console.log("");
  console.log("Seed summary:");
  printSummary("Organizations", orgSummary);
  printSummary("Users", userSummary);

  if (orgSummary.failures.length > 0 || userSummary.failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
