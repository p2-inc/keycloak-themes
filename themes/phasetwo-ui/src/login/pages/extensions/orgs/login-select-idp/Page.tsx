import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { assert } from "tsafe/assert";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "login-select-idp.ftl");

    const { msg, msgStr } = useI18n();
    const [isSubmitting, setIsSubmitting] = useState(false);

    return (
        <Template displayInfo={false} headerNode={msg("selectIdpHeader")}>
            <form
                id="kc-form-login"
                className="space-y-4"
                action={kcContext.url.loginAction}
                method="post"
                onSubmit={() => {
                    setIsSubmitting(true);
                    return true;
                }}
            >
                <div className="space-y-2">
                    <label htmlFor="providerId" className="text-sm font-medium">
                        {msg("doSelectIdp")}
                    </label>
                    <Input
                        id="providerId"
                        name="providerId"
                        type="text"
                        autoFocus
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {msgStr("doSubmit")}
                </Button>
            </form>
        </Template>
    );
}
