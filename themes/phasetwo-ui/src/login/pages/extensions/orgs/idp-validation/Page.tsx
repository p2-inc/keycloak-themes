import { Alert, AlertDescription } from "@/components/ui/alert";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { assert } from "tsafe/assert";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "idp-validation.ftl");

    const { msg } = useI18n();

    return (
        <Template
            displayInfo={false}
            displayMessage={false}
            headerNode={msg("validationSuccessTitle")}
        >
            <div id="kc-validation-message">
                <Alert variant="success" className="my-3">
                    <AlertDescription className="space-y-3">
                        {kcContext.message !== undefined && (
                            <p
                                dangerouslySetInnerHTML={{
                                    __html: kcSanitize(kcContext.message.summary),
                                }}
                            />
                        )}
                        <p>{msg("validationCloseWindow")}</p>
                    </AlertDescription>
                </Alert>
            </div>
        </Template>
    );
}
