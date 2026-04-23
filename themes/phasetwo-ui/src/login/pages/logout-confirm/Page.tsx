/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.20.
 * To relinquish ownership and restore this file to its original content, run the following command:
 * 
 * $ npx keycloakify own --path "login/pages/logout-confirm/Page.tsx" --revert
 */

import { Button } from "@/components/ui/button";
import { useI18n } from "@/login/i18n";
import { useKcContext } from "@/login/KcContext";
import { assert } from "tsafe/assert";
import { Template } from "../../components/Template";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "logout-confirm.ftl");

    const { url, client, logoutConfirm } = kcContext;

    const { msg, msgStr } = useI18n();
    return (
        <Template headerNode={msg("logoutConfirmTitle")}>
            <div className="space-y-4">
                <p className="text-foreground ">{msg("logoutConfirmHeader")}</p>

                <form
                    className="space-y-6"
                    action={url.logoutConfirmAction}
                    method="POST"
                >
                    <input type="hidden" name="session_code" value={logoutConfirm.code} />

                    <Button
                        tabIndex={4}
                        className="w-full"
                        name="confirmLogout"
                        id="kc-logout"
                        type="submit"
                    >
                        {msgStr("doLogout")}
                    </Button>
                </form>

                {!logoutConfirm.skipLink && client.baseUrl && (
                    <div className="flex justify-end">
                        <a
                            href={client.baseUrl}
                            className="text-sm text-primary hover:text-primary/80 underline underline-offset-4"
                        >
                            {msg("backToApplication")}
                        </a>
                    </div>
                )}
            </div>
        </Template>
    );
}
