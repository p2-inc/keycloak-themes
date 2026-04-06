import { useEffect } from "react";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";

const RELOAD_DELAY = 5000;

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "view-email-continuation.ftl");

    const { msg } = useI18n();

    useEffect(() => {
        const timeoutId = setTimeout(() => window.location.reload(), RELOAD_DELAY);
        return () => clearTimeout(timeoutId);
    }, []);

    return (
        <Template
            displayInfo={false}
            displayMessage={false}
            headerNode={msg("viewEmailTitle")}
        >
            <p className="text-sm text-muted-foreground">
                {msg("magicLinkContinuationConfirmation")}
            </p>
        </Template>
    );
}
