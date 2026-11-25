import { createKcPageStory, type Meta, type StoryObj } from "../../../mocks/KcPageStory";

// register.ftl with keycloak-magic-link's Cloudflare Turnstile registration form action.
const { KcPageStory } = createKcPageStory({ pageId: "register.ftl" });

const meta = {
    title: "extensions/cloudflare-turnstile/register.ftl",
    component: KcPageStory
} satisfies Meta<typeof KcPageStory>;

export default meta;

type Story = StoryObj<typeof meta>;

// Cloudflare's test site key that always passes (visible widget):
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const PASSING_TEST_SITE_KEY = "1x00000000000000000000AA";

export const WithTurnstile: Story = {
    args: {
        kcContext: {
            turnstileRequired: true,
            turnstileSiteKey: PASSING_TEST_SITE_KEY,
            turnstileAction: "register"
        }
    }
};

export const WithTurnstileError: Story = {
    args: {
        kcContext: {
            turnstileRequired: true,
            turnstileSiteKey: PASSING_TEST_SITE_KEY,
            turnstileAction: "register",
            messagesPerField: {
                existsError: (fieldName: string, ...otherFieldNames: string[]) =>
                    [fieldName, ...otherFieldNames].includes("cf-turnstile-response"),
                get: (fieldName: string) =>
                    fieldName === "cf-turnstile-response"
                        ? "Invalid Recaptcha"
                        : ""
            }
        }
    }
};
