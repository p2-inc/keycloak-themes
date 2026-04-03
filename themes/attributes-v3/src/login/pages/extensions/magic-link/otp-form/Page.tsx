import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "otp-form.ftl");

    const { msg, msgStr } = useI18n();

    const { url, messagesPerField } = kcContext;

    return (
        <Template displayInfo headerNode={msg("otpFormTitle")}>
            <form
                id="kc-otp-login-form"
                className="space-y-4"
                action={url.loginAction}
                method="post"
            >
                <div className="space-y-2">
                    <Label htmlFor="otp">{msg("loginOtpOneTime")}</Label>
                    <Input
                        id="otp"
                        name="otp"
                        autoComplete="off"
                        type="text"
                        autoFocus
                        aria-invalid={
                            messagesPerField.existsError("totp")
                                ? "true"
                                : undefined
                        }
                    />
                    {messagesPerField.existsError("totp") && (
                        <p
                            id="input-error-otp-code"
                            className="text-sm text-destructive"
                            aria-live="polite"
                        >
                            {kcSanitize(
                                messagesPerField.getFirstError("totp"),
                            )}
                        </p>
                    )}
                </div>

                <div className="flex gap-2">
                    <Button type="submit" name="submit" id="kc-submit">
                        {msgStr("doSubmit")}
                    </Button>
                    <Button
                        type="submit"
                        name="resend"
                        id="kc-resend"
                        variant="outline"
                    >
                        {msgStr("doResend")}
                    </Button>
                </div>
            </form>
        </Template>
    );
}
