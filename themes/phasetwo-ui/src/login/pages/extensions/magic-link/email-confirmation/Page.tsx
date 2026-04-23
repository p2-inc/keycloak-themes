import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "email-confirmation.ftl");

    const { msg } = useI18n();

    const { magicLinkContinuation } = kcContext;

    return (
        <Template
            displayInfo={false}
            displayMessage={false}
            headerNode={msg("magicLinkSuccessfulLoginTitle")}
        >
            {magicLinkContinuation.sameBrowser && (
                <div className="space-y-4 text-sm text-muted-foreground">
                    <p>{msg("magicLinkSuccessfulLoginBody")}</p>
                    <a
                        href={magicLinkContinuation.url}
                        className="text-primary underline"
                    >
                        {msg("loginPage")}
                    </a>
                </div>
            )}
        </Template>
    );
}
