/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/components/LogoutOtherSessions.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/login/i18n";
import { Label } from "@radix-ui/react-label";

export function LogoutOtherSessions() {
    const { msg } = useI18n();

    return (
        <div className="flex items-center space-x-2">
            <Checkbox
                id="logout-sessions"
                name="logout-sessions"
                value="on"
                defaultChecked={true}
            />
            <Label
                htmlFor="logout-sessions"
                className="text-sm font-medium cursor-pointer"
            >
                {msg("logoutOtherSessions")}
            </Label>
        </div>
    );
}
