import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "email-confirmation-error.ftl");

    const { msg } = useI18n();

    return (
        <Template
            displayInfo={false}
            displayMessage={false}
            headerNode={msg("magicLinkFailLoginTitle")}
        >
            <p className="text-sm text-muted-foreground">
                {msg("magicLinkFailLoginBody")}
            </p>
        </Template>
    );
}
