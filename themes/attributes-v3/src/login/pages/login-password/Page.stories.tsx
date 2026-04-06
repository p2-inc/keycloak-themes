/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/pages/login-password/Page.stories.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import { createKcPageStory, type Meta, type StoryObj } from "../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({ pageId: "login-password.ftl" });

const meta = {
    title: "login/login-password.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPasswordError: Story = {
    args: {
        kcContext: {
            realm: {
                resetPasswordAllowed: true
            },
            url: {
                loginAction: "/mock-login",
                loginResetCredentialsUrl: "/mock-reset-password"
            },
            messagesPerField: {
                existsError: (field: string) => field === "password",
                get: () => "Invalid password"
            }
        }
    }
};

export const Arabic: Story = {
    args: {
        kcContext: {
            locale: {
                currentLanguageTag: "ar",
                rtl: true
            }
        }
    }
};
export const French: Story = {
    args: {
        kcContext: {
            locale: {
                currentLanguageTag: "fr"
            }
        }
    }
};

export const WithWebauthn: Story = {
    args: {
        kcContext: {
            url: {
                loginAction: "/mock-login-action"
            },
            enableWebAuthnConditionalUI: true
        }
    }
};

export const WithoutResetPasswordOption: Story = {
    args: {
        kcContext: {
            realm: {
                resetPasswordAllowed: false
            },
            url: {
                loginAction: "/mock-login",
                loginResetCredentialsUrl: "/mock-reset-password"
            },
            messagesPerField: {
                existsError: () => false
            }
        }
    }
};
