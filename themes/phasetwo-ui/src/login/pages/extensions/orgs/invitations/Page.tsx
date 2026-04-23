import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import { assert } from "tsafe/assert";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "invitations.ftl");

    const { msg } = useI18n();

    const { url, invitations } = kcContext;

    return (
        <Template
            displayInfo={false}
            displayMessage={false}
            headerNode={msg("invitationTitle")}
        >
            <p className="text-sm text-muted-foreground mb-4">
                {msg("invitationBody")}
            </p>
            <form
                className="space-y-6"
                action={url.loginAction}
                method="POST"
            >
                <div className="space-y-3">
                    {invitations.orgs.map((org) => (
                        <div
                            key={org.id}
                            className="flex items-center space-x-2"
                        >
                            <Checkbox
                                name="orgs"
                                value={org.id}
                                defaultChecked
                                id={`org-${org.id}`}
                            />
                            <Label htmlFor={`org-${org.id}`}>
                                {org.displayName}
                            </Label>
                        </div>
                    ))}
                </div>
                <Button type="submit" name="accept" id="kc-accept">
                    {msg("doAccept")}
                </Button>
            </form>
        </Template>
    );
}
