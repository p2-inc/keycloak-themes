import { cn } from "@/components/lib/utils";
import { Button } from "@/components/ui/button";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { clsx } from "@keycloakify/login-ui/tools/clsx";
import { useKcClsx } from "@keycloakify/login-ui/useKcClsx";
import { assert } from "tsafe/assert";
import { Template } from "../../../../components/Template";
import { useI18n } from "../../../../i18n";
import { useKcContext } from "../../../../KcContext";
import useProviderLogos from "../../../default/login/useProviderLogos";

export function Page() {
    const { kcContext } = useKcContext();
    assert(kcContext.pageId === "hidpd-select-idp.ftl");

    const providerLogos = useProviderLogos();
    const { msg } = useI18n();
    const { kcClsx } = useKcClsx();

    const providers = kcContext.hidpd.providers;

    return (
        <Template
            displayInfo={false}
            displayMessage={!kcContext.messagesPerField.existsError("username")}
            headerNode={msg("loginAccountTitle")}
        >
            {providers.length > 0 && (
                <div
                    id="kc-social-providers"
                    className={kcClsx("kcFormSocialAccountSectionClass")}
                >
                    <div className="mt-4 flex items-center text-sm">
                        <div className="mt-px flex-auto border-t" />
                        <div className="text-muted-foreground mx-2">
                            {msg(
                                "home-idp-discovery-identity-provider-login-label",
                            )}
                        </div>
                        <div className="mt-px flex-auto border-t" />
                    </div>
                    <ul
                        className={`mt-4! grid gap-3 sm:grid-cols-1 ${providers.length > 3 ? "sm:grid-cols-2" : ""}`}
                    >
                        {providers.map((provider) => (
                            <li key={provider.alias}>
                                <Button
                                    variant="outline"
                                    className="w-full hover:text-current"
                                    asChild
                                >
                                    <a
                                        id={`social-${provider.alias}`}
                                        className={clsx(
                                            kcClsx(
                                                providers.length > 3 &&
                                                    "kcFormSocialAccountGridItem",
                                            ),
                                            "flex items-center justify-center gap-3",
                                        )}
                                        href={provider.loginUrl}
                                    >
                                        <div className="h-5 w-5">
                                            {providerLogos[provider.alias] ? (
                                                <img
                                                    src={
                                                        providerLogos[
                                                            provider.alias
                                                        ]
                                                    }
                                                    alt={`${provider.displayName} logo`}
                                                    className={cn(
                                                        "h-full w-auto",
                                                        (provider.alias ===
                                                            "github" ||
                                                            provider.alias ===
                                                                "x" ||
                                                            provider.alias ===
                                                                "twitter") &&
                                                            "dark:invert",
                                                    )}
                                                />
                                            ) : (
                                                provider.iconClasses && (
                                                    <i
                                                        className={clsx(
                                                            kcClsx(
                                                                "kcCommonLogoIdP",
                                                            ),
                                                            provider.iconClasses,
                                                        )}
                                                        aria-hidden="true"
                                                    />
                                                )
                                            )}
                                        </div>
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: kcSanitize(
                                                    provider.displayName,
                                                ),
                                            }}
                                        />
                                    </a>
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </Template>
    );
}
