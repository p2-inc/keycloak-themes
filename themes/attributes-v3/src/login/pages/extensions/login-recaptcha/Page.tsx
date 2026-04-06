import { Button } from "@/components/ui/button";
import { Template } from "../../../components/Template";
import { useI18n } from "../../../i18n";
import { useKcContext } from "../../../KcContext";
import { assert } from "tsafe/assert";
import { useEffect, useRef, useState } from "react";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "login-recaptcha.ftl");

    const { msg } = useI18n();

    const { url, auth, realm, registrationDisabled, recaptchaSiteKey } =
        kcContext;

    const formRef = useRef<HTMLFormElement>(null);
    const [submitDisabled, setSubmitDisabled] = useState(true);
    const [recaptchaResponse, setRecaptchaResponse] = useState("");

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).handleRecaptcha = (arg: string) => {
            setSubmitDisabled(false);
            setRecaptchaResponse(arg);
            setTimeout(() => {
                formRef.current?.submit();
            }, 100);
        };

        return () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (window as any).handleRecaptcha;
        };
    }, []);

    return (
        <Template
            displayInfo={
                realm.password &&
                realm.registrationAllowed &&
                !registrationDisabled
            }
            displayMessage={false}
            headerNode={msg("doLogIn")}
        >
            <div className="space-y-4">
                <div
                    className="g-recaptcha"
                    data-callback="handleRecaptcha"
                    data-size="compact"
                    data-sitekey={recaptchaSiteKey}
                />
                <form
                    id="kc-form-login"
                    className="space-y-4"
                    action={url.loginAction}
                    method="post"
                    ref={formRef}
                >
                    <input
                        type="hidden"
                        name="credentialId"
                        value={auth.selectedCredential}
                    />
                    <input
                        type="hidden"
                        name="g-recaptcha-response"
                        value={recaptchaResponse}
                    />
                    <Button
                        type="submit"
                        name="login"
                        id="kc-login"
                        disabled={submitDisabled}
                        className="w-full"
                    >
                        {msg("doLogIn")}
                    </Button>
                </form>
            </div>
        </Template>
    );
}
