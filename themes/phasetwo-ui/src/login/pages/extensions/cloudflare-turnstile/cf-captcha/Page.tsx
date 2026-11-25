import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { assert } from "tsafe/assert";
import { Template } from "../../../../components/Template";
import { TurnstileWidget } from "../../../../components/TurnstileWidget";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";

// keycloak-magic-link's standalone "Cloudflare Turnstile validation" step. The submit button stays
// disabled until the challenge is solved, then the form submits itself. A failed check comes back
// as a global error message (captchaFailed).
export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "cf-captcha.ftl");

    const { msg, msgStr } = useI18n();

    const formRef = useRef<HTMLFormElement>(null);
    const [isSolved, setIsSolved] = useState(false);

    // Submit after the commit that put the token into the hidden input.
    useEffect(() => {
        if (isSolved) {
            formRef.current?.requestSubmit();
        }
    }, [isSolved]);

    return (
        <Template
            displayInfo={false}
            displayMessage={true}
            headerNode={msg("bpCaptchaTitle")}
        >
            <form
                id="kc-form-login"
                className="space-y-4"
                action={kcContext.url.loginAction}
                method="post"
                ref={formRef}
            >
                <p className="text-sm text-muted-foreground">
                    {msg("bpCaptchaInstruction")}
                </p>
                {kcContext.captchaRequired && (
                    <TurnstileWidget
                        siteKey={kcContext.captchaSiteKey}
                        action={kcContext.captchaAction}
                        language={kcContext.captchaLanguage}
                        onVerify={() => setIsSolved(true)}
                        onReset={() => setIsSolved(false)}
                    />
                )}
                <input
                    type="hidden"
                    id="id-hidden-input"
                    name="credentialId"
                    value={kcContext.auth?.selectedCredential ?? ""}
                />
                <Button
                    type="submit"
                    name="login"
                    id="kc-login"
                    disabled={!isSolved}
                    className="w-full"
                >
                    {msgStr("doContinue")}
                </Button>
            </form>
        </Template>
    );
}
