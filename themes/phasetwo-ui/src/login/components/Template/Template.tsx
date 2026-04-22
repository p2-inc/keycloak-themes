/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.20.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/Template/Template.tsx" --revert
 */

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "@/login/components/ui/ThemeToggle";
import { redirectUrlOrigin } from "@/login/shared/redirectUrlOrigin";
import { kcSanitize } from "@keycloakify/login-ui/kcSanitize";
import { useKcClsx } from "@keycloakify/login-ui/useKcClsx";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import { RotateCcw, User } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { FiHome } from "react-icons/fi";
import { useI18n } from "../../i18n";
import { useKcContext } from "../../KcContext";
import { Languages } from "../ui/Langauges";
import fallbackLogo from "./../../assets/img/phasetwo-logo-light.svg";
import shape from "./../../assets/img/shape.svg";
import { useInitializeTemplate } from "./useInitializeTemplate";
import {
  useDynamicCss,
  useDynamicFavicon,
  useRealmAssetsBase,
} from "../../hooks/useDynamicCss";

export function Template(props: {
  displayInfo?: boolean;
  displayMessage?: boolean;
  displayRequiredFields?: boolean;
  headerNode: ReactNode;
  socialProvidersNode?: ReactNode;
  infoNode?: ReactNode;
  documentTitle?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const {
    displayInfo = false,
    displayMessage = true,
    displayRequiredFields = false,
    headerNode,
    socialProvidersNode = null,
    infoNode = null,
    documentTitle,
    bodyClassName,
    children,
  } = props;

  const { kcContext } = useKcContext();

  const { auth, url, message, isAppInitiatedAction } = kcContext;

  const { msg, msgStr, enabledLanguages } = useI18n();

  const { kcClsx } = useKcClsx();

  const assetsBase = useRealmAssetsBase(kcContext);
  const logoUrl = `${assetsBase}/assets/img/logo`;
  const [logoError, setLogoError] = useState(false);

  const realmDisplayName = kcContext.realm.displayName || kcContext.realm.name;

  useEffect(() => {
    document.title =
      documentTitle ??
      msgStr("loginTitle", kcContext.realm.displayName || kcContext.realm.name);
  }, []);

  useSetClassName({
    qualifiedName: "html",
    className: kcClsx("kcHtmlClass"),
  });

  useSetClassName({
    qualifiedName: "body",
    className: bodyClassName ?? kcClsx("kcBodyClass"),
  });

  useInitializeTemplate();
  useDynamicCss(kcContext);
  useDynamicFavicon(kcContext);

  return (
    <div className="grid min-h-svh lg:grid-cols-2 ">
      {/* Main content */}
      <div className="flex flex-col gap-4 px-0 py-0 pb-6 lg:p-6 lg:md:p-10 lg:pt-10 min-h-screen lg:min-h-0">
        {/*  navigation */}
        <div className="absolute top-4 inset-s-4 z-20 flex gap-2">
          <Button type="button" variant="outline" size="icon" asChild>
            <a href={kcContext.client?.baseUrl ?? redirectUrlOrigin}>
              <FiHome />
            </a>
          </Button>

          {kcContext.darkMode !== false && <ModeToggle />}

          {enabledLanguages.length > 1 && <Languages />}
        </div>

        <div className="flex flex-1 items-start lg:items-center justify-center flex-col ">
          <div className="w-full max-w-xl">
            <Card className="shadow-none bg-transparent lg:bg-card border-0 lg:rounded-lg lg:border lg:shadow-sm rounded-t-2xl">
              <CardHeader>
                <CardTitle>
                  {/* Mobile header with logo */}
                  <div className="lg:hidden relative mt-8">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="mb-4 flex items-center gap-3">
                        {!logoError ? (
                          <img
                            src={logoUrl}
                            alt={realmDisplayName}
                            className="h-10 max-w-50 object-contain"
                            onError={() => setLogoError(true)}
                          />
                        ) : (
                          <img
                            src={fallbackLogo}
                            alt={realmDisplayName}
                            className="h-10 max-w-50 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const node = !(
                      auth !== undefined &&
                      auth.showUsername &&
                      !auth.showResetCredentials
                    ) ? (
                      <h1 className="text-xl">{headerNode}</h1>
                    ) : (
                      <div
                        id="kc-username"
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex gap-4 items-center">
                          <User className="text-muted-foreground size-6" />

                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-normal text-muted-foreground">
                              {msgStr("attemptedUsernameLoggingInAs")}
                            </span>
                            <label
                              className="font-semibold text-lg"
                              id="kc-attempted-username"
                            >
                              {auth.attemptedUsername}
                            </label>
                          </div>
                        </div>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" asChild>
                                <a
                                  id="reset-login"
                                  href={url.loginRestartFlowUrl}
                                  aria-label={msgStr("restartLoginTooltip")}
                                >
                                  <RotateCcw className="size-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{msg("restartLoginTooltip")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );

                    if (displayRequiredFields) {
                      return (
                        <div className="flex items-center justify-between gap-2">
                          <div>{node}</div>
                          <div>
                            <span className="subtitle">
                              <span className="text-destructive">*</span>
                              {msg("requiredFields")}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return node;
                  })()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div id="kc-content" className="space-y-4">
                  {displayMessage &&
                    message !== undefined &&
                    (message.type !== "warning" || !isAppInitiatedAction) && (
                      <Alert variant={message.type}>
                        <AlertDescription>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: kcSanitize(message.summary),
                            }}
                          />
                        </AlertDescription>
                      </Alert>
                    )}
                  {socialProvidersNode}
                  {children}
                  {auth !== undefined && auth.showTryAnotherWayLink && (
                    <form
                      id="kc-select-try-another-way-form"
                      action={url.loginAction}
                      method="post"
                    >
                      <div className={kcClsx("kcFormGroupClass")}>
                        <input type="hidden" name="tryAnotherWay" value="on" />

                        <Button
                          type="button"
                          className="w-full"
                          variant="outline"
                          asChild
                        >
                          <a
                            href="#"
                            id="try-another-way"
                            onClick={(event) => {
                              document.forms[
                                "kc-select-try-another-way-form" as never
                              ].submit();
                              event.preventDefault();
                              return false;
                            }}
                          >
                            {msg("doTryAnotherWay")}
                          </a>
                        </Button>
                      </div>
                    </form>
                  )}
                  {displayInfo && (
                    <div className="text-center text-sm">{infoNode}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="bg-primary relative hidden lg:block dark:bg-primary/5">
        <div className="flex items-center pt-20 h-full justify-center z-1">
          <div className="absolute right-0 top-0 w-full max-w-62.5 xl:max-w-112.5">
            <img src={shape} alt="grid" />
          </div>
          <div className="absolute bottom-0 left-0 w-full max-w-62.5 rotate-180 xl:max-w-112.5">
            <img src={shape} alt="grid" />
          </div>

          <div className="flex justify-center my-auto flex-col items-center max-w-xs">
            <div className="mb-4 flex items-center gap-3">
              {!logoError ? (
                <img
                  src={logoUrl}
                  alt={realmDisplayName}
                  className="h-12 max-w-50 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <img
                  src={fallbackLogo}
                  alt={realmDisplayName}
                  className="h-12 max-w-50 object-contain"
                />
              )}
            </div>

            <p className="text-center text-primary-foreground/80">
              {msg("welcomeMessage")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
