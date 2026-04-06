/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "components/langauges.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/login/i18n";
import { IoCheckmark, IoLanguage } from "react-icons/io5";
import { Button } from "./ui/button";

export function Languages() {
    const { msgStr, currentLanguage, enabledLanguages } = useI18n();

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        tabIndex={1}
                        variant="outline"
                        size="icon"
                        aria-label={msgStr("languages")}
                        aria-haspopup="true"
                        aria-expanded="false"
                        aria-controls="language-switch1"
                    >
                        <IoLanguage />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    id="language-switch1"
                    role="menu"
                    className="max-h-72 overflow-y-auto"
                >
                    {enabledLanguages.map(({ languageTag, label, href }, i) => {
                        const isActive = languageTag === currentLanguage.languageTag;

                        return (
                            <DropdownMenuItem key={languageTag} asChild>
                                <a
                                    role="menuitem"
                                    id={`language-${i + 1}`}
                                    href={href}
                                    className="flex w-full items-center justify-between  cursor-pointer"
                                >
                                    {label}
                                    {isActive && (
                                        <IoCheckmark className="h-4 w-4 opacity-50" />
                                    )}
                                </a>
                            </DropdownMenuItem>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
