# Setup Dev Environment
## Install pnpm as package manager
`
    npm i pnpm -g
`
## Install Dependencies
`
    pnpm i
`

# Extending the Theme
1. clone the repository
2. cd into keywind
3. apply changes to files
4. build jar-file and put it into your provider-folder within your keycloak instance

# Internal Development Cycle
Keywind uses tailwind to display the masks, therefore the project has to be generated first and pushed afterwards into the right folder.

SUGGESTION: remove all old files before running this command

`
    cd ./src/keywind_integration && npm run build
`