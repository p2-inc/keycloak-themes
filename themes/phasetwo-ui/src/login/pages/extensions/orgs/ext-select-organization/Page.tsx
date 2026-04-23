import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { assert } from "tsafe/assert";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "ext-select-organization.ftl");

    const { msg, msgStr } = useI18n();
    const [selectedOrganization, setSelectedOrganization] = useState(
        kcContext.organizations[0]?.id ?? "",
    );

    return (
        <Template displayInfo={false} headerNode={msg("selectOrgHeader")}>
            <form
                id="kc-form-login"
                className="space-y-4"
                action={kcContext.url.loginAction}
                method="post"
            >
                <div className="space-y-2">
                    <label
                        htmlFor="select-organization"
                        className="text-sm font-medium"
                    >
                        {msg("selectOrganization")}
                    </label>
                    <Select
                        value={selectedOrganization}
                        onValueChange={setSelectedOrganization}
                    >
                        <SelectTrigger
                            id="select-organization"
                            className="w-full"
                        >
                            <SelectValue
                                placeholder={msg("selectOrganization")}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {kcContext.organizations.map((organization) => (
                                <SelectItem
                                    key={organization.id}
                                    value={organization.id}
                                >
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-muted-foreground" />
                                        {organization.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <input
                        type="hidden"
                        name="organizationId"
                        value={selectedOrganization}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    disabled={selectedOrganization.length === 0}
                >
                    {msgStr("doSubmit")}
                </Button>
            </form>
        </Template>
    );
}
