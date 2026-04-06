/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/pages/update-email/Page.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import { Button } from "@/components/ui/button";
import { LogoutOtherSessions } from "@/login/components/LogoutOtherSessions";
import { useI18n } from "@/login/i18n";
import { useKcContext } from "@/login/KcContext";
import { useState } from "react";
import { assert } from "tsafe/assert";
import { Template } from "../../components/Template";
import { UserProfileFormFields } from "../../components/UserProfileFormFields";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "update-email.ftl");

    const { msg, msgStr } = useI18n();

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);

    const { url, messagesPerField, isAppInitiatedAction } = kcContext;

    return (
        <Template
            displayMessage={messagesPerField.exists("global")}
            displayRequiredFields
            headerNode={msg("updateEmailTitle")}
        >
            <form
                id="kc-update-email-form"
                className="space-y-6"
                action={url.loginAction}
                method="post"
            >
                <UserProfileFormFields
                    onIsFormSubmittableValueChange={setIsFormSubmittable}
                />

                <LogoutOtherSessions />

                <div className="space-y-3">
                    <Button
                        disabled={!isFormSubmittable}
                        className="w-full"
                        type="submit"
                    >
                        {msgStr("doSubmit")}
                    </Button>
                    {isAppInitiatedAction && (
                        <Button
                            variant="outline"
                            className="w-full"
                            type="submit"
                            name="cancel-aia"
                            value="true"
                        >
                            {msg("doCancel")}
                        </Button>
                    )}
                </div>
            </form>
        </Template>
    );
}
