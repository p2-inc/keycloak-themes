/**
 * WARNING: Before modifying this file, run the following command:
 * 
 * $ npx keycloakify own --path "login/pages/login-recovery-authn-code-config/Page.stories.tsx"
 * 
 * This file is provided by @oussemasahbeni/keycloakify-login-shadcn version 250004.0.15.
 * It was copied into your repository by the postinstall script: `keycloakify sync-extensions`.
 */

/* eslint-disable */

import { createKcPageStory, type Meta, type StoryObj } from "../../mocks/KcPageStory";

const { KcPageStory } = createKcPageStory({
    pageId: "login-recovery-authn-code-config.ftl"
});

const meta = {
    title: "login/login-recovery-authn-code-config.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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

/**
 * WithErrorDuringCodeGeneration:
 * - Purpose: Tests when an error occurs while generating recovery authentication codes.
 * - Scenario: The component renders an error message to inform the user of the failure during code generation.
 * - Key Aspect: Ensures that error messages are properly displayed when recovery code generation fails.
 */
export const WithErrorDuringCodeGeneration: Story = {
    args: {
        kcContext: {
            url: {
                loginAction: "/mock-login-action"
            },
            message: {
                summary:
                    "An error occurred during recovery code generation. Please try again.",
                type: "error"
            }
        }
    }
};
