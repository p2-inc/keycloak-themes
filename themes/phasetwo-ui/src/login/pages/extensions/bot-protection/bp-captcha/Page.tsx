import { Button } from "@/components/ui/button";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";

// The CAPTCHA step of keycloak-bot-protection. The widget is not rendered here: the extension
// adds its loader script to kcContext.scripts, and the loader inserts the widget into the form
// with id kc-bp-captcha-form, before the submit button.
export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "bp-captcha.ftl");

    const { msg } = useI18n();

    return (
        <Template
            displayInfo={false}
            displayMessage={true}
            headerNode={msg("bpCaptchaTitle")}
        >
            <form
                id="kc-bp-captcha-form"
                className="space-y-4"
                action={kcContext.url.loginAction}
                method="post"
            >
                <p className="text-sm text-muted-foreground">
                    {msg("bpCaptchaInstruction")}
                </p>
                <Button
                    type="submit"
                    name="continue"
                    id="kc-bp-captcha-continue"
                    className="w-full"
                >
                    {msg("bpContinue")}
                </Button>
            </form>
        </Template>
    );
}
