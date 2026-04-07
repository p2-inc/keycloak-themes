# Phase Two Customizations

## Running App

From the theme directory, start Keycloak with the correct Phase Two image automatically:

```bash
pnpm start-keycloak
```

Docker must be installed and running.

## Customizations

Phase Two has added additional functionality to the Admin UI. Those additions live in this `phaseII` folder and are integrated into the owned files listed below. Keycloakify handles keeping the base admin UI up to date — no tag syncing or branching from upstream KC is required.

### Updating Phase II Customizations

When a new Keycloak version is released, the Phase II customizations need to be reapplied to the new version. The steps below outline how to do that.

- Copy the `phaseII` folder into the new fork made from the newest KC tag release. This should go into the `js/apps/admin-ui/src`.
- Copy `start-server-custom.js` and replace contents of `start-server.js`
- Building
  - Make sure to merge all changes in the `admin-ui/pom.xml` file so that the correct name and resources are built.

  ```
  <groupId>io.phasetwo</groupId>
    <artifactId>phasetwo-admin-ui</artifactId>
    <version>26.1.2</version>

    <properties>
        <admin-ui.theme.name>phasetwo.v2</admin-ui.theme.name>
    </properties>
  ```

- Install
  - `react-colorful`
- `PageNav.tsx`
  - Extensions nav group imported from the `phaseII/navigation` folder
  - Export Left Nav for use in the `extensions` file.
  - Add the `<Extensions />` component to the Nav
- `src/context/access/Access.tsx`
  - Import `ExtendedAccessType` from `phaseII/access/access.tsx`
  - Adjust the functions to use that type, from `AccessType` to `ExtendedAccessType`
  - Cast the access var to `ExtendedAccessType`: `const access = whoAmI.realm_access[realm] as ExtendedAccessType[] ?? [];`
- Include the routes for the Phase II orgs and styles in `admin-ui/src/routes`
- Translations
  - In `admin-ui/maven-resources/theme/keycloak.v2/` change the directory name to `phasetwo.v2`
    - For local dev `admin-ui/maven-resources-community/theme/keycloak.v2/` change the directory name to `phasetwo.v2` (this will have to be reverted before doing a build)
  - In `admin-ui/maven-resources/META-INF/keycloak-themes.json` rename `keycloak.v2` to `phasetwo.v2`
  - At the bottom of `admin-ui/maven-resources/theme/phasetwo.v2/admin/messages/messages_en.properties` append the section called "phasetwo additions". This must be **added** to the current Keycloak version, as they change a lot of things every release.
  - Update the `vite.config.ts` to point ot the right theme: `phasetwo.v2` instead of `keycloak.v2`: important for local dev, doesn't affect the build.
- In `vite.config.ts` update `outDir` to be `phasetwo.v2` instead of `keycloak.v2`
- Orgs
  - This folder contains all the Orgs UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
  - Check all references and imports for changes in location. The KC maintainers have a tendency to move these around a lot. Confirm the imports have also not changed functionality.
- User
  - This folder contains a new tab for the User details view.
  - In `admin-ui/src/user/routes/User.tsx` > UserTab add `user-orgs`
  - In `admin-ui/src/user/EditUser.tsx` import `UserOrgs`, add the `userOrgsTab` and add the `<Tab><UsersOrgs />...`
- Custom Styles
  - This folder contains all the Custom Styles UI. It exists mostly independent of other code, but does import components from the `ui-shared` and the `src/components` folder.
- Realm Settings Attributes Tab `RealmSettingsTabs.tsx`
  - A tab to allow setting and configuring the realm settings.
  - Needs to be imported and added as a tab in `../realm-settings/RealmSettingsTabs.tsx`
  - Add `attributes` as a tab option to the type def in `../realm-settings/routes/RealmSettings.tsx`
- Help URLs
  - In the `/js/apps/admin-ui/src/help-urls.ts` file import `PhaseTwoHelpUrls` and spread it into the object
- In the `/js/apps/admin-ui/src/identity-providers/IdentityProviderSection.tsx` file, update the `OrganizationLink` function to use the function to create a Phase Two Org link.
- In the `js/apps/admin-ui/src/realm-settings/GeneralTab.tsx` file, update the `ClipboardCopy` element to include the `isReadOnly` prop to prevent editing the realm name.

#### phaseII folder contents

- **orgs** — Organizations UI, mostly independent; imports from `ui-shared` and `src/components`
- **custom-styles** — Custom Styles UI, mostly independent; imports from `ui-shared` and `src/components`
- **navigation** — Extensions nav group component
- **access** — `ExtendedAccessType` extending KC's `AccessType` with org permissions
- **user** — `UserOrgs` tab component for the user details view
- **realm-settings** — Realm attributes tab component

## Building

Follow the build instructions in the root README.
