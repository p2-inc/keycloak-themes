/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/pages/login-idp-link-confirm-override/Page.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import { Button } from "@/components/ui/button";
import { useI18n } from "@/login/i18n";
import { useKcContext } from "@/login/KcContext";
import { assert } from "tsafe/assert";
import { Template } from "../../components/Template";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "login-idp-link-confirm-override.ftl");

    const { msg } = useI18n();

    return (
        <Template headerNode={msg("confirmOverrideIdpTitle")}>
            <form
                id="kc-register-form"
                action={kcContext.url.loginAction}
                className="flex flex-col gap-5"
                method="post"
            >
                <span>
                    {msg("pageExpiredMsg1")}{" "}
                    <a
                        className="text-primary dark:text-white underline underline-offset-2"
                        id="loginRestartLink"
                        href={kcContext.url.loginRestartFlowUrl}
                    >
                        {msg("doClickHere")}
                    </a>
                </span>

                <Button
                    type="submit"
                    className="w-full"
                    name="submitAction"
                    id="confirmOverride"
                    value="confirmOverride"
                >
                    {msg("confirmOverrideIdpContinue", kcContext.idpDisplayName)}
                </Button>
            </form>
        </Template>
    );
}
